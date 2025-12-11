using BackendApi.DTO;
using BackendApi.Models;
using BackendApi.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;
using System.Data.Common;
using System.Text.RegularExpressions;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/stock-entry")]
    public class StockEntryController : ControllerBase
    {
        private readonly IDbSelector _dbSelector;
        private readonly AppDbContext _context;
        private readonly ILogger<StockEntryController> _logger;

        public StockEntryController(
            IDbSelector dbSelector,
            AppDbContext context,
            ILogger<StockEntryController> logger)
        {
            _dbSelector = dbSelector;
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateStockEntry([FromBody] StockEntryRequest request)
        {
            try
            {
                // Validation initiale
                if (request == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "Le corps de la requête est requis."
                    });
                }

                // Validation des champs requis
                var validationErrors = ValidateRequest(request);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "One or more validation errors occurred.",
                        errors = validationErrors
                    });
                }

                // Configuration de la connexion avec la base spécifiée
                if (_context.Database.GetDbConnection().State != ConnectionState.Open)
                {
                    await _context.Database.OpenConnectionAsync();
                }
                await _context.Database.ExecuteSqlRawAsync($"USE `{request.nomBaseStockSession}`;");

                // Vérifier les codes dans les tables ebe et lbe
                var codeValidationErrors = await ValidateCodesInEbeAndLbe(request);
                if (codeValidationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "Erreurs de validation des codes.",
                        errors = codeValidationErrors
                    });
                }

                // Créer ou vérifier les entrées dans ebe et lbe si elles n'existent pas
                await EnsureEbeAndLbeEntriesExist(request);

                // Générer le numéro de mouvement automatiquement
                var nummvt = await GenerateNumMvt(request.nomBaseStockSession);

                // Utiliser la stratégie d'exécution pour gérer les transactions avec retry
                var strategy = _context.Database.CreateExecutionStrategy();
                await strategy.ExecuteAsync(async () =>
                {
                    // Utiliser une transaction pour garantir l'intégrité
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Créer l'en-tête du mouvement (ebe)
                        var ebe = await CreateEbe(request, nummvt, transaction);

                        // Créer les lignes de mouvement (lbe)
                        await CreateLbeLines(request, nummvt, transaction);

                        // Commit de la transaction
                        await transaction.CommitAsync();

                        _logger.LogInformation("Stock entry created successfully: {NumMvt}", nummvt);
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, "Error creating stock entry");
                        throw;
                    }
                });

                return Ok(new
                {
                    success = true,
                    message = "تم حفظ المدخلات بنجاح"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CreateStockEntry");
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        private Dictionary<string, List<string>> ValidateRequest(StockEntryRequest request)
        {
            var errors = new Dictionary<string, List<string>>();

            // Validation des champs principaux
            // Note: nummvt sera généré automatiquement, donc on ne le valide plus comme requis

            if (string.IsNullOrWhiteSpace(request.codeDep))
                AddError(errors, "codeDep", "The codeDep field is required.");

            if (string.IsNullOrWhiteSpace(request.numcentre))
                AddError(errors, "numcentre", "The numcentre field is required.");

            if (string.IsNullOrWhiteSpace(request.numbat))
                AddError(errors, "numbat", "The numbat field is required.");

            if (string.IsNullOrWhiteSpace(request.codeFournisseur))
                AddError(errors, "codeFournisseur", "The codeFournisseur field is required.");

            if (string.IsNullOrWhiteSpace(request.codeuser))
                AddError(errors, "codeuser", "The codeuser field is required.");

            if (string.IsNullOrWhiteSpace(request.nomBaseStockSession))
                AddError(errors, "nomBaseStockSession", "The nomBaseStockSession field is required.");

            // Validation du panier
            if (request.panierArticles == null || request.panierArticles.Count == 0)
            {
                AddError(errors, "panierArticles", "The panierArticles field must contain at least one article.");
            }
            else
            {
                // Validation de chaque article
                var pniaerSet = new HashSet<int>();
                for (int i = 0; i < request.panierArticles.Count; i++)
                {
                    var article = request.panierArticles[i];
                    var prefix = $"panierArticles[{i}]";

                    // Validation pniaer (doit être unique et séquentiel)
                    if (pniaerSet.Contains(article.pniaer))
                    {
                        AddError(errors, $"{prefix}.pniaer", $"The pniaer value {article.pniaer} is duplicated.");
                    }
                    else
                    {
                        pniaerSet.Add(article.pniaer);
                    }

                    // Vérifier que pniaer est séquentiel (1, 2, 3...)
                    if (article.pniaer != i + 1)
                    {
                        AddError(errors, $"{prefix}.pniaer", $"The pniaer must be sequential starting from 1. Expected {i + 1}, got {article.pniaer}.");
                    }

                    // Validation des champs requis de l'article
                    if (string.IsNullOrWhiteSpace(article.codeart))
                        AddError(errors, $"{prefix}.codeart", "The codeart field is required.");

                    if (string.IsNullOrWhiteSpace(article.desart))
                        AddError(errors, $"{prefix}.desart", "The desart field is required.");

                    if (article.qteart < 0)
                        AddError(errors, $"{prefix}.qteart", "The qteart must be greater than or equal to 0.");

                    if (string.IsNullOrWhiteSpace(article.unite))
                        AddError(errors, $"{prefix}.unite", "The unite field is required.");

                    if (string.IsNullOrWhiteSpace(article.famille))
                        AddError(errors, $"{prefix}.famille", "The famille field is required.");

                    if (string.IsNullOrWhiteSpace(article.libfam))
                        AddError(errors, $"{prefix}.libfam", "The libfam field is required.");

                    if (string.IsNullOrWhiteSpace(article.codetrs))
                        AddError(errors, $"{prefix}.codetrs", "The codetrs field is required.");

                    if (string.IsNullOrWhiteSpace(article.libtrs))
                        AddError(errors, $"{prefix}.libtrs", "The libtrs field is required.");

                    if (string.IsNullOrWhiteSpace(article.codedep))
                        AddError(errors, $"{prefix}.codedep", "The codedep field is required.");

                    if (string.IsNullOrWhiteSpace(article.libdep))
                        AddError(errors, $"{prefix}.libdep", "The libdep field is required.");

                    if (string.IsNullOrWhiteSpace(article.codeusr))
                        AddError(errors, $"{prefix}.codeusr", "The codeusr field is required.");

                    if (string.IsNullOrWhiteSpace(article.libusr))
                        AddError(errors, $"{prefix}.libusr", "The libusr field is required.");

                    // Validation de la date (ISO 8601)
                    if (article.datemaj == default)
                    {
                        AddError(errors, $"{prefix}.datemaj", "The datemaj field is required and must be a valid ISO 8601 date.");
                    }
                }
            }

            return errors;
        }

        private void AddError(Dictionary<string, List<string>> errors, string field, string message)
        {
            if (!errors.ContainsKey(field))
            {
                errors[field] = new List<string>();
            }
            errors[field].Add(message);
        }

        private async Task<Dictionary<string, List<string>>> ValidateCodesInEbeAndLbe(StockEntryRequest request)
        {
            var errors = new Dictionary<string, List<string>>();

            using var db = await _dbSelector.GetConnection(HttpContext, request.nomBaseStockSession);
            if (db.State != ConnectionState.Open)
            {
                await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync();
            }

            // Pas de validation pour le fournisseur - on enregistre directement dans codetrs et libtrs
            // Pas de validation pour l'utilisateur - on enregistre directement dans usera, userm, users

            // Vérifier le code dépôt dans la table depot
            var depotExists = await db.QueryFirstOrDefaultAsync<int?>(
                @"SELECT 1 FROM depot WHERE Code = @CodeDep LIMIT 1",
                new { CodeDep = request.codeDep });

            if (depotExists == null)
            {
                AddError(errors, "codeDep", $"Le code dépôt '{request.codeDep}' n'existe pas dans la table depot.");
            }

            // Vérifier les codes dans les articles du panier
            for (int i = 0; i < request.panierArticles.Count; i++)
            {
                var article = request.panierArticles[i];
                var prefix = $"panierArticles[{i}]";

                // Vérifier le code dépôt de l'article
                var articleDepotExists = await db.QueryFirstOrDefaultAsync<int?>(
                    @"SELECT 1 FROM depot WHERE Code = @CodeDep LIMIT 1",
                    new { CodeDep = article.codedep });

                if (articleDepotExists == null)
                {
                    AddError(errors, $"{prefix}.codedep", $"Le code dépôt '{article.codedep}' n'existe pas dans la table depot.");
                }

                // Pas de validation pour le fournisseur de l'article - on enregistre directement dans codetrs et libtrs
            }

            return errors;
        }

        private async Task EnsureEbeAndLbeEntriesExist(StockEntryRequest request)
        {
            using var db = await _dbSelector.GetConnection(HttpContext, request.nomBaseStockSession);
            if (db.State != ConnectionState.Open)
            {
                await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync();
            }

            // Pas besoin de créer le fournisseur - on enregistre directement dans codetrs et libtrs de ebe
            // Pas besoin de créer l'utilisateur - on enregistre directement dans usera, userm, users de ebe

            // Vérifier et créer le dépôt dans la table depot si nécessaire
            var depotExists = await db.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT Code FROM depot WHERE Code = @CodeDep LIMIT 1",
                new { CodeDep = request.codeDep });

            if (depotExists == null)
            {
                // Créer l'entrée dans la table depot
                await db.ExecuteAsync(
                    @"INSERT INTO depot (Code, Libelle) 
                      VALUES (@Code, @Libelle)
                      ON DUPLICATE KEY UPDATE Libelle = @Libelle",
                    new 
                    { 
                        Code = request.codeDep,
                        Libelle = request.panierArticles.FirstOrDefault()?.libdep ?? ""
                    });
            }
        }

        private async Task<string> GenerateNumMvt(string nomBaseStockSession)
        {
            using var db = await _dbSelector.GetConnection(HttpContext, nomBaseStockSession);
            if (db.State != ConnectionState.Open)
            {
                await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync();
            }

            var annee = DateTime.Now.Year;
            var anneeCourte = annee.ToString().Substring(Math.Max(0, annee.ToString().Length - 2), 2);
            if (anneeCourte.Length == 1) anneeCourte = "0" + anneeCourte;

            // Format: BE + codePV (01) + année (25) + numéro (00001)
            var codePV = "01";
            var prefixeComplet = $"BE{codePV}{anneeCourte}";

            // Récupérer le dernier numéro de la table ebe avec ce préfixe
            var dernierNumero = await db.QueryFirstOrDefaultAsync<string>(
                @"SELECT nummvt FROM ebe 
                  WHERE nummvt LIKE @Prefix
                  ORDER BY nummvt DESC
                  LIMIT 1",
                new { Prefix = $"{prefixeComplet}%" });

            if (string.IsNullOrEmpty(dernierNumero))
            {
                // Premier numéro de l'année
                return $"{prefixeComplet}00001";
            }

            // Extraire le numéro (les 5 derniers chiffres)
            if (dernierNumero.Length >= prefixeComplet.Length + 5)
            {
                var numeroStr = dernierNumero.Substring(prefixeComplet.Length, 5);
                if (int.TryParse(numeroStr, out int numero))
                {
                    numero++;
                    return $"{prefixeComplet}{numero:D5}";
                }
            }

            // Si le format n'est pas correct, retourner le premier numéro
            return $"{prefixeComplet}00001";
        }

        private async Task<Ebe> CreateEbe(StockEntryRequest request, string nummvt, IDbContextTransaction transaction)
        {
            var now = DateTime.Now;
            var dateMvt = now.Date;
            var heure = now.ToString("HH:mm:ss");
            var temps = now.ToString("yyyyMMddHHmmss"); // Format: 20251101100811

            // Utiliser Dapper pour insérer directement avec les colonnes qui existent réellement
            var dbTransaction = transaction.GetDbTransaction();
            var connection = dbTransaction.Connection;
            
            // S'assurer que la bonne base de données est sélectionnée
            await connection.ExecuteAsync($"USE `{request.nomBaseStockSession}`;", null, dbTransaction);
            
            // Vérifier et créer la colonne libarabe dans ebe si elle n'existe pas
            await EnsureColumnExists(connection, dbTransaction, "ebe", "libarabe", "VARCHAR(255) DEFAULT ''");
            
            // Vérifier si la colonne libarabe existe maintenant
            var hasLibarabe = await CheckColumnExists(connection, dbTransaction, "ebe", "libarabe");
            
            var libdep = request.panierArticles.FirstOrDefault()?.libdep ?? "";
            
            // libtrs : nom du fournisseur (français) - vient du niveau principal ou du premier article du panier
            // libtrsarabe : nom du fournisseur (arabe) - sauvegardé dans ebe.libarabe
            var libtrs = !string.IsNullOrWhiteSpace(request.libtrs) 
                ? request.libtrs 
                : request.panierArticles.FirstOrDefault()?.libtrs ?? "";
            
            var libtrsarabe = !string.IsNullOrWhiteSpace(request.libtrsarabe)
                ? request.libtrsarabe
                : request.panierArticles.FirstOrDefault()?.libtrsarabe ?? "";
            
            // Construire la requête SQL dynamiquement selon l'existence de la colonne
            string sql;
            object parameters;
            
            if (hasLibarabe)
            {
                sql = @"INSERT INTO ebe (
                    nummvt, datemvt, heure, codetrs, libtrs, libarabe, numaffaire, refaffaire, descaffaire, enmodif,
                    usera, userm, users, datemaj, codepv, libpv, temps
                ) VALUES (
                    @nummvt, @datemvt, @heure, @codetrs, @libtrs, @libarabe, @numaffaire, @refaffaire, @descaffaire, @enmodif,
                    @usera, @userm, @users, @datemaj, @codepv, @libpv, @temps
                )";
                
                parameters = new
                {
                    nummvt = nummvt,
                    datemvt = dateMvt,
                    heure = heure,
                    codetrs = request.codeFournisseur,
                    libtrs = libtrs, // nom du fournisseur (français)
                    libarabe = libtrsarabe, // nom du fournisseur (arabe)
                    numaffaire = "2501401",
                    refaffaire = "2501401",
                    descaffaire = libdep,
                    enmodif = "0",
                    usera = request.codeuser,
                    userm = request.codeuser,
                    users = request.codeuser,
                    datemaj = now,
                    codepv = "01",
                    libpv = "Siège Local",
                    temps = temps
                };
            }
            else
            {
                sql = @"INSERT INTO ebe (
                    nummvt, datemvt, heure, codetrs, libtrs, numaffaire, refaffaire, descaffaire, enmodif,
                    usera, userm, users, datemaj, codepv, libpv, temps
                ) VALUES (
                    @nummvt, @datemvt, @heure, @codetrs, @libtrs, @numaffaire, @refaffaire, @descaffaire, @enmodif,
                    @usera, @userm, @users, @datemaj, @codepv, @libpv, @temps
                )";
                
                parameters = new
                {
                    nummvt = nummvt,
                    datemvt = dateMvt,
                    heure = heure,
                    codetrs = request.codeFournisseur,
                    libtrs = libtrs, // nom du fournisseur (français)
                    numaffaire = "2501401",
                    refaffaire = "2501401",
                    descaffaire = libdep,
                    enmodif = "0",
                    usera = request.codeuser,
                    userm = request.codeuser,
                    users = request.codeuser,
                    datemaj = now,
                    codepv = "01",
                    libpv = "Siège Local",
                    temps = temps
                };
            }
            
            await connection.ExecuteAsync(sql, parameters, dbTransaction);
            
            // Retourner un objet Ebe pour compatibilité
            // libtrs : nom du fournisseur (français)
            // libarabe : nom du fournisseur (arabe) - vient de libtrsarabe
            return new Ebe
            {
                nummvt = nummvt,
                datemvt = dateMvt,
                heure = heure,
                codetrs = request.codeFournisseur,
                libtrs = libtrs, // nom du fournisseur (français)
                libarabe = libtrsarabe, // nom du fournisseur (arabe)
                numaffaire = "2501401",
                refaffaire = "2501401",
                descaffaire = libdep,
                enmodif = "0",
                usera = request.codeuser,
                userm = request.codeuser,
                users = request.codeuser,
                datemaj = now,
                codepv = "01",
                libpv = "Siège Local",
                temps = temps
            };
        }

        private async Task CreateLbeLines(StockEntryRequest request, string nummvt, IDbContextTransaction transaction)
        {
            var now = DateTime.Now;
            var dateMvt = now.Date;
            var heure = now.ToString("HH:mm:ss");
            var temps = now.ToString("yyyyMMddHHmmss"); // Format: 20251101100811

            // Récupérer les informations des articles en une seule requête
            using var db = await _dbSelector.GetConnection(HttpContext, request.nomBaseStockSession);
            if (db.State != ConnectionState.Open)
            {
                await ((MySql.Data.MySqlClient.MySqlConnection)db).OpenAsync();
            }

            // Vérifier et créer les colonnes libarabe et libtrsarabe dans lbe si elles n'existent pas
            var dbTransaction = transaction.GetDbTransaction();
            var connection = dbTransaction.Connection;
            
            // S'assurer que la bonne base de données est sélectionnée
            await connection.ExecuteAsync($"USE `{request.nomBaseStockSession}`;", null, dbTransaction);
            
            await EnsureColumnExists(connection, dbTransaction, "lbe", "libarabe", "VARCHAR(255) DEFAULT ''");
            await EnsureColumnExists(connection, dbTransaction, "lbe", "libtrsarabe", "VARCHAR(255) DEFAULT ''");
            
            // Vérifier si les colonnes existent maintenant
            var hasLibarabe = await CheckColumnExists(connection, dbTransaction, "lbe", "libarabe");
            var hasLibtrsarabe = await CheckColumnExists(connection, dbTransaction, "lbe", "libtrsarabe");

            var articleCodes = request.panierArticles.Select(a => a.codeart).ToList();
            var articlesInfo = await db.QueryAsync<dynamic>(
                @"SELECT code, unite, nbrunite, tauxtva, fodec, decimqte, typeart
                  FROM article 
                  WHERE code IN @Codes",
                new { Codes = articleCodes });

            var articlesDict = articlesInfo.ToDictionary(a => (string)a.code, a => a);

            for (int i = 0; i < request.panierArticles.Count; i++)
            {
                var article = request.panierArticles[i];
                
                // Récupérer les informations de l'article depuis le dictionnaire
                articlesDict.TryGetValue(article.codeart, out var articleInfo);

                var unite = articleInfo != null ? (string)articleInfo.unite : article.unite;
                var nbrunite = 1.0; // Toujours égal à 1
                var puht = 0.0; // Prix unitaire HT par défaut à 0
                var tauxtva = articleInfo != null ? (double)articleInfo.tauxtva : 0;
                var fodec = articleInfo != null ? (double)articleInfo.fodec : 0;
                var decimqte = articleInfo != null ? (double)articleInfo.decimqte : 0;
                var typeart = articleInfo != null ? (string)articleInfo.typeart : "";

                // Calculer le prix TTC
                var coefficientTva = 1 + (tauxtva / 100);
                var puttc = Math.Round(puht * coefficientTva, 3);
                var mttotal = Math.Round(puttc * article.qteart, 3);

                // nligne commence à 1 puis continue avec 1+3 (1, 4, 7, 10...)
                var nligne = 1 + (i * 3);

                // desart : désignation de l'article (français)
                // libarabe : désignation de l'article (arabe) - c'est le desart en arabe
                // libfam : libellé de la famille (français)
                // libtrs : nom du fournisseur (français)
                // libtrsarabe : nom du fournisseur (arabe)
                var libtrsarabeLbe = !string.IsNullOrWhiteSpace(request.libtrsarabe)
                    ? request.libtrsarabe
                    : request.panierArticles.FirstOrDefault()?.libtrsarabe ?? "";
                
                var libarabeArticle = article.libarabe ?? "";
                
                // Utiliser SQL direct pour garantir l'insertion de libarabe et libtrsarabe
                string sqlLbe;
                object parametersLbe;
                
                if (hasLibarabe && hasLibtrsarabe)
                {
                    sqlLbe = @"INSERT INTO lbe (
                        nummvt, datemvt, codedep, libdep, codeart, desart, libarabe, famille, libfam,
                        qteart, unite, nbrunite, pudev, puht, remise, tauxtva, fodec, puttc, mttotal,
                        config, temps, nligne, fraistva0, fraistva1, fraistva2, fraistva3, numlot, dateexp,
                        codedest, libdest, decimqte, variante, puhtv, longueur, largeur, hauteur,
                        codesect, libsect, majart, majpv, qteliv, nbrpiece, numbc, nassujetti,
                        codetrs, libtrs, libtrsarabe, consom, gammeprix, gratuit, libgratuit, pieceliee,
                        mtfrais, oeuvresoc, poids, ancpv, marge, nouvpvht, nouvpvttc, remise2, dateprod
                    ) VALUES (
                        @nummvt, @datemvt, @codedep, @libdep, @codeart, @desart, @libarabe, @famille, @libfam,
                        @qteart, @unite, @nbrunite, @pudev, @puht, @remise, @tauxtva, @fodec, @puttc, @mttotal,
                        @config, @temps, @nligne, @fraistva0, @fraistva1, @fraistva2, @fraistva3, @numlot, @dateexp,
                        @codedest, @libdest, @decimqte, @variante, @puhtv, @longueur, @largeur, @hauteur,
                        @codesect, @libsect, @majart, @majpv, @qteliv, @nbrpiece, @numbc, @nassujetti,
                        @codetrs, @libtrs, @libtrsarabe, @consom, @gammeprix, @gratuit, @libgratuit, @pieceliee,
                        @mtfrais, @oeuvresoc, @poids, @ancpv, @marge, @nouvpvht, @nouvpvttc, @remise2, @dateprod
                    )";
                    
                    parametersLbe = new
                    {
                        nummvt = nummvt,
                        datemvt = dateMvt,
                        codedep = article.codedep,
                        libdep = article.libdep,
                        codeart = article.codeart,
                        desart = article.desart,
                        libarabe = libarabeArticle,
                        famille = article.famille,
                        libfam = article.libfam,
                        qteart = article.qteart,
                        unite = unite,
                        nbrunite = nbrunite,
                        pudev = puht,
                        puht = puht,
                        remise = 0,
                        tauxtva = tauxtva,
                        fodec = fodec,
                        puttc = puttc,
                        mttotal = mttotal,
                        config = "",
                        temps = temps,
                        nligne = nligne,
                        fraistva0 = 0,
                        fraistva1 = 0,
                        fraistva2 = 0,
                        fraistva3 = 0,
                        numlot = request.numLot ?? "",
                        dateexp = dateMvt,
                        codedest = "",
                        libdest = "",
                        decimqte = decimqte,
                        variante = 0,
                        puhtv = puht,
                        longueur = 0,
                        largeur = 0,
                        hauteur = 0,
                        codesect = "",
                        libsect = "",
                        majart = 0,
                        majpv = 0,
                        qteliv = article.qteart,
                        nbrpiece = 0,
                        numbc = "",
                        nassujetti = 0,
                        codetrs = article.codetrs,
                        libtrs = article.libtrs,
                        libtrsarabe = libtrsarabeLbe,
                        consom = 0,
                        gammeprix = "",
                        gratuit = "",
                        libgratuit = "",
                        pieceliee = "",
                        mtfrais = 0,
                        oeuvresoc = 0,
                        poids = 0,
                        ancpv = 0,
                        marge = 0,
                        nouvpvht = 0,
                        nouvpvttc = 0,
                        remise2 = 0,
                        dateprod = dateMvt
                    };
                }
                else if (hasLibarabe)
                {
                    sqlLbe = @"INSERT INTO lbe (
                        nummvt, datemvt, codedep, libdep, codeart, desart, libarabe, famille, libfam,
                        qteart, unite, nbrunite, pudev, puht, remise, tauxtva, fodec, puttc, mttotal,
                        config, temps, nligne, fraistva0, fraistva1, fraistva2, fraistva3, numlot, dateexp,
                        codedest, libdest, decimqte, variante, puhtv, longueur, largeur, hauteur,
                        codesect, libsect, majart, majpv, qteliv, nbrpiece, numbc, nassujetti,
                        codetrs, libtrs, consom, gammeprix, gratuit, libgratuit, pieceliee,
                        mtfrais, oeuvresoc, poids, ancpv, marge, nouvpvht, nouvpvttc, remise2, dateprod
                    ) VALUES (
                        @nummvt, @datemvt, @codedep, @libdep, @codeart, @desart, @libarabe, @famille, @libfam,
                        @qteart, @unite, @nbrunite, @pudev, @puht, @remise, @tauxtva, @fodec, @puttc, @mttotal,
                        @config, @temps, @nligne, @fraistva0, @fraistva1, @fraistva2, @fraistva3, @numlot, @dateexp,
                        @codedest, @libdest, @decimqte, @variante, @puhtv, @longueur, @largeur, @hauteur,
                        @codesect, @libsect, @majart, @majpv, @qteliv, @nbrpiece, @numbc, @nassujetti,
                        @codetrs, @libtrs, @consom, @gammeprix, @gratuit, @libgratuit, @pieceliee,
                        @mtfrais, @oeuvresoc, @poids, @ancpv, @marge, @nouvpvht, @nouvpvttc, @remise2, @dateprod
                    )";
                    
                    parametersLbe = new
                    {
                        nummvt = nummvt,
                        datemvt = dateMvt,
                        codedep = article.codedep,
                        libdep = article.libdep,
                        codeart = article.codeart,
                        desart = article.desart,
                        libarabe = libarabeArticle,
                        famille = article.famille,
                        libfam = article.libfam,
                        qteart = article.qteart,
                        unite = unite,
                        nbrunite = nbrunite,
                        pudev = puht,
                        puht = puht,
                        remise = 0,
                        tauxtva = tauxtva,
                        fodec = fodec,
                        puttc = puttc,
                        mttotal = mttotal,
                        config = "",
                        temps = temps,
                        nligne = nligne,
                        fraistva0 = 0,
                        fraistva1 = 0,
                        fraistva2 = 0,
                        fraistva3 = 0,
                        numlot = request.numLot ?? "",
                        dateexp = dateMvt,
                        codedest = "",
                        libdest = "",
                        decimqte = decimqte,
                        variante = 0,
                        puhtv = puht,
                        longueur = 0,
                        largeur = 0,
                        hauteur = 0,
                        codesect = "",
                        libsect = "",
                        majart = 0,
                        majpv = 0,
                        qteliv = article.qteart,
                        nbrpiece = 0,
                        numbc = "",
                        nassujetti = 0,
                        codetrs = article.codetrs,
                        libtrs = article.libtrs,
                        consom = 0,
                        gammeprix = "",
                        gratuit = "",
                        libgratuit = "",
                        pieceliee = "",
                        mtfrais = 0,
                        oeuvresoc = 0,
                        poids = 0,
                        ancpv = 0,
                        marge = 0,
                        nouvpvht = 0,
                        nouvpvttc = 0,
                        remise2 = 0,
                        dateprod = dateMvt
                    };
                }
                else
                {
                    sqlLbe = @"INSERT INTO lbe (
                        nummvt, datemvt, codedep, libdep, codeart, desart, famille, libfam,
                        qteart, unite, nbrunite, pudev, puht, remise, tauxtva, fodec, puttc, mttotal,
                        config, temps, nligne, fraistva0, fraistva1, fraistva2, fraistva3, numlot, dateexp,
                        codedest, libdest, decimqte, variante, puhtv, longueur, largeur, hauteur,
                        codesect, libsect, majart, majpv, qteliv, nbrpiece, numbc, nassujetti,
                        codetrs, libtrs, consom, gammeprix, gratuit, libgratuit, pieceliee,
                        mtfrais, oeuvresoc, poids, ancpv, marge, nouvpvht, nouvpvttc, remise2, dateprod
                    ) VALUES (
                        @nummvt, @datemvt, @codedep, @libdep, @codeart, @desart, @famille, @libfam,
                        @qteart, @unite, @nbrunite, @pudev, @puht, @remise, @tauxtva, @fodec, @puttc, @mttotal,
                        @config, @temps, @nligne, @fraistva0, @fraistva1, @fraistva2, @fraistva3, @numlot, @dateexp,
                        @codedest, @libdest, @decimqte, @variante, @puhtv, @longueur, @largeur, @hauteur,
                        @codesect, @libsect, @majart, @majpv, @qteliv, @nbrpiece, @numbc, @nassujetti,
                        @codetrs, @libtrs, @consom, @gammeprix, @gratuit, @libgratuit, @pieceliee,
                        @mtfrais, @oeuvresoc, @poids, @ancpv, @marge, @nouvpvht, @nouvpvttc, @remise2, @dateprod
                    )";
                    
                    parametersLbe = new
                    {
                        nummvt = nummvt,
                        datemvt = dateMvt,
                        codedep = article.codedep,
                        libdep = article.libdep,
                        codeart = article.codeart,
                        desart = article.desart,
                        famille = article.famille,
                        libfam = article.libfam,
                        qteart = article.qteart,
                        unite = unite,
                        nbrunite = nbrunite,
                        pudev = puht,
                        puht = puht,
                        remise = 0,
                        tauxtva = tauxtva,
                        fodec = fodec,
                        puttc = puttc,
                        mttotal = mttotal,
                        config = "",
                        temps = temps,
                        nligne = nligne,
                        fraistva0 = 0,
                        fraistva1 = 0,
                        fraistva2 = 0,
                        fraistva3 = 0,
                        numlot = request.numLot ?? "",
                        dateexp = dateMvt,
                        codedest = "",
                        libdest = "",
                        decimqte = decimqte,
                        variante = 0,
                        puhtv = puht,
                        longueur = 0,
                        largeur = 0,
                        hauteur = 0,
                        codesect = "",
                        libsect = "",
                        majart = 0,
                        majpv = 0,
                        qteliv = article.qteart,
                        nbrpiece = 0,
                        numbc = "",
                        nassujetti = 0,
                        codetrs = article.codetrs,
                        libtrs = article.libtrs,
                        consom = 0,
                        gammeprix = "",
                        gratuit = "",
                        libgratuit = "",
                        pieceliee = "",
                        mtfrais = 0,
                        oeuvresoc = 0,
                        poids = 0,
                        ancpv = 0,
                        marge = 0,
                        nouvpvht = 0,
                        nouvpvttc = 0,
                        remise2 = 0,
                        dateprod = dateMvt
                    };
                }
                
                await connection.ExecuteAsync(sqlLbe, parametersLbe, dbTransaction);
            }
        }

        /// <summary>
        /// Vérifie si une colonne existe dans une table
        /// </summary>
        private async Task<bool> CheckColumnExists(IDbConnection connection, IDbTransaction transaction, string tableName, string columnName)
        {
            try
            {
                var sql = @"
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = @tableName
                    AND COLUMN_NAME = @columnName";
                
                var result = await connection.QueryFirstOrDefaultAsync<dynamic>(sql, new { tableName, columnName }, transaction);
                return result != null && Convert.ToInt32(result.count) > 0;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// S'assure qu'une colonne existe dans une table, la crée si elle n'existe pas
        /// </summary>
        private async Task EnsureColumnExists(IDbConnection connection, IDbTransaction transaction, string tableName, string columnName, string columnDefinition)
        {
            var exists = await CheckColumnExists(connection, transaction, tableName, columnName);
            if (!exists)
            {
                try
                {
                    var sql = $"ALTER TABLE `{tableName}` ADD COLUMN `{columnName}` {columnDefinition}";
                    await connection.ExecuteAsync(sql, null, transaction);
                    _logger.LogInformation("Colonne {ColumnName} créée dans la table {TableName}", columnName, tableName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Impossible de créer la colonne {ColumnName} dans la table {TableName}", columnName, tableName);
                }
            }
        }
    }
}

