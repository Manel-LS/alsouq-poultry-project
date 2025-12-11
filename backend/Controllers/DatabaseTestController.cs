using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendApi.Services;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/debug")]
public class DatabaseTestController : ControllerBase
{
    private readonly IDatabaseTestService _dbTestService;
    private readonly IConfiguration _cfg;

    public DatabaseTestController(IDatabaseTestService dbTestService, IConfiguration cfg)
    {
        _dbTestService = dbTestService;
        _cfg = cfg;
    }

    [HttpGet("databases")]
    public async Task<IActionResult> GetDatabases()
    {
        var databases = await _dbTestService.GetDatabasesAsync();
        return Ok(new { success = true, databases });
    }

    [HttpGet("test-connection/{database}")]
    public async Task<IActionResult> TestConnection(string database)
    {
        var connectionString = $"Server=localhost;Database={database};Uid=root;Pwd=;SslMode=None;";
        var isConnected = await _dbTestService.TestConnectionAsync(connectionString);
        var tables = await _dbTestService.GetTablesAsync(connectionString);
        
        return Ok(new 
        { 
            success = true, 
            database,
            connected = isConnected,
            tables = tables.ToList(),
            hasBatimentTable = tables.Contains("batiment")
        });
    }

    [HttpGet("test-default")]
    public async Task<IActionResult> TestDefaultConnection()
    {
        var defaultConnectionString = _cfg.GetConnectionString("Default") ?? "";
        var isConnected = await _dbTestService.TestConnectionAsync(defaultConnectionString);
        var tables = await _dbTestService.GetTablesAsync(defaultConnectionString);
        
        return Ok(new 
        { 
            success = true, 
            connectionString = defaultConnectionString,
            connected = isConnected,
            tables = tables.ToList(),
            hasBatimentTable = tables.Contains("batiment")
        });
    }

    [HttpGet("find-batiment-table")]
    public async Task<IActionResult> FindBatimentTable()
    {
        var databases = await _dbTestService.GetDatabasesAsync();
        var results = new List<object>();
        
        foreach (var db in databases)
        {
            var connectionString = $"Server=localhost;Database={db};Uid=root;Pwd=;SslMode=None;";
            var isConnected = await _dbTestService.TestConnectionAsync(connectionString);
            var hasBatiment = false;
            
            if (isConnected)
            {
                hasBatiment = await _dbTestService.TableExistsAsync(connectionString, "batiment");
            }
            
            results.Add(new
            {
                database = db,
                connected = isConnected,
                hasBatimentTable = hasBatiment
            });
        }
        
        return Ok(new { success = true, databases = results });
    }
}
