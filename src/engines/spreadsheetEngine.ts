import * as XLSX from 'xlsx';

export const convertSpreadsheet = async (file: File, outputFormat: string): Promise<string> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  
  if (outputFormat === 'csv') {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv' });
    return URL.createObjectURL(blob);
  }

  if (outputFormat === 'json') {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  if (outputFormat === 'xlsx') {
    const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return URL.createObjectURL(blob);
  }

  throw new Error(`Unsupported spreadsheet format: ${outputFormat}`);
};
