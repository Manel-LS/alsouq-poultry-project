using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendApi.Services;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/miseplaces")]
public class MiseplaceController : ControllerBase
{
    private readonly IDbSelector _dbSelector;
    public MiseplaceController(IDbSelector dbSelector) { _dbSelector = dbSelector; }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> List([FromQuery] string numcentre, [FromQuery] string codefact = "N")
    {
        if (string.IsNullOrWhiteSpace(numcentre))
            return BadRequest(new { success = false, error = "numcentre required" });

        using var db = await _dbSelector.GetConnection(HttpContext);
        var rows = await db.QueryAsync<dynamic>(
            "SELECT nummvt AS code, libcentre AS libelle, numcentre, codefact, libesparabe, libcentarabe, libbatarabe FROM miseplace WHERE numcentre=@numcentre AND codefact=@codefact",
            new { numcentre, codefact }
        );
        return Ok(new { success = true, miseplaces = rows, count = rows.Count(), filters = new { numCentre = numcentre, codeFact = codefact } });
    }

    [HttpGet("{code}")]
    [Authorize]
    public async Task<IActionResult> Detail(string code)
    {
        using var db = await _dbSelector.GetConnection(HttpContext);
        var row = await db.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT codeMiseplace AS code, libelleMiseplace AS libelle, numcentre AS numcentre, codeFact AS codefact, capacite, typeMiseplace AS type, statut FROM miseplace WHERE codeMiseplace=@code LIMIT 1",
            new { code }
        );
        if (row is null) return NotFound(new { success = false, error = "not found" });
        return Ok(new { success = true, miseplace = row });
    }

    [HttpGet("centre/{numcentre}")]
    [Authorize]
    public async Task<IActionResult> ByCentre(string numcentre, [FromQuery] string codefact = "N")
    {
        using var db = await _dbSelector.GetConnection(HttpContext);
        var rows = await db.QueryAsync<dynamic>(
            "SELECT nummvt AS code, libcentre AS libelle, numcentre, codefact, libesparabe, libcentarabe, libbatarabe FROM miseplace WHERE numcentre=@numcentre AND codeFact=@codefact",
            new { numcentre, codefact }
        );
        return Ok(new { success = true, miseplaces = rows, count = rows.Count(), filters = new { numCentre = numcentre, CodeFact = codefact } });
    }
}


