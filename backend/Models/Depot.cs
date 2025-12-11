using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

public class Depot
{
    [Key]  
    public string? Code { get; set; }
    public string? Libelle { get; set; }
    public string? numcentre { get; set; }
    public string? numbat { get; set; } 

}

