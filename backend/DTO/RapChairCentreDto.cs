namespace BackendApi.DTO
{
    public class RapChairCentreDto
    {
        // Site (Centre)
        public string? NumCentre { get; set; }
        public string? LibCentre { get; set; }
        public string? AdrCentre { get; set; }
        
        // Miseplace
        public string? NumMvt { get; set; }
        
        // Souche
        public string? Souche { get; set; }
        
        // Jour/Semaine
        public double Jour { get; set; }
        public double Semaine { get; set; }
        
        // Mortalité
        public double MortaliteEffectif { get; set; }
        public double MortalitePourcentage { get; set; }
        public double MortalitePourcentageGuide { get; set; }
        
        // Poids
        public double PoidsLot { get; set; }
        public double PoidsGuide { get; set; }
        
        // Consommation
        public double ConsommationKgJour { get; set; }
        public double ConsommationKgPoule { get; set; }
        
        // Données supplémentaires pour calculs
        public double Effectif { get; set; }
        public double Consommation { get; set; }
    }
}








