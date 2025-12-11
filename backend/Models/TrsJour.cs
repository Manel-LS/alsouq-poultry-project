using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

public class TrsJour
{
    [Key]
    public string?  code { get; set; }
    public string? famille { get; set; }
    public string? numlot { get; set; }
    public DateTime dateprod { get; set; }
    public string? codeart { get; set; }
    public string?  libellebat { get; set; }
    public double qteart { get; set; }
    
}
