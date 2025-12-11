using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Data;
using MySql.Data.MySqlClient;

namespace BackendApi.Services.Reports
{
    /// <summary>
    /// Générateur de rapport de production quotidienne par centre (rap_ponte_centre)
    /// </summary>
    public class RapPonteCentreReport : BaseReportGenerator, IReportGenerator
    {
        public byte[] GenerateWithGrouping(string connectionString, string codeUser, string societe)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            // Récupérer les données depuis la base de données
            using var connection = new MySqlConnection(connectionString);
            connection.Open();

            var sql = @"SELECT 
                               nummvt,
                               effectifmvt,
                               codeesp,
                               centre,
                               libesp,
                               '' AS AdrCentre,
                               batiment,
                               souche,
                               date,
                               semaine,
                               jour,
                               effectif,
                               mortalite,
                               CASE WHEN effectif > 0 THEN (mortalite / effectif) * 100 ELSE 0 END AS MortalitePourcentage,
                               tauxmort AS MortalitePourcentageGuide,
                               CASE WHEN effectif > 0 THEN effectifmvt / effectif ELSE 0 END AS EffectifMvtRatio,
                               ROUND(poidslot) AS PoidsLot,
                               ROUND(poids) AS PoidsGuide,
                               consommation AS ConsommationKgJour,
                               CASE WHEN effectif > 0 THEN consommation / effectif ELSE 0 END AS ConsommationKgPoule,
                               consommation,
                               oeufcasse,
                               oeufnorm,
                               oeufdj,
                               oeufrejet,
                               oaclot,
                               prodoflot,
                               pontelot,
                               pontestd,
                               indconv,
                               indconvlot
                       FROM paramsouche 
                       WHERE codeuser = @CodeUser AND societe = @Societe
                       ORDER BY date, centre, nummvt, jour";

            using var command = new MySqlCommand(sql, connection);
            command.Parameters.AddWithValue("@CodeUser", codeUser);
            command.Parameters.AddWithValue("@Societe", societe);

            using var adapter = new MySqlDataAdapter(command);
            var dataTable = new DataTable();
            adapter.Fill(dataTable);

            // Calculer les totaux globaux
            var totalMortalite = dataTable.AsEnumerable()
                .Sum(r => r["mortalite"] != DBNull.Value ? Convert.ToDouble(r["mortalite"]) : 0);
            var totalEffectif = dataTable.AsEnumerable()
                .Sum(r => r["effectif"] != DBNull.Value ? Convert.ToDouble(r["effectif"]) : 0);
            var totalPoidsGuide = Math.Round(dataTable.AsEnumerable()
                .Sum(r => r["PoidsGuide"] != DBNull.Value ? Convert.ToDouble(r["PoidsGuide"]) : 0));
            var totalPoidsLot = Math.Round(dataTable.AsEnumerable()
                .Sum(r => r["PoidsLot"] != DBNull.Value ? Convert.ToDouble(r["PoidsLot"]) : 0));
            var totalConsommationKgJour = dataTable.AsEnumerable()
                .Sum(r => r["ConsommationKgJour"] != DBNull.Value ? Convert.ToDouble(r["ConsommationKgJour"]) : 0);
            var totalConsommationKgPoule = dataTable.AsEnumerable()
                .Sum(r => r["ConsommationKgPoule"] != DBNull.Value ? Convert.ToDouble(r["ConsommationKgPoule"]) : 0);

            // Grouper par date
            var groupedData = dataTable.AsEnumerable()
                .GroupBy(r => r["date"] != DBNull.Value ? Convert.ToDateTime(r["date"]) : DateTime.MinValue)
                .OrderBy(g => g.Key)
                .ToList();

            // Générer le PDF avec QuestPDF
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(1f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial").DirectionFromLeftToRight());

                    // En-tête du rapport (RTL) - Ponte
                    page.Header()
                        .Column(column =>
                        {
                            column.Item().AlignCenter().Text("تقرير الانتاج اليومي - بياض")
                                .FontSize(16).Bold().FontFamily("Arial").DirectionFromRightToLeft();
                            
                            if (groupedData.Any())
                            {
                                var firstDate = groupedData.First().Key;
                                var lastDate = groupedData.Last().Key;
                                if (groupedData.Count == 1)
                                {
                                    column.Item().AlignRight().PaddingRight(1f, Unit.Centimetre)
                                        .Text($"التاريخ: {firstDate:dd/MM/yyyy}")
                                        .FontSize(10).Bold().DirectionFromRightToLeft();
                                }
                                else
                                {
                                    column.Item().AlignRight().PaddingRight(1f, Unit.Centimetre)
                                        .Text($"من {firstDate:dd/MM/yyyy} إلى {lastDate:dd/MM/yyyy}")
                                        .FontSize(10).Bold().DirectionFromRightToLeft();
                                }
                            }
                        });

                    // En-têtes de colonnes
                    page.Content()
                        .PaddingVertical(0.3f, Unit.Centimetre)
                        .Column(column =>
                        {
                            // En-têtes du tableau (première ligne)
                            column.Item().Table(table =>
                            {
                                BuildTableHeader(table);
                            });

                            // Deuxième ligne d'en-têtes (sous-colonnes)
                            column.Item().Table(table =>
                            {
                                BuildTableSubHeader(table);
                            });

                            // Données groupées par date
                            foreach (var group in groupedData)
                            {
                                var groupDate = group.Key;
                                var groupRows = group.OrderBy(r => r["centre"]).ThenBy(r => r["nummvt"]).ThenBy(r => r["jour"]).ToList();

                                // En-tête de groupe (date) - RTL
                                column.Item().PaddingTop(0.2f, Unit.Centimetre)
                                    .Background(Colors.Grey.Lighten3)
                                    .Padding(0.3f, Unit.Centimetre)
                                    .AlignRight()
                                    .Text($"التاريخ: {groupDate:dd/MM/yyyy}")
                                    .FontSize(10).Bold().DirectionFromRightToLeft();

                                // Lignes de données du groupe
                                column.Item().Table(table =>
                                {
                                    table.ColumnsDefinition(columns =>
                                    {
                                        columns.RelativeColumn(0.7f);
                                        columns.RelativeColumn(0.9f);
                                        columns.RelativeColumn(0.5f);
                                        columns.RelativeColumn(0.5f);
                                        columns.RelativeColumn(1.0f);
                                        columns.RelativeColumn(0.5f);
                                        columns.RelativeColumn(0.5f);
                                        columns.RelativeColumn(0.5f);
                                        columns.RelativeColumn(0.5f);
                                        columns.RelativeColumn(0.5f);
                                        columns.RelativeColumn(0.8f);
                                        columns.RelativeColumn(1.0f);
                                        columns.RelativeColumn(1.0f);
                                        columns.RelativeColumn(2.0f);
                                    });

                                    foreach (var row in groupRows)
                                    {
                                        BuildDataRow(table, row);
                                    }
                                });

                                // Totaux pour ce groupe de date
                                var groupMortalite = groupRows.Sum(r => r["mortalite"] != DBNull.Value ? Convert.ToDouble(r["mortalite"]) : 0);
                                var groupEffectif = groupRows.Sum(r => r["effectif"] != DBNull.Value ? Convert.ToDouble(r["effectif"]) : 0);
                                var groupPoidsGuide = Math.Round(groupRows.Sum(r => r["PoidsGuide"] != DBNull.Value ? Convert.ToDouble(r["PoidsGuide"]) : 0));
                                var groupPoidsLot = Math.Round(groupRows.Sum(r => r["PoidsLot"] != DBNull.Value ? Convert.ToDouble(r["PoidsLot"]) : 0));
                                var groupConsommationKgJour = groupRows.Sum(r => r["ConsommationKgJour"] != DBNull.Value ? Convert.ToDouble(r["ConsommationKgJour"]) : 0);
                                var groupConsommationKgPoule = groupRows.Sum(r => r["ConsommationKgPoule"] != DBNull.Value ? Convert.ToDouble(r["ConsommationKgPoule"]) : 0);

                                // Totaux du groupe
                                column.Item().PaddingTop(0.1f, Unit.Centimetre).Table(table =>
                                {
                                    BuildGroupSummaryRow(table, groupMortalite, groupEffectif, groupPoidsGuide, 
                                        groupPoidsLot, groupConsommationKgJour, groupConsommationKgPoule, groupDate);
                                });
                            }

                            // Totaux globaux
                            column.Item().PaddingTop(0.5f, Unit.Centimetre)
                                .BorderTop(2)
                                .BorderColor(Colors.Black)
                                .Table(table =>
                                {
                                    BuildSummaryRow(table, totalMortalite, totalEffectif, totalPoidsGuide, 
                                        totalPoidsLot, totalConsommationKgJour, totalConsommationKgPoule);
                                });
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("الصفحة ").FontSize(9).DirectionFromRightToLeft();
                            x.CurrentPageNumber().FontSize(9);
                            x.Span(" من ").FontSize(9).DirectionFromRightToLeft();
                            x.TotalPages().FontSize(9);
                        });
                });
            })
            .GeneratePdf();
        }

        private void BuildTableHeader(TableDescriptor table)
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(0.7f);
                columns.RelativeColumn(0.9f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.8f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(2.0f);
            });

            table.Header(header =>
            {
                header.Cell().ColumnSpan(2).Element(CellHeaderStyle).AlignCenter().Text("استهلاك الأعلاف").FontSize(8).Bold().DirectionFromRightToLeft();
                header.Cell().ColumnSpan(2).Element(CellHeaderStyle).AlignCenter().Text("الوزن").FontSize(8).Bold().DirectionFromRightToLeft();
                header.Cell().Element(CellHeaderStyle).AlignCenter().Text("عدد الطيور").FontSize(8).Bold().DirectionFromRightToLeft();
                header.Cell().ColumnSpan(3).Element(CellHeaderStyle).AlignCenter().Text("النافق").FontSize(8).Bold().DirectionFromRightToLeft();
                header.Cell().ColumnSpan(2).Element(CellHeaderStyle).AlignCenter().Text("يوم/أسبوع").FontSize(8).Bold().DirectionFromRightToLeft();
                header.Cell().Element(CellHeaderStyle).AlignCenter().Text("رقم الحركة").FontSize(8).Bold().DirectionFromRightToLeft();
                header.Cell().Element(CellHeaderStyle).AlignCenter().Text("السلالة").FontSize(8).Bold().DirectionFromRightToLeft();
                header.Cell().Element(CellHeaderStyle).AlignCenter().Text("الحظيرة").FontSize(8).Bold().DirectionFromRightToLeft();
                header.Cell().Element(CellHeaderStyle).AlignCenter().Text("الموقع").FontSize(8).Bold().DirectionFromRightToLeft();
            });
        }

        private void BuildTableSubHeader(TableDescriptor table)
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(0.7f);
                columns.RelativeColumn(0.9f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.8f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(2.0f);
            });

            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("كغ/طير").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("كغ/يوم").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("دليل").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("الدفعة").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("").FontSize(7);
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("% دليل").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("النسبة").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("العدد").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("اليوم").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("الأسبوع").FontSize(7).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("").FontSize(7);
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("").FontSize(7);
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("").FontSize(7);
            table.Cell().Element(CellHeaderSubStyle).AlignCenter().Text("").FontSize(7);
        }

        private void BuildDataRow(TableDescriptor table, DataRow row)
        {
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["ConsommationKgPoule"], 2)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["ConsommationKgJour"], 2)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["PoidsGuide"], 0)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["PoidsLot"], 0)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["effectif"], 0)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["MortalitePourcentageGuide"], 2)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["EffectifMvtRatio"], 2)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["mortalite"], 0)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["jour"], 0)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(FormatNumber(row["semaine"], 0)).FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(row["nummvt"]?.ToString() ?? "").FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(row["souche"]?.ToString() ?? "").FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(row["batiment"]?.ToString() ?? "").FontSize(8).DirectionFromRightToLeft();
            table.Cell().Element(CellDataStyle).AlignCenter().Text(row["centre"]?.ToString() ?? "").FontSize(8).DirectionFromRightToLeft();
        }

        private void BuildGroupSummaryRow(TableDescriptor table, double groupMortalite, double groupEffectif, 
            double groupPoidsGuide, double groupPoidsLot, double groupConsommationKgJour, double groupConsommationKgPoule, DateTime groupDate)
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(0.7f);
                columns.RelativeColumn(0.9f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.8f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(2.0f);
            });

            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text(FormatNumber(groupConsommationKgPoule, 2)).FontSize(9).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text(FormatNumber(groupConsommationKgJour, 2)).FontSize(9).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text(FormatNumber(groupPoidsGuide, 0)).FontSize(9).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text(FormatNumber(groupPoidsLot, 0)).FontSize(9).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text(FormatNumber(groupEffectif, 0)).FontSize(9).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text("").FontSize(9);
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text("").FontSize(9);
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text(FormatNumber(groupMortalite, 0)).FontSize(9).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text("").FontSize(9);
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text("").FontSize(9);
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text("").FontSize(9);
            table.Cell().Element(CellGroupSummaryStyle).AlignRight().Text($" :المجموع").FontSize(9).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text("").FontSize(9);
            table.Cell().Element(CellGroupSummaryStyle).AlignCenter().Text("").FontSize(9);
        }

        private void BuildSummaryRow(TableDescriptor table, double totalMortalite, double totalEffectif, 
            double totalPoidsGuide, double totalPoidsLot, double totalConsommationKgJour, double totalConsommationKgPoule)
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(0.7f);
                columns.RelativeColumn(0.9f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.5f);
                columns.RelativeColumn(0.8f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(1.0f);
                columns.RelativeColumn(2.0f);
            });

            table.Cell().Element(CellSummaryStyle).AlignCenter().Text(FormatNumber(totalConsommationKgPoule, 2)).FontSize(10).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text(FormatNumber(totalConsommationKgJour, 2)).FontSize(10).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text(FormatNumber(totalPoidsGuide, 0)).FontSize(10).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text(FormatNumber(totalPoidsLot, 0)).FontSize(10).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text(FormatNumber(totalEffectif, 0)).FontSize(10).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text("").FontSize(10);
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text("").FontSize(10);
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text(FormatNumber(totalMortalite, 0)).FontSize(10).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text("").FontSize(10);
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text("").FontSize(10);
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text("").FontSize(10);
            table.Cell().Element(CellSummaryStyle).AlignRight().Text(":المجموع العام ").FontSize(10).Bold().DirectionFromRightToLeft();
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text("").FontSize(10);
            table.Cell().Element(CellSummaryStyle).AlignCenter().Text("").FontSize(10);
        }
    }
}




