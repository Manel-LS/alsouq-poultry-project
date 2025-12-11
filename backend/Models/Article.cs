using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

public class Article
{
    [Key]
    public string code { get; set; } = string.Empty;
    public string libelle { get; set; } = string.Empty;
    public string famille { get; set; } = string.Empty;
    public string libfam { get; set; } = string.Empty;
    public DateTime datecr { get; set; }
    public string unite { get; set; } = string.Empty;
    public double nbrunite { get; set; }
    public string typeart { get; set; } = string.Empty;
    public string nature { get; set; } = string.Empty;
    public double tauxtva { get; set; }
    public double fodec { get; set; }
    public double prixvht1 { get; set; }
    public double prixvttc1 { get; set; }
    public double remmax { get; set; }
    public double prixachini { get; set; }
    public double prixbrut { get; set; }
    public double remise { get; set; }
    public double prixnet { get; set; }
    public double marge { get; set; }
    public DateTime dateach { get; set; }
    public double pmp { get; set; }
    public double prixconsulte { get; set; }
    public double coutrev { get; set; }
    public string aconf { get; set; } = string.Empty;
    public string config { get; set; } = string.Empty;
    public string cnature { get; set; } = string.Empty;
    public string libnature { get; set; } = string.Empty;
    public string gestionlot { get; set; } = string.Empty;
    public string gestionserie { get; set; } = string.Empty;
    public string typesortie { get; set; } = string.Empty;
    public double alerteexp { get; set; }
    public string nomenclature { get; set; } = string.Empty;
    public string fichetech { get; set; } = string.Empty;
    public string typeprod { get; set; } = string.Empty;
    public double decimqte { get; set; }
    public string codefrs { get; set; } = string.Empty;
    public string libfrs { get; set; } = string.Empty;
    public string homologue { get; set; } = string.Empty;
    public string dimension { get; set; } = string.Empty;
    public string longueur { get; set; } = string.Empty;
    public string largeur { get; set; } = string.Empty;
    public string hauteur { get; set; } = string.Empty;
    public double pabrut { get; set; }
    public double remachat { get; set; }
    public double panet { get; set; }
    public double pattc { get; set; }
    public double margev { get; set; }
    public double margebrut { get; set; }
    public string artvrac { get; set; } = string.Empty;
    public string gtaillecoul { get; set; } = string.Empty;
    public string cgrille { get; set; } = string.Empty;
    public string lgrille { get; set; } = string.Empty;
    public string ctaille { get; set; } = string.Empty;
    public string ltaille { get; set; } = string.Empty;
    public string ccoul { get; set; } = string.Empty;
    public string lcoul { get; set; } = string.Empty;
    public string artpere { get; set; } = string.Empty;
    public double poids { get; set; }
    public double capacite { get; set; }
    public string image1 { get; set; } = string.Empty;
    public string image2 { get; set; } = string.Empty;
    public string image3 { get; set; } = string.Empty;
    public string fourchprix { get; set; } = string.Empty;
    public string typedep { get; set; } = string.Empty;
    public double margemin { get; set; }
    public string codebarre { get; set; } = string.Empty;
    public string cartinc { get; set; } = string.Empty;
    public string lartinc { get; set; } = string.Empty;
    public string facturable { get; set; } = string.Empty;
    public string cmarque { get; set; } = string.Empty;
    public string lmarque { get; set; } = string.Empty;
    public string czone { get; set; } = string.Empty;
    public string lzone { get; set; } = string.Empty;
    public double prixmin { get; set; }
    public double fodachat { get; set; }
    public double consachat { get; set; }
    public double dureevie { get; set; }
    public double consvente { get; set; }
    public double dureevente { get; set; }
    public double nbjalertev { get; set; }
    public string ristmens { get; set; } = string.Empty;
    public string ristann { get; set; } = string.Empty;
    public string remfact { get; set; } = string.Empty;
    public string mtvente { get; set; } = string.Empty;
    public string reffourn { get; set; } = string.Empty;
    public string desfourn { get; set; } = string.Empty;
    public string codedest { get; set; } = string.Empty;
    public string libdest { get; set; } = string.Empty;
    public string ctypetr { get; set; } = string.Empty;
    public string ltypetr { get; set; } = string.Empty;
    public string cartcolis { get; set; } = string.Empty;
    public string lartcolis { get; set; } = string.Empty;
    public double margepv { get; set; }
    public string prixnull { get; set; } = string.Empty;
    public double poidsbrut { get; set; }
    public double nbrpiece { get; set; }
    public string cetat { get; set; } = string.Empty;
    public string letat { get; set; } = string.Empty;
    public string ccond { get; set; } = string.Empty;
    public string lcond { get; set; } = string.Empty;
    public double oeuvresoc { get; set; }
    public string libarabe { get; set; } = string.Empty;
    public string avecremise { get; set; } = string.Empty;
    public string tactil { get; set; } = string.Empty;
    public double prixsoutr { get; set; }
    public string venteweb { get; set; } = string.Empty;
    public string cvol { get; set; } = string.Empty;
    public string lvol { get; set; } = string.Empty;
    public string cgamme1 { get; set; } = string.Empty;
    public string lgamme1 { get; set; } = string.Empty;
    public string cgamme2 { get; set; } = string.Empty;
    public string lgamme2 { get; set; } = string.Empty;
    public string cgamme3 { get; set; } = string.Empty;
    public string lgamme3 { get; set; } = string.Empty;
    public string cgamme4 { get; set; } = string.Empty;
    public string lgamme4 { get; set; } = string.Empty;
    public string cgamme5 { get; set; } = string.Empty;
    public string lgamme5 { get; set; } = string.Empty;
    public string libarabe2 { get; set; } = string.Empty;
    public string promotion { get; set; } = string.Empty;
    public string usera { get; set; } = string.Empty;
    public string userm { get; set; } = string.Empty;
    public DateTime datemaj { get; set; }
  //  public string numbat { get; set; } = string.Empty;
  //  public string libfrs { get; set; } = string.Empty;
}