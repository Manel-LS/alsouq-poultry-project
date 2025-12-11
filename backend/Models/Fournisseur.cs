using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models;

[Table("fournisseur")]
public class Fournisseur
{
    [Key]
    public string code { get; set; } = string.Empty;
    public string? libelle { get; set; }
    public string? adresse { get; set; }
    public string? tel1 { get; set; }
    public string? libarabe { get; set; } = string.Empty;
}


