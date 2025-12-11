using System;
using System.Linq;
using System.Threading.Tasks;
using BackendApi.DTO;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Services
{
    public class LotService
    {
        private readonly AppDbContext _context;
        private readonly double _capaciteAlv;

        public LotService(AppDbContext context, double capaciteAlv)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _capaciteAlv = capaciteAlv;
        }

        //public async Task<JourEnCoursDto?> GetJourEnCoursAsync(string numLot, string nomBaseStockSession, string numCentre)
        //{
        //    if (string.IsNullOrEmpty(numLot))
        //        throw new ArgumentException("numLot ne peut pas être vide", nameof(numLot));

        //    if (string.IsNullOrEmpty(nomBaseStockSession))
        //        throw new ArgumentException("nomBaseStockSession ne peut pas être vide", nameof(nomBaseStockSession));

        //    if (string.IsNullOrEmpty(numCentre))
        //        throw new ArgumentException("numCentre ne peut pas être vide", nameof(numCentre));

        //    // 1️⃣ Récupérer les paramètres depuis la table Paramaitre de la base socerp
        //    var paramInfo = await _context.Paramaitre
        //        .FromSqlRaw("SELECT * FROM socerp.Paramaitre WHERE Code = {0}", nomBaseStockSession)
        //        .AsNoTracking()
        //        .FirstOrDefaultAsync();

        //    if (paramInfo == null)
        //        throw new InvalidOperationException("Paramètres de la souche non trouvés !");

        //    // Extraire les infos
        //    var tsouche = paramInfo.Souche;
        //    var teffectif = paramInfo.Effectif;
        //    //var tcodeesp = paramInfo.CodeEsp;
        //    var tadresse = paramInfo.Adresse;

        //    // 2️⃣ Récupérer l'espèce
        //    //var espece = await _context.Especies
        //    //    .Where(e => e.CodeArt == tcodeesp)
        //    //    .AsNoTracking()
        //    //    .FirstOrDefaultAsync();

        //    // 3️⃣ Récupérer le dépôt associé en utilisant numCentre reçu
        //    var depot = await _context.Depots
        //        .Where(d => d.numcentre == numCentre)
        //        .AsNoTracking()
        //        .FirstOrDefaultAsync();

        //    double stockOeuf = 0;

        //    if (depot != null)
        //    {
        //        stockOeuf = await _context.StockLots
        //            .Where(s => s.NumLot == numLot && s.CodeDep == depot.Code && s.CodeArt.StartsWith("006"))
        //            .SumAsync(s => ( double)s.QteArt) ?? 0;
        //    }

        //    // 4️⃣ Calculer l'effectif total (sorties)
        //    double effSortie = 0; // tu peux ajouter la logique exacte selon tes règles
        //    double effectifFinal = teffectif - effSortie;

        //    // 5️⃣ Construire le DTO
        //    var result = new JourEnCoursDto
        //    {
        //        NumMvt = numLot,
        //        DateMvt = paramInfo.Date,
        //        Jour = paramInfo.Jour,
        //        Semaine = paramInfo.Semaine,
        //        Mortalite = paramInfo.Mortalite,
        //        MortMale = paramInfo.MortMale,
        //        Effectif = effectifFinal,
        //        StockOeuf = stockOeuf,
        //        StockPlat = _capaciteAlv > 0 ? stockOeuf / _capaciteAlv : 0,
        //        //TypeEspece = espece?.TypeEspece,
        //        //Phase2 = espece?.Phase2 == "1",
        //        Souche = tsouche,
        //        Adresse = tadresse,
        //        NumCentre = numCentre,
        //        LibCentre = depot?.Libelle
        //    };

        //    return result;
        //}
    //    public async Task<JourEnCoursDto?> GetJourEnCoursAsync(string numLot, string numCentre)
    //    {
    //        if (string.IsNullOrEmpty(numLot))
    //            throw new ArgumentException("numLot ne peut pas être vide", nameof(numLot));

    //        if (string.IsNullOrEmpty(numCentre))
    //            throw new ArgumentException("numCentre ne peut pas être vide", nameof(numCentre));

    //        // 🔹 1️⃣ Lecture des paramètres de la souche (équivalent à paramsouche VB6)
    //        var paramSouche = await _context.ParamSouche
    //            .Where(p => p.Nummvt == numLot)
    //            .OrderBy(p => p.Jour)
    //            .FirstOrDefaultAsync();

    //        if (paramSouche == null)
    //            throw new InvalidOperationException("Paramètres de souche non encore affectés !");

    //        // 🔹 2️⃣ Gestion du dépôt selon le centre (table depot)
    //        var depot = await _context.Depots
    //            .Where(d => d.numcentre == numCentre)
    //            .AsNoTracking()
    //            .FirstOrDefaultAsync();

    //        if (depot == null)
    //            throw new InvalidOperationException("Aucun dépôt de stock n'est affecté à ce bâtiment !");

    //        string codeDepBat = depot.Code;
    //        string libDepBat = depot.Libelle;

    //        // 🔹 3️⃣ Récupération des infos principales
    //        string tsouche = paramSouche.Souche ?? "";
    //        double teffectif = paramSouche.Effectif ?? 0;
    //        string tadresse = paramSouche.Adresse ?? "";
    //        string tcodeesp = paramSouche.Codeesp ?? "";

    //        // 🔹 4️⃣ Charger les infos espèce (optionnel si table Esp existe)
    //        var espece = await _context.Espece
    //            .AsNoTracking()
    //            .FirstOrDefaultAsync(e => e.CodeArt == tcodeesp);

    //        string typeEspece = espece?.TypeEspece ?? "";
    //        bool phase2 = espece?.Phase2 == "1";

    //        // 🔹 5️⃣ Déterminer le dernier jour non clôturé
    //        var dernierJour = await _context.ParamSouche
    //            .Where(p => p.NumMvt == numLot && p.Cloturer == false)
    //            .OrderBy(p => p.Jour)
    //            .FirstOrDefaultAsync()
    //            ?? await _context.ParamSouche
    //            .Where(p => p.NumMvt == numLot)
    //            .OrderByDescending(p => p.Jour)
    //            .FirstOrDefaultAsync();

    //        if (dernierJour == null)
    //            throw new InvalidOperationException("Aucun jour trouvé pour ce lot.");

    //        // 🔹 6️⃣ Calcul de l’effectif total
    //        var mouvements = await _context.ParamSouche
    //            .Where(p => p.NumMvt == numLot && p.Jour < dernierJour.Jour)
    //            .Select(p => new
    //            {
    //                p.Mortalite,
    //                p.QteVendu,
    //                p.QteTransfert,
    //                p.Effajout,
    //                p.Effretire
    //            })
    //            .ToListAsync();

    //        double effSortie = mouvements.Sum(m =>
    //            (m.Mortalite ?? 0) +
    //            (m.QteVendu ?? 0) +
    //            (m.QteTransfert ?? 0) -
    //            (m.Effajout ?? 0) +
    //            (m.Effretire ?? 0)
    //        );

    //        double effectifFinal = teffectif - effSortie;

    //        // 🔹 7️⃣ Calcul du stock d’œufs (équivalent StockOeufLot)
    //        double stockOeuf = await _context.StockLots
    //            .Where(s => s.NumLot == numLot &&
    //                        s.CodeDep == codeDepBat &&
    //                        _context.Articles
    //                            .Where(a => a.CNature == "006")
    //                            .Select(a => a.Code)
    //                            .Contains(s.CodeArt))
    //            .SumAsync(s => ( double)s.QteArt) ?? 0;

    //        double capaciteAlv = (await _context.Parametres.FirstOrDefaultAsync())?.CapaciteAlv ?? 0;
    //        double stockPlat = capaciteAlv > 0 ? stockOeuf / capaciteAlv : 0;

    //        // 🔹 8️⃣ Construction du résultat
    //        var result = new JourEnCoursDto
    //        {
    //            NumMvt = numLot,
    //            DateMvt = dernierJour.Date,
    //            Jour = dernierJour.Jour,
    //            Semaine = dernierJour.Semaine,
    //            Mortalite = dernierJour.Mortalite ?? 0,
    //            MortMale = dernierJour.MortMale ?? 0,
    //            Effectif = effectifFinal,
    //            StockOeuf = stockOeuf,
    //            StockPlat = stockPlat,
    //            Souche = tsouche,
    //            Adresse = tadresse,
    //            NumCentre = numCentre,
    //            LibCentre = libDepBat,
    //            TypeEspece = typeEspece,
    //            Phase2 = phase2
    //        };

    //        return result;
    //    }

    //    public async Task1<JourEnCoursDto?> GetJourEnCoursAsync(string numLot, string numCentre, string numBatiment,
    //string libCentre, string libBatiment, string souche, double effectif, string adresse,
    //string codeEspece, string nomEspece, string tcc, string trs, string nomBaseStockSession)
    //    {
    //        if (string.IsNullOrEmpty(numLot))
    //            throw new ArgumentException("numLot ne peut pas être vide", nameof(numLot));

    //        if (string.IsNullOrEmpty(numCentre))
    //            throw new ArgumentException("numCentre ne peut pas être vide", nameof(numCentre));

    //        // 1️⃣ Vérifier si les paramètres souche existent
    //        var paramSouche = await _context.ParamSouche
    //            .Where(p => p.NumMvt == numLot)
    //            .AsNoTracking()
    //            .FirstOrDefaultAsync();

    //        if (paramSouche == null)
    //            throw new InvalidOperationException("Paramètres souche non encore affecté !");

    //        // 2️⃣ Récupérer les paramètres système
    //        var para = await _context.Paramaitre
    //            .FromSqlRaw("SELECT * FROM socerp.Paramaitre WHERE Code = {0}", nomBaseStockSession)
    //            .AsNoTracking()
    //            .FirstOrDefaultAsync();

    //        if (para == null)
    //            throw new InvalidOperationException("Paramètres système non trouvés !");

    //        // 3️⃣ Gestion du dépôt selon la logique VB6
    //        string codeDepBat = string.Empty;
    //        string libDepBat = string.Empty;

    //        if (para.gestionavicole == "1")
    //        {
    //            var depotQuery = _context.Depots.AsQueryable();

    //            if (para.StkCentre == "1")
    //            {
    //                depotQuery = depotQuery.Where(d => d.numcentre == numCentre);
    //            }
    //            else
    //            {
    //                depotQuery = depotQuery.Where(d => d.numcentre == numCentre && d.numbat == numBatiment);
    //            }

    //            var depot = await depotQuery
    //                .AsNoTracking()
    //                .FirstOrDefaultAsync();

    //            if (depot == null)
    //                throw new InvalidOperationException("Aucun dépôt de stock n'est affecté à ce bâtiment !");

    //            codeDepBat = depot.Code;
    //            libDepBat = depot.Libelle;
    //        }

    //        // 4️⃣ Récupérer l'espèce
    //        var espece = await _context.Especies
    //            .Where(e => e.CodeArt == codeEspece)
    //            .AsNoTracking()
    //            .FirstOrDefaultAsync();

    //        if (espece == null)
    //            throw new InvalidOperationException("Espèce non trouvée !");

    //        // 5️⃣ Appeler les deux fonctions similaires à VB6
    //        // Correspond à: DernJourClot 0
    //        var donneesJour = await DernJourClotAsync(numLot, 0, espece, codeDepBat, para);

    //        // Correspond à: StockOeufLot (appelé conditionnellement dans VB6)
    //        var stockOeuf = await StockOeufLotAsync(numLot, codeDepBat, para);

    //        // 6️⃣ Construire le DTO avec toutes les données
    //        var result = new JourEnCoursDto
    //        {
    //            NumMvt = numLot,
    //            DateMvt = donneesJour.Date,
    //            Jour = donneesJour.Jour,
    //            Semaine = donneesJour.Semaine,
    //            Mortalite = donneesJour.Mortalite,
    //            MortMale = donneesJour.MortMale,
    //            Effectif = donneesJour.EffectifFinal,
    //            StockOeuf = stockOeuf.StockOeuf,
    //            StockPlat = stockOeuf.StockPlat,
    //            TypeEspece = espece.TypeEspece,
    //            Phase2 = espece.Phase2 == "1",
    //            Souche = souche,
    //            Adresse = adresse,
    //            NumCentre = numCentre,
    //            LibCentre = libDepBat,
    //            NumBatiment = numBatiment,
    //            LibBatiment = libBatiment,
    //            CodeEspece = codeEspece,
    //            NomEspece = nomEspece,
    //            TCC = tcc,
    //            TRS = trs,
    //            QteVendue = donneesJour.QteVendue,
    //            PoidsVendu = donneesJour.PoidsVendu,
    //            MontantVente = donneesJour.MontantVente,
    //            EffAjout = donneesJour.EffAjout,
    //            EffRetire = donneesJour.EffRetire
    //        };

    //        return result;
    //    }

    //    // Fonction équivalente à DernJourClot
    //    private async Task<DonneesJourDto> DernJourClotAsync(string numLot, int mode, Espece espece, string codeDepBat, Paramaitre para)
    //    {
    //        var result = new DonneesJourDto();

    //        // Logique simplifiée de DernJourClot
    //        var paramSouche = await _context.ParamSouche
    //            .Where(p => p.NumMvt == numLot)
    //            .OrderBy(p => p.Jour)
    //            .FirstOrDefaultAsync();

    //        if (paramSouche != null)
    //        {
    //            result.Date = paramSouche.Date;
    //            result.Jour = paramSouche.Jour;
    //            result.Semaine = paramSouche.Semaine;
    //            result.Mortalite = paramSouche.Mortalite;
    //            result.MortMale = paramSouche.MortMale;
    //            result.EffAjout = paramSouche.EffAjout;
    //            result.EffRetire = paramSouche.EffRetire;
    //        }

    //        // Calcul de l'effectif (logique simplifiée)
    //        var historique = await _context.ParamSouche
    //            .Where(p => p.NumMvt == numLot && p.Jour < result.Jour)
    //            .ToListAsync();

    //        double effSortie = 0;
    //        foreach (var hist in historique)
    //        {
    //            effSortie += (hist.Mortalite + hist.QteVendu + hist.QteTransfert - hist.EffAjout + hist.EffRetire);
    //        }

    //        result.EffectifFinal = result.Effectif - effSortie;

    //        // Calcul des ventes (logique simplifiée)
    //        result.QteVendue = await CalculerVentesAsync(numLot, result.Date, espece);

    //        return result;
    //    }

    //    // Fonction équivalente à StockOeufLot
    //    private async Task<StockOeufDto> StockOeufLotAsync(string numLot, string codeDepBat, Paramaitre para)
    //    {
    //        var result = new StockOeufDto();

    //        if (!string.IsNullOrEmpty(codeDepBat))
    //        {
    //            result.StockOeuf = await _context.StockLots
    //                .Where(s => s.NumLot == numLot &&
    //                           s.CodeDep == codeDepBat &&
    //                           _context.Articles.Any(a => a.Code == s.CodeArt && a.CNature == "006"))
    //                .SumAsync(s => ( double)s.QteArt) ?? 0;

    //            result.StockPlat = para.CapaciteAlv > 0 ? Math.Floor(result.StockOeuf / para.CapaciteAlv) : 0;
    //        }

    //        return result;
    //    }

    //    // Méthode utilitaire pour calculer les ventes
    //    private async Task<double> CalculerVentesAsync(string numLot, DateTime date, Espece espece)
    //    {
    //        double totalVentes = 0;

    //        // Ventes de lbl
    //        totalVentes += await _context.Lbl
    //            .Where(v => v.NumLot == numLot && v.DateMvt == date)
    //            .SumAsync(v => ( double)v.QteArt) ?? 0;

    //        // Ventes de lfc
    //        totalVentes += await _context.Lfc
    //            .Where(v => v.NumLot == numLot && v.DateMvt == date)
    //            .SumAsync(v => ( double)v.QteArt) ?? 0;

    //        // Ventes de lbs
    //        totalVentes += await _context.Lbs
    //            .Where(v => v.NumLot == numLot && v.DateMvt == date)
    //            .SumAsync(v => ( double)v.QteArt) ?? 0;

    //        return totalVentes;
    //    }

    //    // DTOs supplémentaires
    //    public class DonneesJourDto
    //    {
    //        public DateTime Date { get; set; }
    //        public int Jour { get; set; }
    //        public int Semaine { get; set; }
    //        public double Mortalite { get; set; }
    //        public double MortMale { get; set; }
    //        public double EffectifFinal { get; set; }
    //        public double EffAjout { get; set; }
    //        public double EffRetire { get; set; }
    //        public double QteVendue { get; set; }
    //        public double PoidsVendu { get; set; }
    //        public double MontantVente { get; set; }
    //    }

    //    public class StockOeufDto
    //    {
    //        public double StockOeuf { get; set; }
    //        public double StockPlat { get; set; }
    //    }
    }
}
