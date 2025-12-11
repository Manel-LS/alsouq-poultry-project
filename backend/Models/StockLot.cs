    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
namespace BackendApi.Models
{

    [Table("stocklot")]
    public class StockLot

{

        [Key]
        public string? codedep { get; set; }
        public string? NumLot { get; set; }
        public string? CodeDep { get; set; }
        public string? codeart { get; set; }
        public string? famille { get; set; }
        public double qteart { get; set; }
        public double qteini { get; set; }
        
    }
}
