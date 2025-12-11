using BackendApi.Services.Reports;

namespace BackendApi.Services
{
    public interface IQuestPdfReportService
    {
        byte[] GenerateRapChairCentrePdf(string connectionString, string codeUser, string societe);
        byte[] GenerateRapChairCentrePdfWithGrouping(string connectionString, string codeUser, string societe);
        byte[] GenerateRapPoidCentrePdfWithGrouping(string connectionString, string codeUser, string societe);
        byte[] GenerateReport(ReportType reportType, string connectionString, string codeUser, string societe);
    }

    public class QuestPdfReportService : IQuestPdfReportService
    {
        private readonly RapChairCentreReport _rapChairCentreReport;
        private readonly RapPonteCentreReport _rapPonteCentreReport;
        private readonly RapReproCentreReport _rapReproCentreReport;
        private readonly RapPoidCentreReport _rapPoidCentreReport;

        public QuestPdfReportService()
        {
            _rapChairCentreReport = new RapChairCentreReport();
            _rapPonteCentreReport = new RapPonteCentreReport();
            _rapReproCentreReport = new RapReproCentreReport();
            _rapPoidCentreReport = new RapPoidCentreReport();
        }

        public byte[] GenerateRapChairCentrePdfWithGrouping(string connectionString, string codeUser, string societe)
        {
            return _rapChairCentreReport.GenerateWithGrouping(connectionString, codeUser, societe);
        }

        [Obsolete("Utilisez GenerateRapChairCentrePdfWithGrouping à la place")]
        public byte[] GenerateRapChairCentrePdf(string connectionString, string codeUser, string societe)
        {
            return GenerateRapChairCentrePdfWithGrouping(connectionString, codeUser, societe);
        }

        public byte[] GenerateRapPoidCentrePdfWithGrouping(string connectionString, string codeUser, string societe)
        {
            return _rapPoidCentreReport.GenerateWithGrouping(connectionString, codeUser, societe);
        }

        /// <summary>
        /// Méthode générique pour router vers le bon rapport selon le type
        /// </summary>
        public byte[] GenerateReport(ReportType reportType, string connectionString, string codeUser, string societe)
        {
            return reportType switch
            {
                ReportType.RapChairCentre => GenerateRapChairCentrePdfWithGrouping(connectionString, codeUser, societe),
                ReportType.RapPonteCentre => _rapPonteCentreReport.GenerateWithGrouping(connectionString, codeUser, societe),
                ReportType.RapReproCentre => _rapReproCentreReport.GenerateWithGrouping(connectionString, codeUser, societe),
                ReportType.RapPoidCentre => GenerateRapPoidCentrePdfWithGrouping(connectionString, codeUser, societe),
                _ => throw new ArgumentException($"Type de rapport non supporté: {reportType}")
            };
        }
    }
}
