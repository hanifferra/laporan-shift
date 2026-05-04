import Papa from 'papaparse';

export interface SheetData {
  headers: string[];
  rows: Record<string, any>[];
}

export async function fetchSheetData(url: string): Promise<SheetData> {
  // Convert normal Google Sheet URL to CSV export URL
  // Example: https://docs.google.com/spreadsheets/d/1Xy.../edit#gid=0 
  // To: https://docs.google.com/spreadsheets/d/1Xy.../export?format=csv
  
  let exportUrl = url;
  if (url.includes('docs.google.com/spreadsheets/d/')) {
    const match = url.match(/\/d\/([^/]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      // Handle specific sheet gid if present
      const gidMatch = url.match(/gid=([0-9]+)/);
      if (gidMatch && gidMatch[1]) {
        exportUrl += `&gid=${gidMatch[1]}`;
      }
    }
  }

  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error('Gagal mengambil data dari Google Sheet. Pastikan link dapat diakses secara publik.');
  }

  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data as Record<string, any>[]
        });
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
}
