// Models/Espece.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models
{
    [Table("espece")]
    public class Espece
    {
        [Key]
        public string? code { get; set; } = string.Empty;
        public string? libelle { get; set; } = string.Empty;
        public DateTime datecr { get; set; }
        public double nbjelv { get; set; }
        public double tauxrend { get; set; }
        public string? typeespece { get; set; } = string.Empty;
        public string? phase2 { get; set; } = "0";
        public string? genphase2 { get; set; } = string.Empty;
        public string? codeart { get; set; } = string.Empty;
        public string? desart { get; set; } = string.Empty;
        public string? codeart1 { get; set; } = string.Empty;
        public string? desart1 { get; set; } = string.Empty;
        public string? cartpous { get; set; } = string.Empty;
        public string? lartpous { get; set; } = string.Empty;
        public string? uniformite { get; set; } = string.Empty;
        public double perteth { get; set; }
        public string? usera { get; set; } = string.Empty;
        public string? userm { get; set; } = string.Empty;
        public DateTime datemaj { get; set; }
        public string? libarabe { get; set; } = string.Empty;
    }
}