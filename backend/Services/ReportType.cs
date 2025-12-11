namespace BackendApi.Services
{
    /// <summary>
    /// Types de rapports disponibles dans le système
    /// </summary>
    public enum ReportType
    {
        /// <summary>
        /// Rapport de production quotidienne par centre (chair/viande)
        /// </summary>
        RapChairCentre,
        
        /// <summary>
        /// Rapport de production quotidienne par centre (ponte)
        /// </summary>
        RapPonteCentre,
        
        /// <summary>
        /// Rapport de production quotidienne par centre (reproduction)
        /// </summary>
        RapReproCentre,
        
        /// <summary>
        /// Rapport de poids par centre
        /// </summary>
        RapPoidCentre
    }
}




