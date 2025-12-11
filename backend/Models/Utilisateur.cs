namespace BackendApi.Models;

public class Utilisateur
{
    public string? code { get; set; }
    public string? login { get; set; }
    public string? libelle { get; set; }
    public bool actif { get; set; }
    public string? motpasse { get; set; }
}
