import React from 'react';

const ReportExport = () => {
  const handleExport = async () => {
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const res = await fetch('/api/reports/export-com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ file: 'Sales.rpt' })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}. Please check console for more details. Possible issues: \n500 “COM not enabled”: activate com_dotnet, restart Apache.\n500 “Crystal COM not available”: verify Crystal Runtime is installed and architecture matches PHP.\n404 “Report not found”: verify public\\reports\\<file>.rpt exists.\nDB Connection: correct credentials/DSN, network rights, possibly run Apache with a COM/ODBC-accessible account.`);
    }
  };

  return (
    <div>
      <h2>Report Export</h2>
      <button onClick={handleExport}>Export Sales Report</button>
    </div>
  );
};

export default ReportExport;
