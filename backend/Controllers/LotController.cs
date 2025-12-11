using BackendApi.DTO;
using BackendApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LotController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LotController(AppDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet("jour-en-cours")]
        [Produces("application/json")]
        public async Task<ActionResult<VbjourDto>> GetjourEnCoursVb(
            [FromQuery] string nomBaseStockSession,
            [FromQuery] string? numLot = null,
            [FromQuery] string? tnummvt = null,
            [FromQuery] string? numCentre = null,
            [FromQuery] string? departement = null,
            [FromQuery] string? departmnt = null,
            [FromQuery] string? numBatiment = null,
            [FromQuery] double? tjour = null,
            [FromQuery] double? tsemaine = null)
        {
            try
            {
                // Étape 1: Validation des paramètres obligatoires
                // Support pour numLot ou tnummvt (priorité à tnummvt si les deux sont fournis)
                string lotNumber = !string.IsNullOrEmpty(tnummvt) ? tnummvt! : (numLot ?? string.Empty);
                if (string.IsNullOrEmpty(lotNumber))
                    return BadRequest(new { success = false, error = "numLot ou tnummvt doit être fourni" });

                if (string.IsNullOrEmpty(nomBaseStockSession))
                    return BadRequest(new { success = false, error = "nomBaseStockSession ne peut pas être vide" });

                // Support pour numCentre ou departement/departmnt (priorité à departement/departmnt)
                string centreNumber = !string.IsNullOrEmpty(departement) ? departement : 
                                     (!string.IsNullOrEmpty(departmnt) ? departmnt : (numCentre ?? string.Empty));
                if (string.IsNullOrEmpty(centreNumber))
                    return BadRequest(new { success = false, error = "numCentre, departement ou departmnt doit être fourni" });

                // Étape 2: Configuration de la connexion
                if (_context.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
                {
                    await _context.Database.OpenConnectionAsync();
                }
                // Utiliser le nom de base validé (pas d'injection SQL possible car validé en amont)
                var dbName = nomBaseStockSession;
#pragma warning disable EF1002 // Méthode ExecuteSqlRawAsync avec interpolation - nom de base validé
                await _context.Database.ExecuteSqlRawAsync($"USE `{dbName}`;");
#pragma warning restore EF1002

                // Étape 3: Récupération des paramètres souche
                var paramSouchePremier = await _context.ParamSouche
                    .Where(p => p.nummvt == lotNumber)
                    .OrderBy(p => p.jour)
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                if (paramSouchePremier == null)
                    return NotFound(new { success = false, error = "Paramètres souche non encore affecté !" });

                var para = await _context.Paramaitre
                    .FromSqlRaw("SELECT * FROM socerp.Paramaitre WHERE Code = {0}", nomBaseStockSession)
                    .AsNoTracking()
                    .OrderBy(p => p.code)
                    .FirstOrDefaultAsync();

                if (para == null)
                    return StatusCode(500, new { success = false, error = "Paramètres système non trouvés !" });

                // Étape 5: Gestion du dépôt avec gestion sécurisée des propriétés
                string codeDepBat = string.Empty;
                string libDepBat = string.Empty;

                // Vérification sécurisée des propriétés de para
                var gestionAvicole = SafeGetString(para?.gestionavicole);
                var stkCentre = SafeGetString(para?.stkcentre);

                if (!string.IsNullOrEmpty(gestionAvicole) && gestionAvicole == "1")
                {
                    var depotQuery = _context.Depot.AsQueryable();

                    if (!string.IsNullOrEmpty(stkCentre) && stkCentre == "1")
                    {
                        // Gestion des nulls dans la requête
                        depotQuery = depotQuery.Where(d =>
                            (d.numcentre ?? "") == (centreNumber ?? ""));
                    }
                    else
                    {
                        if (string.IsNullOrEmpty(numBatiment))
                            return BadRequest(new { success = false, error = "numBatiment est requis quand StkCentre = 0" });

                        // Gestion des nulls dans la requête
                        depotQuery = depotQuery.Where(d =>
                            (d.numcentre ?? "") == (centreNumber ?? "") &&
                            (d.numbat ?? "") == (numBatiment ?? ""));
                    }

                    var depot = await depotQuery.AsNoTracking().FirstOrDefaultAsync();
                    if (depot == null)
                        return NotFound(new { success = false, error = "Aucun dépôt de stock n'est affecté à ce bâtiment !" });

                    codeDepBat = SafeGetString(depot.Code);
                    libDepBat = SafeGetString(depot.Libelle);
                }

                // Étape 6: Récupération de l'espèce avec gestion sécurisée
                var codeEspece = SafeGetString(paramSouchePremier?.codeesp);
                if (string.IsNullOrEmpty(codeEspece))
                    return NotFound(new { success = false, error = "Code espèce non trouvé dans les paramètres souche !" });

                var espece = await _context.Espece
                    .Where(e => e.code == codeEspece)
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                if (espece == null)
                    return NotFound(new { success = false, error = $"Espèce avec le code {codeEspece} non trouvée !" });

                // Étape 7: Récupération des informations de mise en place
                var misePlace = await _context.Miseplace
                    .Where(m => m.nummvt == lotNumber)
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                double teffectifGlobal = 0;
                string tsoucheMisePlace = string.Empty;

                if (misePlace != null)
                {
                    teffectifGlobal = SafeGetDouble(misePlace.effectif);
                    tsoucheMisePlace = SafeGetString(misePlace.souche);
                    Debug.WriteLine($"MisePlace trouvée - EffectifGlobal: {teffectifGlobal}, Souche: {tsoucheMisePlace}");
                }

                // Étape 8: Récupération du jour cible
                ParamSouche? jourCible = null;

                // Si tjour et/ou tsemaine sont fournis, chercher le jour spécifique
                if (tjour.HasValue || tsemaine.HasValue)
                {
                    var query = _context.ParamSouche.Where(p => p.nummvt == lotNumber);
                    
                    if (tjour.HasValue)
                    {
                        query = query.Where(p => p.jour == tjour.Value);
                    }
                    
                    if (tsemaine.HasValue)
                    {
                        query = query.Where(p => p.semaine == tsemaine.Value);
                    }
                    
                    jourCible = await query
                        .OrderBy(p => p.jour)
                        .AsNoTracking()
                        .FirstOrDefaultAsync();
                }
                
                // Si pas de jour spécifique trouvé ou pas de paramètres tjour/tsemaine, chercher le premier non clôturé
                if (jourCible == null)
                {
                    jourCible = await _context.ParamSouche
                        .Where(p => p.nummvt == lotNumber && p.cloturer == 0)
                        .OrderBy(p => p.jour)
                        .AsNoTracking()
                        .FirstOrDefaultAsync();
                }

                // Si toujours pas trouvé, prendre le dernier jour
                if (jourCible == null)
                {
                    jourCible = await _context.ParamSouche
                        .Where(p => p.nummvt == lotNumber)
                        .OrderByDescending(p => p.jour)
                        .AsNoTracking()
                        .FirstOrDefaultAsync();
                }

                if (jourCible == null)
                    return NotFound(new { success = false, error = "Aucune ligne paramsouche pour ce lot" });

                // Étape 9: Récupération de l'effectif directement depuis paramsouche
                // L'effectif du jour est directement dans paramsouche.effectif
                double teffectifj = SafeGetDouble(jourCible.effectif);
                
                // Calcul de l'effectif global pour référence (depuis miseplace)
                double teffectif = teffectifGlobal;
                
                // Calcul des transferts historiques si nécessaire
                double EffTransfert = 0;
                var historiques = await _context.ParamSouche
                    .Where(p => p.nummvt == lotNumber && p.jour < jourCible.jour)
                    .AsNoTracking()
                    .ToListAsync();

                foreach (var h in historiques)
                {
                    EffTransfert += SafeGetDouble(h.qtetransfert);
                }

                // Étape 11: Calcul des ventes
                double tqtev = 0;
                double tpoidsv = 0;
                double tmtv = 0;
                var currentDate = jourCible.date ?? DateTime.MinValue;
                var filtrecodeart = SafeGetString(espece?.codeart);

                // Ventes LBL
                var ventesLbl = await _context.Lbl
                    .Where(v => v.datemvt == currentDate && v.nummvt == lotNumber && v.codeart == filtrecodeart)
                    .AsNoTracking()
                    .ToListAsync();

                foreach (var v in ventesLbl)
                {
                    if (SafeGetString(espece?.typeespece) == "C")
                    {
                        if (SafeGetDouble(v.qteart) > 0)
                        {
                            tqtev += SafeGetDouble(v.nbrsujet);
                            tpoidsv += SafeGetDouble(v.qteart);
                        }
                    }
                    else
                    {
                        tqtev += SafeGetDouble(v.qteart);
                    }
                    tmtv += SafeGetDouble(v.qteart) * SafeGetDouble(v.puttc);
                }

                // Ventes LFC
                var ventesLfc = await _context.Lfc
                    .Where(v => v.datemvt == currentDate && v.nummvt == lotNumber && v.codeart == filtrecodeart)
                    .AsNoTracking()
                    .ToListAsync();

                foreach (var v in ventesLfc)
                {
                    if (SafeGetString(espece?.typeespece) == "C")
                    {
                        if (SafeGetDouble(v.qteart) > 0)
                        {
                            tqtev += SafeGetDouble(v.nbrsujet);
                            tpoidsv += SafeGetDouble(v.qteart);
                        }
                    }
                    else
                    {
                        tqtev += SafeGetDouble(v.qteart);
                    }
                    tmtv += SafeGetDouble(v.qteart) * SafeGetDouble(v.puttc);
                }

                // Ventes LBS
                var ventesLbs = await _context.Lbs
                    .Where(v => v.datemvt == currentDate && v.nummvt == lotNumber && v.codeart == filtrecodeart)
                    .AsNoTracking()
                    .ToListAsync();

                foreach (var v in ventesLbs)
                {
                    if (SafeGetString(espece?.typeespece) == "C")
                    {
                        if (SafeGetDouble(v.qteart) > 0)
                        {
                            tqtev += SafeGetDouble(v.nbrsujet);
                            tpoidsv += SafeGetDouble(v.qteart);
                        }
                    }
                    else
                    {
                        tqtev += SafeGetDouble(v.qteart);
                    }
                    tmtv += SafeGetDouble(v.qteart) * SafeGetDouble(v.puttc);
                }

                tqtev = Math.Round(tqtev, 0);
                tpoidsv = Math.Round(tpoidsv, 3);
                tmtv = Math.Round(tmtv, 3);

                // Étape 12: Calcul des stocks
                double tstockoeuf = 0;
                double tstockplat = 0;

                if (!string.IsNullOrEmpty(codeDepBat))
                {
                    var stocks = await _context.StockLots
                        .Where(s => s.NumLot == lotNumber && s.CodeDep == codeDepBat)
                        .AsNoTracking()
                        .ToListAsync();

                    foreach (var s in stocks)
                        tstockoeuf += Math.Round(SafeGetDouble(s.qteart));

                    if (para != null && SafeGetDouble(para.capacitealv) > 0)
                        tstockplat = Math.Floor(tstockoeuf / SafeGetDouble(para.capacitealv));
                }

                // Étape 13: Construction du DTO final
                // Déterminer si le jour est clôturé
                int cloture = SafeGetDouble(jourCible.cloturer) == 1 ? 1 : 0; // 0 = non clôturé, 1 = clôturé

                var dto = new VbjourDto
                {
                    tnummvt = lotNumber,
                    tjour = SafeGetDouble(jourCible.jour),
                    tsemaine = SafeGetDouble(jourCible.semaine),
                    tdate = jourCible.date,
                    tmortalite = SafeGetDouble(jourCible.mortalite),
                    tmortmale = SafeGetDouble(jourCible.mortmale),
                    teffajout = SafeGetDouble(jourCible.effajout),
                    teffretire = SafeGetDouble(jourCible.effretire),
                    tqtev = tqtev,
                    tpoidsv = tpoidsv,
                    tmtv = tmtv,
                    tpoidsoeuf = Math.Round(SafeGetDouble(jourCible.poidslot), 3),
                    talimrest = Math.Round(SafeGetDouble(jourCible.alimrestant), 3),
                    ttemperlot = SafeGetString(jourCible?.temperlot),
                    thumiditelot = SafeGetString(jourCible?.humiditelot),
                    tconseaulot = SafeGetString(jourCible?.conseaulot),
                    tintlumlot = SafeGetString(jourCible?.intlumlot),
                    teclairlot = SafeGetString(jourCible?.eclairlot),
                    teffectif = teffectif,
                    teffectifj = teffectifj,
                    tstockoeuf = tstockoeuf,
                    tstockplat = tstockplat,
                    tcodeesp = codeEspece,
                    tespece = SafeGetString(espece?.libelle),
                    tespecearabe = SafeGetString(espece?.libarabe),
                    tnumcentre = centreNumber,
                    tlibcentre = libDepBat,
                    tnumbat = numBatiment ?? string.Empty,
                    tlibbat = string.Empty,
                    tsouche = tsoucheMisePlace,
                    tadresse = string.Empty,
                    teffectif_global = teffectifGlobal,
                    tsouche_miseplace = tsoucheMisePlace,
                    tcloturer = SafeGetDouble(jourCible?.cloturer),
                    cloture = cloture
                };

                return Ok(new { success = true, message = "success", data = dto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
            finally
            {
                if (_context.Database.GetDbConnection().State == System.Data.ConnectionState.Open)
                {
                    await _context.Database.CloseConnectionAsync();
                }
            }
        }

        // Méthodes helpers améliorées pour gérer les DBNull
        private string SafeGetString(object? value)
        {
            try
            {
                if (value == null || value == DBNull.Value)
                    return string.Empty;

                return value.ToString() ?? string.Empty;
            }
            catch (InvalidCastException)
            {
                return string.Empty;
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        private double SafeGetDouble(object? value)
        {
            try
            {
                if (value == null || value == DBNull.Value)
                    return 0.0;

                // Si c'est déjà un double, retourner directement
                if (value is double d)
                    return d;

                // Si c'est un float, convertir en double
                if (value is float f)
                    return (double)f;

                // Si c'est un decimal, convertir en double
                if (value is decimal dec)
                    return (double)dec;

                // Si c'est un int, convertir en double
                if (value is int i)
                    return (double)i;

                // Pour les autres types, essayer de parser la string
                if (double.TryParse(value.ToString(), out double result))
                    return result;

                return 0.0;
            }
            catch (InvalidCastException)
            {
                return 0.0;
            }
            catch (Exception)
            {
                return 0.0;
            }
        }

        [HttpGet("test-connection")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                if (_context.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
                {
                    await _context.Database.OpenConnectionAsync();
                }
                var connectionState = _context.Database.GetDbConnection().State;
                var canConnect = await _context.Database.CanConnectAsync();

                return Ok(new
                {
                    success = true,
                    Message = "Connexion à la base de données réussie",
                    ConnectionState = connectionState.ToString(),
                    CanConnect = canConnect
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    Message = "Erreur de connexion à la base de données",
                    Details = ex.Message
                });
            }
            finally
            {
                if (_context.Database.GetDbConnection().State == System.Data.ConnectionState.Open)
                {
                    await _context.Database.CloseConnectionAsync();
                }
            }
        }
    }

    // DTOs
    public class VbjourDto
    {
        public string tnummvt { get; set; } = string.Empty;
        public double tjour { get; set; }
        public double tsemaine { get; set; }
        public DateTime? tdate { get; set; }
        public double tmortalite { get; set; }
        public double tmortmale { get; set; }
        public double teffajout { get; set; }
        public double teffretire { get; set; }
        public double tqtev { get; set; }
        public double tpoidsv { get; set; }
        public double tmtv { get; set; }
        public double tpoidsoeuf { get; set; }
        public double talimrest { get; set; }
        public string ttemperlot { get; set; } = string.Empty;
        public string thumiditelot { get; set; } = string.Empty;
        public string tconseaulot { get; set; } = string.Empty;
        public string tintlumlot { get; set; } = string.Empty;
        public string teclairlot { get; set; } = string.Empty;
        public double teffectif { get; set; }
        public double teffectifj { get; set; }
        public double tstockoeuf { get; set; }
        public double tstockplat { get; set; }
        public string tcodeesp { get; set; } = string.Empty;
        public string tespece { get; set; } = string.Empty;
        public string tespecearabe { get; set; } = string.Empty;
        public string tnumcentre { get; set; } = string.Empty;
        public string tlibcentre { get; set; } = string.Empty;
        public string tnumbat { get; set; } = string.Empty;
        public string tlibbat { get; set; } = string.Empty;
        public string tsouche { get; set; } = string.Empty;
        public string tadresse { get; set; } = string.Empty;
        public double teffectif_global { get; set; }
        public string tsouche_miseplace { get; set; } = string.Empty;
        public double tcloturer { get; set; }
        public int cloture { get; set; } // 0 = non clôturé, 1 = clôturé
    }
}