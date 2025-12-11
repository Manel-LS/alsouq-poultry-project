using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

public class Miseplace
{
    [Key]
    public string nummvt { get; set; } = string.Empty;
    public DateTime datemvt { get; set; }
    public DateTime dateeclo { get; set; }
    public string? codefact { get; set; } = string.Empty;
    public string? generer { get; set; } = string.Empty;
    public string? cloturefin { get; set; } = string.Empty;
    public string? codeesp { get; set; } = string.Empty;
    public string? libesp { get; set; } = string.Empty;
    public string? souche { get; set; } = string.Empty;
    public double nbrjour { get; set; }
    public double jourdeb { get; set; }
    public string? codetrs { get; set; } = string.Empty;
    public string? libtrs { get; set; } = string.Empty;
    public string? numcentre { get; set; } = string.Empty;
    public string? libcentre { get; set; } = string.Empty;
    public string? adrcentre { get; set; } = string.Empty;
    public string? numbat { get; set; } = string.Empty;
    public string? libbat { get; set; } = string.Empty;
    public double effectif { get; set; }
    public string? codefrs { get; set; } = string.Empty;
    public string? libfrs { get; set; } = string.Empty;
    public double puttc { get; set; }
    public string? souchemue { get; set; } = string.Empty;
    public DateTime datedebmue { get; set; }
    public double nbrjourmue { get; set; }
    public DateTime datefinmue { get; set; }
    public double totalvente { get; set; }
    public double totalregl { get; set; }
    public string? codesout { get; set; } = string.Empty;
    public string? libsout { get; set; } = string.Empty;
    public string? numrot { get; set; } = string.Empty;
    public double effmale { get; set; }
    public string? groupage { get; set; } = string.Empty;
    public string? usera { get; set; } = string.Empty;
    public string? userm { get; set; } = string.Empty;
    public string? users { get; set; } = string.Empty;
    public DateTime datemaj { get; set; }
    public string? libesparabe { get; set; } = string.Empty;
    public string? libcentarabe { get; set; } = string.Empty;
    public string? libbatarabe { get; set; } = string.Empty;
}