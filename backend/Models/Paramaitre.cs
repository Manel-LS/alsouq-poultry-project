using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models
{
    [Table("Paramaitre")]
    public class Paramaitre
    {
        [Key]
        public string code { get; set; }
        public string? Libelle { get; set; }
        public string? Adresse { get; set; }
        public string? Ville { get; set; }
        public string? Activite1 { get; set; }
        public string? CodeTva { get; set; }
        public string? Registrec { get; set; }
        public string? Rib { get; set; }
        public string? Tel { get; set; }
        public string? Fax { get; set; }
        public string? Gsm { get; set; }
        public string? Mail { get; set; }
        public string? Site { get; set; }
        public string? QteNegative { get; set; }
        public string? Accedesi { get; set; }
        public string? Accfamille { get; set; }
        public string? Alertestock { get; set; }

        public  double TauxFodec { get; set; }
        public  double TauxAvance { get; set; }
        public  double TauxMajo { get; set; }
        public  double Timbref { get; set; }
        public  double Tvadef { get; set; }
        public string? PrixConsom { get; set; }
        

        public string? TypePapier { get; set; }
        public string? ImprimerSur { get; set; }
        public string? MargePv { get; set; }
        public string? AffPrixAch { get; set; }
        public string? GestionProjet { get; set; }
        public string? ArtProjet { get; set; }

        public string? gestionavicole { get; set; }
        public string? Chair { get; set; }
        public string? Ponte { get; set; }
        public string? Repro { get; set; }
        public string? Lapin { get; set; }
        public string? GestionCouvoir { get; set; }

        public  double Incubation { get; set; }
        public  double Mirage { get; set; }
        public string? TypeMirage { get; set; }
        public string? TrsEcloAuto { get; set; }
        public string? TypeIncub { get; set; }
        public  double Eclosoir { get; set; }
        public  double Perteth { get; set; }
        public  double capacitealv { get; set; }
        //public  double TauxMajoAlv { get; set; }

        public string? GestionLot { get; set; }
        public string? CleFamArt { get; set; }
        public string? NbrUnite { get; set; }
        public string? MarqueArt { get; set; }
        public string? Equivalence { get; set; }

        public  double DecimPrix { get; set; }
        public  double DecimQte { get; set; }
        public string? FraisBe { get; set; }
        public string? Nomenclature { get; set; }
        public string? FicheTech { get; set; }

        // ... continue pour tous les autres champs list�s

        public string? stkcentre { get; set; }
        public string? UserMvt { get; set; }
        public string? UniteAlim { get; set; }
        public string? GroupageLot { get; set; }
        public string? ContPrevProd { get; set; }

     }
}
