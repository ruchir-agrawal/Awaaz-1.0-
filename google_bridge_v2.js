/**
 * Awaaz Google Bridge v2
 * 
 * Features:
 * 1. Multi-tenant sheet support (Tabs per business)
 * 2. Google Drive recording storage (.wav)
 * 3. Automatic tab initialization
 * 4. Improved formatting for mobile numbers
 */

const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_SPREADSHEET_ID';
const RECORDINGS_FOLDER_NAME = 'Awaaz_Recordings';

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const { type, businessName, data, transcript, audioBase64 } = params;
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (type === 'INIT_OWNER') {
      return initOwnerSheet(ss, businessName);
    }
    
    if (type === 'book_appointment' || type === 'LOG_CALL') {
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
    // Set headers
    const headers = [
      'CALL TIME', 
      'PATIENT NAME', 
      'PATIENT MOBILE NO.', 
      'REASON', 
      'APPOINTMENT STATUS', 
      'PATIENT ID', 
      'TRANSCRIPT', 
      'RECORDING LINK'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground('#f3f3f3')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Sheet initialized' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Saves recording to Drive and appends row to sheet
 */
function logCallData(ss, businessName, data, transcript, audioBase64) {
  const sheet = ss.getSheetByName(businessName) || ss.getSheets()[0];
  
  let recordingUrl = "No Recording";
  
  // 1. Save Recording to Google Drive if provided
  if (audioBase64) {
    const folder = getOrCreateFolder(RECORDINGS_FOLDER_NAME);
    const fileName = `Recording_${businessName}_${new Date().getTime()}.wav`;
    const blob = Utilities.newBlob(Utilities.base64Decode(audioBase64), 'audio/wav', fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    recordingUrl = file.getUrl();
  }
  
  // 2. Normalize Phone Number (ensure it stays a string in Sheets)
  const rawPhone = data.patient_mobile_no || data.mobile || "";
  const cleanPhone = "'" + rawPhone.replace(/[^\d+]/g, ''); // Prefix with ' to force string
  
  // 3. Prepare Row
  // Order: CALL TIME | PATIENT NAME | MOBILE | REASON | STATUS | PATIENT ID | TRANSCRIPT | RECORDING
  const row = [
    new Date().toLocaleString(),          // CALL TIME
    data.patient_name || "Unknown",        // PATIENT NAME
    cleanPhone,                            // PATIENT MOBILE NO.
    data.reason || "N/A",                  // REASON
    data.appointment_status || "Scheduled",// APPOINTMENT STATUS
    data.patient_id || "NEW",             // PATIENT ID
    transcript || "No transcript available", // TRANSCRIPT
    recordingUrl                           // RECORDING LINK
  ];
  
  sheet.appendRow(row);
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', recordingUrl }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(name);
}
