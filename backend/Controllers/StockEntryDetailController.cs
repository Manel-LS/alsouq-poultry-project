using BackendApi.DTO;
using BackendApi.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/detail-stock-entry")]
    public class StockEntryDetailController : ControllerBase
    {
        private readonly IDbSelector _dbSelector;
        private readonly ILogger<StockEntryDetailController> _logger;

        public StockEntryDetailController(
            IDbSelector dbSelector,
            ILogger<StockEntryDetailController> logger)
        {
            _dbSelector = dbSelector;
            _logger = logger;
        }

        [HttpGet("{nummvt}")]
        public async Task<IActionResult> GetStockEntryDetail(
            string nummvt,
            [FromQuery] string nomBaseStockSession = "",
            [FromQuery] string? codeuser = null)
        {
            try
            {
                // Validation des paramètres requis
                if (string.IsNullOrWhiteSpace(nummvt))
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "Le paramètre nummvt est requis."
                    });
                }

                if (string.IsNullOrWhiteSpace(nomBaseStockSession))
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "Le paramètre nomBaseStockSession est requis."
                    });
                }

                using var db = await _dbSelector.GetConnection(HttpContext, nomBaseStockSession);
                if (db.State != ConnectionState.Open)
                {
                    await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync();
                }

                // Récupérer l'en-tête du bon d'entrée avec libarabe du fournisseur
                var ebe = await db.QueryFirstOrDefaultAsync<dynamic>(
                    @"SELECT 
                        e.nummvt,
                        e.datemvt,
                        e.codetrs,
                        e.libtrs,
                        e.usera,
                        e.datemaj,
                        f.libarabe AS libarabeFournisseur
                    FROM ebe e
                    LEFT JOIN fournisseur f ON f.code = e.codetrs
                    WHERE e.nummvt = @nummvt
                    LIMIT 1",
                    new { nummvt });

                if (ebe == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        error = "Bon d'entrée non trouvé",
                        message = $"Aucun bon d'entrée trouvé avec le nummvt: {nummvt}"
                    });
                }

                // Récupérer les lignes du bon d'entrée avec champs arabes de stockdepot
                var lbeLines = await db.QueryAsync<dynamic>(
                    @"SELECT 
                        l.nligne AS pniaer,
                        l.codeart,
                        l.desart,
                        l.qteart,
                        l.unite,
                        l.famille,
                        l.libfam,
                        l.codetrs,
                        l.libtrs,
                        l.codedep,
                        l.libdep,
                        l.nummvt,
                        l.numlot,
                        IFNULL(sd.libarabe, '') AS libarabe,
                        IFNULL(sd.unitearabe, '') AS unitearabe
                    FROM lbe l
                    LEFT JOIN stockdepot sd ON sd.codeart = l.codeart AND sd.codedep = l.codedep AND sd.famille = l.famille
                    WHERE l.nummvt = @nummvt
                    ORDER BY l.nligne ASC",
                    new { nummvt });

                // Récupérer le libellé de l'utilisateur depuis ebe
                var codeuserEbe = ebe.usera?.ToString() ?? "";
                var user = !string.IsNullOrWhiteSpace(codeuserEbe)
                    ? await db.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT libelle FROM utilisateur WHERE code = @code LIMIT 1",
                        new { code = codeuserEbe })
                    : null;

                var datemaj = ebe.datemaj != null ? (DateTime)ebe.datemaj : DateTime.MinValue;

                // Construire le tableau de lignes LBE
                var result = new List<StockEntryLineDto>();

                foreach (var line in lbeLines)
                {
                    var pniaer = line.pniaer != null ? Convert.ToInt32(line.pniaer) : 0;
                    var qteart = line.qteart != null ? Convert.ToDouble(line.qteart) : 0.0;

                    result.Add(new StockEntryLineDto
                    {
                        pniaer = pniaer,
                        codeart = line.codeart?.ToString() ?? "",
                        desart = line.desart?.ToString() ?? "",
                        libelle = line.desart?.ToString() ?? "",
                        qteart = qteart,
                        quantite = qteart,
                        unite = line.unite?.ToString() ?? "",
                        famille = line.famille?.ToString() ?? "",
                        libfam = line.libfam?.ToString() ?? "",
                        libelleFamille = line.libfam?.ToString() ?? "",
                        codetrs = line.codetrs?.ToString() ?? "",
                        libtrs = line.libtrs?.ToString() ?? "",
                        codedep = line.codedep?.ToString() ?? "",
                        libdep = line.libdep?.ToString() ?? "",
                        codeusr = codeuserEbe,
                        libusr = user?.libelle?.ToString() ?? "",
                        datemaj = datemaj,
                        libarabe = line.libarabe?.ToString() ?? "",
                        unitearabe = line.unitearabe?.ToString() ?? ""
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetStockEntryDetail");
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message,
                    message = ex.InnerException?.Message ?? ex.Message
                });
            }
        }
    }
}

