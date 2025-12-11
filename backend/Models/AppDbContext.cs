using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // Tables existantes
        public DbSet<Espece> Espece { get; set; }
        public DbSet<StockLot> StockLots { get; set; }
        public DbSet<MvtProduction> MvtProduction { get; set; }
        public DbSet<TrsJour> TrsJour { get; set; }
        public DbSet<StockDepot> StockDepot { get; set; }
        



        // ⚠️ Ajouter la table Paramaitre même si elle est dans une autre base
        public DbSet<Paramaitre> Paramaitre { get; set; }
        public DbSet<ParamSouche> ParamSouche { get; set; }
        public DbSet<Article> Article { get; set; }
        public DbSet<Lmvt> Lmvt { get; set; }
        public DbSet<Emvt> Emvt { get; set; }
        public DbSet<Ebe> Ebe { get; set; }
        public DbSet<Lbe> Lbe { get; set; }
        public DbSet<Tmpmvt> Tmpmvt { get; set; }
        
        public DbSet<Miseplace> Miseplace { get; set; }
        public DbSet<Lbs> Lbs { get; set; }
        public DbSet<Lfc> Lfc { get; set; }
        public DbSet<Lbl> Lbl { get; set; }
        public DbSet<Depot> Depot { get; set; }
        public DbSet<Usercentre> Usercentre { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Mapper la table Paramaitre dans la base socerp
            modelBuilder.Entity<Paramaitre>()
                .ToTable("Paramaitre", schema: null); // ou schema: "socerp" si nécessaire

            // Clé composite pour Lmvt : une ligne est identifiée par (nummvt, nligne)
            modelBuilder.Entity<Lmvt>()
                .HasKey(l => new { l.nummvt, l.nligne });

            // Clé composite pour Lbe : une ligne est identifiée par (nummvt, nligne)
            modelBuilder.Entity<Lbe>()
                .HasKey(l => new { l.nummvt, l.nligne });
        }
    }
}
