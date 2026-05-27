const SHEET_QUESTIONNAIRE = 'Questionnaire';
const SHEET_TEACHERS      = 'Teachers';

// ══ 執行這個函數一次來修正所有欄位標題 ══
function fixHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const tSheet = ss.getSheetByName(SHEET_TEACHERS);
  if (tSheet) {
    const correctHeaders = ['更新時間','姓名','Email','年級段','當前階段','入門%','初階%','進階%',
      '教學技巧','學科知識','課堂管理','行政了解','備課能力','任務完成數','任務狀態'];
    tSheet.getRange(1, 1, 1, correctHeaders.length).setValues([correctHeaders]);
    tSheet.getRange(1, 1, 1, correctHeaders.length).setFontWeight('bold');
  }
  
  const qSheet = ss.getSheetByName(SHEET_QUESTIONNAIRE);
  if (qSheet) {
    const correctHeaders = ['填寫時間','姓名','Email','年級段','起始等級','B分數','D適配分',
      '教學技巧','學科知識','課堂管理','行政了解','備課能力',
      'D1答案','D2答案','D3答案','D4答案','D5答案'];
    qSheet.getRange(1, 1, 1, correctHeaders.length).setValues([correctHeaders]);
    qSheet.getRange(1, 1, 1, correctHeaders.length).setFontWeight('bold');
  }
  
  SpreadsheetApp.getUi().alert('欄位標題已修正完成！');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'questionnaire') {
      const sheet = getOrCreateSheet(ss, SHEET_QUESTIONNAIRE, [
        '填寫時間','姓名','Email','年級段','起始等級','B分數','D適配分',
        '教學技巧','學科知識','課堂管理','行政了解','備課能力',
        'D1答案','D2答案','D3答案','D4答案','D5答案'
      ]);
      const r = data.radarScores || {};
      const d = data.dAnswers || {};
      const email = (data.email || '').toLowerCase().trim();
      
      // 用 Email 比對（C欄，index 2）
      const rows = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][2]||'').toLowerCase().trim() === email && email) {
          sheet.getRange(i+1,1,1,17).setValues([[
            data.submittedAt, data.name, email, data.grade, data.level, data.bScore, data.fitScore||0,
            r['教學技巧']||0, r['學科知識']||0, r['課堂管理']||0, r['行政了解']||0, r['備課能力']||0,
            d.d1||'', d.d2||'', d.d3||'', d.d4||'', d.d5||''
          ]]);
          found = true; break;
        }
      }
      if (!found) sheet.appendRow([
        data.submittedAt, data.name, email, data.grade, data.level, data.bScore, data.fitScore||0,
        r['教學技巧']||0, r['學科知識']||0, r['課堂管理']||0, r['行政了解']||0, r['備課能力']||0,
        d.d1||'', d.d2||'', d.d3||'', d.d4||'', d.d5||''
      ]);
    }

    if (data.type === 'progress') {
      const sheet = getOrCreateSheet(ss, SHEET_TEACHERS, [
        '更新時間','姓名','Email','年級段','當前階段','入門%','初階%','進階%',
        '教學技巧','學科知識','課堂管理','行政了解','備課能力','任務完成數','任務狀態'
      ]);
      const r = data.radarScores || {};
      const email = (data.email || '').toLowerCase().trim();
      const newRow = [
        data.updatedAt, data.name, email, data.grade, data.phase,
        data.entryPct||0, data.basicPct||0, data.advPct||0,
        r['教學技巧']||0, r['學科知識']||0, r['課堂管理']||0, r['行政了解']||0, r['備課能力']||0,
        data.taskCount||0,
        data.tasks || '{}'
      ];

      const rows = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        const rowEmail = String(rows[i][2]||'').toLowerCase().trim();
        const rowName  = String(rows[i][1]||'').trim();
        // 嚴格用 Email 比對，Email 不存在時才用姓名
        const match = (email && rowEmail === email) || (!email && rowName === data.name);
        if (match) {
          sheet.getRange(i+1, 1, 1, newRow.length).setValues([newRow]);
          found = true; break;
        }
      }
      if (!found) sheet.appendRow(newRow);
    }

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', msg: err.message });
  }
}

function doGet(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const name  = (e.parameter.sheet || SHEET_TEACHERS);
    const sheet = ss.getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return jsonResponse([]);
    const rows    = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data    = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
    return jsonResponse(data);
  } catch (err) {
    return jsonResponse({ status: 'error', msg: err.message });
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
