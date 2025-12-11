namespace BackendApi.Services.Reports
{
    /// <summary>
    /// Interface de base pour tous les générateurs de rapports
    /// </summary>
    public interface IReportGenerator
    {
        /// <summary>
        /// Génère le rapport PDF avec groupage par date
        /// </summary>
        byte[] GenerateWithGrouping(string connectionString, string codeUser, string societe);
    }
}







