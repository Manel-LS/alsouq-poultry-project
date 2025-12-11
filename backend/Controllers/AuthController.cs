using System.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BackendApi.Services;

namespace BackendApi.Controllers;

[ApiController]
[Route("api")]
public class AuthController : ControllerBase
{
    private readonly IDbSelector _dbSelector;
    private readonly IConfiguration _cfg;

    public AuthController(IDbSelector dbSelector, IConfiguration cfg)
    {
        _dbSelector = dbSelector;
        _cfg = cfg;
    }

    public record LoginRequest(string login, string motpasse, string? database_choice);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.login) || string.IsNullOrWhiteSpace(req.motpasse))
            return BadRequest(new { error = "Missing credentials" });
        if (string.IsNullOrWhiteSpace(req.database_choice))
            return BadRequest(new { error = "database_choice required" });

        using var db = CreateGlobalConnection();
        var user = await db.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT code, login, libelle, actif, motpasse FROM utilisateur WHERE login=@login LIMIT 1",
            new { req.login }
        );
        if (user is null) return Unauthorized(new { error = "Invalid credentials" });

        var ok = (string)user.motpasse == req.motpasse;
        if (!ok) return Unauthorized(new { error = "Invalid credentials" });

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"] ?? ""));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _cfg["Jwt:Issuer"],
            audience: _cfg["Jwt:Audience"],
            claims: BuildClaims((string)user.login, req.database_choice),
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );
        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        var dbs = await db.QueryAsync<(string code, string libelle)>(
            "SELECT code, libelle FROM paramaitre WHERE cloturer=0"
        );

        return Ok(new
        {
            status = "success",
            token = jwt,
            user = new { code = user.code, login = user.login, libelle = user.libelle, actif = user.actif },
            database_choice = req.database_choice,
            available_databases = dbs.Select(x => new { code = x.code, libelle = x.libelle, label = x.code + " -- " + x.libelle })
        });
    }

    private static IEnumerable<Claim> BuildClaims(string login, string? dbChoice)
    {
        var claims = new List<Claim> { new Claim(ClaimTypes.Name, login) };
        if (!string.IsNullOrWhiteSpace(dbChoice)) claims.Add(new Claim("db", dbChoice));
        return claims;
    }

    [HttpGet("databases")]
    public async Task<IActionResult> Databases()
    {
        try
        {
            using var db = CreateGlobalConnection();
            await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync(); // Open connection here
            var rows = await db.QueryAsync<(string code, string libelle)>(
                "SELECT code, libelle FROM paramaitre WHERE cloturer=0"
            );
            return Ok(new
            {
                success = true,
                databases = rows.Select(x => new { code = x.code, libelle = x.libelle, display_label = x.code + " - " + x.libelle }),
                count = rows.Count()
            });
        }
        catch (Exception ex)
        {
            // Log the exception details
            Console.WriteLine($"Error in GetDatabases: {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
            return StatusCode(500, new { success = false, error = "Internal Server Error", details = ex.Message });
        }
    }

    private IDbConnection CreateGlobalConnection()
    {
        try
        {
            var cs = _cfg.GetConnectionString("Default") ?? string.Empty;
            Console.WriteLine($"Attempting to create global connection with connection string: {cs}");
            var connection = new MySql.Data.MySqlClient.MySqlConnection(cs);
            // connection.Open(); // Removed this line
            Console.WriteLine($"Global connection successfully created (not yet opened): {connection.State}");
            return connection;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in CreateGlobalConnection: {ex.Message}");
            Console.WriteLine($"Stack Trace (CreateGlobalConnection): {ex.StackTrace}");
            throw; // Re-throw to be caught by the calling Databases() method's try-catch
        }
    }
}


