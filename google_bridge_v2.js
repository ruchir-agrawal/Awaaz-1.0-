/**
 * Awaaz Google Bridge v3
 *
 * Features:
 * 1. Dedicated spreadsheet per business
 * 2. Backward-compatible shared spreadsheet fallback
 * 3. Google Drive recording storage (.wav)
 * 4. GET endpoint to fetch existing appointments for AI context
 * 5. INIT_OWNER action to auto-provision or connect a spreadsheet
 */

const LEGACY_SPREADSHEET_ID = '1Lw0M8XeMhu0Jep1Dm1VIxUBsz7VrgN1ByF4s82gzatE';
const DEFAULT_RECORDS_SHEET_NAME = 'Records';
const RECORDINGS_FOLDER_NAME = 'Awaaz_Recordings';
const HEADERS = [
  'CALL DATE & TIME (IST)',
  'PATIENT NAME',
  'MOBILE NUMBER',
  'NEW / RETURNING',
  'SERVICE / REASON',
  'APPOINTMENT DATE & TIME',
  'STATUS',
  'SESSION UID',
  'TRANSCRIPT',
  'RECORDING LINK'
];

function doGet(e) {
  try {
    const target = getRequestTarget(e && e.parameter ? e.parameter : {});
    if (!target.businessName && !target.spreadsheetId) {
      return jsonResponse({ status: 'error', message: 'businessName or spreadsheetId parameter required' });
    }

    const ss = openTargetSpreadsheet(target);
    const sheet = getTargetSheet(ss, target, false);
    if (!sheet) {
      return jsonResponse({ status: 'ok', appointments: [], spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl(), sheetName: resolveSheetName(target) });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return jsonResponse({ status: 'ok', appointments: [], spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl(), sheetName: sheet.getName() });
    }

    const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const appointments = data.map(function (row) {
      return {
        callTime:            row[0] ? row[0].toString() : '',
        patientName:         row[1] ? row[1].toString() : '',
        mobile:              row[2] ? row[2].toString().replace(/^'/, '') : '',
        newOrReturning:      row[3] ? row[3].toString() : '',
        reason:              row[4] ? row[4].toString() : '',
        appointmentDatetime: row[5] ? row[5].toString() : '',
        status:              row[6] ? row[6].toString() : '',
        sessionUid:          row[7] ? row[7].toString() : '',
        transcript:          row[8] ? row[8].toString() : '',
        recordingLink:       row[9] ? row[9].toString() : '',
      };
    }).filter(function (row) {
      return row.callTime && row.callTime.trim() !== '';
    });

    return jsonResponse({
      status: 'ok',
      appointments: appointments,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      sheetName: sheet.getName()
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents || '{}');
    const type = params.type;
    const target = getRequestTarget(params);

    if (type === 'INIT_OWNER') {
      return initOwnerSheet(target, params.createDedicatedSpreadsheet !== false);
    }

    if (type === 'check_calendar_availability') {
      return jsonResponse({
        status: 'ok',
        message: 'Calendar check acknowledged. Respond with available slots verbally.'
      });
    }

    if (type === 'transfer_call') {
      return jsonResponse({
        status: 'ok',
        message: 'Transfer acknowledged.'
      });
    }

    const sheetWriteTypes = ['book_appointment', 'log_call_data', 'LOG_CALL'];
    if (sheetWriteTypes.indexOf(type) !== -1) {
      const ss = openTargetSpreadsheet(target);
      return logCallData(ss, target, params.data || {}, params.transcript, params.audioBase64);
    }

    return jsonResponse({ status: 'error', message: 'Unknown action type' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function getRequestTarget(source) {
  return {
    businessName: (source.businessName || '').toString().trim(),
    spreadsheetId: extractSpreadsheetId((source.spreadsheetId || source.googleSheetId || source.sheetUrl || '').toString().trim()),
    sheetName: (source.sheetName || source.googleSheetTabName || DEFAULT_RECORDS_SHEET_NAME).toString().trim() || DEFAULT_RECORDS_SHEET_NAME
  };
}

function extractSpreadsheetId(raw) {
  if (!raw) return '';
  var match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(raw)) return raw;
  return '';
}

function resolveSheetName(target) {
  if (target.spreadsheetId) {
    return target.sheetName || DEFAULT_RECORDS_SHEET_NAME;
  }

  return target.businessName || DEFAULT_RECORDS_SHEET_NAME;
}

function openTargetSpreadsheet(target) {
  if (target.spreadsheetId) {
    return SpreadsheetApp.openById(target.spreadsheetId);
  }

  return SpreadsheetApp.openById(LEGACY_SPREADSHEET_ID);
}

function createDedicatedSpreadsheet(target) {
  var titleBase = target.businessName || 'Awaaz Business';
  return SpreadsheetApp.create('Awaaz - ' + titleBase + ' - Records');
}

function getTargetSheet(ss, target, createIfMissing) {
  var sheetName = resolveSheetName(target);
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet && createIfMissing) {
    sheet = ss.insertSheet(sheetName);
    applyHeaders(sheet);
  } else if (sheet && sheet.getLastRow() === 0) {
    applyHeaders(sheet);
  } else if (sheet && sheet.getLastRow() >= 1 && sheet.getRange(1, 1, 1, Math.min(HEADERS.length, sheet.getLastColumn())).getValues()[0][0] !== HEADERS[0]) {
    applyHeaders(sheet);
  }

  return sheet;
}

function applyHeaders(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  headerRange.setBackground('#1a1a2e');
  headerRange.setFontColor('#c8a034');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(8, 200);
  sheet.setColumnWidth(9, 400);
}

function initOwnerSheet(target, createDedicated) {
  if (!target.businessName && !target.spreadsheetId) {
    throw new Error('Business name is required to initialize sheet storage');
  }

  var ss = target.spreadsheetId ? SpreadsheetApp.openById(target.spreadsheetId) : (createDedicated ? createDedicatedSpreadsheet(target) : SpreadsheetApp.openById(LEGACY_SPREADSHEET_ID));
  var normalizedTarget = {
    businessName: target.businessName,
    spreadsheetId: ss.getId(),
    sheetName: target.spreadsheetId ? (target.sheetName || DEFAULT_RECORDS_SHEET_NAME) : (createDedicated ? DEFAULT_RECORDS_SHEET_NAME : (target.businessName || DEFAULT_RECORDS_SHEET_NAME))
  };

  var sheet = getTargetSheet(ss, normalizedTarget, true);
  return jsonResponse({
    status: 'success',
    message: 'Sheet initialized',
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheetName: sheet.getName()
  });
}

function logCallData(ss, target, data, transcript, audioBase64) {
  var sheet = getTargetSheet(ss, target, true);
  var recordingUrl = 'No Recording';

  if (audioBase64) {
    try {
      var folder = getOrCreateFolder(RECORDINGS_FOLDER_NAME);
      var businessSlug = (target.businessName || 'Business').replace(/[^a-zA-Z0-9]+/g, '_');
      var fileName = 'Recording_' + businessSlug + '_' + new Date().getTime() + '.wav';
      var blob = Utilities.newBlob(Utilities.base64Decode(audioBase64), 'audio/wav', fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      recordingUrl = file.getUrl();
    } catch (e) {
      recordingUrl = 'Recording Error: ' + e.toString();
    }
  }

  var rawPhone = data.phone_number || data.patient_mobile_no || data.mobile || '';
  var cleanPhone = rawPhone ? "'" + rawPhone.replace(/[^\d+]/g, '') : 'Not Provided';
  var hasAppt = !!(data.appointment_datetime && data.appointment_datetime !== 'null');
  var status = data.status || (hasAppt ? 'Confirmed' : (data.session_uid === 'AUTO_LOG' ? 'Inquiry / Abrupt End' : 'Inquiry Only'));

  var row = [
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    data.patient_name || 'Not Captured',
    cleanPhone,
    data.new_or_returning || 'Not Specified',
    data.service_reason || data.reason || 'N/A',
    (hasAppt ? data.appointment_datetime : '-'),
    status,
    data.session_uid || 'N/A',
    transcript || 'No transcript available',
    recordingUrl
  ];

  sheet.appendRow(row);

  return jsonResponse({
    status: 'success',
    recordingUrl: recordingUrl,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheetName: sheet.getName()
  });
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(name);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
