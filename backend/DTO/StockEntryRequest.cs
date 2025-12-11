using System.ComponentModel.DataAnnotations;

namespace BackendApi.DTO
{
    public class StockEntryRequest
    {
        [Required(ErrorMessage = "Le champ nummvt est requis.")]
        public string nummvt { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ codeDep est requis.")]
        public string codeDep { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ numcentre est requis.")]
        public string numcentre { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ numbat est requis.")]
        public string numbat { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ codeFournisseur est requis.")]
        public string codeFournisseur { get; set; } = string.Empty;

        public string? libtrs { get; set; }

        public string? libtrsarabe { get; set; }

        [Required(ErrorMessage = "Le champ codeuser est requis.")]
        public string codeuser { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ nomBaseStockSession est requis.")]
        public string nomBaseStockSession { get; set; } = string.Empty;

        public string? numLot { get; set; }

        [Required(ErrorMessage = "Le panierArticles doit contenir au moins un article.")]
        [MinLength(1, ErrorMessage = "Le panierArticles doit contenir au moins un article.")]
        public List<PanierArticleDto> panierArticles { get; set; } = new List<PanierArticleDto>();
    }

    public class PanierArticleDto
    {
        [Required(ErrorMessage = "Le champ pniaer est requis.")]
        public int pniaer { get; set; }

        [Required(ErrorMessage = "Le champ codeart est requis.")]
        public string codeart { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ desart est requis.")]
        public string desart { get; set; } = string.Empty;

        public string? libarabe { get; set; }

        [Required(ErrorMessage = "Le champ qteart est requis.")]
        [Range(0, double.MaxValue, ErrorMessage = "La quantité doit être supérieure ou égale à 0.")]
        public double qteart { get; set; }

        [Required(ErrorMessage = "Le champ unite est requis.")]
        public string unite { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ famille est requis.")]
        public string famille { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ libfam est requis.")]
        public string libfam { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ codetrs est requis.")]
        public string codetrs { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ libtrs est requis.")]
        public string libtrs { get; set; } = string.Empty;

        public string? libtrsarabe { get; set; }

        [Required(ErrorMessage = "Le champ codedep est requis.")]
        public string codedep { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ libdep est requis.")]
        public string libdep { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ codeusr est requis.")]
        public string codeusr { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ libusr est requis.")]
        public string libusr { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le champ datemaj est requis.")]
        public DateTime datemaj { get; set; }
    }
}



