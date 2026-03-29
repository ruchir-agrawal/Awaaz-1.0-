/**
 * Awaaz Google Bridge v2.1
 * 
 * Features:
 * 1. Multi-tenant sheet support (Tabs per business)
 * 2. Google Drive recording storage (.wav)
 * 3. Automatic tab initialization on signup
 * 4. Improved formatting for mobile numbers
 * 5. GET endpoint to fetch existing appointments (AI context injection)
 */

const SPREADSHEET_ID = '1Lw0M8XeMhu0Jep1Dm1VIxUBsz7VrgN1ByF4s82gzatE';
const RECORDINGS_FOLDER_NAME = 'Awaaz_Recordings';

// ═══════════════════════════════════════════════════════════════════
// GET HANDLER — Returns existing appointment data for AI context
// Usage: ?businessName=MyClinic
// ═══════════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    const businessName = e.parameter.businessName;
    if (!businessName) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'businessName parameter required' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(businessName);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', appointments: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      // Only headers, no data
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', appointments: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Read all data rows (skip header row 1)
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues(); // Cols A-F only (no transcript/recording)

    const appointments = data.map(function (row) {
      return {
        callTime: row[0] ? row[0].toString() : '',
        patientName: row[1] ? row[1].toString() : '',
        mobile: row[2] ? row[2].toString().replace(/^'/, '') : '', // strip leading apostrophe
        reason: row[3] ? row[3].toString() : '',
        status: row[4] ? row[4].toString() : '',
        patientId: row[5] ? row[5].toString() : ''
      };
    }).filter(function (a) { return a.patientName && a.patientName !== 'Unknown'; }); // Only valid entries

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', appointments: appointments }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST HANDLER — Existing functionality (init, book, log)
// ═══════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const { type, businessName, data, transcript, audioBase64 } = params;

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (type === 'INIT_OWNER') {
      return initOwnerSheet(ss, businessName);
    }

    // Support all Sharmaji Prompt Actions + Legacy LOG_CALL
    const loggingTypes = ['book_appointment', 'log_call_data', 'LOG_CALL', 'check_calendar_availability', 'transfer_call'];
    if (loggingTypes.indexOf(type) !== -1) {
      return logCallData(ss, businessName, data, transcript, audioBase64);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action type' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Creates a new tab for a business if it doesn't exist
 */
function initOwnerSheet(ss, name) {
  if (!name) throw new Error("Business name is required");

  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // 10-column layout based on Sharmaji Dental Hub prompt
    var headers = [
      'CALL DATE & TIME (IST)', // A
      'PATIENT NAME',            // B
      'MOBILE NUMBER',           // C
      'NEW / RETURNING',         // D
      'SERVICE / REASON',        // E
      'APPOINTMENT DATE & TIME', // F
      'STATUS',                  // G
      'SESSION UID',             // H
      'TRANSCRIPT',              // I
      'RECORDING LINK'           // J
    ];
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground('#1a1a2e');
    headerRange.setFontColor('#c8a034');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Set column widths
    sheet.setColumnWidth(1, 180); // Call Time
    sheet.setColumnWidth(8, 200); // Session UID
    sheet.setColumnWidth(9, 400); // Transcript
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Sheet initialized' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Saves recording to Drive and appends row to sheet
 * Handles specific fields from Sharmaji Dental Hub Prompt:
 * patient_name, phone_number, new_or_returning, service_reason, appointment_datetime
 */
function logCallData(ss, businessName, data, transcript, audioBase64) {
  var sheet = ss.getSheetByName(businessName) || ss.getSheets()[0];

  var recordingUrl = "No Recording";

  // 1. Save Recording to Google Drive if provided
  if (audioBase64) {
    try {
      var folder = getOrCreateFolder(RECORDINGS_FOLDER_NAME);
      var fileName = 'Recording_' + businessName + '_' + new Date().getTime() + '.wav';
      var blob = Utilities.newBlob(Utilities.base64Decode(audioBase64), 'audio/wav', fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      recordingUrl = file.getUrl();
    } catch(e) {
      recordingUrl = 'Recording Error: ' + e.toString();
    }
  }

  // 2. Normalize Phone Number
  var rawPhone = data.phone_number || data.patient_mobile_no || data.mobile || "";
  var cleanPhone = rawPhone ? "'" + rawPhone.replace(/[^\d+]/g, '') : "Not Provided";

  // 3. Determine appointment status
  var hasAppt = !!(data.appointment_datetime && data.appointment_datetime !== 'null');
  var status = hasAppt ? 'Confirmed' : (data.session_uid === 'AUTO_LOG' ? 'Inquiry / Abrupt End' : 'Inquiry Only');

  // 4. Prepare Row — matches 10-column layout
  var row = [
    new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), // A: Call Date & Time
    data.patient_name || "Not Captured",                               // B: Patient Name
    cleanPhone,                                                         // C: Mobile Number
    data.new_or_returning || "Not Specified",                          // D: New / Returning
    data.service_reason || data.reason || "N/A",                      // E: Service / Reason
    (hasAppt ? data.appointment_datetime : "-"),                       // F: Appointment Date & Time
    status,                                                             // G: Status
    data.session_uid || "N/A",                                         // H: Session UID
    transcript || "No transcript available",                           // I: Transcript
    recordingUrl                                                        // J: Recording Link
  ];

  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', recordingUrl: recordingUrl }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(name);
}
