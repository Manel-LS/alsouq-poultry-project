using System.ComponentModel.DataAnnotations;

namespace BackendApi.DTO
{
    public class RapChairCentreRequest
    {
        [Required]
        public DateTime? DateDebut { get; set; }
        
        [Required]
        public DateTime? DateFin { get; set; }
        
        public string? Societe { get; set; }
        
        public string? CodeUser { get; set; }
        
        public string? Database { get; set; }
    }
}

