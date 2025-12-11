using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models
{
    public class Lbe
    {
        public string nummvt { get; set; } = string.Empty;
        public DateTime datemvt { get; set; }
        public string codedep { get; set; } = string.Empty;
        public string libdep { get; set; } = string.Empty;
        public string codeart { get; set; } = string.Empty;
        public string desart { get; set; } = string.Empty;
        public string libarabe { get; set; } = string.Empty;
        public string famille { get; set; } = string.Empty;
        public string libfam { get; set; } = string.Empty;
        public double qteart { get; set; }
        public string unite { get; set; } = string.Empty;
        public double nbrunite { get; set; }
        public double pudev { get; set; }
        public double puht { get; set; }
        public double remise { get; set; }
        public double tauxtva { get; set; }
        public double fodec { get; set; }
        public double puttc { get; set; }
        public double mttotal { get; set; }
        public string config { get; set; } = string.Empty;
        public string temps { get; set; } = string.Empty;
        public double nligne { get; set; }
        public double fraistva0 { get; set; }
        public double fraistva1 { get; set; }
        public double fraistva2 { get; set; }
        public double fraistva3 { get; set; }
        public string numlot { get; set; } = string.Empty;
        public DateTime dateexp { get; set; }
        public string codedest { get; set; } = string.Empty;
        public string libdest { get; set; } = string.Empty;
        public double decimqte { get; set; }
        public double variante { get; set; }
        public double puhtv { get; set; }
        public double longueur { get; set; }
        public double largeur { get; set; }
        public double hauteur { get; set; }
        public string codesect { get; set; } = string.Empty;
        public string libsect { get; set; } = string.Empty;
        public double majart { get; set; }
        public double majpv { get; set; }
        public double qteliv { get; set; }
        public double nbrpiece { get; set; }
        public string numbc { get; set; } = string.Empty;
        public double nassujetti { get; set; }
        public string codetrs { get; set; } = string.Empty;
        public string libtrs { get; set; } = string.Empty;
        public string libtrsarabe { get; set; } = string.Empty;
        public double consom { get; set; }
        public string gammeprix { get; set; } = string.Empty;
        public string gratuit { get; set; } = string.Empty;
        public string libgratuit { get; set; } = string.Empty;
        public string pieceliee { get; set; } = string.Empty;
        public double mtfrais { get; set; }
        public double oeuvresoc { get; set; }
        public double poids { get; set; }
        public double ancpv { get; set; }
        public double marge { get; set; }
        public double nouvpvht { get; set; }
        public double nouvpvttc { get; set; }
        public double remise2 { get; set; }
        public DateTime dateprod { get; set; }
        [NotMapped]
        public string ville { get; set; } = string.Empty;
        [NotMapped]
        public string groupage { get; set; } = string.Empty;
    }
}

