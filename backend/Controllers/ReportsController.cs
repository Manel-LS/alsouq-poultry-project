using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IO;
using BackendApi.Services;
using Dapper;
using BackendApi.Models;
using BackendApi.DTO;
using System.Security.Claims;
using System.Collections.Generic;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase, IDisposable
    {
        private bool _disposed = false;
        private readonly IDbSelector _dbSelector;
        private readonly IQuestPdfReportService _questPdfReportService;

        public ReportsController(IDbSelector dbSelector, IQuestPdfReportService questPdfReportService)
        {
            _dbSelector = dbSelector;
            _questPdfReportService = questPdfReportService;
        }

        [HttpGet("types")]
        public async Task<IActionResult> GetReportTypes([FromQuery] string? databaseName)
        {
            try
            {
                if (string.IsNullOrEmpty(databaseName))
                {
                    return BadRequest(new { success = false, error = "Le paramètre 'databaseName' est requis. Format: GET /api/reports/types?databaseName=nom_base" });
                }

                // Connexion à la base globale "socerp"
                var socerpConnectionString = "Server=localhost;Database=socerp;Uid=root;Pwd=;SslMode=None;";
                using var db = new MySql.Data.MySqlClient.MySqlConnection(socerpConnectionString);
                await db.OpenAsync();

                // Requête SQL pour récupérer les valeurs chair, ponte, repro
                var sql = @"
                    SELECT chair, ponte, repro 
                    FROM `paramaitre` 
                    WHERE `code` = @DatabaseName
                    LIMIT 1";

                var result = await db.QueryFirstOrDefaultAsync<ReportTypesResponse>(sql, new { DatabaseName = databaseName });

                if (result == null)
                {
                    return NotFound(new { success = false, error = $"Aucun enregistrement trouvé dans paramaitre avec code = '{databaseName}'" });
                }

                return Ok(new { success = true, data = result });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateReport([FromBody] RapChairCentreRequest? request, [FromQuery] string reportType = "rap_chair_centre")
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { success = false, error = "Le corps de la requête est requis. Format JSON attendu: {\"dateDebut\": \"2025-10-06\", \"dateFin\": \"2025-12-04\", \"codeUser\": \"04\", \"societe\": \"OVIPO\"}" });
                }

                if (request.DateDebut == null || request.DateFin == null)
                {
                    return BadRequest(new { success = false, error = "Les dates DateDebut et DateFin sont requises." });
                }

                // Convertir le reportType string en enum
                ReportType type;
                if (!Enum.TryParse<ReportType>(reportType.Replace("rap_", "").Replace("_", ""), true, out type))
                {
                    // Fallback pour les noms complets
                    type = reportType.ToLower() switch
                    {
                        "rap_chair_centre" or "chaircentre" or "chair" => ReportType.RapChairCentre,
                        "rap_ponte_centre" or "pontecentre" or "ponte" or "rapoponte" => ReportType.RapPonteCentre,
                        "rap_repro_centre" or "reprocentre" or "repro" => ReportType.RapReproCentre,
                        "rap_poid_centre" or "poidcentre" => ReportType.RapPoidCentre,
                        _ => ReportType.RapChairCentre // Par défaut
                    };
                }

                // Récupérer CodeUser depuis le frontend
                var codeUser = request.CodeUser;
                if (string.IsNullOrEmpty(codeUser))
                {
                    return BadRequest(new { success = false, error = "CodeUser est requis." });
                }

                // Récupérer Societe depuis le frontend
                var societe = request.Societe;
                if (string.IsNullOrEmpty(societe))
                {
                    return BadRequest(new { success = false, error = "Societe est requise." });
                }

                // Récupérer le nom de la base de données depuis la requête, le header ou le query param
                var databaseName = request.Database 
                    ?? HttpContext.Request.Headers["X-Database-Choice"].FirstOrDefault() 
                    ?? HttpContext.Request.Query["database"].FirstOrDefault();
                
                if (string.IsNullOrEmpty(databaseName))
                {
                    return BadRequest(new { success = false, error = "Le nom de la base de données est requis. Spécifiez-le dans le champ 'database' de la requête, dans le header 'X-Database-Choice' ou dans le query param 'database'." });
                }
                
                // Connexion à la base principale
                using var db = await _dbSelector.GetConnection(HttpContext);
                db.Open();

                // Convertir les dates au format MySQL
                var dateDebut = request.DateDebut.Value.ToString("yyyy-MM-dd");
                var dateFin = request.DateFin.Value.ToString("yyyy-MM-dd");

                // Étape 1: Supprimer les anciennes données de baseimpr.paramsouche
                try
                {
                    await db.ExecuteAsync(
                        "DELETE FROM baseimpr.paramsouche WHERE codeuser = @CodeUser AND societe = @Societe",
                        new { CodeUser = codeUser, Societe = societe });
                }
                catch
                {
                    // Si la table n'existe pas, on continue
                }

                // Étape 2: Copier les données
                var copySql = $@"
                    INSERT INTO baseimpr.paramsouche (
                        nummvt, effectifmvt, codeesp, centre, libesp, batiment, souche, date, semaine, jour,
                        effectif, mortalite, tauxmort, oeufcasse, oeufnorm, oeufdj, oeufrejet, oaclot,
                        prodoflot, pontelot, pontestd, consommation, poids, poidslot, indconv, indconvlot,
                        codeuser, societe
                    )
                    SELECT 
                        e.nummvt,
                        e.effectif AS effectifmvt,
                        e.numcentre AS codeesp,
                        e.libcentre AS centre,
                        e.numbat AS libesp,
                        e.libbat AS batiment,
                        COALESCE(e.souche, p.code) AS souche,
                        p.date,
                        p.semaine,
                        p.jour,
                        p.effectif,
                        p.mortalite,
                        COALESCE(p.tauxmort, 0) AS tauxmort,
                        COALESCE(p.oeufcasse, 0) AS oeufcasse,
                        COALESCE(p.oeufnorm, 0) AS oeufnorm,
                        COALESCE(p.oeufdj, 0) AS oeufdj,
                        COALESCE(p.oeufrejet, 0) AS oeufrejet,
                        COALESCE(p.oaclot, 0) AS oaclot,
                        COALESCE(p.prodoflot, 0) AS prodoflot,
                        COALESCE(p.pontelot, 0) AS pontelot,
                        COALESCE(p.pontestd, 0) AS pontestd,
                        p.consommation,
                        COALESCE(p.poids, 0) AS poids,
                        p.poidslot,
                        COALESCE(p.indconv, 0) AS indconv,
                        COALESCE(p.indconvlot, 0) AS indconvlot,
                        @CodeUser AS codeuser,
                        @Societe AS societe
                    FROM `{databaseName}`.paramsouche p
                    INNER JOIN `{databaseName}`.miseplace e ON e.nummvt = p.nummvt
                    WHERE p.date >= @DateDebut 
                        AND p.date <= @DateFin 
                        AND p.cloturer = 1";

                var copyParams = new { DateDebut = dateDebut, DateFin = dateFin, CodeUser = codeUser, Societe = societe };
                
                // Copier les données dans baseimpr.paramsouche
                await db.ExecuteAsync(copySql, copyParams);

                // Étape 3: Générer le rapport avec QuestPDF (dynamique)
                var baseImprConnectionString = $"Server=localhost;Database=baseimpr;Uid=root;Pwd=;SslMode=None;";
                
                // Générer le PDF avec QuestPDF
                byte[] pdfBytes = _questPdfReportService.GenerateReport(type, baseImprConnectionString, codeUser, societe);

                // Retourner le PDF avec les headers appropriés
                var reportName = type switch
                {
                    ReportType.RapChairCentre => "rap_chair_centre",
                    ReportType.RapPonteCentre => "rap_ponte_centre",
                    ReportType.RapReproCentre => "rap_repro_centre",
                    ReportType.RapPoidCentre => "rap_poid_centre",
                    _ => "report"
                };
                var fileName = $"{reportName}_{dateDebut}_{dateFin}.pdf";
                
                Response.Headers["X-Success-Message"] = "File downloaded successfully";
                Response.Headers["X-File-Name"] = fileName;
                Response.Headers["X-File-Size"] = pdfBytes.Length.ToString();
                Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                Response.Headers["Pragma"] = "no-cache";
                Response.Headers["Expires"] = "0";
                
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace,
                    source = ex.Source
                });
            }
        }

        [HttpPost("types")]
        public async Task<IActionResult> GetReportTypes([FromBody] ReportTypesRequest? request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.DatabaseName))
                {
                    return BadRequest(new { success = false, error = "Le nom de la base de données est requis. Format JSON attendu: {\"databaseName\": \"nom_base\"}" });
                }

                // Connexion à la base globale "socerp"
                var socerpConnectionString = "Server=localhost;Database=socerp;Uid=root;Pwd=;SslMode=None;";
                using var db = new MySql.Data.MySqlClient.MySqlConnection(socerpConnectionString);
                await db.OpenAsync();

                // Requête SQL pour récupérer les valeurs chair, ponte, repro
                var sql = @"
                    SELECT chair, ponte, repro 
                    FROM `paramaitre` 
                    WHERE `code` = @DatabaseName
                    LIMIT 1";

                var result = await db.QueryFirstOrDefaultAsync<ReportTypesResponse>(sql, new { DatabaseName = request.DatabaseName });

                if (result == null)
                {
                    return NotFound(new { success = false, error = $"Aucun enregistrement trouvé dans paramaitre avec code = '{request.DatabaseName}'" });
                }

                return Ok(new { success = true, data = result });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpPost("rap_chair_centre")]
        public async Task<IActionResult> GenerateRapChairCentre([FromBody] RapChairCentreRequest? request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { success = false, error = "Le corps de la requête est requis. Format JSON attendu: {\"dateDebut\": \"2025-10-06\", \"dateFin\": \"2025-12-04\", \"codeUser\": \"04\", \"societe\": \"OVIPO\"}" });
                }

                if (request.DateDebut == null || request.DateFin == null)
                {
                    return BadRequest(new { success = false, error = "Les dates DateDebut et DateFin sont requises." });
                }

                // Récupérer CodeUser depuis le frontend
                var codeUser = request.CodeUser;
                if (string.IsNullOrEmpty(codeUser))
                {
                    return BadRequest(new { success = false, error = "CodeUser est requis." });
                }

                // Récupérer Societe depuis le frontend
                var societe = request.Societe;
                if (string.IsNullOrEmpty(societe))
                {
                    return BadRequest(new { success = false, error = "Societe est requise." });
                }

                // Récupérer le nom de la base de données depuis la requête, le header ou le query param
                var databaseName = request.Database 
                    ?? HttpContext.Request.Headers["X-Database-Choice"].FirstOrDefault() 
                    ?? HttpContext.Request.Query["database"].FirstOrDefault();
                
                if (string.IsNullOrEmpty(databaseName))
                {
                    return BadRequest(new { success = false, error = "Le nom de la base de données est requis. Spécifiez-le dans le champ 'database' de la requête, dans le header 'X-Database-Choice' ou dans le query param 'database'." });
                }
                
                // Connexion à la base principale (peut être SOCERP ou autre, mais on utilisera SQL direct avec nom de base)
                using var db = await _dbSelector.GetConnection(HttpContext);
                db.Open();

                // Convertir les dates au format MySQL (comme CONVERTIONDAT dans VB6)
                var dateDebut = request.DateDebut.Value.ToString("yyyy-MM-dd");
                var dateFin = request.DateFin.Value.ToString("yyyy-MM-dd");

                // Étape 1: Supprimer les anciennes données de baseimpr.paramsouche (comme dans VB6)
                try
                {
                    await db.ExecuteAsync(
                        "DELETE FROM baseimpr.paramsouche WHERE codeuser = @CodeUser AND societe = @Societe",
                        new { CodeUser = codeUser, Societe = societe });
                }
                catch
                {
                    // Si la table n'existe pas, on continue
                }

                // Étape 2: Copier les données (comme CopyDonne() dans VB6)
                // SQL direct avec nom de base explicite (MySQL permet d'accéder à d'autres bases sur le même serveur)
                var copySql = $@"
                    INSERT INTO baseimpr.paramsouche (
                        nummvt, effectifmvt, codeesp, centre, libesp, batiment, souche, date, semaine, jour,
                        effectif, mortalite, tauxmort, oeufcasse, oeufnorm, oeufdj, oeufrejet, oaclot,
                        prodoflot, pontelot, pontestd, consommation, poids, poidslot, indconv, indconvlot,
                        codeuser, societe
                    )
                    SELECT 
                        e.nummvt,
                        e.effectif AS effectifmvt,
                        e.numcentre AS codeesp,
                        e.libcentre AS centre,
                        e.numbat AS libesp,
                        e.libbat AS batiment,
                        COALESCE(e.souche, p.code) AS souche,
                        p.date,
                        p.semaine,
                        p.jour,
                        p.effectif,
                        p.mortalite,
                        COALESCE(p.tauxmort, 0) AS tauxmort,
                        COALESCE(p.oeufcasse, 0) AS oeufcasse,
                        COALESCE(p.oeufnorm, 0) AS oeufnorm,
                        COALESCE(p.oeufdj, 0) AS oeufdj,
                        COALESCE(p.oeufrejet, 0) AS oeufrejet,
                        COALESCE(p.oaclot, 0) AS oaclot,
                        COALESCE(p.prodoflot, 0) AS prodoflot,
                        COALESCE(p.pontelot, 0) AS pontelot,
                        COALESCE(p.pontestd, 0) AS pontestd,
                        p.consommation,
                        COALESCE(p.poids, 0) AS poids,
                        p.poidslot,
                        COALESCE(p.indconv, 0) AS indconv,
                        COALESCE(p.indconvlot, 0) AS indconvlot,
                        @CodeUser AS codeuser,
                        @Societe AS societe
                    FROM `{databaseName}`.paramsouche p
                    INNER JOIN `{databaseName}`.miseplace e ON e.nummvt = p.nummvt
                    WHERE p.date >= @DateDebut 
                        AND p.date <= @DateFin 
                        AND p.cloturer = 1";

                var copyParams = new { DateDebut = dateDebut, DateFin = dateFin, CodeUser = codeUser, Societe = societe };
                
                // Copier les données dans baseimpr.paramsouche (comme dans CopyDonne())
                await db.ExecuteAsync(copySql, copyParams);

                // Étape 3: Générer le rapport avec QuestPDF
                // Construire la chaîne de connexion pour baseimpr
                var baseImprConnectionString = $"Server=localhost;Database=baseimpr;Uid=root;Pwd=;SslMode=None;";
                
                // Générer le PDF avec QuestPDF
                byte[] pdfBytes = _questPdfReportService.GenerateRapChairCentrePdfWithGrouping(baseImprConnectionString, codeUser, societe);

                // Étape 4: Nettoyer baseimpr.paramsouche après génération (comme dans le code VB6)
                //await dbBaseImpr.ExecuteAsync(
                //    "DELETE FROM paramsouche WHERE codeuser = @CodeUser AND societe = @Societe",
                //    new { CodeUser = codeUser, Societe = societe });

                // Retourner le PDF avec les headers appropriés pour le téléchargement
                var fileName = $"rap_chair_centre_{dateDebut}_{dateFin}.pdf";
                
                // Ajouter un message de succès dans les headers (visible côté frontend) - AVANT File()
                // Utiliser uniquement des caractères ASCII pour les headers HTTP
                Response.Headers["X-Success-Message"] = "File downloaded successfully";
                Response.Headers["X-File-Name"] = fileName;
                Response.Headers["X-File-Size"] = pdfBytes.Length.ToString();
                Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                Response.Headers["Pragma"] = "no-cache";
                Response.Headers["Expires"] = "0";
                
                // File() gère automatiquement Content-Type, Content-Disposition et Content-Length
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace,
                    source = ex.Source
                });
            }
        }

        ~ReportsController()
        {
            Dispose(disposing: false);
        }

        public void Dispose()
        {
            Dispose(disposing: true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    
                }

                
                _disposed = true;
            }
        }
    }
}
