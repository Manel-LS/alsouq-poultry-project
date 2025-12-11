using System.Text;
using System.Linq;
using BackendApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Afficher le nom de l'application au démarrage
Console.WriteLine("========================================");
Console.WriteLine($"Application: BackendApi");
Console.WriteLine($"Environnement: {builder.Environment.EnvironmentName}");
Console.WriteLine($"Content Root: {builder.Environment.ContentRootPath}");
Console.WriteLine("========================================\n");

// Vérifier la présence de la chaîne de connexion
var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("La chaîne de connexion 'Default' est manquante dans la configuration.");
}

// Afficher uniquement les informations non sensibles de la chaîne de connexion
if (builder.Environment.IsDevelopment())
{
    // En développement, afficher la chaîne complète pour le débogage
    Console.WriteLine($"Chaîne de connexion utilisée: {connectionString}");
}
else
{
    // En production, masquer les informations sensibles
    var connectionInfo = connectionString.Split(';')
        .Where(s => s.StartsWith("Server=") || s.StartsWith("Database="))
        .Select(s => s.Split('=')[0] + "=***")
        .ToList();
    Console.WriteLine($"Connexion configurée: {string.Join("; ", connectionInfo)}");
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        // Optimisation : Désactiver la lecture des commentaires JSON en production
        if (!builder.Environment.IsDevelopment())
        {
            options.JsonSerializerOptions.ReadCommentHandling = System.Text.Json.JsonCommentHandling.Skip;
        }
    });

// Ajouter la compression HTTP pour améliorer les performances
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Optimal;
});

builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Optimal;
});

// Ajouter les health checks pour le monitoring
builder.Services.AddHealthChecks()
    .AddCheck<BackendApi.Services.DatabaseHealthCheck>("database", tags: new[] { "db", "sql", "mysql", "ready" });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Services
builder.Services.AddScoped<IDbSelector, DbSelector>();
builder.Services.AddScoped<IDatabaseTestService, DatabaseTestService>();
builder.Services.AddScoped<IQuestPdfReportService, QuestPdfReportService>();

// Configuration de la base de données
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 32)),
        mysqlOptions =>
        {
            mysqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
            
            // Optimisations pour la production
            mysqlOptions.CommandTimeout(30); // Timeout de 30 secondes pour les commandes
            mysqlOptions.MaxBatchSize(100); // Optimiser les batch inserts
        }
    );

    if (builder.Environment.IsDevelopment())
    {
        // Logging uniquement pour les erreurs et warnings en développement
        options.LogTo(Console.WriteLine, LogLevel.Warning);
        // Le logging sensible est activé uniquement si nécessaire pour le débogage
        // options.EnableSensitiveDataLogging(); // Désactivé pour réduire les avertissements
    }
});

// Configuration CORS optimisée pour la production
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        // En développement : CORS permissif
        options.AddPolicy("AllowAll",
            policy =>
            {
                policy.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            });
    }
    else
    {
        // En production : CORS sécurisé
        options.AddPolicy("Production",
            policy =>
            {
                // Remplacer par vos domaines frontend réels
                var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                    ?? new[] { "http://localhost:3000", "https://yourdomain.com" };
                
                policy.WithOrigins(allowedOrigins)
                       .AllowAnyMethod()
                       .AllowAnyHeader()
                       .AllowCredentials()
                       .SetPreflightMaxAge(TimeSpan.FromHours(24));
            });
    }
});

// Configuration JWT
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("La clé JWT est manquante dans la configuration.");
}

var key = Encoding.UTF8.GetBytes(jwtKey);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Test de la connexion à la base de données au démarrage
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            var canConnect = await context.Database.CanConnectAsync();
            Console.WriteLine($"Connexion à la base de données: {(canConnect ? "SUCCÈS" : "ÉCHEC")}");

            if (canConnect)
            {
                // Tester l'accès aux tables
                var tables = await context.Paramaitre.CountAsync();
                Console.WriteLine($"Connexion aux tables: OK");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erreur de connexion à la base de données: {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
        }
    }
}

// Désactiver HTTPS redirection en développement pour éviter l'avertissement
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Compression HTTP (doit être avant UseRouting)
app.UseResponseCompression();

// CORS selon l'environnement
if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowAll");
}
else
{
    app.UseCors("Production");
}

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Health checks endpoint
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
app.MapControllers();

app.Run();