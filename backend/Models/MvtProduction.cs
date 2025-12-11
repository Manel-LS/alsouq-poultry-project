using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

public class MvtProduction
{
    [Key]
    public string?  code { get; set; }
    public string? famille { get; set; }
    public string? numlot { get; set; }
    public DateTime dateprod { get; set; }
    public string? codeart { get; set; }
    public string? codedep { get; set; }
    public double qteart { get; set; }
    
}
