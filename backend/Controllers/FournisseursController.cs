using BackendApi.Models;
using BackendApi.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace BackendApi.Controllers;

[ApiController]
[Route("api")]
public class FournisseursController : ControllerBase
{
    private readonly IDbSelector _dbSelector;

    public FournisseursController(IDbSelector dbSelector)
    {
        _dbSelector = dbSelector;
    }

    [HttpGet("fournisseurs")]
    public async Task<IActionResult> GetFournisseurs()
    {
        try
        {
            using var db = await _dbSelector.GetConnection(HttpContext);
            
            // S'assurer que la connexion est ouverte
            if (db.State != ConnectionState.Open)
            {
                await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync();
            }
            
            var sql = @"
                SELECT 
                    code,
                    libelle,
                    adresse,
                    tel1,
                    libarabe
                FROM fournisseur
                ORDER BY code";

            var fournisseurs = await db.QueryAsync<Fournisseur>(sql);

            return Ok(new 
            { 
                success = true, 
                fournisseurs = fournisseurs, 
                count = fournisseurs.Count() 
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erreur dans GetFournisseurs: {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
            
            return StatusCode(500, new 
            { 
                success = false, 
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }
    }
}

