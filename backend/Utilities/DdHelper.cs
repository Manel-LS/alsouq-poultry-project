using System.Diagnostics;
using System.Text.Json;

namespace BackendApi.Utilities
{
    /// <summary>
    /// Classe utilitaire pour le débogage similaire à dd() de PHP/Laravel
    /// Permet d'afficher des valeurs et d'arrêter l'exécution
    /// </summary>
    public static class DdHelper
    {
        /// <summary>
        /// Affiche la valeur et arrête l'exécution (comme dd() en PHP)
        /// </summary>
        /// <param name="value">Valeur à afficher</param>
        /// <param name="label">Label optionnel pour identifier la sortie</param>
        public static void Dd(object? value, string? label = null)
        {
            var output = new System.Text.StringBuilder();
            output.AppendLine("═══════════════════════════════════════════════════════");
            
            if (!string.IsNullOrEmpty(label))
            {
                output.AppendLine($"📌 {label}:");
                output.AppendLine("───────────────────────────────────────────────────────");
            }
            
            if (value == null)
            {
                output.AppendLine("NULL");
            }
            else
            {
                try
                {
                    // Essayer de sérialiser en JSON pour un affichage lisible
                    var options = new JsonSerializerOptions
                    {
                        WriteIndented = true,
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                    };
                    var json = JsonSerializer.Serialize(value, value.GetType(), options);
                    output.AppendLine(json);
                }
                catch
                {
                    // Si la sérialisation échoue, utiliser ToString()
                    output.AppendLine(value.ToString());
                }
            }
            
            output.AppendLine("═══════════════════════════════════════════════════════");
            output.AppendLine($"📍 Type: {value?.GetType().FullName ?? "null"}");
            output.AppendLine($"📍 Emplacement: {new StackTrace(true).GetFrame(1)?.GetFileName()}:{new StackTrace(true).GetFrame(1)?.GetFileLineNumber()}");
            
            // Afficher dans la console
            Console.WriteLine(output.ToString());
            
            // Afficher dans la sortie de débogage
            Debug.WriteLine(output.ToString());
            
            // Arrêter l'exécution (comme dd() en PHP)
            // En mode Debug, cela ouvrira le débogueur
            // En mode Release, cela ne fait rien (comme commenté)
            Debugger.Break();
        }

        /// <summary>
        /// Affiche la valeur sans arrêter l'exécution (comme dump() en PHP)
        /// </summary>
        /// <param name="value">Valeur à afficher</param>
        /// <param name="label">Label optionnel</param>
        public static void Dump(object? value, string? label = null)
        {
            var output = new System.Text.StringBuilder();
            
            if (!string.IsNullOrEmpty(label))
            {
                output.AppendLine($"📌 {label}:");
            }
            
            if (value == null)
            {
                output.AppendLine("NULL");
            }
            else
            {
                try
                {
                    var options = new JsonSerializerOptions
                    {
                        WriteIndented = true,
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                    };
                    var json = JsonSerializer.Serialize(value, value.GetType(), options);
                    output.AppendLine(json);
                }
                catch
                {
                    output.AppendLine(value.ToString());
                }
            }
            
            output.AppendLine($"Type: {value?.GetType().FullName ?? "null"}");
            
            Console.WriteLine(output.ToString());
            Debug.WriteLine(output.ToString());
        }

        /// <summary>
        /// Affiche plusieurs valeurs à la fois
        /// </summary>
        public static void Dd(params object?[] values)
        {
            for (int i = 0; i < values.Length; i++)
            {
                Dd(values[i], $"Variable {i + 1}");
            }
        }
    }
}











