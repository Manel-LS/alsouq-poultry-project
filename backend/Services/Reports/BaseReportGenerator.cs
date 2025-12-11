using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Data;
using MySql.Data.MySqlClient;

namespace BackendApi.Services.Reports
{
    /// <summary>
    /// Classe de base pour les générateurs de rapports avec méthodes communes
    /// </summary>
    public abstract class BaseReportGenerator
    {
        protected static string FormatNumber(object? value, int decimals = 2)
        {
            if (value == null || value == DBNull.Value)
                return "0";
            
            if (double.TryParse(value.ToString(), out double num))
            {
                return num.ToString($"F{decimals}");
            }
            
            return value.ToString() ?? "0";
        }

        /// <summary>
        /// Style pour les en-têtes principaux du tableau - Design original avec PaddingVertical et PaddingHorizontal
        /// </summary>
        protected static IContainer CellHeaderStyle(IContainer container)
        {
            return container
                .Border(1)
                .BorderColor(Colors.Black)
                .Background("#5087a8")
                .PaddingVertical(8)
                .PaddingHorizontal(5);
        }

        /// <summary>
        /// Style pour les sous-en-têtes du tableau - Design original
        /// </summary>
        protected static IContainer CellHeaderSubStyle(IContainer container)
        {
            return container
                .Border(1)
                .BorderColor(Colors.Black)
                .Background(Colors.White)
                .PaddingVertical(5)
                .PaddingHorizontal(3);
        }

        /// <summary>
        /// Style pour les cellules de données - Design original
        /// </summary>
        protected static IContainer CellDataStyle(IContainer container)
        {
            return container
                .Border(1)
                .BorderColor(Colors.Black)
                .Background(Colors.White)
                .PaddingVertical(5)
                .PaddingHorizontal(3);
        }

        /// <summary>
        /// Style pour les totaux de groupe - Design original
        /// </summary>
        protected static IContainer CellGroupSummaryStyle(IContainer container)
        {
            return container
                .BorderTop(1)
                .BorderColor(Colors.Black)
                .Background(Colors.Grey.Lighten2)
                .PaddingVertical(5)
                .PaddingHorizontal(3);
        }

        /// <summary>
        /// Style pour les totaux globaux - Design original
        /// </summary>
        protected static IContainer CellSummaryStyle(IContainer container)
        {
            return container
                .BorderTop(1)
                .BorderColor(Colors.Black)
                .Background(Colors.Blue.Lighten3)
                .PaddingVertical(5)
                .PaddingHorizontal(3);
        }
    }
}

