using System.ComponentModel.DataAnnotations;

namespace BackendApi.DTO
{
    public class ReportTypesRequest
    {
        [Required]
        public string DatabaseName { get; set; } = string.Empty;
    }
}





