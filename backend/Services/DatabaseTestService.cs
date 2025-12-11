using System.Data;
using Dapper;
using MySql.Data.MySqlClient;

namespace BackendApi.Services;

public interface IDatabaseTestService
{
    Task<bool> TestConnectionAsync(string connectionString);
    Task<bool> TableExistsAsync(string connectionString, string tableName);
    Task<IEnumerable<string>> GetDatabasesAsync();
    Task<IEnumerable<string>> GetTablesAsync(string connectionString);
}

public class DatabaseTestService : IDatabaseTestService
{
    public async Task<bool> TestConnectionAsync(string connectionString)
    {
        try
        {
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();
            return connection.State == ConnectionState.Open;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> TableExistsAsync(string connectionString, string tableName)
    {
        try
        {
            using var connection = new MySqlConnection(connectionString);
            var query = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = @tableName";
            var count = await connection.QueryFirstOrDefaultAsync<int>(query, new { tableName });
            return count > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<IEnumerable<string>> GetDatabasesAsync()
    {
        try
        {
            using var connection = new MySqlConnection("Server=localhost;Uid=root;Pwd=;SslMode=None;");
            await connection.OpenAsync();
            var databases = await connection.QueryAsync<string>("SHOW DATABASES");
            return databases.Where(db => !db.StartsWith("information_schema") && !db.StartsWith("mysql") && !db.StartsWith("performance_schema") && !db.StartsWith("sys"));
        }
        catch
        {
            return Enumerable.Empty<string>();
        }
    }

    public async Task<IEnumerable<string>> GetTablesAsync(string connectionString)
    {
        try
        {
            using var connection = new MySqlConnection(connectionString);
            await connection.OpenAsync();
            var tables = await connection.QueryAsync<string>("SHOW TABLES");
            return tables;
        }
        catch
        {
            return Enumerable.Empty<string>();
        }
    }
}

