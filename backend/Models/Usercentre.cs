using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

public class Usercentre
{
    [Key]
    public string? codec { get; set; }
    public string? libellec { get; set; }
    public string? codeuser { get; set; }
    public string? libelle { get; set; }
    public string? accee { get; set; }
    
    
}
