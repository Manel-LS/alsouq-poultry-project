using System.Data;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using MySql.Data.MySqlClient;

namespace BackendApi.Services;

public interface IDbSelector
{
    Task<IDbConnection> GetConnection(HttpContext httpContext, string? explicitChoice = null);
}

public class DbSelector : IDbSelector
{
    private readonly IConfiguration _cfg;

    public DbSelector(IConfiguration cfg)
    {
        _cfg = cfg;
    }

    public Task<IDbConnection> GetConnection(HttpContext httpContext, string? explicitChoice = null)
    {
        var choice = explicitChoice;
        var claimDb = httpContext.User?.Claims?.FirstOrDefault(c => c.Type == "db")?.Value;
        if (!string.IsNullOrWhiteSpace(claimDb)) choice = claimDb;
        choice ??= httpContext.Request.Headers["X-Database-Choice"].FirstOrDefault();
        choice ??= httpContext.Request.Query["database"].FirstOrDefault();
        choice = (choice ?? "").Trim();

        string connectionString;
        if (!string.IsNullOrWhiteSpace(choice))
        {
            // Optimisation : Ajouter les paramètres de pool pour la production
            connectionString = $"Server=localhost;Database={choice};Uid=root;Pwd=;SslMode=None;Pooling=true;MinimumPoolSize=2;MaximumPoolSize=50;ConnectionTimeout=30;";
        }
        else
        {
            connectionString = _cfg.GetConnectionString("Default") ?? "Server=localhost;Database=SOCERP;Uid=root;Pwd=;SslMode=None;Pooling=true;MinimumPoolSize=2;MaximumPoolSize=50;ConnectionTimeout=30;";
        }
        
        var conn = new MySqlConnection(connectionString);
        return Task.FromResult<IDbConnection>(conn);
    }

    private string ResolveDsn(string? choice)
    {
        if (string.IsNullOrEmpty(choice))
        {
            var d = Environment.GetEnvironmentVariable("DATABASE_URL");
            if (!string.IsNullOrEmpty(d)) return d;
            return _cfg["DatabaseUrls:Primary"] ?? string.Empty;
        }
        if (string.Equals(choice, "1", StringComparison.OrdinalIgnoreCase) || string.Equals(choice, "DATABASE_URL", StringComparison.OrdinalIgnoreCase))
            return Environment.GetEnvironmentVariable("DATABASE_URL") ?? _cfg["DatabaseUrls:Primary"] ?? string.Empty;
        if (string.Equals(choice, "2", StringComparison.OrdinalIgnoreCase) || string.Equals(choice, "DATABASE_URL_2", StringComparison.OrdinalIgnoreCase))
            return Environment.GetEnvironmentVariable("DATABASE_URL_2") ?? _cfg["DatabaseUrls:Secondary"] ?? string.Empty;
        if (string.Equals(choice, "3", StringComparison.OrdinalIgnoreCase) || string.Equals(choice, "DATABASE_URL_3", StringComparison.OrdinalIgnoreCase))
            return Environment.GetEnvironmentVariable("DATABASE_URL_3") ?? _cfg["DatabaseUrls:Tertiary"] ?? string.Empty;
        var env = Environment.GetEnvironmentVariable(choice);
        if (!string.IsNullOrEmpty(env)) return env;
        return _cfg[$"DatabaseUrls:{choice}"] ?? string.Empty;
    }

    private static string ConvertDsnToMySql(string csDsn)
    {
        if (string.IsNullOrWhiteSpace(csDsn)) return string.Empty;
        if (!csDsn.Contains("://")) return csDsn;
        var m = Regex.Match(csDsn, @"^(?<scheme>\w+)://(?<user>[^:]+):(?<pass>[^@]+)@(?<host>[^/:]+)(:(?<port>\d+))?/(?<db>[^?]+)");
        if (!m.Success) return csDsn;
        var user = Uri.UnescapeDataString(m.Groups["user"].Value);
        var pass = Uri.UnescapeDataString(m.Groups["pass"].Value);
        var host = m.Groups["host"].Value;
        var port = m.Groups["port"].Success ? m.Groups["port"].Value : "3306";
        var db = m.Groups["db"].Value;
        return $"Server={host};Port={port};Database={db};Uid={user};Pwd={pass};SslMode=None;";
    }
}


