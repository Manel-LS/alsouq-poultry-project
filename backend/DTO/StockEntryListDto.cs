using System.Text.Json.Serialization;

namespace BackendApi.DTO
{
    public class StockEntryListDto
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
        public int nombreArticles { get; set; }
        public List<LbeLineDto> lignes { get; set; } = new List<LbeLineDto>();
    }

    public class LbeLineDto
    {
        public string codeart { get; set; } = string.Empty;
        public string desart { get; set; } = string.Empty;
        public string libarabe { get; set; } = string.Empty;
        
        [JsonPropertyName("datemvt")]
        public DateTime datemvt { get; set; }
        
        [JsonPropertyName("dateMvtFormatted")]
        public string dateMvt { get; set; } = string.Empty;
        
        public double qteart { get; set; }
        public string unite { get; set; } = string.Empty;
    }
}

