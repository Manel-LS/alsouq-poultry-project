using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

public class Lbs
{
    [Key]
    public string? nummvt { get; set; }
    public string? codedep { get; set; }
    public string? codeart { get; set; }
    public DateTime datemvt { get; set; }
    public double qteart { get; set; }
    public double puttc { get; set; }
    public double nbrsujet { get; set; }
    
}
