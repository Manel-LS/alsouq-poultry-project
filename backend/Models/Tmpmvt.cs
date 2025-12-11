using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models
{
    public class Tmpmvt
    {
        [Key]
         public string nummvt { get; set; } = string.Empty;
        public string codeuser { get; set; } = string.Empty;
        public string typemvt { get; set; } = string.Empty;
        public string codeart { get; set; } = string.Empty;
        public string codedep { get; set; } = string.Empty;
     //   public string numbe { get; set; } = string.Empty;
        public string famille { get; set; } = string.Empty;
        public string libdep { get; set; } = string.Empty;
   
        public double qteart { get; set; }
        public string desart { get; set; } = string.Empty;
        public double nligne { get; set; }
        
        public string ville { get; set; } = string.Empty;

        public double puttc { get; set; }
        public DateTime datemvt { get; set; }
        
    }
}
