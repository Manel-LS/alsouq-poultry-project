using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models
{
    public class Ebe
    {
        [Key]
        public string nummvt { get; set; } = string.Empty;
        public DateTime datemvt { get; set; }
        public string heure { get; set; } = string.Empty;
        public string codefact { get; set; } = string.Empty;
        public string codetrs { get; set; } = string.Empty;
        public string libtrs { get; set; } = string.Empty;
        public string libarabe { get; set; } = string.Empty;
        public string numblfrs { get; set; } = string.Empty;
        public DateTime dateblfrs { get; set; }
        public string numfact { get; set; } = string.Empty;
        public string pieceliee { get; set; } = string.Empty;
        public string numfactfrs { get; set; } = string.Empty;
        public string coderep { get; set; } = string.Empty;
        public string librep { get; set; } = string.Empty;
        public string codechauff { get; set; } = string.Empty;
        public string libchauff { get; set; } = string.Empty;
        public string codevh { get; set; } = string.Empty;
        public string libvh { get; set; } = string.Empty;
        public double base1 { get; set; }
        public double base2 { get; set; }
        public double base3 { get; set; }
        public double base4 { get; set; }
        public double base5 { get; set; }
        public double majo { get; set; }
        public double majo1 { get; set; }
        public double majo2 { get; set; }
        public double majo3 { get; set; }
        public double majo4 { get; set; }
        public double majo5 { get; set; }
        public double tva1 { get; set; }
        public double tva2 { get; set; }
        public double tva3 { get; set; }
        public double tva4 { get; set; }
        public double tva5 { get; set; }
        public double mht { get; set; }
        public double mremise { get; set; }
        public double mnht { get; set; }
        public double bfodec { get; set; }
        public double mfodec { get; set; }
        public double mtva { get; set; }
        public double mttc { get; set; }
        public string codepv { get; set; } = string.Empty;
        public string libpv { get; set; } = string.Empty;
        public string enmodif { get; set; } = string.Empty;
        public string temps { get; set; } = string.Empty;
        public string usera { get; set; } = string.Empty;
        public string numaffaire { get; set; } = string.Empty;
        public string devise { get; set; } = string.Empty;
        public double cours { get; set; }
        public string refaffaire { get; set; } = string.Empty;
        public string descaffaire { get; set; } = string.Empty;
        public double mtbdev { get; set; }
        public double mtrdev { get; set; }
        public double mtndev { get; set; }
        public string userm { get; set; } = string.Empty;
        public string users { get; set; } = string.Empty;
        public DateTime datemaj { get; set; }
        public double decimqte { get; set; }
        public string numtrs { get; set; } = string.Empty;
        public string transferer { get; set; } = string.Empty;
        public string soctrs { get; set; } = string.Empty;
        public double mtrapp { get; set; }
        public string pieceorg { get; set; } = string.Empty;
        public double mtnassujetti { get; set; }
        public double bavance { get; set; }
        public double mavance { get; set; }
        public double tavance { get; set; }
        public double bconsom { get; set; }
        public double mconsom { get; set; }
        public double tvadue { get; set; }
        public double mfodecdue { get; set; }
        public string numbc { get; set; } = string.Empty;
        public DateTime datebc { get; set; }
        public string exonorer { get; set; } = string.Empty;
        public double mtfrais { get; set; }
        public double movsoc { get; set; }
    }
}

