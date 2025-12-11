using BackendApi.Models;
using BackendApi.Utilities; // Pour utiliser DdHelper.Dd() comme dd() en PHP
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
using MySqlConnector;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RapportJournalierController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<RapportJournalierController> _logger;
        private readonly AppDbContext _context;

        public RapportJournalierController(
            IConfiguration configuration,
            ILogger<RapportJournalierController> logger,
            AppDbContext context)
        {
            _configuration = configuration;
            _logger = logger;
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpPost("valider-journee")]
        public async Task<IActionResult> ValiderJournee([FromBody] ValidationJourneeRequest request)
        {
            // EXEMPLE DE DÉBOGAGE : Utiliser DdHelper.Dd() comme dd() en PHP
            // Décommentez la ligne suivante pour déboguer la requête reçue :
            // DdHelper.Dd(request, "Request reçue dans ValiderJournee");
            
            // Validation initiale de la base de données
            if (string.IsNullOrWhiteSpace(request.NomBaseStockSession))
            {
                Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                Response.Headers.Add("Pragma", "no-cache");
                Response.Headers.Add("Expires", "0");
                return BadRequest(new ApiErrorResponse
                {
                    Success = false,
                    ErrorCode = "VALIDATION_ERROR",
                    Message = "Le nom de la base de données est requis",
                    Errors = new List<ValidationError>
                    {
                        new ValidationError
                        {
                            Field = "NomBaseStockSession",
                            Code = "REQUIRED",
                            Message = "Le nom de la base (NomBaseStockSession) doit être fourni et non vide."
                        }
                    },
                    Timestamp = DateTime.UtcNow
                });
            }

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                // Ajout logique multi-base :
                if (_context.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
                {
                    await _context.Database.OpenConnectionAsync();
                }
                var nomBase = request.NomBaseStockSession?.ToString();
                await _context.Database.ExecuteSqlRawAsync($"USE `{nomBase}`;");
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        _logger.LogInformation("Début de validation de journée pour le lot: {NumMvt}", request.NumMvt);

                        // Validation complète des données d'entrée
                        var validationResult = await ValiderDonneesEntreeComplet(request);
                        if (!validationResult.IsValid)
                        {
                            await transaction.RollbackAsync();
                            Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                            Response.Headers.Add("Pragma", "no-cache");
                            Response.Headers.Add("Expires", "0");
                            return BadRequest(new ApiErrorResponse
                            {
                                Success = false,
                                ErrorCode = "VALIDATION_ERROR",
                                Message = "Erreurs de validation détectées",
                                Errors = validationResult.Errors,
                                Timestamp = DateTime.UtcNow
                            });
                        }

                        var result = await TraiterValidationJourneeComplete(request, transaction);
                        await transaction.CommitAsync();

                        _logger.LogInformation("Validation de journée terminée avec succès pour le lot: {NumMvt}", request.NumMvt);
                        return Ok(new ApiSuccessResponse<ValidationJourneeResult>
                        {
                            Success = true,
                            Message = "Journée validée avec succès",
                            Data = result,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                    catch (BusinessException ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogWarning(ex, "Erreur métier lors de la validation de journée pour le lot: {NumMvt}", request.NumMvt);
                        Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                        Response.Headers.Add("Pragma", "no-cache");
                        Response.Headers.Add("Expires", "0");
                        return BadRequest(new ApiErrorResponse
                        {
                            Success = false,
                            ErrorCode = ex.ErrorCode ?? "BUSINESS_ERROR",
                            Message = ex.Message,
                            Errors = ex.ValidationErrors ?? new List<ValidationError>(),
                            Timestamp = DateTime.UtcNow
                        });
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, "Erreur lors de la validation de journée pour le lot: {NumMvt}", request.NumMvt);
                        Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                        Response.Headers.Add("Pragma", "no-cache");
                        Response.Headers.Add("Expires", "0");
                        return StatusCode(500, new ApiErrorResponse
                        {
                            Success = false,
                            ErrorCode = "INTERNAL_ERROR",
                            Message = "Une erreur inattendue s'est produite lors de la validation de la journée",
                            Errors = new List<ValidationError>
                            {
                                new ValidationError
                                {
                                    Field = "System",
                                    Code = "EXCEPTION",
                                    Message = ex.Message
                                }
                            },
                            Timestamp = DateTime.UtcNow
                        });
                    }
                    finally
                    {
                        await transaction.DisposeAsync();
                        await _context.Database.CloseConnectionAsync();
                    }
                }
            });
        }

        private async Task<ValidationJourneeResult> TraiterValidationJourneeComplete(ValidationJourneeRequest request, IDbContextTransaction transaction)
        {
            if (request.CartItems == null || request.CartItems.Count == 0)
            {
                throw new BusinessException("PANIER_VIDE",
                    "Aucun article reçu pour la validation.",
                    new List<ValidationError>
                    {
                        new ValidationError
                        {
                            Field = "CartItems",
                            Code = "REQUIRED",
                            Message = "Le panier d'articles est vide."
                        }
                    });
            }

            var totaux = new TotauxJournee();
            totaux.MT_Production = 0;
            totaux.MT_Depense = 0;

            // Déterminer le groupage
            string groupage = await DeterminerGroupage(request.NumMvt);

            // Récupération des numéros de mouvements existants
            var numerosMouvements = await GetNumerosMouvementsExistants(request);

            // Suppression des anciens mouvements
            await SupprimerAnciensMouvements(numerosMouvements);

            // Validation de la journée avec génération de mortalité si nécessaire
            await ValidationJournee(request.NumMvt, request.Mortalite, request.Date, request.NomBaseStockSession);

            // Traitement des mouvements temporaires
            await TraiterMouvementsTemporaires(request, totaux, groupage, numerosMouvements);

            // Calcul des indicateurs
            var indicateurs = await CalculerIndicateurs(totaux, request);

            // Mise à jour de la base de données
            await MettreAJourParamsouche(request, totaux, indicateurs);

            // Mise à jour des données complémentaires
            await MettreAJourDonneesComplementaires(request);

            // Mise à jour de la mortalité
            await Maj_Mortalite(request.NumMvt, request.Date);

            return new ValidationJourneeResult
            {
                Success = true,
                Message = "Journée validée avec succès",
                Totaux = totaux,
                Indicateurs = indicateurs
            };
        }

        private async Task<string> DeterminerGroupage(string numMvt)
        {
            // Récupérer les informations de mise en place et d'espèce
            var mplace = await _context.Miseplace
                .FirstOrDefaultAsync(m => m.nummvt == numMvt);

            if (mplace == null) return numMvt;

            var espece = await _context.Espece
                .FirstOrDefaultAsync(e => e.code == mplace.codeesp);

            if (espece != null && espece.typeespece == "R" && espece.phase2 == "1")
            {
                return mplace.groupage ?? numMvt;
            }

            return numMvt;
        }

        private async Task<NumerosMouvements> GetNumerosMouvementsExistants(ValidationJourneeRequest request)
        {
            var numeros = new NumerosMouvements();

            // Récupération du mouvement de consommation
            var mouvementConsommation = await _context.Emvt
                .Where(e => e.numaffaire == request.NumMvt &&
                           e.nummvt.StartsWith("CS") &&
                           e.typemvt == "S" &&
                           e.datemvt == request.Date)
                .FirstOrDefaultAsync();

            numeros.NumCons = mouvementConsommation?.nummvt;

            // Récupération du mouvement de production
            var mouvementProduction = await _context.Emvt
                .Where(e => e.numaffaire == request.NumMvt &&
                           e.nummvt.StartsWith("RP") &&
                           e.typemvt == "E" &&
                           e.datemvt == request.Date)
                .FirstOrDefaultAsync();

            numeros.NumProd = mouvementProduction?.nummvt;

            return numeros;
        }

        private async Task SupprimerAnciensMouvements(NumerosMouvements numeros)
        {
            if (!string.IsNullOrEmpty(numeros.NumCons))
            {
                var lignesConsommation = _context.Lmvt.Where(l => l.nummvt == numeros.NumCons);
                _context.Lmvt.RemoveRange(lignesConsommation);
                await _context.SaveChangesAsync();
            }

            if (!string.IsNullOrEmpty(numeros.NumProd))
            {
                var lignesProduction = _context.Lmvt.Where(l => l.nummvt == numeros.NumProd);
                _context.Lmvt.RemoveRange(lignesProduction);
                await _context.SaveChangesAsync();
            }
        }

        private async Task ValidationJournee(string numMvt, double mortalite, DateTime date, string? codeSociete = null)
        {
            var mplace = await _context.Miseplace
                .FirstOrDefaultAsync(m => m.nummvt == numMvt);

            if (mplace == null) return;

            var espece = await _context.Espece
                .FirstOrDefaultAsync(e => e.code == mplace.codeesp);

            if (espece != null && espece.typeespece != "C")
            {
                await Gen_Sortie_Mortalite(numMvt, mortalite, date, mplace, espece, codeSociete);
            }
        }

        private async Task Gen_Sortie_Mortalite(string numMvt, double mortalite, DateTime date, Miseplace mplace, Espece espece, string? codeSociete = null)
        {
            if (mortalite == 0) return;

            // Rechercher le mouvement de mortalité existant
            var mouvementMortalite = await _context.Emvt
                .Where(e => e.numaffaire == numMvt &&
                           e.nummvt.StartsWith("MV") &&
                           e.datemvt == date &&
                           e.pieceliee == "RP")
                .FirstOrDefaultAsync();

            string numMV = mouvementMortalite?.nummvt ?? string.Empty;

            if (string.IsNullOrEmpty(numMV))
            {
                numMV = await CreerNouveauMouvement("emvt", date.Year, "MV", "01");
            }

            // Supprimer les anciennes lignes
            var anciennesLignes = _context.Lmvt.Where(l => l.nummvt == numMV);
            _context.Lmvt.RemoveRange(anciennesLignes);

            var ancienEntete = await _context.Emvt.FirstOrDefaultAsync(e => e.nummvt == numMV);
            if (ancienEntete != null)
            {
                _context.Emvt.Remove(ancienEntete);
            }
            await _context.SaveChangesAsync();

            // Récupérer CodeDepBat et LibDepBat depuis Depot
            var (codeDepBat, libDepBat) = await GetCodeDepBatLibDepBat(mplace, codeSociete);

            // Créer le nouvel entête
            await CreationEnteteMortalite(numMV, "S", "MORT_VENTE_TRS", numMvt, date, mplace, codeSociete);

            // Récupérer l'article correspondant à l'espèce
            var article = await _context.Article
                .FirstOrDefaultAsync(a => a.code == espece.codeart);

            if (article == null)
            {
                _logger.LogError("Article inexistant pour l'espèce: {CodeEsp}", espece.code);
                return;
            }

            // Récupérer le prix depuis Miseplace
            var prixTTC = mplace.puttc;

            // Créer la ligne de mouvement
            var tempsActuel = DateTime.Now;
            var prixTtcArrondi = Math.Round(prixTTC, 3);
            var tauxTvaArrondi = Math.Round(article.tauxtva, 3);
            var coeffTva = 1 + (tauxTvaArrondi / 100);
            var puhtCalcule = coeffTva != 0 ? Math.Round(prixTtcArrondi / coeffTva, 3) : prixTtcArrondi;
            var montantTotal = Math.Round(prixTtcArrondi * mortalite, 3);
            var dateLot = new DateTime(date.Year, date.Month, date.Day);
            var nligneMortalite = await ObtenirProchaineLigne(numMV);
            var tempsFormate = GetDateHeure(dateLot, tempsActuel);

            var ligneMortalite = new Lmvt
            {
                nummvt = numMV,
                datemvt = dateLot,
                codedep = codeDepBat,
                libdep = libDepBat,
                codeart = article.code,
                desart = article.libelle,
                libarabe = article.libarabe ?? string.Empty,
                famille = article.famille,
                qteart = mortalite,
                puht = puhtCalcule,
                tauxtva = tauxTvaArrondi,
                fodec = article.fodec,
                remise = 0,
                mttotal = montantTotal,
                temps = tempsFormate,
                puttc = prixTtcArrondi,
                unite = article.unite,
                nbrunite = 1,
                config = "",
                typemvt = "S",
                naturemvt = "MORT_VENTE_TRS",
                nligne = nligneMortalite,
                numbande = "",
                numlot = numMvt,
                dateexp = dateLot,
                numaffaire = numMvt,
                datepl = dateLot
            };

            _context.Lmvt.Add(ligneMortalite);
            await _context.SaveChangesAsync();
        }

        private async Task<(string codeDepBat, string libDepBat)> GetCodeDepBatLibDepBat(Miseplace mplace, string? codeSociete = null)
        {
            string codeDepBat = string.Empty;
            string libDepBat = string.Empty;

            var parametre = await TryGetParamaitre(codeSociete);
            if (parametre != null && parametre.gestionavicole == "1")
            {
                Depot? depot = null;
                if (parametre.stkcentre == "1")
                {
                    depot = await _context.Depot
                        .FirstOrDefaultAsync(d => d.numcentre == mplace.numcentre);
                }
                else
                {
                    depot = await _context.Depot
                        .FirstOrDefaultAsync(d => d.numcentre == mplace.numcentre && d.numbat == mplace.numbat);
                }

                if (depot != null)
                {
                    codeDepBat = depot.Code ?? string.Empty;
                    libDepBat = depot.Libelle ?? string.Empty;
                }
            }

            return (codeDepBat, libDepBat);
        }

        private string GetDateHeure(DateTime date, DateTime time)
        {
            var combined = new DateTime(date.Year, date.Month, date.Day, time.Hour, time.Minute, time.Second);
            return combined.ToString("yyyyMMddHHmmss");
        }

        private async Task CreationEnteteMortalite(string numMvt, string typeMvt, string natureMvt, string numAffaire, DateTime date, Miseplace mplace, string? codeSociete = null)
        {
            var currentTime = DateTime.Now;
            var entete = new Emvt
            {
                nummvt = numMvt,
                typemvt = typeMvt,
                numaffaire = numAffaire,
                datemvt = date,
                heure = currentTime.ToString("HH:mm"),
                pieceliee = "RP",
                codetrs = mplace.codetrs ?? string.Empty,
                libtrs = mplace.libtrs ?? string.Empty,
                naturemvt = natureMvt,
                mht = 0,
                mremise = 0,
                mnht = 0,
                mtva = 0,
                mttc = 0,
                majo = await GetTauxMajo(codeSociete),
                commentaire = "",
                nb1 = "",
                nb2 = "",
                nb3 = "",
                temps = GetDateHeure(date, currentTime),
                codefact = "N",
                numfact = "",
                codepv = "01",
                libpv = "SIEGE LOCAL",
                datemaj = currentTime,
                datepl = date
            };

            _context.Emvt.Add(entete);
            await _context.SaveChangesAsync();
        }

        private async Task<double> GetTauxMajo(string? codeSociete = null)
        {
            var parametre = await TryGetParamaitre(codeSociete);
            return parametre?.TauxMajo ?? 0;
        }

        private async Task TraiterMouvementsTemporaires(ValidationJourneeRequest request, TotauxJournee totaux, string groupage, NumerosMouvements numerosMouvements)
        {
            var mouvements = await RecupererMouvements(request);

            string numCons = numerosMouvements.NumCons ?? string.Empty;
            string numProd = numerosMouvements.NumProd ?? string.Empty;
            string vaccinEff = "";
            string medEff = "";
            var prochainesLignesParMouvement = new Dictionary<string, double>();

            foreach (var mouvement in mouvements)
            {
                var article = await ObtenirArticle(mouvement);

                if (article == null) continue;

                if (string.IsNullOrWhiteSpace(mouvement.Famille))
                {
                    mouvement.Famille = article.Famille;
                }

                var depotCategorie = ResoudreCategorieDepot(mouvement, article);
                string typeMvt = "S";
                switch (depotCategorie)
                {
                    case "001":
                        totaux.TotAlim += mouvement.QteArt;
                        typeMvt = "S";
                        break;
                    case "002":
                        totaux.TotCoupeaux += mouvement.QteArt;
                        typeMvt = "S";
                        break;
                    case "003":
                        vaccinEff = string.IsNullOrEmpty(vaccinEff)
                            ? $"( {mouvement.DesArt} / {mouvement.QteArt} )"
                            : $"{vaccinEff} / ( {mouvement.DesArt} / {mouvement.QteArt} )";
                        typeMvt = "S";
                        break;
                    case "004":
                        medEff = string.IsNullOrEmpty(medEff)
                            ? $"( {mouvement.DesArt} / {mouvement.QteArt} )"
                            : $"{medEff} / ( {mouvement.DesArt} / {mouvement.QteArt} )";
                        typeMvt = "S";
                        break;
                    case "005":
                        totaux.TotGaz += mouvement.QteArt;
                        typeMvt = "S";
                        break;
                    case "006":
                        totaux.TotOeuf += mouvement.QteArt;
                        switch (article.TypeProd)
                        {
                            case "N": totaux.TotOFN += mouvement.QteArt; break;
                            case "D": totaux.TotODJ += mouvement.QteArt; break;
                            case "C": totaux.TotOCAS += mouvement.QteArt; break;
                            case "R": totaux.TotOREJ += mouvement.QteArt; break;
                            case "O": totaux.TotOAC += mouvement.QteArt; break;
                        }
                        typeMvt = "E";
                        break;
                    default:
                        typeMvt = "S";
                        break;
                }

                // Création des mouvements consommation/production
                if (typeMvt == "S")
                {
                    if (string.IsNullOrEmpty(numCons))
                    {
                        numCons = await CreerNouveauMouvement("emvt", request.Date.Year, "CS", "01");
                        await CreationEnteteConsommation(numCons, "S", "Bon de Consommation", request.NumMvt, request.Date, request.NomBaseStockSession);
                    }
                    var ligneOK = await RemplirLigne(mouvement, article, numCons, "S", groupage, request, totaux, prochainesLignesParMouvement);
                    if (!ligneOK)
                        throw new BusinessException("STOCK_INSUFFISANT", 
                            $"Stock insuffisant pour l'article {mouvement.CodeArt} / {mouvement.DesArt}",
                            new List<ValidationError>
                            {
                                new ValidationError
                                {
                                    Field = "Stock",
                                    Code = "STOCK_INSUFFISANT",
                                    Message = $"Stock insuffisant pour l'article {mouvement.CodeArt} ({mouvement.DesArt})"
                                }
                            });
                }
                else if (typeMvt == "E")
                {
                    if (string.IsNullOrEmpty(numProd))
                    {
                        numProd = await CreerNouveauMouvement("emvt", request.Date.Year, "RP", "01");
                        await CreationEnteteProduction(numProd, "E", "Rapp de Production", request.NumMvt, request.Date, request.NomBaseStockSession);
                    }
                    var ligneOK = await RemplirLigne(mouvement, article, numProd, "E", groupage, request, totaux, prochainesLignesParMouvement);
                    if (!ligneOK)
                        throw new BusinessException("STOCK_INSUFFISANT", 
                            $"Stock insuffisant pour l'article {mouvement.CodeArt} / {mouvement.DesArt}",
                            new List<ValidationError>
                            {
                                new ValidationError
                                {
                                    Field = "Stock",
                                    Code = "STOCK_INSUFFISANT",
                                    Message = $"Stock insuffisant pour l'article {mouvement.CodeArt} ({mouvement.DesArt})"
                                }
                            });
                }
            }

            totaux.VaccinEff = vaccinEff;
            totaux.MedEff = medEff;
            numerosMouvements.NumCons = numCons;
            numerosMouvements.NumProd = numProd;
        }

        private async Task<List<MouvementItem>> RecupererMouvements(ValidationJourneeRequest request)
        {
            var mouvements = new List<MouvementItem>();

            int index = 1;
            foreach (var item in request.CartItems)
            {
                if (string.IsNullOrWhiteSpace(item.CodeArt))
                {
                    continue;
                }

                mouvements.Add(new MouvementItem
                {
                    CodeArt = item.CodeArt,
                    Famille = item.Famille ?? string.Empty,
                    // Utiliser CNature en priorité si fourni, sinon LibDep
                    LibDep = !string.IsNullOrWhiteSpace(item.CNature) ? item.CNature : item.LibDep,
                    QteArt = item.QteArt,
                    DesArt = item.DesArt,
                    NLigne = item.NLigne != 0 ? item.NLigne : index,
                    Ville = item.Ville,
                    Puttc = item.Puttc
                });
                index++;
            }

            return mouvements.OrderBy(m => m.NLigne).ToList();
        }

        private async Task<ArticleDetail?> ObtenirArticle(MouvementItem mouvement)
        {
            if (string.IsNullOrWhiteSpace(mouvement.CodeArt))
            {
                return null;
            }

            if (!string.IsNullOrWhiteSpace(mouvement.Famille))
            {
                var articleAvecFamille = await _context.Article
                    .Where(a => a.code == mouvement.CodeArt && a.famille == mouvement.Famille)
                    .Select(a => new ArticleDetail
                    {
                        Code = a.code,
                        Famille = a.famille ?? string.Empty,
                        Libelle = a.libelle ?? string.Empty,
                        Libarabe = a.libarabe ?? string.Empty,
                        TauxTva = EF.Property<double?>(a, nameof(Article.tauxtva)) ?? 0,
                        Fodec = EF.Property<double?>(a, nameof(Article.fodec)) ?? 0,
                        Unite = a.unite ?? string.Empty,
                        NbrUnite = EF.Property<double?>(a, nameof(Article.nbrunite)) ?? 0,
                        TypeProd = a.typeprod ?? string.Empty,
                        DecimQte = EF.Property<double?>(a, nameof(Article.decimqte)) ?? 0,
                        AlerteExp = EF.Property<double?>(a, nameof(Article.alerteexp)) ?? 0,
                        PrixNet = EF.Property<double?>(a, nameof(Article.prixnet)) ?? 0,
                        PrixVht1 = EF.Property<double?>(a, nameof(Article.prixvht1)) ?? 0
                    })
                    .FirstOrDefaultAsync();

                if (articleAvecFamille != null)
                {
                    return articleAvecFamille;
                }
            }

            var articleSansFamille = await _context.Article
                .Where(a => a.code == mouvement.CodeArt)
                .Select(a => new ArticleDetail
                {
                    Code = a.code,
                    Famille = a.famille ?? string.Empty,
                    Libelle = a.libelle ?? string.Empty,
                    Libarabe = a.libarabe ?? string.Empty,
                    TauxTva = EF.Property<double?>(a, nameof(Article.tauxtva)) ?? 0,
                    Fodec = EF.Property<double?>(a, nameof(Article.fodec)) ?? 0,
                    Unite = a.unite ?? string.Empty,
                    NbrUnite = EF.Property<double?>(a, nameof(Article.nbrunite)) ?? 0,
                    TypeProd = a.typeprod ?? string.Empty,
                    DecimQte = EF.Property<double?>(a, nameof(Article.decimqte)) ?? 0,
                    AlerteExp = EF.Property<double?>(a, nameof(Article.alerteexp)) ?? 0,
                    PrixNet = EF.Property<double?>(a, nameof(Article.prixnet)) ?? 0,
                    PrixVht1 = EF.Property<double?>(a, nameof(Article.prixvht1)) ?? 0
                })
                .FirstOrDefaultAsync();

            if (articleSansFamille != null && string.IsNullOrWhiteSpace(mouvement.Famille))
            {
                mouvement.Famille = articleSansFamille.Famille;
            }

            return articleSansFamille;
        }

        private async Task<Paramaitre?> TryGetParamaitre(string? codeSociete = null)
        {
            try
            {
                // Si un code société est fourni, interroger la base globale socerp
                if (!string.IsNullOrWhiteSpace(codeSociete))
                {
                    return await _context.Paramaitre
                        .FromSqlInterpolated($"SELECT * FROM socerp.paramaitre WHERE code = {codeSociete}")
                        .FirstOrDefaultAsync();
                }
                
                // Sinon, essayer la base courante (pour compatibilité)
                return await _context.Paramaitre.FirstOrDefaultAsync();
            }
            catch (MySqlException ex) when (ex.Message.Contains("paramaitre", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(ex, "Table Paramaitre introuvable dans la base {Database}", _context.Database.GetDbConnection().Database);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Impossible de récupérer les paramètres globaux");
                return null;
            }
        }

        private class ArticleDetail
        {
            public string Code { get; set; } = string.Empty;
            public string Famille { get; set; } = string.Empty;
            public string Libelle { get; set; } = string.Empty;
            public string Libarabe { get; set; } = string.Empty;
            public double TauxTva { get; set; }
            public double Fodec { get; set; }
            public string Unite { get; set; } = string.Empty;
            public double NbrUnite { get; set; }
            public string TypeProd { get; set; } = string.Empty;
            public double DecimQte { get; set; }
            public double AlerteExp { get; set; }
            public double PrixNet { get; set; }
            public double PrixVht1 { get; set; }
        }

        private class MouvementItem
        {
            public string CodeArt { get; set; } = string.Empty;
            public string Famille { get; set; } = string.Empty;
            public string LibDep { get; set; } = string.Empty;
            public double QteArt { get; set; }
            public string DesArt { get; set; } = string.Empty;
            public double NLigne { get; set; }
            public string Ville { get; set; } = string.Empty;
            public double Puttc { get; set; }
        }

        private static IEnumerable<string> BuildDepotCodeCandidates(params string?[] codes)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var rawCode in codes)
            {
                if (string.IsNullOrWhiteSpace(rawCode)) continue;

                var trimmed = rawCode.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                set.Add(trimmed);

                var withoutLeadingZeros = trimmed.TrimStart('0');
                if (!string.IsNullOrEmpty(withoutLeadingZeros))
                {
                    set.Add(withoutLeadingZeros);
                }

                for (int pad = 2; pad <= 4; pad++)
                {
                    set.Add(trimmed.PadLeft(pad, '0'));
                }
            }

            return set.Where(code => !string.IsNullOrWhiteSpace(code));
        }

        private async Task<string> CreerNouveauMouvement(string nomTable, int annee, string prefixe, string codePV)
        {
            var parametre = await TryGetParamaitre();
            string codePVFinal = codePV;

            var anneeCourte = annee.ToString().Substring(Math.Max(0, annee.ToString().Length - 2), 2);
            if (anneeCourte.Length == 1) anneeCourte = "0" + anneeCourte;

            if (parametre != null && !string.IsNullOrEmpty(parametre.code) && parametre.code == "1")
            {
                codePVFinal = "01";
            }

            var prefixeComplet = $"{prefixe}{codePVFinal}{anneeCourte}";

            var dernierNumero = await _context.Emvt
                .AsNoTracking()
                .Where(e => e.nummvt.StartsWith(prefixeComplet))
                .OrderByDescending(e => e.nummvt)
                .Select(e => e.nummvt)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(dernierNumero))
            {
                return $"{prefixeComplet}00001";
            }

            if (dernierNumero.Length >= prefixeComplet.Length + 5)
            {
                var numeroStr = dernierNumero.Substring(prefixeComplet.Length, 5);
                if (int.TryParse(numeroStr, out int numero))
                {
                    numero++;
                    return $"{prefixeComplet}{numero:D5}";
                }
            }

            return $"{prefixeComplet}00001";
        }

        private async Task CreationEnteteConsommation(string numMvt, string typeMvt, string natureMvt, string numBande, DateTime date, string? codeSociete = null)
        {
            var mplace = await _context.Miseplace
                .FirstOrDefaultAsync(m => m.nummvt == numBande);

            if (mplace == null) return;

            var currentTime = DateTime.Now;
            var entete = new Emvt
            {
                nummvt = numMvt,
                typemvt = typeMvt,
                numaffaire = numBande,
                datemvt = date,
                heure = currentTime.ToString("HH:mm"),
                pieceliee = "", // Dans VB, pieceliee est mis à "" à la fin
                codetrs = mplace.codetrs ?? string.Empty,
                libtrs = mplace.libtrs ?? string.Empty,
                naturemvt = natureMvt,
                mht = 0,
                mremise = 0,
                mnht = 0,
                mtva = 0,
                mttc = 0,
                majo = await GetTauxMajo(codeSociete),
                commentaire = "",
                nb1 = "",
                nb2 = "",
                nb3 = "",
                temps = GetDateHeure(date, currentTime),
                codefact = "N",
                numfact = "",
                codepv = "01",
                libpv = "SIEGE LOCAL",
                datemaj = currentTime,
                datepl = date
            };

            _context.Emvt.Add(entete);
            await _context.SaveChangesAsync();
        }

        private async Task CreationEnteteProduction(string numMvt, string typeMvt, string natureMvt, string numBande, DateTime date, string? codeSociete = null)
        {
            var mplace = await _context.Miseplace
                .FirstOrDefaultAsync(m => m.nummvt == numBande);

            if (mplace == null) return;

            var currentTime = DateTime.Now;
            var entete = new Emvt
            {
                nummvt = numMvt,
                typemvt = typeMvt,
                numaffaire = numBande,
                datemvt = date,
                heure = currentTime.ToString("HH:mm"),
                pieceliee = "", // Dans VB, pieceliee est mis à "" à la fin
                codetrs = mplace.codetrs ?? string.Empty,
                libtrs = mplace.libtrs ?? string.Empty,
                naturemvt = natureMvt,
                mht = 0,
                mremise = 0,
                mnht = 0,
                mtva = 0,
                mttc = 0,
                majo = await GetTauxMajo(codeSociete),
                commentaire = "",
                nb1 = "",
                nb2 = "",
                nb3 = "",
                temps = GetDateHeure(date, currentTime),
                codefact = "N",
                numfact = "",
                codepv = "01",
                libpv = "SIEGE LOCAL",
                datemaj = currentTime,
                datepl = date
            };

            _context.Emvt.Add(entete);
            await _context.SaveChangesAsync();
        }

        private async Task<bool> RemplirLigne(MouvementItem mouvement, ArticleDetail article, string numMvt, string typeMvt, string groupage, ValidationJourneeRequest request, TotauxJournee totaux, Dictionary<string, double> prochainesLignesParMouvement)
        {
            if (article == null) return false;

            // Récupérer CodeDepBat et LibDepBat
            var mplace = await _context.Miseplace.FirstOrDefaultAsync(m => m.nummvt == request.NumMvt);
            var (codeDepBatDb, libDepBatDb) = await GetCodeDepBatLibDepBat(mplace ?? new Miseplace(), request.NomBaseStockSession);

            var codeDepBatRequest = request.CodeDepBat?.Trim();
            var codeDepBatFromDb = codeDepBatDb?.Trim();
            var codeDepBat = !string.IsNullOrWhiteSpace(codeDepBatRequest)
                ? codeDepBatRequest
                : (codeDepBatFromDb ?? string.Empty);
            var codeDepReference = !string.IsNullOrWhiteSpace(codeDepBatFromDb)
                ? codeDepBatFromDb
                : codeDepBat;
            var libDepBat = !string.IsNullOrWhiteSpace(request.LibDepBat)
                ? request.LibDepBat
                : libDepBatDb;

            var codeDepotLigne = !string.IsNullOrWhiteSpace(mouvement.LibDep)
                ? mouvement.LibDep
                : codeDepBat;

            codeDepotLigne = codeDepotLigne?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(codeDepotLigne))
            {
                codeDepotLigne = codeDepBat?.Trim() ?? string.Empty;
            }

            string libDepotLigne = libDepBat;

            if (!string.IsNullOrWhiteSpace(mouvement.LibDep))
            {
                var depotLigne = await _context.Depot
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.Code == mouvement.LibDep);

                if (depotLigne != null)
                {
                    libDepotLigne = depotLigne.Libelle ?? depotLigne.Code ?? string.Empty;
                }
                else if (string.IsNullOrWhiteSpace(libDepotLigne))
                {
                    libDepotLigne = mouvement.LibDep;
                }
            }

            if (string.IsNullOrWhiteSpace(libDepotLigne))
            {
                libDepotLigne = !string.IsNullOrWhiteSpace(libDepBat)
                    ? libDepBat
                    : codeDepotLigne;
            }

            string codeDepotEffectif;

            // Pour les entrées (production), utiliser directement codeDepBat
            if (typeMvt == "E")
            {
                codeDepotEffectif = !string.IsNullOrWhiteSpace(codeDepBat) ? codeDepBat : codeDepReference;
                // S'assurer que libDepotLigne est correct pour la production
                if (string.IsNullOrWhiteSpace(libDepotLigne) || libDepotLigne == mouvement.LibDep)
                {
                    libDepotLigne = libDepBat;
                }
            }
            else
            {
                // Pour les sorties (consommation), vérifier le stock
                codeDepotEffectif = codeDepotLigne;
                
                var depotCandidates = BuildDepotCodeCandidates(codeDepotLigne, codeDepBat, codeDepReference).ToList();

                if (depotCandidates.Count == 0)
                {
                    return false;
                }

                var stockRecord = await _context.StockDepot
                    .Where(s => s.codeart == mouvement.CodeArt && depotCandidates.Contains(s.codedep))
                    .OrderByDescending(s => s.qteart)
                    .Select(s => new { s.qteart, s.codedep })
                    .FirstOrDefaultAsync();

                if (stockRecord == null || stockRecord.qteart <= 0)
                {
                    return false;
                }

                if (stockRecord.qteart < mouvement.QteArt)
                {
                    return false;
                }

                codeDepotEffectif = stockRecord.codedep ?? codeDepotEffectif;

                if (!depotCandidates.Contains(codeDepotEffectif))
                {
                    depotCandidates.Add(codeDepotEffectif);
                }

                if (!string.Equals(codeDepotEffectif, codeDepotLigne, StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(libDepotLigne))
                {
                    var depotEffectif = await _context.Depot
                        .AsNoTracking()
                        .FirstOrDefaultAsync(d => d.Code == codeDepotEffectif);

                    if (depotEffectif != null)
                    {
                        libDepotLigne = depotEffectif.Libelle ?? depotEffectif.Code ?? libDepotLigne;
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(codeDepotEffectif))
            {
                codeDepotEffectif = codeDepReference;
            }

            if (string.IsNullOrWhiteSpace(libDepotLigne))
            {
                libDepotLigne = !string.IsNullOrWhiteSpace(libDepBat)
                    ? libDepBat
                    : codeDepotEffectif;
            }

            // Déterminer le prix selon la configuration
            double prixAchat = await DeterminerPrix(article, mouvement.Puttc, typeMvt, request.Date, request.NomBaseStockSession);

            // Calculer les quantités livrées pour les œufs
            double qteLiv = 0;
            if (article.Famille == "006" && await IsEspeceReproduction(request.NumMvt) && typeMvt == "E")
            {
                qteLiv = await CalculerQuantiteLivree(groupage, article.Famille, article.Code, request.Date, codeDepBat);
            }

            var currentTime = DateTime.Now;
            var prochaineLigne = await ObtenirProchaineLigne(numMvt, prochainesLignesParMouvement);
            var prixTtcArrondi = Math.Round(prixAchat, 3);
            var tauxTvaArrondi = Math.Round(article.TauxTva, 3);
            var coefficientTva = 1 + (tauxTvaArrondi / 100);
            var puhtCalcule = coefficientTva != 0 ? Math.Round(prixTtcArrondi / coefficientTva, 3) : prixTtcArrondi;
            var montantTotal = Math.Round(prixTtcArrondi * mouvement.QteArt, 3);
            var dateLot = new DateTime(request.Date.Year, request.Date.Month, request.Date.Day);
            var tempsFormate = GetDateHeure(dateLot, currentTime);

            var ligne = new Lmvt
            {
                nummvt = numMvt,
                datemvt = dateLot,
                codedep = codeDepotEffectif,
                libdep = libDepotLigne,
                codeart = mouvement.CodeArt,
                desart = article.Libelle,
                libarabe = article.Libarabe,
                famille = mouvement.Famille,
                qteart = mouvement.QteArt,
                qteliv = qteLiv,
                puht = puhtCalcule,
                tauxtva = tauxTvaArrondi,
                fodec = article.Fodec,
                remise = 0,
                mttotal = montantTotal,
                puttc = prixTtcArrondi,
                unite = article.Unite,
                nbrunite = article.NbrUnite,
                config = "",
                typemvt = typeMvt,
                naturemvt = typeMvt == "E" ? "Rapp de Production" : "Bon de Consommation",
                nligne = prochaineLigne,
                numbande = request.NumMvt,
                decimqte = article.DecimQte,
                numaffaire = request.NumMvt,
                numlot = typeMvt == "E" ? groupage : "",
                temps = tempsFormate,
                ville = mouvement.Ville ?? string.Empty,
                dateexp = dateLot,
                datepl = dateLot
            };

            _context.Lmvt.Add(ligne);
            await _context.SaveChangesAsync();

            // Mettre à jour les totaux MT_Production et MT_Depense
            if (typeMvt == "E")
            {
                totaux.MT_Production += ligne.mttotal;
            }
            else
            {
                totaux.MT_Depense += ligne.mttotal;
            }

            // Créer le lot pour les entrées
            if (typeMvt == "E")
            {
                await CreationLot(codeDepBat, article.Code, article.Famille, groupage,
                    DateTime.MinValue, article.Libelle, prixAchat, request.Date, (int)article.AlerteExp);
            }

            return true;
        }

        private async Task<double> ObtenirProchaineLigne(string numMvt, Dictionary<string, double>? cache = null)
        {
            if (!string.IsNullOrWhiteSpace(numMvt) && cache != null && cache.TryGetValue(numMvt, out var prochaine))
            {
                prochaine += 3;
                cache[numMvt] = prochaine;
                return prochaine;
            }

            double derniereLigne = 0;
            if (!string.IsNullOrWhiteSpace(numMvt))
            {
                var derniereLigneExistante = await _context.Lmvt
                    .Where(l => l.nummvt == numMvt)
                    .OrderByDescending(l => l.nligne)
                    .Select(l => (double?)l.nligne)
                    .FirstOrDefaultAsync();

                if (derniereLigneExistante.HasValue)
                {
                    derniereLigne = derniereLigneExistante.Value;
                }
            }

            var nouvelleLigne = derniereLigne > 0 ? derniereLigne + 3 : 1;

            if (!string.IsNullOrWhiteSpace(numMvt) && cache != null)
            {
                cache[numMvt] = nouvelleLigne;
            }

            return nouvelleLigne;
        }

        private async Task<double> DeterminerPrix(ArticleDetail article, double prixTTC, string typeMvt, DateTime date, string? codeSociete = null)
        {
            // Si un prix TTC est fourni depuis le panier (stockdepot.prixvttc1), l'utiliser en priorité
            if (prixTTC > 0)
            {
                return prixTTC;
            }

            if (typeMvt == "S")
            {
                var parametre = await TryGetParamaitre(codeSociete);
                if (parametre?.PrixConsom == "A")
                {
                    // Si PrixConsom = "A", chercher le dernier prix d'achat
                    var dernPrix = await GetDernierPrix(article.Code, date);
                    return dernPrix > 0 ? dernPrix : article.PrixNet;
                }
                // Sinon, utiliser le prix de vente HT1
                return article.PrixVht1 > 0 ? article.PrixVht1 : article.PrixNet;
            }
            // Pour les entrées, utiliser le prix net
            return article.PrixNet;
        }

        private static string ResoudreCategorieDepot(MouvementItem mouvement, ArticleDetail article)
        {
            // Si LibDep est cnature (code direct comme "001", "002", etc.), l'utiliser directement
            if (!string.IsNullOrWhiteSpace(mouvement.LibDep))
            {
                var trimmed = mouvement.LibDep.Trim();
                
                // Vérifier si c'est déjà un code numérique valide (001-999)
                if (trimmed.Length <= 3 && trimmed.All(char.IsDigit))
                {
                    var codeDirect = trimmed.PadLeft(3, '0');
                    // Valider que c'est un code de catégorie connu (001-006)
                    if (codeDirect == "001" || codeDirect == "002" || codeDirect == "003" || 
                        codeDirect == "004" || codeDirect == "005" || codeDirect == "006")
                    {
                        return codeDirect;
                    }
                }
            }

            // Sinon, essayer d'extraire le préfixe numérique
            var code = ExtrairePrefixeDepot(mouvement.LibDep);

            // Fallback sur la famille du mouvement
            if (string.IsNullOrEmpty(code) && !string.IsNullOrWhiteSpace(mouvement.Famille))
            {
                code = mouvement.Famille.Trim();
            }

            // Fallback sur la famille de l'article
            if (string.IsNullOrEmpty(code) && !string.IsNullOrWhiteSpace(article.Famille))
            {
                code = article.Famille.Trim();
            }

            return NormaliserCategorieDepot(code, mouvement.LibDep);
        }

        private static string ExtrairePrefixeDepot(string? libDep)
        {
            if (string.IsNullOrWhiteSpace(libDep))
            {
                return string.Empty;
            }

            var trimmed = libDep.Trim();
            var digits = new string(trimmed.TakeWhile(char.IsDigit).ToArray());

            if (!string.IsNullOrEmpty(digits))
            {
                return digits.PadLeft(3, '0');
            }

            if (trimmed.Length == 3 && trimmed.All(char.IsDigit))
            {
                return trimmed;
            }

            return string.Empty;
        }

        private static string NormaliserCategorieDepot(string? code, string? libDep)
        {
            if (!string.IsNullOrWhiteSpace(code))
            {
                return code.PadLeft(3, '0');
            }

            if (string.IsNullOrWhiteSpace(libDep))
            {
                return string.Empty;
            }

            var normalized = libDep.Trim().ToLowerInvariant();

            if (normalized.Contains("alim"))
            {
                return "001";
            }

            if (normalized.Contains("coup") || normalized.Contains("cope"))
            {
                return "002";
            }

            if (normalized.Contains("vacc"))
            {
                return "003";
            }

            if (normalized.Contains("med"))
            {
                return "004";
            }

            if (normalized.Contains("gaz"))
            {
                return "005";
            }

            if (normalized.Contains("oeuf") || normalized.Contains("egg") || normalized.Contains("ov"))
            {
                return "006";
            }

            return string.Empty;
        }

        private async Task<double> GetDernierPrix(string codeArt, DateTime date)
        {
            // Implémenter la logique pour récupérer le dernier prix d'achat
            var dernierAchat = await _context.Lmvt
                .Where(l => l.codeart == codeArt && l.datemvt < date && l.typemvt == "E")
                .OrderByDescending(l => l.datemvt)
                .FirstOrDefaultAsync();

            return dernierAchat?.puttc ?? 0;
        }

        private async Task<bool> IsEspeceReproduction(string numMvt)
        {
            var mplace = await _context.Miseplace
                .FirstOrDefaultAsync(m => m.nummvt == numMvt);

            if (mplace == null) return false;

            var espece = await _context.Espece
                .FirstOrDefaultAsync(e => e.code == mplace.codeesp);

            return espece?.typeespece == "R";
        }

        private async Task<double> CalculerQuantiteLivree(string groupage, string famille, string codeArt, DateTime date, string codeDep)
        {
            var quantiteTrs = await _context.TrsJour
                .Where(t => t.dateprod == date && t.numlot == groupage && t.famille == famille && t.codeart == codeArt)
                .SumAsync(t => t.qteart);

            var quantiteMvt = await _context.MvtProduction
                .Where(m => m.dateprod == date && m.numlot == groupage && m.famille == famille && m.codeart == codeArt && m.codedep == codeDep)
                .SumAsync(m => m.qteart);

            return quantiteTrs + quantiteMvt;
        }

        private async Task CreationLot(string codeDep, string codeArt, string famille, string numLot, DateTime dateExp, string libelle, double prix, DateTime date, int alerteExp)
        {
            // Implémenter la création de lot si nécessaire
            await Task.CompletedTask;
        }

        private async Task<IndicateursJournee> CalculerIndicateurs(TotauxJournee totaux, ValidationJourneeRequest request)
        {
            var indicateurs = new IndicateursJournee();

            // Calcul du groupage de lot
            if (totaux.TotOeuf > 0)
            {
                var parametres = await TryGetParamaitre(request.NomBaseStockSession);
                var uniteAlim = parametres?.UniteAlim?.Trim() ?? "TN";
                 var diviseur = string.Equals(uniteAlim, "TN", StringComparison.OrdinalIgnoreCase) ? 1000000 : 1000;
                indicateurs.GrOfLot = Math.Round((diviseur * totaux.TotAlim) / totaux.TotOeuf, 2);
            }
            else
            {
                indicateurs.GrOfLot = 0;
            }

            // Calcul de l'alimentation ingérée
            if (request.AlimRestant > 0)
            {
                indicateurs.AlimIng = await CalculerAlimIngeree(request.Jour, request.AlimRestant, request.NumMvt);
            }

            return indicateurs;
        }

        private async Task<double> CalculerAlimIngeree(double jour, double alimRestEnc, string numMvt)
        {
            double alimDist = 0;
            double alimCons = 0;
            double dernAlimR = 0;

            // Récupérer le dernier enregistrement avec alimrestant > 0
            var dernierAvecRestant = await _context.ParamSouche
                .Where(p => p.nummvt == numMvt && p.jour < jour && p.alimrestant > 0)
                .OrderByDescending(p => p.jour)
                .FirstOrDefaultAsync();

            if (dernierAvecRestant == null)
            {
                // Aucun enregistrement avec alimrestant > 0, calculer depuis le début
                var tousLesJours = await _context.ParamSouche
                    .Where(p => p.nummvt == numMvt && p.jour < jour)
                    .OrderBy(p => p.jour)
                    .ToListAsync();

                foreach (var param in tousLesJours)
                {
                    alimDist += param.consommation;
                    alimCons += param.effectif * param.consalim;
                }
                dernAlimR = 0;
            }
            else
            {
                // Calculer depuis le dernier enregistrement avec alimrestant
                var joursIntermediaires = await _context.ParamSouche
                    .Where(p => p.nummvt == numMvt && p.jour >= dernierAvecRestant.jour && p.jour < jour)
                    .OrderBy(p => p.jour)
                    .ToListAsync();

                foreach (var param in joursIntermediaires)
                {
                    alimDist += param.consommation;
                    alimCons += param.effectif * param.consalim;
                }
                dernAlimR = dernierAvecRestant.alimrestant;
            }

            var talimdist = alimDist + dernAlimR;
            var talimsilone = alimRestEnc;
            var talimlot = talimdist - talimsilone;

            return talimlot;
        }

        private async Task MettreAJourParamsouche(ValidationJourneeRequest request, TotauxJournee totaux, IndicateursJournee indicateurs)
        {
            var paramSouche = await _context.ParamSouche
                .FirstOrDefaultAsync(p => p.nummvt == request.NumMvt && p.date == request.Date);

            if (paramSouche != null)
            {
                paramSouche.consommation = totaux.TotAlim;
                paramSouche.coupeaux = totaux.TotCoupeaux;
                paramSouche.gaz = totaux.TotGaz;
                paramSouche.vaccinlot = totaux.VaccinEff;
                paramSouche.medlot = totaux.MedEff;
                paramSouche.prodoflot = totaux.TotOeuf;
                paramSouche.pontelot = Math.Round(100 * totaux.TotOeuf / (paramSouche.effectif > 0 ? paramSouche.effectif : 1), 2);
                if (indicateurs.AlimIng > 0)
                {
                    paramSouche.alimingerlot = indicateurs.AlimIng;
                }
                paramSouche.mtproduction = totaux.MT_Production;
                paramSouche.mtdepense = totaux.MT_Depense;
                paramSouche.groflot = indicateurs.GrOfLot;
                paramSouche.oeufnorm = totaux.TotOFN;
                paramSouche.oeufdj = totaux.TotODJ;
                paramSouche.oeufcasse = totaux.TotOCAS;
                paramSouche.oeufrejet = totaux.TotOREJ;
                paramSouche.oaclot = totaux.TotOAC;
                paramSouche.temperlot = request.TemperLot;
                paramSouche.humiditelot = request.HumiditeLot;
                paramSouche.conseaulot = request.ConseauLot;
                paramSouche.intlumlot = request.IntLumLot;
                paramSouche.eclairlot = request.EclairLot;
                paramSouche.cloturer = 1;

                await _context.SaveChangesAsync();
            }
        }

        private async Task MettreAJourDonneesComplementaires(ValidationJourneeRequest request)
        {
            var paramSouche = await _context.ParamSouche
                .FirstOrDefaultAsync(p => p.nummvt == request.NumMvt && p.date == request.Date);

            if (paramSouche != null)
            {
                paramSouche.effajout = request.EffAjout;
                paramSouche.effretire = request.EffRetire;
                paramSouche.effectif = request.Effectif;
                paramSouche.mortalite = request.Mortalite;
                paramSouche.mortmale = request.MortMale;
                paramSouche.qtevendu = request.QteVendu;
                paramSouche.poidsvendu = request.PoidsVendu;
                paramSouche.mtvente = request.MtVente;
                paramSouche.poidsoflot = request.PoidsOeuf;
                paramSouche.alimrestant = request.AlimRestant;
                paramSouche.alimingerlot = 0; // Dans VB: alimingerlot=0

                await _context.SaveChangesAsync();
            }
        }

        private async Task Maj_Mortalite(string numLot, DateTime dateRech)
        {
            var mplace = await _context.Miseplace
                .FirstOrDefaultAsync(m => m.nummvt == numLot);

            if (mplace == null) return;

            var espece = await _context.Espece
                .FirstOrDefaultAsync(e => e.code == mplace.codeesp);

            if (espece == null) return;

            double newEffectif = mplace.effectif;
            double newEffmale = mplace.effmale;

            string cArt1 = espece.codeart ?? string.Empty;
            string cArt2 = espece.codeart1 ?? string.Empty;

            var paramsClotures = await _context.ParamSouche
                .Where(p => p.nummvt == numLot && p.cloturer == 1 && p.date >= dateRech)
                .OrderBy(p => p.jour)
                .ToListAsync();

            foreach (var param in paramsClotures)
            {
                double qteVenduF = 0;
                double qteVenduM = 0;
                double poidsVendu = 0;

                // Calculer les ventes depuis Lbl
                var ventesLbl = await _context.Lbl
                    .Where(l => l.numlot == numLot &&
                               (l.codeart == cArt1 || l.codeart == cArt2) &&
                               l.datemvt == param.date)
                    .ToListAsync();

                foreach (var vente in ventesLbl)
                {
                    if (espece.typeespece == "C")
                    {
                        if (vente.qteart > 0)
                        {
                            qteVenduF += vente.nbrsujet;
                            poidsVendu += Math.Round(vente.qteart, 3);
                        }
                    }
                    else
                    {
                        if (vente.codeart == cArt1)
                            qteVenduF += vente.qteart;
                        else if (vente.codeart == cArt2)
                            qteVenduM += vente.qteart;
                    }
                }

                // Calculer les ventes depuis Lbs
                var ventesLbs = await _context.Lbs
                    .Where(l => l.datemvt == param.date &&
                               (l.codeart == cArt1 || l.codeart == cArt2))
                    .ToListAsync();

                foreach (var vente in ventesLbs)
                {
                    if (espece.typeespece == "C")
                    {
                        if (vente.qteart > 0)
                        {
                            qteVenduF += vente.nbrsujet ;
                            poidsVendu += Math.Round(vente.qteart, 3);
                        }
                    }
                    else
                    {
                        if (vente.codeart == cArt1)
                            qteVenduF += vente.qteart;
                        else if (vente.codeart == cArt2)
                            qteVenduM += vente.qteart;
                    }
                }

                // Calculer les ventes depuis Lfc
                var ventesLfc = await _context.Lfc
                    .Where(l => l.datemvt == param.date &&
                               (l.codeart == cArt1 || l.codeart == cArt2))
                    .ToListAsync();

                foreach (var vente in ventesLfc)
                {
                    if (espece.typeespece == "C")
                    {
                        if (vente.qteart > 0)
                        {
                            qteVenduF += vente.nbrsujet ;
                            poidsVendu += Math.Round(vente.qteart, 3);
                        }
                    }
                    else
                    {
                        if (vente.codeart == cArt1)
                            qteVenduF += vente.qteart;
                        else if (vente.codeart == cArt2)
                            qteVenduM += vente.qteart;
                    }
                }

                // Mettre à jour les quantités vendues
                param.qtevendu = Math.Round(qteVenduF);
                param.poidsvendu = Math.Round(poidsVendu, 3);

                // Mettre à jour les effectifs
                var effectifActuel = newEffectif + param.effajout -
                                   (param.mortalite + qteVenduF + param.qtetransfert + param.effretire);

                var effMaleActuel = newEffmale - qteVenduM - param.mortmale;

                // Mettre à jour tous les enregistrements à partir de cette date
                var paramsAMettreAJour = await _context.ParamSouche
                    .Where(p => p.nummvt == numLot && p.date >= param.date)
                    .ToListAsync();

                foreach (var paramAJour in paramsAMettreAJour)
                {
                    paramAJour.effectif = effectifActuel;
                    paramAJour.effmale = effMaleActuel;
                }

                newEffectif = effectifActuel;
                newEffmale = effMaleActuel;

                await _context.SaveChangesAsync();
            }
        }

        private async Task<DetailedValidationResult> ValiderDonneesEntreeComplet(ValidationJourneeRequest request)
        {
            var errors = new List<ValidationError>();

            // Validation du lot
            if (string.IsNullOrWhiteSpace(request.NumMvt))
            {
                errors.Add(new ValidationError
                {
                    Field = "NumMvt",
                    Code = "REQUIRED",
                    Message = "Veuillez choisir un lot !"
                });
            }
            else
            {
                // Vérifier que le lot existe
                var mplace = await _context.Miseplace
                    .FirstOrDefaultAsync(m => m.nummvt == request.NumMvt);
                if (mplace == null)
                {
                    errors.Add(new ValidationError
                    {
                        Field = "NumMvt",
                        Code = "NOT_FOUND",
                        Message = $"Le lot '{request.NumMvt}' n'existe pas dans la base de données"
                    });
                }
            }

            // Validation de la date
            if (request.Date == default)
            {
                errors.Add(new ValidationError
                {
                    Field = "Date",
                    Code = "REQUIRED",
                    Message = "Veuillez choisir la date !"
                });
            }

            // Validation de la mortalité
            if (request.Mortalite < 0)
            {
                errors.Add(new ValidationError
                {
                    Field = "Mortalite",
                    Code = "INVALID_VALUE",
                    Message = "La mortalité ne peut pas être négative"
                });
            }

            // Validation de l'effectif
            if (request.Effectif < 0)
            {
                errors.Add(new ValidationError
                {
                    Field = "Effectif",
                    Code = "INVALID_VALUE",
                    Message = "L'effectif ne peut pas être négatif"
                });
            }

            // Validation du code utilisateur
            if (string.IsNullOrWhiteSpace(request.CodeUser))
            {
                errors.Add(new ValidationError
                {
                    Field = "CodeUser",
                    Code = "REQUIRED",
                    Message = "Le code utilisateur est requis"
                });
            }

            // Validation du jour
            if (request.Jour <= 0)
            {
                errors.Add(new ValidationError
                {
                    Field = "Jour",
                    Code = "INVALID_VALUE",
                    Message = "Le jour doit être supérieur à 0"
                });
            }

            // Validation des valeurs négatives
            if (request.EffAjout < 0)
            {
                errors.Add(new ValidationError
                {
                    Field = "EffAjout",
                    Code = "INVALID_VALUE",
                    Message = "L'effectif ajouté ne peut pas être négatif"
                });
            }

            if (request.EffRetire < 0)
            {
                errors.Add(new ValidationError
                {
                    Field = "EffRetire",
                    Code = "INVALID_VALUE",
                    Message = "L'effectif retiré ne peut pas être négatif"
                });
            }

            if (request.MortMale < 0)
            {
                errors.Add(new ValidationError
                {
                    Field = "MortMale",
                    Code = "INVALID_VALUE",
                    Message = "La mortalité mâle ne peut pas être négative"
                });
            }

            return new DetailedValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }

        private ValidationResult ValiderDonneesEntree(ValidationJourneeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NumMvt))
            {
                return ValidationResult.Invalid("Veuillez choisir un lot !");
            }

            if (request.Date == default)
            {
                return ValidationResult.Invalid("Veuillez choisir la date !");
            }

            if (request.Mortalite < 0)
            {
                return ValidationResult.Invalid("La mortalité ne peut pas être négative");
            }

            return ValidationResult.Valid();
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
                    Message = "Connexion à la base de données réussie",
                    ConnectionState = connectionState.ToString(),
                    CanConnect = canConnect
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur de connexion à la base de données");
                return StatusCode(500, new
                {
                    Message = "Erreur de connexion à la base de données",
                    Details = ex.Message
                });
            }
            finally
            {
                await _context.Database.CloseConnectionAsync();
            }
        }
    }

    // Classes DTO étendues
    public class ValidationJourneeRequest
    {
        [JsonPropertyName("nummvt")]
        public string NumMvt { get; set; } = string.Empty;
        public string NumLot { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public double Jour { get; set; }
        public double Semaine { get; set; }
        public string CodeUser { get; set; } = string.Empty;
        public string NomBaseStockSession { get; set; } = string.Empty;
        public double Mortalite { get; set; }
        public double MortMale { get; set; }
        public double EffAjout { get; set; }
        public double EffRetire { get; set; }
        public double Effectif { get; set; }
        public double EffectifGlobal { get; set; }
        public double QteVendu { get; set; }
        public double PoidsVendu { get; set; }
        public double MtVente { get; set; }
        public double PoidsOeuf { get; set; }
        public double StockOeuf { get; set; }
        public double StockPlat { get; set; }
        public string TemperLot { get; set; } = string.Empty;
        public string HumiditeLot { get; set; } = string.Empty;
        public double ConseauLot { get; set; }
        public string IntLumLot { get; set; } = string.Empty;
        public string EclairLot { get; set; } = string.Empty;
        public double AlimRestant { get; set; }
        public string Souche { get; set; } = string.Empty;
        public string CodeEspece { get; set; } = string.Empty;
        public string Espece { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string NomJour { get; set; } = string.Empty;
        public double EffectifParamSouche { get; set; }
        public double NbrAlveole { get; set; }
        public string CodeDepBat { get; set; } = string.Empty;
        public string LibDepBat { get; set; } = string.Empty;
        public string NumBE { get; set; } = string.Empty;
        public string NumCentre { get; set; } = string.Empty;
        public string LotStatus { get; set; } = string.Empty;
        public List<CartItemRequest> CartItems { get; set; } = new();
        public double TEffectif { get; set; }
        public double TMortalite { get; set; }
        public double TQteV { get; set; }
        public double TPoidsV { get; set; }
        public double TMtv { get; set; }
        public string TSouche { get; set; } = string.Empty;
        public string TCodeEsp { get; set; } = string.Empty;
        public string TEspece { get; set; } = string.Empty;
        public double TEffAjout { get; set; }
        public double TEffRetire { get; set; }
        public double TEffectifJ { get; set; }
        public double TMortMale { get; set; }
        public string TNomJour { get; set; } = string.Empty;
        public double TEffectifParamSouche { get; set; }
        public double TNbrAlveole { get; set; }
    }

    public class ValidationJourneeResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public TotauxJournee Totaux { get; set; } = new();
        public IndicateursJournee Indicateurs { get; set; } = new();
    }

    public class TotauxJournee
    {
        public double TotAlim { get; set; }
        public double TotCoupeaux { get; set; }
        public double TotGaz { get; set; }
        public double TotOeuf { get; set; }
        public double TotOFN { get; set; }
        public double TotODJ { get; set; }
        public double TotOCAS { get; set; }
        public double TotOREJ { get; set; }
        public double TotOAC { get; set; }
        public string VaccinEff { get; set; } = string.Empty;
        public string MedEff { get; set; } = string.Empty;
        public double MT_Production { get; set; }
        public double MT_Depense { get; set; }
    }

    public class IndicateursJournee
    {
        public double GrOfLot { get; set; }
        public double AlimIng { get; set; }
        public double Talimth { get; set; }
        public double Tdiff { get; set; }
    }

    public class NumerosMouvements
    {
        public string NumCons { get; set; } = string.Empty;
        public string NumProd { get; set; } = string.Empty;
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;

        public static ValidationResult Valid() => new ValidationResult { IsValid = true };
        public static ValidationResult Invalid(string message) => new ValidationResult { IsValid = false, ErrorMessage = message };
    }

    public class CartItemRequest
    {
        public string CodeArt { get; set; } = string.Empty;
        public string Famille { get; set; } = string.Empty;
        public string LibDep { get; set; } = string.Empty;
        public string CNature { get; set; } = string.Empty;
        public double QteArt { get; set; }
        public string DesArt { get; set; } = string.Empty;
        public double NLigne { get; set; }
        public string Ville { get; set; } = string.Empty;
        public double Puttc { get; set; }
    }

    public class DetailedValidationResult
    {
        public bool IsValid { get; set; }
        public List<ValidationError> Errors { get; set; } = new List<ValidationError>();
    }

    public class ValidationError
    {
        public string Field { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class ApiErrorResponse
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public List<ValidationError> Errors { get; set; } = new List<ValidationError>();
        public DateTime Timestamp { get; set; }
    }

    public class ApiSuccessResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class BusinessException : Exception
    {
        public string ErrorCode { get; set; }
        public List<ValidationError>? ValidationErrors { get; set; }

        public BusinessException(string errorCode, string message, List<ValidationError>? validationErrors = null)
            : base(message)
        {
            ErrorCode = errorCode;
            ValidationErrors = validationErrors;
        }
    }
}