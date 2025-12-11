using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models;

[Table("paramsouche")]
[PrimaryKey(nameof(nummvt), nameof(codeesp), nameof(code), nameof(jour))]
public class ParamSouche
{
    [Column("nummvt")]
    public string? nummvt { get; set; }

    [Column("codeesp")]
    public string? codeesp { get; set; }

    [Column("code")]
    public string? code { get; set; }

    [Column("jour")]
    public double jour { get; set; }

    public double semaine { get; set; }
    public DateTime? date { get; set; }
    public double effectif { get; set; }
    public double consalim { get; set; }
    public double consommation { get; set; }
    public double poidslot { get; set; }
    public double mortalite { get; set; }
    public double indconv { get; set; }
    public double indconvlot { get; set; }
    public double indprod { get; set; }
    public double conseau { get; set; }
    public double conseaulot { get; set; }
    public string? temperature { get; set; }
    public string? humidite { get; set; }
    public string? vaccinlot { get; set; }
    public string? adminprotoco { get; set; }
    public string? medlot { get; set; }
    public double gaz { get; set; }
    public double coupeaux { get; set; }
    public double alimrestant { get; set; }
    public double alimingere { get; set; }
    public double alimingerlot { get; set; }
    public double gmq { get; set; }
    public double qtevendu { get; set; }
    public double poidsvendu { get; set; }
    public double mtvente { get; set; }
    public string? acheteur { get; set; }
    public double prodof { get; set; }
    public double prodoflot { get; set; }
    public double oeufnorm { get; set; }
    public double oeufdj { get; set; }
    public double oeufcasse { get; set; }
    public double oeufrejet { get; set; }
    public double poidsof { get; set; }
    public double poidsoflot { get; set; }
    public double masof { get; set; }
    public double masoflot { get; set; }
    public double ofcumsuj { get; set; }
    public double ofcumsujlot { get; set; }
    public double masofcum { get; set; }
    public double masofcumlot { get; set; }
    public double viabilite { get; set; }
    public double viabilitelot { get; set; }
    public double homogenstd { get; set; }
    public double homogenlot { get; set; }
    public double grofstd { get; set; }
    public double groflot { get; set; }
    public double pontestd { get; set; }
    public double pontelot { get; set; }
    public double oacstd { get; set; }
    public double oaclot { get; set; }
    public double oacinclot { get; set; }
    public double tauxoacstd { get; set; }
    public double mtdepense { get; set; }
    public double mtproduction { get; set; }
    public double mtmort { get; set; }
    public double autrecharge { get; set; }
    public double coutrev { get; set; }
    public double cloturer { get; set; }
    public double alerte { get; set; }
    public double effajout { get; set; }
    public string? desccons { get; set; }

    public double qtetransfert { get; set; }
    public string? temperlot { get; set; }
    public string? humiditelot { get; set; }
    public string? intlumlot { get; set; }
    public string? eclairlot { get; set; }
    public double effretire { get; set; }
    public double mortmale { get; set; }
    public double effdepmale { get; set; }
    public double effmale { get; set; }
        [NotMapped]
    public string? centre { get; set; }
}