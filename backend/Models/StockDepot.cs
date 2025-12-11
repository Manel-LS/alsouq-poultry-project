using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models
{
    public class StockDepot
    {
        [Key]
         
        public string codedep { get; set; } = string.Empty;
        public string libdep { get; set; } = string.Empty;
        public string codeart { get; set; } = string.Empty;
        public string desart { get; set; } = string.Empty;
        public string famille { get; set; } = string.Empty;
        public string libfam { get; set; } = string.Empty;
        public double qteart { get; set; }
        public double qteini { get; set; }
        public double qtemin { get; set; }
        public double qtemax { get; set; }
        public double qtereserve { get; set; }
        public string unite { get; set; } = string.Empty;
        public double nbrunite { get; set; }
        public string typeart { get; set; } = string.Empty;
        public double tauxtva { get; set; }
        public double fodec { get; set; }
        public double prixvht1 { get; set; }
        public double prixvttc1 { get; set; }
        public double prixbrut { get; set; }
        public double remise { get; set; }
        public double prixnet { get; set; }
        public double marge { get; set; }
        public double pmp { get; set; }
        public double panet { get; set; }
        public string inventaire { get; set; } = string.Empty;
        public string nature { get; set; } = string.Empty;
        public string typedep { get; set; } = string.Empty;
        public double nbrpiece { get; set; }
        public string cmarque { get; set; } = string.Empty;
        public string lmarque { get; set; } = string.Empty;
        public double prixconsulte { get; set; }
        public double consvente { get; set; }
        public string codefrs { get; set; } = string.Empty;
        public string libfrs { get; set; } = string.Empty;
        public double prixsoutr { get; set; }
        public double fodachat { get; set; }
        public string cnature { get; set; } = string.Empty;
        public string libarabe { get; set; } = string.Empty;
        public string unitearabe { get; set; } = string.Empty;
    }
}