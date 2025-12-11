using BackendApi.Models;
using BackendApi.Services;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Data;

namespace BackendApi.Controllers;

[ApiController]
[Route("api")]
public class BatimentController : ControllerBase
{
    private readonly IDbSelector _dbSelector;
    public BatimentController(IDbSelector dbSelector)
    {
        _dbSelector = dbSelector;
    }

    [HttpGet("batiments")]
    [Authorize]
    public async Task<IActionResult> List([FromQuery] string codeuser, [FromQuery] string? cloturer = null)
    {
        if (string.IsNullOrEmpty(codeuser))
        {
            return BadRequest(new { success = false, message = "Le paramètre codeuser est requis" });
        }

        using var db = await _dbSelector.GetConnection(HttpContext);

        // Vérifier si les colonnes arabes existent
        bool hasArabicColumns = await CheckArabicColumnsExist(db, "batiment", new[] { "libcentarabe", "adrarabe", "libbatarabe" });
        
        var sql = @"
    SELECT DISTINCT 
        b.codecli AS codecli,
        b.numcentre AS Numcentre,
        b.libelleCentre AS LibelleCentre,
        b.adresse AS Adresse,
        b.numbat AS numbat,
        b.libellebat AS libellebat";
        
        if (hasArabicColumns)
        {
            sql += @",
        IFNULL(b.libcentarabe, '') AS libcentarabe,
        IFNULL(b.adrarabe, '') AS adrarabe,
        IFNULL(b.libbatarabe, '') AS libbatarabe";
        }
        else
        {
            sql += @",
        '' AS libcentarabe,
        '' AS adrarabe,
        '' AS libbatarabe";
        }
        
        sql += @"
    FROM batiment b
    INNER JOIN usercentre uc ON b.numcentre = uc.codec
    WHERE uc.codeuser = @Codeuser and b.occuper='1'
     
";

        if (!string.IsNullOrEmpty(cloturer))
        {
            sql += @" AND EXISTS (
            SELECT 1 FROM miseplace mp 
            WHERE mp.numcentre = b.numcentre 
            AND mp.codefact = @Cloturer
        )";
        }

        sql += " ORDER BY b.Numcentre";

        try
        {
            var rows = await db.QueryAsync<Batiment>(sql, new
            {
                Codeuser = codeuser,
                Cloturer = cloturer
            });

            return Ok(new { success = true, batiments = rows, count = rows.Count() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    //public async Task<IActionResult> List([FromQuery] string codeuser)
    //{
    //    if (string.IsNullOrEmpty(codeuser))
    //    {
    //        return BadRequest(new { success = false, message = "Le paramètre codeuser est requis" });
    //    }

    //    using var db = await _dbSelector.GetConnection(HttpContext);
    //    var rows = await db.QueryAsync<Batiment>(
    //        @"
    //    SELECT DISTINCT 
    //        b.codecli AS codecli,
    //        b.numcentre AS Numcentre,
    //        b.libelleCentre AS LibelleCentre,
    //        b.adresse AS Adresse,
    //        b.numbat AS numbat,
    //        b.libellebat AS libellebat
    //    FROM batiment b
    //    INNER JOIN usercentre uc ON b.numcentre = uc.codec
    //    WHERE uc.codeuser = @Codeuser
    //    ORDER BY b.Numcentre
    //    ",
    //        new { Codeuser = codeuser }
    //    );

    //    return Ok(new { success = true, batiments = rows, count = rows.Count() });
    //}


    [HttpGet("miseplaces-by-bat")]
    [Authorize]
    public async Task<IActionResult> ListMiseplacesByBatiment([FromQuery] string numcentre, [FromQuery] string lotStatus, [FromQuery] string codeuser)
    {
        if (string.IsNullOrWhiteSpace(numcentre))
            return BadRequest(new { success = false, error = "numcentre parameter is required" });
        if (string.IsNullOrWhiteSpace(lotStatus))
            return BadRequest(new { success = false, error = "lotStatus parameter is required" });
        if (string.IsNullOrWhiteSpace(codeuser))
            return BadRequest(new { success = false, error = "codeuser parameter is required" });

        using var db = await _dbSelector.GetConnection(HttpContext);
        
        // Vérifier si les colonnes arabes existent
        bool hasMiseplaceArabic = await CheckArabicColumnsExist(db, "miseplace", new[] { "libesparabe", "libcentarabe", "libbatarabe" });
        
        var sql = @"SELECT mp.nummvt, mp.libcentre, mp.numcentre, mp.codefact, mp.numbat, mp.libbat, 
                  mp.effectif, mp.souche, mp.codeesp, mp.libesp";
        
        if (hasMiseplaceArabic)
        {
            sql += ", mp.libesparabe, mp.libcentarabe, mp.libbatarabe";
        }
        else
        {
            sql += ", '' AS libesparabe, '' AS libcentarabe, '' AS libbatarabe";
        }
        
        sql += @" FROM miseplace mp
           INNER JOIN usercentre uc ON mp.numcentre = uc.codec
           WHERE mp.numcentre = @numcentre AND mp.codefact = @lotStatus AND uc.codeuser = @codeuser
           ORDER BY mp.numbat";
        
        var rows = await db.QueryAsync<Miseplace>(sql, new { numcentre, lotStatus, codeuser });
        return Ok(new { success = true, miseplaces = rows, count = rows.Count() });
    }

    [HttpGet("batiments/{numbat}")]
    [Authorize]
    public async Task<IActionResult> Detail(string numbat)
    {
        using var db = await _dbSelector.GetConnection(HttpContext);
        var sql = await BuildBatimentDetailQuery(db, numbat);
        var row = await db.QueryFirstOrDefaultAsync<dynamic>(sql, new { numbat });
        if (row is null) return NotFound(new { success = false, error = "not found" });
        return Ok(new { success = true, batiment = row });
    }

    /// <summary>
    /// Construit la requête SQL pour les détails d'un bâtiment avec gestion des colonnes optionnelles
    /// </summary>
    private async Task<string> BuildBatimentDetailQuery(IDbConnection db, string numbat)
    {
        bool hasArabicColumns = await CheckArabicColumnsExist(db, "batiment", new[] { "libcentarabe", "adrarabe", "libbatarabe" });
        
        var sql = "SELECT codeClient AS codecli, numcentre AS numcentre, libelleCentre AS libellecentre, adresse, numeroBatiment AS numbat, libelleBatiment AS libellebat";
        
        if (hasArabicColumns)
        {
            sql += ", IFNULL(libcentarabe, '') AS libcentarabe, IFNULL(adrarabe, '') AS adrarabe, IFNULL(libbatarabe, '') AS libbatarabe";
        }
        else
        {
            sql += ", '' AS libcentarabe, '' AS adrarabe, '' AS libbatarabe";
        }
        
        sql += " FROM batiment WHERE numeroBatiment=@numbat LIMIT 1";
        return sql;
    }

    /// <summary>
    /// Liste des bâtiments avec leurs mises en place associées
    /// Retourne un tableau formaté pour affichage React
    /// </summary>
    [HttpGet("batiments-avec-miseplace")]
    [Authorize]
    public async Task<IActionResult> ListBatimentsAvecMiseplace(
        [FromQuery] string codeuser,
        [FromQuery] string? numcentre = null,
        [FromQuery] string? codefact = null)
    {
        if (string.IsNullOrEmpty(codeuser))
        {
            return BadRequest(new { success = false, message = "Le paramètre codeuser est requis" });
        }

        try
        {
            using var db = await _dbSelector.GetConnection(HttpContext);
            
            // S'assurer que la connexion est ouverte
            if (db.State != ConnectionState.Open)
            {
                await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync();
            }

            // Vérifier si les colonnes arabes existent
            bool hasBatimentArabic = await CheckArabicColumnsExist(db, "batiment", new[] { "libcentarabe", "adrarabe", "libbatarabe" });
            bool hasMiseplaceArabic = await CheckArabicColumnsExist(db, "miseplace", new[] { "libesparabe", "libcentarabe", "libbatarabe" });
            
            // Construction de la requête SQL avec jointure
            // Conversion des dates en chaînes pour éviter les problèmes de conversion MySQL -> DateTime
            var sql = @"
                SELECT 
                    b.numcentre AS NumCentre,
                    b.libelleCentre AS LibelleCentre,
                    b.adresse AS Adresse,
                    b.numbat AS NumBatiment,
                    b.libellebat AS LibelleBatiment";
            
            if (hasBatimentArabic)
            {
                sql += @",
                    IFNULL(b.libcentarabe, '') AS LibCentarabe,
                    IFNULL(b.adrarabe, '') AS Adrarabe,
                    IFNULL(b.libbatarabe, '') AS LibBatarabe";
            }
            else
            {
                sql += @",
                    '' AS LibCentarabe,
                    '' AS Adrarabe,
                    '' AS LibBatarabe";
            }
            
            sql += @",
                    mp.nummvt AS NumMvt,
                    mp.codefact AS CodeFact,
                    mp.libbat AS LibBat,
                    COALESCE(mp.effectif, 0) AS Effectif,
                    mp.codeesp AS CodeEspece,
                    mp.libesp AS LibEspece";
            
            if (hasMiseplaceArabic)
            {
                sql += @",
                    IFNULL(mp.libesparabe, '') AS LibEesparabe,
                    IFNULL(mp.libcentarabe, '') AS MpLibCentarabe,
                    IFNULL(mp.libbatarabe, '') AS MpLibBatarabe";
            }
            else
            {
                sql += @",
                    '' AS LibEesparabe,
                    '' AS MpLibCentarabe,
                    '' AS MpLibBatarabe";
            }
            
            sql += @",
                    mp.souche AS Souche,
                    CASE WHEN mp.datemvt IS NULL THEN NULL ELSE DATE_FORMAT(mp.datemvt, '%Y-%m-%d %H:%i:%s') END AS DateMvt,
                    CASE WHEN mp.dateeclo IS NULL THEN NULL ELSE DATE_FORMAT(mp.dateeclo, '%Y-%m-%d %H:%i:%s') END AS DateEclo,
                    COALESCE(mp.nbrjour, 0) AS NbrJour,
                    COALESCE(mp.jourdeb, 0) AS JourDeb
                FROM batiment b
                INNER JOIN usercentre uc ON b.numcentre = uc.codec
                LEFT JOIN miseplace mp ON b.numcentre = mp.numcentre AND b.numbat = mp.numbat
                WHERE uc.codeuser = @Codeuser 
                    AND b.occuper = '1'";

            var parameters = new DynamicParameters();
            parameters.Add("Codeuser", codeuser);

            // Filtres optionnels
            if (!string.IsNullOrEmpty(numcentre))
            {
                sql += " AND b.numcentre = @NumCentre";
                parameters.Add("NumCentre", numcentre);
            }

            if (!string.IsNullOrEmpty(codefact))
            {
                sql += " AND (mp.codefact = @CodeFact OR mp.codefact IS NULL)";
                parameters.Add("CodeFact", codefact);
            }

            sql += " ORDER BY b.numcentre, b.numbat, mp.nummvt";

            // Utiliser dynamic pour éviter les problèmes de parsing de dates
            var rowsDynamic = await db.QueryAsync<dynamic>(sql, parameters);
            var rowsList = rowsDynamic.Select(r => 
            {
                DateTime? ParseDateTime(object value)
                {
                    if (value == null || value == DBNull.Value)
                        return null;
                    
                    // Si c'est déjà un DateTime, le retourner directement
                    if (value is DateTime dt)
                        return dt;
                    
                    // Convertir en chaîne et parser
                    string? dateStr = value?.ToString();
                    if (string.IsNullOrWhiteSpace(dateStr))
                        return null;
                    
                    // Essayer plusieurs formats de date MySQL
                    string[] formats = {
                        "yyyy-MM-dd HH:mm:ss",
                        "yyyy-MM-dd",
                        "dd/MM/yyyy HH:mm:ss",
                        "dd/MM/yyyy",
                        "MM/dd/yyyy HH:mm:ss",
                        "MM/dd/yyyy"
                    };
                    
                    foreach (var format in formats)
                    {
                        if (DateTime.TryParseExact(dateStr, format, null, System.Globalization.DateTimeStyles.None, out DateTime parsedDate))
                            return parsedDate;
                    }
                    
                    // Dernier recours : TryParse standard
                    if (DateTime.TryParse(dateStr, out DateTime parsed))
                        return parsed;
                    
                    return null;
                }
                
                double ParseDouble(object value)
                {
                    if (value == null || value == DBNull.Value)
                        return 0;
                    
                    if (value is double d)
                        return d;
                    
                    if (value is int i)
                        return (double)i;
                    
                    if (value is decimal dec)
                        return (double)dec;
                    
                    if (value is float f)
                        return (double)f;
                    
                    if (double.TryParse(value.ToString(), out double result))
                        return result;
                    
                    return 0;
                }
                
                return new BatimentAvecMiseplaceDto
                {
                    NumCentre = r.NumCentre?.ToString(),
                    LibelleCentre = r.LibelleCentre?.ToString(),
                    Adresse = r.Adresse?.ToString(),
                    NumBatiment = r.NumBatiment?.ToString(),
                    LibelleBatiment = r.LibelleBatiment?.ToString(),
                    LibCentarabe = r.LibCentarabe?.ToString(),
                    Adrarabe = r.Adrarabe?.ToString(),
                    LibBatarabe = r.LibBatarabe?.ToString(),
                    NumMvt = r.NumMvt?.ToString(),
                    CodeFact = r.CodeFact?.ToString(),
                    LibBat = r.LibBat?.ToString(),
                    Effectif = ParseDouble(r.Effectif),
                    CodeEspece = r.CodeEspece?.ToString(),
                    LibEspece = r.LibEspece?.ToString(),
                    LibEesparabe = r.LibEesparabe?.ToString(),
                    MpLibCentarabe = r.MpLibCentarabe?.ToString(),
                    MpLibBatarabe = r.MpLibBatarabe?.ToString(),
                    Souche = r.Souche?.ToString(),
                    DateMvt = ParseDateTime(r.DateMvt),
                    DateEclo = ParseDateTime(r.DateEclo),
                    NbrJour = ParseDouble(r.NbrJour),
                    JourDeb = ParseDouble(r.JourDeb)
                };
            }).ToList();

            // Grouper par bâtiment pour faciliter l'affichage en React
            var batimentsGroupes = rowsList
                .GroupBy(b => new { b.NumCentre, b.NumBatiment, b.LibelleCentre, b.LibelleBatiment, b.Adresse, b.LibCentarabe, b.Adrarabe, b.LibBatarabe })
                .Select(g => new
                {
                    NumCentre = g.Key.NumCentre,
                    LibelleCentre = g.Key.LibelleCentre,
                    Adresse = g.Key.Adresse,
                    NumBatiment = g.Key.NumBatiment,
                    LibelleBatiment = g.Key.LibelleBatiment,
                    LibCentarabe = g.Key.LibCentarabe,
                    Adrarabe = g.Key.Adrarabe,
                    LibBatarabe = g.Key.LibBatarabe,
                    Miseplaces = g.Where(m => !string.IsNullOrEmpty(m.NumMvt))
                        .Select(m => new
                        {
                            m.NumMvt,
                            m.CodeFact,
                            m.LibBat,
                            m.Effectif,
                            m.CodeEspece,
                            m.LibEspece,
                            m.LibEesparabe,
                            m.MpLibCentarabe,
                            m.MpLibBatarabe,
                            m.Souche,
                            m.DateMvt,
                            m.DateEclo,
                            m.NbrJour,
                            m.JourDeb
                        })
                        .ToList(),
                    NombreMiseplaces = g.Count(m => !string.IsNullOrEmpty(m.NumMvt))
                })
                .ToList();

            return Ok(new
            {
                success = true,
                data = batimentsGroupes,
                count = batimentsGroupes.Count,
                totalMiseplaces = rowsList.Count(r => !string.IsNullOrEmpty(r.NumMvt))
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message, details = ex.StackTrace });
        }
    }

    // New endpoint for structures
    [HttpGet("structures")]
    [Authorize]
    public async Task<IActionResult> ListStructures()
    {
        using var db = await _dbSelector.GetConnection(HttpContext);
        var rows = await db.QueryAsync<Structure>(
            @"SELECT code AS code, libelle AS libelle, IFNULL(libarabe, '') AS libarabe 
          FROM structure 
          WHERE typeStruct = 'CH' and nature= '1'
          ORDER BY code"
        );
        return Ok(new { success = true, structures = rows, count = rows.Count() });
    }

    // New endpoint for production data
    [HttpGet("production")]
    [Authorize]
    public IActionResult ListProduction()
    {
        // Mock data for demonstration
        var mockProductionData = new List<ProductionData>
        {
            new ProductionData { Day = "Day 1", Eggs = 100, Mortality = 5 },
            new ProductionData { Day = "Day 2", Eggs = 110, Mortality = 3 },
            new ProductionData { Day = "Day 3", Eggs = 120, Mortality = 7 },
            new ProductionData { Day = "Day 4", Eggs = 115, Mortality = 4 },
            new ProductionData { Day = "Day 5", Eggs = 130, Mortality = 2 }
        };
        var mockMortalityData = new List<ProductionData>
        {
            new ProductionData { Day = "Day 1", Eggs = 0, Mortality = 5 },
            new ProductionData { Day = "Day 2", Eggs = 0, Mortality = 3 },
            new ProductionData { Day = "Day 3", Eggs = 0, Mortality = 7 },
            new ProductionData { Day = "Day 4", Eggs = 0, Mortality = 4 },
            new ProductionData { Day = "Day 5", Eggs = 0, Mortality = 2 }
        };
        return Ok(new { success = true, production = mockProductionData, mortality = mockMortalityData });
    }



    [HttpGet("inventory")]
    [Authorize]
    public async Task<IActionResult> ListInventory(
        [FromQuery] string structure,
        [FromQuery] string nummvt,
        [FromQuery] string numcentre,
        [FromQuery] string numbat,
        [FromQuery] string nomBaseStockSession,
        [FromQuery] string? famille = null) // Nouveau paramètre optionnel
    {
        if (string.IsNullOrWhiteSpace(structure) ||
            string.IsNullOrWhiteSpace(nummvt) ||
            string.IsNullOrWhiteSpace(numcentre) ||
            string.IsNullOrWhiteSpace(numbat) ||
            string.IsNullOrWhiteSpace(nomBaseStockSession)) // Validation ajoutée
        {
            return BadRequest(new { success = false, error = "Les paramètres structure, nummvt, numcentre, numbat et nomBaseStockSession sont requis" });
        }

        using var db = await _dbSelector.GetConnection(HttpContext);
 
        var paramaitre = await db.QueryFirstOrDefaultAsync<Paramaitre>(
           "SELECT * FROM socerp.paramaitre WHERE code = @nomBaseStockSession",
              new { nomBaseStockSession }
       );

        var paramSouche = await db.QueryFirstOrDefaultAsync<ParamSouche>(
            "SELECT * FROM paramsouche WHERE nummvt = @nummvt",
            new { nummvt }
        );

        if (paramSouche == null)
        {
            return BadRequest(new { success = false, error = "Paramètres souche non encore affecté pour ce centre et bâtiment !" });
        }

      
        string codeDepBat = "01";
        string libDepBat = "Dépôt Local";
       
 
            if (paramaitre != null && !string.IsNullOrEmpty(paramaitre.gestionavicole) && paramaitre.gestionavicole == "1")
             


        //if (paramaitre != null && paramaitre.gestionavicole.HasValue && paramaitre.gestionavicole == 1)
        {
            //if (paramaitre.stkcentre.HasValue && paramaitre.stkcentre == 1)
            if (!string.IsNullOrEmpty(paramaitre.stkcentre) && paramaitre.stkcentre == "1")

            {
                var depot = await db.QueryFirstOrDefaultAsync<Depot>(
                    "SELECT * FROM depot WHERE numcentre = @numcentre LIMIT 1",
                    new { numcentre }
                );
                if (depot != null)
                {
                    codeDepBat = depot.Code ?? "";
                    libDepBat = depot.Libelle ?? "";
                }
            }
            else
            {
                var depot = await db.QueryFirstOrDefaultAsync<Depot>(
                    "SELECT * FROM depot WHERE numcentre = @numcentre AND numbat = @numbat LIMIT 1",
                    new { numcentre, numbat }
                );
                if (depot != null)
                {
                    codeDepBat = depot.Code ?? "";
                    libDepBat = depot.Libelle ?? "";
                }
            }

            if (string.IsNullOrWhiteSpace(codeDepBat) || string.IsNullOrWhiteSpace(libDepBat))
            {
                return BadRequest(new { success = false, error = "Aucun dépôt de stock n'est affecté à ce centre et bâtiment !" });
            }
        }
        else if (paramaitre == null)
        {
            return BadRequest(new { success = false, error = "Aucun paramètre trouvé dans la table paramaitre" });
        }

        var inventory = await db.QueryAsync<InventoryItem>(
            "SELECT sd.codedep AS CodeDep, sd.cnature AS CNature, sd.libdep AS LibDep, sd.codeart AS Codeart, sd.desart AS Desart, " +
            "sd.qteart AS Qteart, sd.prixvttc1 AS Prixvttc1, a.famille AS Famille, a.libfam AS LibFam, " +
            "IFNULL(a.tauxtva, 0) AS Tauxtva, IFNULL(a.prixnet, 0) AS PrixNet, IFNULL(a.prixvht1, 0) AS Prixvht1, " +
            "IFNULL(a.unite, '') AS Unite, IFNULL(sd.libarabe, '') AS Libarabe, IFNULL(sd.unitearabe, '') AS UniteArabe " +
            "FROM stockdepot sd " +
            "LEFT JOIN article a ON a.code = sd.codeart " +
            "WHERE sd.cnature = @structure AND sd.codedep = @codedep" +
            (string.IsNullOrWhiteSpace(famille) ? string.Empty : " AND a.famille = @famille"),
            new { structure, codedep = codeDepBat, famille }
        );

        return Ok(new
        {
            success = true,
            inventory = inventory,
            CodeDepBat = codeDepBat,
            LibDepBat = libDepBat,
            count = inventory.Count()
        });
    }


    [HttpGet("/api/centres/list")]
    [Authorize]
    public async Task<IActionResult> Centres()
    {
        using var db = await _dbSelector.GetConnection(HttpContext);
        // Vérifier si la colonne existe
        bool hasLibcentarabe = await CheckArabicColumnsExist(db, "batiment", new[] { "libcentarabe" });
        var sql = "SELECT DISTINCT numcentre AS numcentre, libelleCentre AS libellecentre";
        if (hasLibcentarabe)
        {
            sql += ", IFNULL(libcentarabe, '') AS libcentarabe";
        }
        else
        {
            sql += ", '' AS libcentarabe";
        }
        sql += " FROM batiment ORDER BY libelleCentre";
        
        var rows = await db.QueryAsync<dynamic>(sql);
        return Ok(new { success = true, centres = rows, count = rows.Count() });
    }

    [HttpGet("/api/clients/list")]
    [Authorize]
    public async Task<IActionResult> Clients()
    {
        using var db = await _dbSelector.GetConnection(HttpContext);
        var rows = await db.QueryAsync<string>(
            "SELECT DISTINCT  codecli FROM batiment ORDER BY  codecli"
        );
        var list = rows.Select(c => new { codecli = c });
        return Ok(new { success = true, clients = list, count = list.Count() });
    }





    public class DernierJourDto
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = "";
        public string NumLot { get; set; } = string.Empty;
        public int Semaine { get; set; }
        public int Jour { get; set; }
        public DateTime Date { get; set; }
        public double Mortalite { get; set; }
        public double MortMale { get; set; }
        public double EffAjout { get; set; }
        public double EffRetire { get; set; }
        public double EffectifInitial { get; set; }         // teffectif
        public double EffectifJour { get; set; }            // teffectifj
        public double QteVendueJour { get; set; }           // tqtev
        public double PoidsVenduJour { get; set; }          // tpoidsv
        public double MontantVenteJour { get; set; }        // tmtv
        public double PoidsOeufLot { get; set; }            // tpoidsoeuf
        public double AlimRestant { get; set; }             // talimrest
        public string TemperLot { get; set; } = string.Empty;               // ttemperlot
        public string HumiditeLot { get; set; } = string.Empty;             // thumiditelot
        public string ConseauLot { get; set; } = string.Empty;              // tconseaulot
        public string IntLumLot { get; set; } = string.Empty;               // tintlumlot
        public string EclairLot { get; set; } = string.Empty;               // teclairlot
        public double StockOeuf { get; set; }               // calculated
        public double StockPlat { get; set; }               // calculated
        public string TypeEspece { get; set; } = string.Empty;
        public string CodeArt { get; set; } = string.Empty;
    }

    /// <summary>
    /// Traduction de DernJourClot(j) en endpoint API.
    /// j: 0=cloturer (premier non clôturé), 1=premier clôturé, 2=précédent, 3=suivant, 4=dernier, 5=jour exact
    /// currentJour (optionnel) correspond à tjour dans VB6 (utile pour j=2/3/5)
    /// </summary>
    [HttpGet("{numLot}/dernier-jour")]
    [Authorize]
    public async Task<IActionResult> DernierJourClot(
        string numLot,
        [FromQuery] int j = 0,
        [FromQuery] int? currentJour = null)
    {
        try
        {
            using var db = await _dbSelector.GetConnection(HttpContext);

            // 1) Reset effajout on first paramsouche (VB6 behavior)
            var firstParams = await db.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT * FROM paramsouche WHERE nummvt = @NumLot ORDER BY jour LIMIT 1",
                new { NumLot = numLot });
            if (firstParams != null)
            {
                // Update effajout = 0 for that first jour (VB6 did this)
                await db.ExecuteAsync(
                    "UPDATE paramsouche SET effajout = 0 WHERE nummvt = @NumLot AND jour = @Jour LIMIT 1",
                    new { NumLot = numLot, Jour = (int)firstParams.jour });
            }

            // 2) Select paramsouche depending on j
            string sqlSelectParams;
            object sqlParams;

            if (j == 4) // dernier cloturé
            {
                sqlSelectParams = "SELECT * FROM paramsouche WHERE nummvt = @NumLot AND cloturer = 1 ORDER BY jour DESC LIMIT 1";
                sqlParams = new { NumLot = numLot };
            }
            else if (j == 2) // precedent
            {
                // need tjour: if not provided use current DB value fallback (we'll fetch tjour later if needed)
                if (!currentJour.HasValue)
                {
                    // fallback: take current stored jour from latest paramsouche
                    var tmp = await db.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT jour FROM paramsouche WHERE nummvt = @NumLot ORDER BY jour DESC LIMIT 1",
                        new { NumLot = numLot });
                    if (tmp == null) return NotFound(new { success = false, message = "Aucun paramsouche trouvé pour calcul précédent." });
                    currentJour = (int)tmp.jour;
                }

                sqlSelectParams = "SELECT * FROM paramsouche WHERE nummvt = @NumLot AND jour < @Tjour AND cloturer = 1 ORDER BY jour DESC LIMIT 1";
                sqlParams = new { NumLot = numLot, Tjour = currentJour.Value };
            }
            else if (j == 1) // premier cloturé
            {
                sqlSelectParams = "SELECT * FROM paramsouche WHERE nummvt = @NumLot AND cloturer = 1 ORDER BY jour LIMIT 1";
                sqlParams = new { NumLot = numLot };
            }
            else if (j == 3) // suivant
            {
                if (!currentJour.HasValue)
                {
                    var tmp = await db.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT jour FROM paramsouche WHERE nummvt = @NumLot ORDER BY jour DESC LIMIT 1",
                        new { NumLot = numLot });
                    if (tmp == null) return NotFound(new { success = false, message = "Aucun paramsouche trouvé pour calcul suivant." });
                    currentJour = (int)tmp.jour;
                }
                sqlSelectParams = "SELECT * FROM paramsouche WHERE nummvt = @NumLot AND jour > @Tjour AND cloturer = 1 ORDER BY jour LIMIT 1";
                sqlParams = new { NumLot = numLot, Tjour = currentJour.Value };
            }
            else if (j == 5) // jour exact = tjour
            {
                if (!currentJour.HasValue)
                {
                    var tmp = await db.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT jour FROM paramsouche WHERE nummvt = @NumLot ORDER BY jour DESC LIMIT 1",
                        new { NumLot = numLot });
                    if (tmp == null) return NotFound(new { success = false, message = "Aucun paramsouche trouvé pour jour exact." });
                    currentJour = (int)tmp.jour;
                }
                sqlSelectParams = "SELECT * FROM paramsouche WHERE nummvt = @NumLot AND jour = @Tjour ORDER BY jour LIMIT 1";
                sqlParams = new { NumLot = numLot, Tjour = currentJour.Value };
            }
            else // j == 0 or default: premier non cloturé
            {
                sqlSelectParams = "SELECT * FROM paramsouche WHERE nummvt = @NumLot AND cloturer = '0' ORDER BY jour LIMIT 1";
                sqlParams = new { NumLot = numLot };
            }

            var param = await db.QueryFirstOrDefaultAsync<dynamic>(sqlSelectParams, sqlParams);

            // if not found, fallback to last paramsouche (VB6 does that)
            if (param == null)
            {
                param = await db.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM paramsouche WHERE nummvt = @NumLot ORDER BY jour DESC LIMIT 1", new { NumLot = numLot });
                if (param == null)
                    return NotFound(new { success = false, message = "Aucun enregistrement paramsouche trouvé." });
            }

            int tsemaine = param.semaine;
            int tjour = (int)param.jour;
            DateTime tdate = param.date;
            double tmortalite = param.mortalite ?? 0;
            double tmortmale = param.mortmale ?? 0;
            double teffajout = param.effajout ?? 0;
            double teffretire = param.effretire ?? 0;
            double tqtev = 0;
            double tpoidsv = 0;
            double tmtv = 0;
            double tpoidsoeuf = ( double)param.poidsoflot ;
            double talimrest = ( double)param.alimrestant ;
            string ttemperlot = (param.temperlot ?? "").ToString();
            string thumiditelot = (param.humiditelot ?? "").ToString();
            string tconseaulot = (param.conseaulot ?? "").ToString();
            string tintlumlot = (param.intlumlot ?? "").ToString();
            string teclairlot = (param.eclairlot ?? "").ToString();

            // 3) Calcul EffSortie & teffectifj
            // Récupérer l'effectif initial (VB6 uses teffectif variable from earlier—here we try to read from batiment table)
            var batiment = await db.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT teffectif = COALESCE(effectif, 0) FROM batiment WHERE nummvt = @NumLot LIMIT 1",
                new { NumLot = numLot });

            double teffectif = batiment != null ? ( double)batiment.teffectif : 0;

            // Sum over paramsouche where jour < tjour
            var sums = await db.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT 
                    COALESCE(SUM(mortalite + qtevendu + qtetransfert - effajout + effretire),0) AS EffSortie,
                    COALESCE(SUM(qtetransfert),0) AS EffTransfert
                  FROM paramsouche
                  WHERE nummvt = @NumLot AND jour < @Tjour
                  LIMIT 1",
                new { NumLot = numLot, Tjour = tjour });

            double EffSortie = ( double)sums?.EffSortie;
            // double EffTransfert = ( double)sums?.EffTransfert ?? 0; // kept if needed

            double teffectifj = teffectif - EffSortie;
            if (EffSortie == 0) teffectifj = teffectif; // same as VB6 logic (if no rows)

            // 4) Charger l'espèce liée au lot (pour TypeEspece & CodeArt & Phase2)
            var espece = await db.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT e.typeespece as TypeEspece, e.phase2 as Phase2, e.codeart as CodeArt, COALESCE(e.capacitealv, 0) as CapaciteAlv, e.libarabe as Libarabe
                  FROM espece e
                  JOIN batiment b ON b.codeesp = e.codeesp
                  WHERE b.nummvt = @NumLot
                  LIMIT 1",
                new { NumLot = numLot });

            string typeEspece = espece?.TypeEspece ?? "";
            string codeArt = espece?.CodeArt ?? "";
            bool isPhase2 = (espece?.Phase2?.ToString() == "1");
            double capaciteAlv = ( double)(espece?.CapaciteAlv) ;

            // 5) Construire ReqChair (codeart filter)
            string reqChairSqlFragment = "";
            if (!string.IsNullOrEmpty(codeArt))
            {
                // The VB6 added spacing differently for type 'C' but same effect; we will use param binding
                reqChairSqlFragment = " AND codeart = @CodeArt ";
            }

            var tablesToCheck = new[] { "lbl", "lfc", "lbs" };

            // For each table, fetch rows for that date and numlot and sum like VB6 loop
            foreach (var table in tablesToCheck)
            {
                var rows = await db.QueryAsync<dynamic>(
                    $@"SELECT * FROM {table} 
                       WHERE datemvt = @DateMvt
                       AND numlot = @NumLot
                       {(string.IsNullOrEmpty(reqChairSqlFragment) ? "" : " AND codeart = @CodeArt ")}
                       ORDER BY nummvt
                       LIMIT 2500",
                    new { DateMvt = tdate.Date, NumLot = numLot, CodeArt = codeArt });

                foreach (var r in rows)
                {
                    double qteArt = ( double)(r.qteart);
                    double nbrSujet = ( double)(r.nbrsujet);
                    double puttc = ( double)(r.puttc) ;

                    if (typeEspece == "C")
                    {
                        if (qteArt > 0)
                        {
                            tqtev += nbrSujet;
                            tpoidsv += qteArt;
                        }
                    }
                    else
                    {
                        tqtev += qteArt;
                        // for non 'C' VB6 sets tpoidsv = 0 repeatedly -> final result is 0
                        tpoidsv = 0;
                    }

                    tmtv += qteArt * puttc;
                }
            }

            // After loops: mimic VB6 line: tqtev = Val(tqtev)
            tqtev = Convert.ToDouble(tqtev);

            // Format values as VB6 did => we round/format to 3 decimals for numeric fields
            tpoidsv = Math.Round(tpoidsv, 3);
            tmtv = Math.Round(tmtv, 3);
            tpoidsoeuf = Math.Round(tpoidsoeuf, 3);
            talimrest = Math.Round(talimrest, 3);

            // 6) If ponte & phase2 -> compute stock œufs
            double stockOeuf = 0;
            double stockPlat = 0;
            if (typeEspece == "P" && isPhase2)
            {
                (stockOeuf, stockPlat) = await StockOeufLotAsync(db, numLot, string.Empty, capaciteAlv);
            }

            // 7) Build and return DTO
            var dto = new DernierJourDto
            {
                Success = true,
                Message = "OK",
                NumLot = numLot,
                Semaine = tsemaine,
                Jour = tjour,
                Date = tdate,
                Mortalite = tmortalite,
                MortMale = tmortmale,
                EffAjout = teffajout,
                EffRetire = teffretire,
                EffectifInitial = teffectif,
                EffectifJour = teffectifj,
                QteVendueJour = tqtev,
                PoidsVenduJour = tpoidsv,
                MontantVenteJour = tmtv,
                PoidsOeufLot = tpoidsoeuf,
                AlimRestant = talimrest,
                TemperLot = ttemperlot ?? string.Empty,
                HumiditeLot = thumiditelot ?? string.Empty,
                ConseauLot = tconseaulot ?? string.Empty,
                IntLumLot = tintlumlot ?? string.Empty,
                EclairLot = teclairlot ?? string.Empty,
                StockOeuf = stockOeuf,
                StockPlat = stockPlat,
                TypeEspece = typeEspece ?? string.Empty,
                CodeArt = codeArt ?? string.Empty
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Equivalent de StockOeufLot() — somme QteArt dans stocklot pour numlot et codedep (if codedep null, sum by numlot)
    /// retourne (oeufs, plateaux)
    /// </summary>
    private async Task<(double oeufs, double plateaux)> StockOeufLotAsync(System.Data.IDbConnection db, string numLot, string? codeDepBat, double capaciteAlv)
    {
        // SELECT QteArt rows (rounded in VB6)
        IEnumerable<double> rows;
        if (!string.IsNullOrEmpty(codeDepBat))
        {
            rows = await db.QueryAsync<double>(
                @"SELECT ROUND(QteArt) FROM stocklot 
                  WHERE numlot = @NumLot 
                    AND codedep = @CodeDep 
                    AND codeart IN (SELECT code FROM article WHERE cnature = '006')
                  LIMIT 100",
                new { NumLot = numLot, CodeDep = codeDepBat });
        }
        else
        {
            rows = await db.QueryAsync<double>(
                @"SELECT ROUND(QteArt) FROM stocklot 
                  WHERE numlot = @NumLot
                    AND codeart IN (SELECT code FROM article WHERE cnature = '006')
                  LIMIT 100",
                new { NumLot = numLot });
        }

        double stockOeuf = rows.Sum();
        double stockPlat = capaciteAlv > 0 ? Math.Floor(stockOeuf / capaciteAlv) : 0;

        return (Math.Floor(stockOeuf), stockPlat);
    }

    /// <summary>
    /// Vérifie si les colonnes arabes existent dans une table
    /// </summary>
    private async Task<bool> CheckArabicColumnsExist(IDbConnection db, string tableName, string[] columnNames)
    {
        try
        {
            var columns = string.Join("', '", columnNames);
            var sql = $@"
                SELECT COUNT(*) as count
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = @tableName
                AND COLUMN_NAME IN ('{columns}')";
            
            var result = await db.QueryFirstOrDefaultAsync<dynamic>(sql, new { tableName });
            if (result == null) return false;
            var countValue = result.count;
            if (countValue == null) return false;
            return Convert.ToInt32(countValue) == columnNames.Length;
        }
        catch
        {
            return false;
        }
    }
}

// DTO pour la liste des bâtiments avec mise en place
public class BatimentAvecMiseplaceDto
{
    public string? NumCentre { get; set; }
    public string? LibelleCentre { get; set; }
    public string? Adresse { get; set; }
    public string? NumBatiment { get; set; }
    public string? LibelleBatiment { get; set; }
    public string? LibCentarabe { get; set; }
    public string? Adrarabe { get; set; }
    public string? LibBatarabe { get; set; }
    public string? NumMvt { get; set; }
    public string? CodeFact { get; set; }
    public string? LibBat { get; set; }
    public double Effectif { get; set; }
    public string? CodeEspece { get; set; }
    public string? LibEspece { get; set; }
    public string? LibEesparabe { get; set; }
    public string? MpLibCentarabe { get; set; }
    public string? MpLibBatarabe { get; set; }
    public string? Souche { get; set; }
    public DateTime? DateMvt { get; set; }
    public DateTime? DateEclo { get; set; }
    public double NbrJour { get; set; }
    public double JourDeb { get; set; }
}


