using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System.Data;
using System.Text.RegularExpressions;

namespace BackendApi.Services;

// IReportService.cs
public interface IReportService
{
    byte[] GeneratePdfReport(string reportName);
}
 