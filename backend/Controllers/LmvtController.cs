using BackendApi.Models;
using BackendApi.Services;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/lmvt")]
    public class LmvtController : ControllerBase
    {
        private readonly IDbSelector _dbSelector;

        public LmvtController(IDbSelector dbSelector)
        {
            _dbSelector = dbSelector;
        }

        /// <summary>
        /// Retourne toutes les lignes lmvt pour un mouvement donné
        /// GET /api/lmvt?nummvt=XXX&date=YYYY-MM-DD (date optionnelle)
        /// Retourne les lignes où numaffaire = nummvt et datemvt correspond
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetLmvtByMouvement(
            [FromQuery] string nummvt,
            [FromQuery] DateTime? date = null)
        {
            if (string.IsNullOrWhiteSpace(nummvt))
            {
                return BadRequest(new { success = false, error = "Le paramètre nummvt est requis" });
            }

            try
            {
                using var db = await _dbSelector.GetConnection(HttpContext);

                // Requête simplifiée : seulement lmvt avec jointure sur stockdepot pour récupérer CNature
                string sql = @"
                    SELECT 
                        l.codeart AS CodeArt,
                        l.qteart AS Qte,
                        l.famille,
                        l.codedep,
                        l.nummvt AS NumMvt,
                        l.datemvt AS DateMvt,
                        l.numaffaire,
                        IFNULL(sd.cnature, '') AS CNature,
                        IFNULL(l.libarabe, '') AS Libarabe
                    FROM lmvt l
                    LEFT JOIN stockdepot sd ON sd.codeart = l.codeart 
                        AND sd.codedep = l.codedep 
                        AND sd.famille = l.famille
                    WHERE l.numaffaire = @nummvt";

                object parameters;

                // Si une date est fournie, ajouter le filtre sur datemvt
                if (date.HasValue)
                {
                    sql += " AND DATE(l.datemvt) = DATE(@date)";
                    parameters = new { nummvt, date = date.Value };
                }
                else
                {
                    parameters = new { nummvt };
                }

                var results = await db.QueryAsync<dynamic>(sql, parameters);
                return Ok(new { success = true, data = results });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }
}

