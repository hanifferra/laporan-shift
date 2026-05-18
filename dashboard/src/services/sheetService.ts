import Papa from 'papaparse';

export interface SheetData {
  headers: string[];
  rows: Record<string, any>[];
}

export async function fetchSheetData(url: string): Promise<SheetData> {
  let exportUrl = url;
  if (url.includes('docs.google.com/spreadsheets/d/')) {
    const match = url.match(/\/d\/([^/]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
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

export interface TargetEntry {
  periodeMulai: string;
  periodeSelesai: string;
  namaTarget: string;
}

export const fetchTargetData = async (url: string): Promise<TargetEntry[]> => {
  try {
    const data = await fetchSheetData(url);
    return data.rows
      .map(row => {
        const vals = Object.values(row) as string[];
        return {
          periodeMulai: vals[0]?.trim() ?? '',
          periodeSelesai: vals[1]?.trim() ?? '',
          namaTarget: vals[2]?.trim() ?? '',
        };
      })
      .filter(t => t.periodeMulai && t.namaTarget);
  } catch (error) {
    console.error('Error fetching target sheet:', error);
    return [];
  }
};