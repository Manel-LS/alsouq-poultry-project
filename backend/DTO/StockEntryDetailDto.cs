using System.Text.Json.Serialization;

namespace BackendApi.DTO
{
    public class StockEntryDetailDto
    {
        [JsonPropertyName("nummvt")]
        public string nummvt { get; set; } = string.Empty;
        
        [JsonPropertyName("numlot")]
        public string numlot { get; set; } = string.Empty;
        
        public string codeFournisseur { get; set; } = string.Empty;
        public string libelleFournisseur { get; set; } = string.Empty;
        public string libtrs { get; set; } = string.Empty;
        public string libarabeFournisseur { get; set; } = string.Empty;
        public DateTime dateCreation { get; set; }
        public string date { get; set; } = string.Empty;
        public DateTime datemaj { get; set; }
        public string numcentre { get; set; } = string.Empty;
        public string numbat { get; set; } = string.Empty;
        public string codeDep { get; set; } = string.Empty;
        public string libDep { get; set; } = string.Empty;
        public string codeuser { get; set; } = string.Empty;
        public string libusr { get; set; } = string.Empty;
        public List<StockEntryLineDto> panierArticles { get; set; } = new List<StockEntryLineDto>();
    }

    public class StockEntryLineDto
    {
        public int pniaer { get; set; }
        
        [JsonPropertyName("codeart")]
        public string codeart { get; set; } = string.Empty;
        
        public string desart { get; set; } = string.Empty;
        
        [JsonPropertyName("libelle")]
        public string libelle { get; set; } = string.Empty;
        
        [JsonPropertyName("qteart")]
        public double qteart { get; set; }
        
        public double quantite { get; set; }
        
        [JsonPropertyName("unite")]
        public string unite { get; set; } = string.Empty;
        
        public string famille { get; set; } = string.Empty;
        public string libfam { get; set; } = string.Empty;
        public string libelleFamille { get; set; } = string.Empty;
        public string codetrs { get; set; } = string.Empty;
        public string libtrs { get; set; } = string.Empty;
        public string codedep { get; set; } = string.Empty;
        public string libdep { get; set; } = string.Empty;
        public string codeusr { get; set; } = string.Empty;
        public string libusr { get; set; } = string.Empty;
        public DateTime datemaj { get; set; }
        public string libarabe { get; set; } = string.Empty;
        public string unitearabe { get; set; } = string.Empty;
    }
}

