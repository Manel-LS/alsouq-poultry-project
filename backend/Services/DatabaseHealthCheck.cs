using Microsoft.Extensions.Diagnostics.HealthChecks;
using BackendApi.Models;

namespace BackendApi.Services;

public class DatabaseHealthCheck : IHealthCheck
{
    private readonly AppDbContext _context;

    public DatabaseHealthCheck(AppDbContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy("Database is available")
                : HealthCheckResult.Unhealthy("Database is unavailable");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy($"Database check failed: {ex.Message}", ex);
        }
    }
}

