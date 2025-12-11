using FastReport;
using FastReport.Export.PdfSimple;
using System;
using System.Collections.Generic;
using System.Data;

public class TestGroupage
{
    public byte[] GeneratePdf()
    {
        // 1) Création d’un DataTable
        DataTable dt = new DataTable("datasource");
        dt.Columns.Add("date", typeof(DateTime));
        dt.Columns.Add("centre", typeof(string));
        dt.Columns.Add("value", typeof(int));

        // 2) Ajout de données
        dt.Rows.Add(DateTime.Parse("2025-01-01"), "Centre A", 10);
        dt.Rows.Add(DateTime.Parse("2025-01-01"), "Centre B", 20);
        dt.Rows.Add(DateTime.Parse("2025-01-02"), "Centre A", 5);
        dt.Rows.Add(DateTime.Parse("2025-01-02"), "Centre B", 15);

        // 3) Charger le rapport FRX
        Report report = new Report();
        report.Load("report.frx");

        // 4) Enregistrer les données
        DataSet ds = new DataSet();
        ds.Tables.Add(dt);
        report.RegisterData(ds);

        // 5) Préparer
        report.Prepare();

        // 6) Exporter en PDF
        using (PDFSimpleExport export = new PDFSimpleExport())
        {
            using (MemoryStream ms = new MemoryStream())
            {
                report.Export(export, ms);
                return ms.ToArray();
            }
        }
    }
}
