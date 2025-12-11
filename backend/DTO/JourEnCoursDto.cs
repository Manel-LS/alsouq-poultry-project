namespace BackendApi.DTO
{
    public class JourEnCoursDto
    { 
            public string NumMvt { get; set; } = string.Empty;
            public DateTime DateMvt { get; set; }
            public int Jour { get; set; }
            public int Semaine { get; set; }
            public double Mortalite { get; set; }
            public double MortMale { get; set; }
            public double Effectif { get; set; }
            public double StockOeuf { get; set; }
            public double StockPlat { get; set; }
            public string TypeEspece { get; set; } = string.Empty;
            public bool Phase2 { get; set; }
            public string Souche { get; set; } = string.Empty;
            public string Adresse { get; set; } = string.Empty;
            public string NumCentre { get; set; } = string.Empty;
            public string LibCentre { get; set; } = string.Empty;
            public string? NumBatiment { get; set; }
            public string CodeEspece { get; set; } = string.Empty;
            public string NomEspece { get; set; } = string.Empty;
            public string NomEspeceArabe { get; set; } = string.Empty;
            public double QteVendue { get; set; }
            public double PoidsVendu { get; set; }
            public double MontantVente { get; set; }
            public double EffTransfert { get; set; }
            public double EffAjout { get; set; }
            public double EffRetire { get; set; }
            public double AlimRestant { get; set; }
            public double PoidsOeufLot { get; set; }
        
    }

}
