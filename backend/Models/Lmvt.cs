using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models
{
    public class Lmvt
    {
        public string nummvt { get; set; } = string.Empty;
        public DateTime datemvt { get; set; }
        public string codedep { get; set; } = string.Empty;
        public string libdep { get; set; } = string.Empty;
        public string codeart { get; set; } = string.Empty;
        public string desart { get; set; } = string.Empty;
        public string famille { get; set; } = string.Empty;
        public string libfam { get; set; } = string.Empty;
        public double qteart { get; set; }
        public double qteliv { get; set; }
        public string unite { get; set; } = string.Empty;
        public double nbrunite { get; set; }
        public double puht { get; set; }
        public double remise { get; set; }
        public double tauxtva { get; set; }
        public double fodec { get; set; }
        public double puttc { get; set; }
        public double mttotal { get; set; }
        public string typemvt { get; set; } = string.Empty;
        public string naturemvt { get; set; } = string.Empty;
        public string config { get; set; } = string.Empty;
        public string temps { get; set; } = string.Empty;
        public string numbande { get; set; } = string.Empty;
        public string numlot { get; set; } = string.Empty;
        public DateTime dateexp { get; set; }
        public string artpere { get; set; } = string.Empty;
        public DateTime datepl { get; set; }
        public string typeart { get; set; } = string.Empty;
        public string pieceliee { get; set; } = string.Empty;
        public double nligne { get; set; }
        public double decimqte { get; set; }
        public double variante { get; set; }
        public double puhtv { get; set; }
        public double longueur { get; set; }
        public double largeur { get; set; }
        public double hauteur { get; set; }
        public double pudev { get; set; }
        public string codetrs { get; set; } = string.Empty;
        public string libtrs { get; set; } = string.Empty;
        public string coderep { get; set; } = string.Empty;
        public string librep { get; set; } = string.Empty;
        public string codereg { get; set; } = string.Empty;
        public string libreg { get; set; } = string.Empty;
        public string cchauff { get; set; } = string.Empty;
        public string lchauff { get; set; } = string.Empty;
        public string numfr { get; set; } = string.Empty;
        public string chantier { get; set; } = string.Empty;
        public string numaffaire { get; set; } = string.Empty;
        public string usera { get; set; } = string.Empty;
        public string gammeprix { get; set; } = string.Empty;
        public string gratuit { get; set; } = string.Empty;
        public string libgratuit { get; set; } = string.Empty;
        public double consom { get; set; }
        public string codesect { get; set; } = string.Empty;
        public string libsect { get; set; } = string.Empty;
        public string ccaisse { get; set; } = string.Empty;
        public string lcaisse { get; set; } = string.Empty;
        public string natcaisse { get; set; } = string.Empty;
        public double capcaisse { get; set; }
        public double oeuvresoc { get; set; }
        public double poids { get; set; }
        public double nbrpiece { get; set; }
        public string libarabe { get; set; } = string.Empty;
        public double remise2 { get; set; }
        [NotMapped]
        public string ville { get; set; } = string.Empty;
        [NotMapped]
        public string groupage { get; set; } = string.Empty;
    }
}