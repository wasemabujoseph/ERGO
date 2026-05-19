/**
 * Google Sheets Database client for ErgoFlow AI.
 * Acts as a serverless database adapter communicating with Google Apps Script Web App.
 */

// Load script URL from Vite env variables
const GOOGLE_SCRIPT_URL = import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '';
const GOOGLE_SHEET_ID = import.meta.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '';

interface SheetPayload {
  action: 'read' | 'append' | 'update';
  sheet: string;
  id?: string | number;
  data?: any;
}

/**
 * Checks if the Google Sheets API is configured.
 */
export function isSheetsConfigured(): boolean {
  return typeof GOOGLE_SCRIPT_URL === 'string' && GOOGLE_SCRIPT_URL.trim().length > 0;
}

/**
 * Sends a request to the Google Apps Script web app endpoint.
 */
async function sendRequest(payload: SheetPayload): Promise<any> {
  if (!isSheetsConfigured()) {
    console.warn(`[GoogleSheets] Script URL not configured. Action: ${payload.action} on ${payload.sheet}`);
    throw new Error('Google Apps Script URL is not configured. Please set NEXT_PUBLIC_GOOGLE_SCRIPT_URL.');
  }

  try {
    // If it's a read action, we can use a GET request or POST.
    // Apps Script web apps can receive POST requests containing JSON.
    // Since POST bypasses some URL length limits and is cleaner for payloads, we use POST for everything,
    // or GET for read if desired. Let's use POST for all interactions as it's more reliable for sending payloads.
    
    // For GET on read:
    if (payload.action === 'read') {
      const url = `${GOOGLE_SCRIPT_URL}?action=read&sheet=${encodeURIComponent(payload.sheet)}&sheetId=${encodeURIComponent(GOOGLE_SHEET_ID)}`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    }

    // For POST on write/update:
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script does not always support application/json preflights nicely, text/plain avoids preflight CORS checks!
      },
      body: JSON.stringify({
        ...payload,
        sheetId: GOOGLE_SHEET_ID
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (error) {
    console.error(`[GoogleSheets Error] Failed to execute ${payload.action} on ${payload.sheet}:`, error);
    throw error;
  }
}

/**
 * Helper to parse JSON string fields (like arrays/objects) back to native JS types.
 */
function parseRowFields<T>(row: any): T {
  if (!row) return row;
  const parsedRow = { ...row };
  for (const key in parsedRow) {
    const val = parsedRow[key];
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try {
        parsedRow[key] = JSON.parse(val);
      } catch (e) {
        // Keep original string if parsing fails
      }
    }
  }
  return parsedRow as T;
}

/**
 * Fetches all rows from a sheet.
 */
export async function fetchRows<T>(sheetName: string): Promise<T[]> {
  try {
    const data = await sendRequest({ action: 'read', sheet: sheetName });
    // Parse JSON strings back into objects for history, violations, checks, etc.
    return data.map((row: any) => parseRowFields<T>(row));
  } catch (error) {
    console.warn(`[GoogleSheets] Falling back to local storage/mock for sheet ${sheetName}`);
    throw error;
  }
}

/**
 * Appends a new row to a sheet.
 */
export async function appendRow<T>(sheetName: string, rowData: T): Promise<T> {
  const result = await sendRequest({
    action: 'append',
    sheet: sheetName,
    data: rowData
  });
  return parseRowFields<T>(result);
}

/**
 * Updates a row in a sheet by its ID.
 */
export async function updateRowInSheet<T>(sheetName: string, id: string | number, rowData: Partial<T>): Promise<T> {
  const result = await sendRequest({
    action: 'update',
    sheet: sheetName,
    id,
    data: rowData
  });
  return parseRowFields<T>(result);
}

/**
 * Filters rows locally or remotely.
 */
export async function filterRows<T>(sheetName: string, predicate: (row: T) => boolean): Promise<T[]> {
  const rows = await fetchRows<T>(sheetName);
  return rows.filter(predicate);
}
