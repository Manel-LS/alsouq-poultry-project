using BackendApi.DTO;
using BackendApi.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Data;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/liste-stock-entry")]
    public class StockEntryListController : ControllerBase
    {
        private readonly IDbSelector _dbSelector;
        private readonly ILogger<StockEntryListController> _logger;

        private class CountResult
        {
            public int count { get; set; }
        }

        public StockEntryListController(
            IDbSelector dbSelector,
            ILogger<StockEntryListController> logger)
        {
            _dbSelector = dbSelector;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> ListStockEntries(
            [FromQuery] string numcentre,
            [FromQuery] string numbat,
            [FromQuery] string? numlot = null,
            [FromQuery] string nomBaseStockSession = "",
            [FromQuery] string? codeuser = null)
        {
            try
            {
                // Validation des paramètres requis
                if (string.IsNullOrWhiteSpace(numcentre))
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "Le paramètre numcentre est requis."
                    });
                }

                if (string.IsNullOrWhiteSpace(numbat))
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "Le paramètre numbat est requis."
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

                // Construire la requête SQL pour récupérer les bons d'entrée directement depuis ebe avec libarabe du fournisseur
                // Vérifier si la colonne libarabe existe dans ebe
                var checkLibarabeSql = @"
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'ebe'
                    AND COLUMN_NAME = 'libarabe'";
                
                var hasLibarabe = await db.QueryFirstOrDefaultAsync<CountResult>(checkLibarabeSql);
                var libarabeCount = hasLibarabe?.count ?? 0;
                var libarabeExists = libarabeCount > 0;
                
                var sql = @"
                    SELECT DISTINCT
                        e.nummvt,
                        e.datemvt,
                        e.codetrs AS codeFournisseur,
                        e.libtrs AS libelleFournisseur,
                        e.usera AS codeuser,
                        e.datemaj,
                        e.numaffaire,
                        (SELECT l.numlot FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS numlot,
                        (SELECT l.codedep FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS codeDep,
                        (SELECT l.libdep FROM lbe l WHERE l.nummvt = e.nummvt LIMIT 1) AS libDep,
                        (SELECT COUNT(*) FROM lbe l WHERE l.nummvt = e.nummvt) AS nombreArticles";
                
                if (libarabeExists)
                {
                    sql += @",
                        IFNULL(e.libarabe, '') AS libarabeFournisseur";
                }
                else
                {
                    sql += @",
                        IFNULL(f.libarabe, '') AS libarabeFournisseur";
                }
                
                sql += @"
                    FROM ebe e";
                
                if (!libarabeExists)
                {
                    sql += @"
                    LEFT JOIN fournisseur f ON f.code = e.codetrs";
                }
                
                sql += @"
                    WHERE 1=1";

                var parameters = new DynamicParameters();
                
                // Filtre par numlot depuis la table lbe
                if (!string.IsNullOrWhiteSpace(numlot))
                {
                    sql += @"
                        AND EXISTS (
                            SELECT 1 FROM lbe l 
                            WHERE l.nummvt = e.nummvt 
                            AND l.numlot = @numlot
                        )";
                    parameters.Add("numlot", numlot);
                }
                
                // Filtre par codeuser si fourni
                if (!string.IsNullOrWhiteSpace(codeuser))
                {
                    sql += " AND e.usera = @codeuser";
                    parameters.Add("codeuser", codeuser);
                }

                sql += @"
                    ORDER BY e.datemvt DESC, e.nummvt DESC";

                _logger.LogInformation("SQL Query: {Sql}", sql);
                _logger.LogInformation("Parameters: numlot={Numlot}, codeuser={Codeuser}", numlot ?? "", codeuser ?? "");

                var entries = await db.QueryAsync<dynamic>(sql, parameters);
                var entriesList = entries.ToList();
                
                _logger.LogInformation("Found {Count} entries", entriesList.Count);

                var result = new List<StockEntryListDto>();

                foreach (var entry in entries)
                {
                    // Récupérer le libellé du dépôt
                    var codeDep = entry.codeDep?.ToString() ?? "";
                    var depot = !string.IsNullOrWhiteSpace(codeDep)
                        ? await db.QueryFirstOrDefaultAsync<dynamic>(
                            "SELECT Libelle FROM depot WHERE Code = @Code LIMIT 1",
                            new { Code = codeDep })
                        : null;

                    // Récupérer le libellé de l'utilisateur
                    var codeuserEbe = entry.codeuser?.ToString() ?? "";
                    var user = !string.IsNullOrWhiteSpace(codeuserEbe)
                        ? await db.QueryFirstOrDefaultAsync<dynamic>(
                            "SELECT libelle FROM utilisateur WHERE code = @code LIMIT 1",
                            new { code = codeuserEbe })
                        : null;

                    var dateMvt = entry.datemvt != null ? (DateTime)entry.datemvt : DateTime.MinValue;
                    var datemaj = entry.datemaj != null ? (DateTime)entry.datemaj : DateTime.MinValue;
                    var nummvtEntry = entry.nummvt?.ToString() ?? "";

                    // Vérifier si la colonne libarabe existe dans lbe
                    var checkLbeLibarabeSql = @"
                        SELECT COUNT(*) as count
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'lbe'
                        AND COLUMN_NAME = 'libarabe'";
                    
                    var hasLbeLibarabe = await db.QueryFirstOrDefaultAsync<CountResult>(checkLbeLibarabeSql);
                    var lbeLibarabeCount = hasLbeLibarabe?.count ?? 0;
                    var lbeLibarabeExists = lbeLibarabeCount > 0;

                    // Récupérer toutes les lignes lbe pour ce nummvt avec libarabe et datemvt
                    string sqlLbe;
                    if (lbeLibarabeExists)
                    {
                        sqlLbe = @"
                            SELECT 
                                codeart,
                                desart,
                                IFNULL(libarabe, '') AS libarabe,
                                datemvt,
                                qteart,
                                unite
                            FROM lbe
                            WHERE nummvt = @nummvt
                            ORDER BY nligne";
                    }
                    else
                    {
                        sqlLbe = @"
                            SELECT 
                                codeart,
                                desart,
                                '' AS libarabe,
                                datemvt,
                                qteart,
                                unite
                            FROM lbe
                            WHERE nummvt = @nummvt
                            ORDER BY nligne";
                    }

                    string nummvtEntryStr = nummvtEntry;
                    string sqlLbeStr = sqlLbe;
                    _logger.LogInformation("Récupération des lignes lbe pour nummvt: {Nummvt}", nummvtEntryStr);
                    _logger.LogInformation("SQL Lbe: {Sql}", sqlLbeStr);
                    
                    var lignesLbe = await db.QueryAsync<dynamic>(sqlLbe, new { nummvt = nummvtEntry });
                    var lignesList = lignesLbe.ToList();
                    int countLignes = lignesList.Count;
                    
                    _logger.LogInformation("Nombre de lignes lbe trouvées pour {Nummvt}: {Count}", nummvtEntryStr, countLignes);
                    
                    // Requête de test pour vérifier le nombre de lignes dans lbe pour ce ebe
                    var testCountSql = "SELECT COUNT(*) as count FROM lbe WHERE nummvt = @nummvt";
                    var testCount = await db.QueryFirstOrDefaultAsync<CountResult>(testCountSql, new { nummvt = nummvtEntry });
                    int countLbe = testCount?.count ?? 0;
                    _logger.LogInformation("Test SQL - Nombre de lignes lbe pour {Nummvt}: {Count}", nummvtEntryStr, countLbe);

                    var lignesListDto = new List<LbeLineDto>();

                    foreach (var ligne in lignesList)
                    {
                        var dateMvtLbe = ligne.datemvt != null ? (DateTime)ligne.datemvt : DateTime.MinValue;
                        lignesListDto.Add(new LbeLineDto
                        {
                            codeart = ligne.codeart?.ToString() ?? "",
                            desart = ligne.desart?.ToString() ?? "",
                            libarabe = ligne.libarabe?.ToString() ?? "",
                            datemvt = dateMvtLbe,
                            dateMvt = dateMvtLbe != DateTime.MinValue ? dateMvtLbe.ToString("yyyy-MM-dd") : "",
                            qteart = ligne.qteart != null ? Convert.ToDouble(ligne.qteart) : 0,
                            unite = ligne.unite?.ToString() ?? ""
                        });
                    }
                    
                    int countLignesDto = lignesListDto.Count;
                    _logger.LogInformation("Lignes lbe ajoutées pour {Nummvt}: {Count} lignes", nummvtEntryStr, countLignesDto);

                    result.Add(new StockEntryListDto
                    {
                        nummvt = nummvtEntry,
                        numlot = entry.numlot?.ToString() ?? "",
                        codeFournisseur = entry.codeFournisseur?.ToString() ?? "",
                        libelleFournisseur = entry.libelleFournisseur?.ToString() ?? "",
                        libtrs = entry.libelleFournisseur?.ToString() ?? "",
                        libarabeFournisseur = entry.libarabeFournisseur?.ToString() ?? "",
                        dateCreation = dateMvt,
                        date = dateMvt.ToString("yyyy-MM-dd"),
                        datemaj = datemaj,
                        numcentre = numcentre,
                        numbat = numbat,
                        codeDep = codeDep,
                        libDep = depot?.Libelle?.ToString() ?? entry.libDep?.ToString() ?? "",
                        codeuser = codeuserEbe,
                        libusr = user?.libelle?.ToString() ?? "",
                        nombreArticles = entry.nombreArticles != null ? Convert.ToInt32(entry.nombreArticles) : 0,
                        lignes = lignesListDto
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = result,
                    count = result.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ListStockEntries");
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message,
                    message = ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        [HttpGet("test-count-lbe")]
        public async Task<IActionResult> TestCountLbe(
            [FromQuery] string nummvt,
            [FromQuery] string nomBaseStockSession)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(nummvt))
                {
                    return BadRequest(new { success = false, error = "Le paramètre nummvt est requis." });
                }

                if (string.IsNullOrWhiteSpace(nomBaseStockSession))
                {
                    return BadRequest(new { success = false, error = "Le paramètre nomBaseStockSession est requis." });
                }

                using var db = await _dbSelector.GetConnection(HttpContext, nomBaseStockSession);
                if (db.State != ConnectionState.Open)
                {
                    await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync();
                }

                // Requête SQL de test pour compter les lignes lbe pour ce ebe
                var sql = @"
                    SELECT 
                        e.nummvt AS nummvtEbe,
                        e.datemvt AS datemvtEbe,
                        e.libtrs AS libtrsEbe,
                        IFNULL(e.libarabe, '') AS libarabeEbe,
                        (SELECT COUNT(*) FROM lbe l WHERE l.nummvt = e.nummvt) AS nombreLignesLbe
                    FROM ebe e
                    WHERE e.nummvt = @nummvt";

                var ebeInfo = await db.QueryFirstOrDefaultAsync<dynamic>(sql, new { nummvt });

                if (ebeInfo == null)
                {
                    return NotFound(new { success = false, error = $"Aucun ebe trouvé avec nummvt: {nummvt}" });
                }

                // Récupérer toutes les lignes lbe
                var sqlLbe = @"
                    SELECT 
                        codeart,
                        desart,
                        IFNULL(libarabe, '') AS libarabe,
                        datemvt,
                        qteart,
                        unite,
                        nligne
                    FROM lbe
                    WHERE nummvt = @nummvt
                    ORDER BY nligne";

                var lignesLbe = await db.QueryAsync<dynamic>(sqlLbe, new { nummvt });
                var lignesList = lignesLbe.ToList();

                return Ok(new
                {
                    success = true,
                    ebe = new
                    {
                        nummvt = ebeInfo.nummvtEbe?.ToString() ?? "",
                        datemvt = ebeInfo.datemvtEbe != null ? ((DateTime)ebeInfo.datemvtEbe).ToString("yyyy-MM-dd") : "",
                        libtrs = ebeInfo.libtrsEbe?.ToString() ?? "",
                        libarabe = ebeInfo.libarabeEbe?.ToString() ?? ""
                    },
                    nombreLignesLbe = ebeInfo.nombreLignesLbe != null ? Convert.ToInt32(ebeInfo.nombreLignesLbe) : 0,
                    lignes = lignesList.Select(l => new
                    {
                        codeart = l.codeart?.ToString() ?? "",
                        desart = l.desart?.ToString() ?? "",
                        libarabe = l.libarabe?.ToString() ?? "",
                        datemvt = l.datemvt != null ? ((DateTime)l.datemvt).ToString("yyyy-MM-dd") : "",
                        qteart = l.qteart != null ? Convert.ToDouble(l.qteart) : 0,
                        unite = l.unite?.ToString() ?? "",
                        nligne = l.nligne != null ? Convert.ToDouble(l.nligne) : 0
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in TestCountLbe");
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

