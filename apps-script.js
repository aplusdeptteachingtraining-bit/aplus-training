const SHEET_QUESTIONNAIRE = 'Questionnaire';
const SHEET_TEACHERS      = 'Teachers';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'questionnaire') {
      const sheet = getOrCreateSheet(ss, SHEET_QUESTIONNAIRE, [
        '填寫時間','姓名','年級段','起始等級','B分數','D適配分',
        '教學技巧','學科知識','課堂管理','行政了解','備課能力',
        'D1答案','D2答案','D3答案','D4答案','D5答案'
      ]);
      const r = data.radarScores || {};
      const d = data.dAnswers   || {};
      // 若同名已存在則更新
      const rows = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === data.name) {
          sheet.getRange(i+1,1,1,16).setValues([[
            data.submittedAt, data.name, data.grade, data.level, data.bScore, data.fitScore||0,
            r['教學技巧']||0, r['學科知識']||0, r['課堂管理']||0, r['行政了解']||0, r['備課能力']||0,
            d.d1||'', d.d2||'', d.d3||'', d.d4||'', d.d5||''
          ]]);
          found = true; break;
        }
      }
      if (!found) sheet.appendRow([
        data.submittedAt, data.name, data.grade, data.level, data.bScore, data.fitScore||0,
        r['教學技巧']||0, r['學科知識']||0, r['課堂管理']||0, r['行政了解']||0, r['備課能力']||0,
        d.d1||'', d.d2||'', d.d3||'', d.d4||'', d.d5||''
      ]);
    }

    if (data.type === 'progress') {
      const sheet = getOrCreateSheet(ss, SHEET_TEACHERS, [
        '更新時間','姓名','年級段','當前階段','入門%','初階%','進階%',
        '教學技巧','學科知識','課堂管理','行政了解','備課能力','任務完成數','任務狀態'
      ]);
      const r = data.radarScores || {};
      const newRow = [
        data.updatedAt, data.name, data.grade, data.phase,
        data.entryPct||0, data.basicPct||0, data.advPct||0,
        r['教學技巧']||0, r['學科知識']||0, r['課堂管理']||0, r['行政了解']||0, r['備課能力']||0,
        data.taskCount||0,
        data.tasks || '{}'   // ← 任務狀態 JSON
      ];
      const rows = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === data.name) {
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
    const ss   = SpreadsheetApp.getActiveSpreadsheet();
    const name = (e.parameter.sheet || SHEET_TEACHERS);
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
