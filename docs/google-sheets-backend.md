# Google Sheets Database Setup & Google Apps Script API

This guide documents how to configure Google Sheets as your serverless database backend and deploy the Google Apps Script API gateway.

---

## 📊 1. Google Sheets Structure

1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Note the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
3. Rename the first tab to **`Workstations`**.
4. Create new tabs for the remaining tables:
   *   **`Workstations`**: Add headers in row 1:
       `id`, `name`, `department`, `stage`, `riskScore`, `rebaScore`, `rulaScore`, `assignedOperator`, `shift`, `exposureHours`, `lastUpdate`, `history`, `violations`, `actionPlan`
   *   **`Assessments`**: Add headers in row 1:
       `id`, `workstationId`, `type`, `date`, `evaluator`, `score`, `details`, `metadata`
   *   **`CorrectiveActions`**: Add headers in row 1:
       `id`, `workstationId`, `description`, `budget`, `owner`, `status`, `date`
   *   **`AIInsights`**: Add headers in row 1:
       `id`, `workstationId`, `task`, `hazardDetected`, `estimatedAngle`, `rulaCalculated`, `criticalFinding`, `engineeringMitigation`, `date`

> [!TIP]
> If a worksheet tab is left empty, the Apps Script API will automatically attempt to initialize it with appropriate headers when a new record is appended. However, creating headers manually is highly recommended.

---

## 📜 2. Google Apps Script Setup

1. In your Google Sheet, click on **Extensions** -> **Apps Script** in the top menu bar.
2. Delete any boilerplate code inside the editor (`Code.gs`) and paste the following script:

```javascript
/**
 * ErgoFlow AI Google Sheets API Gateway
 * Handles GET (reads) and POST (appends & updates) requests.
 */

// Permitted sheets for operations
var PERMITTED_SHEETS = ["Workstations", "Assessments", "CorrectiveActions", "AIInsights"];

function doGet(e) {
  try {
    var action = e.parameter.action;
    var sheetName = e.parameter.sheet;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return makeJsonResponse({ error: "Sheet not found: " + sheetName });
    }
    
    if (PERMITTED_SHEETS.indexOf(sheetName) === -1) {
      return makeJsonResponse({ error: "Access denied to sheet: " + sheetName });
    }
    
    if (action === "read") {
      var data = readRows(sheet);
      return makeJsonResponse({ success: true, data: data });
    }
    
    return makeJsonResponse({ error: "Invalid action parameter" });
  } catch (error) {
    return makeJsonResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var sheetName = payload.sheet;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return makeJsonResponse({ error: "Sheet not found: " + sheetName });
    }
    
    if (PERMITTED_SHEETS.indexOf(sheetName) === -1) {
      return makeJsonResponse({ error: "Access denied to sheet: " + sheetName });
    }
    
    if (action === "append") {
      var newRow = appendRow(sheet, payload.data);
      return makeJsonResponse({ success: true, data: newRow });
    } else if (action === "update") {
      var updated = updateRow(sheet, payload.id, payload.data);
      return makeJsonResponse({ success: true, data: updated });
    }
    
    return makeJsonResponse({ error: "Invalid action parameter" });
  } catch (error) {
    return makeJsonResponse({ error: error.toString() });
  }
}

/**
 * Formats JSON response and adds CORS headers
 */
function makeJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reads all rows from a spreadsheet sheet and maps them to JSON objects
 */
function readRows(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Appends a new row mapping data to correct headers
 */
function appendRow(sheet, data) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  
  if (values.length === 1 && values[0][0] === "") {
    headers = Object.keys(data);
    sheet.appendRow(headers);
  }
  
  var newRowValues = [];
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    var val = data[header];
    newRowValues.push(val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : val) : "");
  }
  sheet.appendRow(newRowValues);
  
  var result = {};
  for (var i = 0; i < headers.length; i++) {
    result[headers[i]] = newRowValues[i];
  }
  return result;
}

/**
 * Updates a row by matching its id key column
 */
function updateRow(sheet, id, data) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idIndex = headers.indexOf("id");
  if (idIndex === -1) idIndex = 0;
  
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][idIndex].toString() === id.toString()) {
      rowIndex = i + 1; // 1-indexed and skip header
      break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error("Row with id " + id + " not found in " + sheet.getName());
  }
  
  for (var key in data) {
    var colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      var val = data[key];
      sheet.getRange(rowIndex, colIndex + 1).setValue(typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
  
  var updatedRowValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var result = {};
  for (var i = 0; i < headers.length; i++) {
    result[headers[i]] = updatedRowValues[i];
  }
  return result;
}
```

---

## 🚀 3. Web App Deployment

To expose the script to the frontend client:

1. In the Apps Script project editor, click the blue **Deploy** button at the top-right and select **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   *   **Description**: `ErgoFlow Sheets database API Gateway`
   *   **Execute as**: **`Me (your-email@gmail.com)`** (This is crucial: the script runs under your account to write to the spreadsheet without clients needing to log in).
   *   **Who has access**: **`Anyone`** (This makes the API accessible from the web client without preflight authorization walls).
4. Click **Deploy**.
5. Google will ask you to **Authorize Access** to your account (as the script reads/writes to Sheets). Click **Authorize Access**, select your account, click **Advanced** -> **Go to Untitled project (unsafe)**, and select **Allow**.
6. Copy the **Web App URL** provided under "URL":
   `https://script.google.com/macros/s/AKfycb...your-unique-id.../exec`

---

## 🔌 4. Integration

Paste the copied script URL into your `.env.local` or Cloudflare Environment Variables:

```env
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycb...your-unique-id.../exec
NEXT_PUBLIC_GOOGLE_SHEET_ID=your-sheet-id-from-url
```
