/**
 * sheets.js — A Plus 耶加培訓系統 · Google Sheets 串接模組
 *
 * 使用說明：
 * 1. 在 Google Sheets 建立試算表，命名「A Plus 培訓系統資料庫」
 * 2. 建立兩個工作表：Questionnaire（問卷結果）、Teachers（教師進度）
 * 3. 擴充功能 → Apps Script，貼入下方 Apps Script 程式碼，部署為網路應用程式
 * 4. 將部署後取得的 URL 貼入下方 APPS_SCRIPT_URL
 */

// ── 設定區 ── 請將此 URL 替換為你的 Apps Script 部署 URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

const IS_CONFIGURED = APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID') === false;

// ── 寫入問卷結果 ──
async function submitQuestionnaire(data) {
  const payload = {
    type: 'questionnaire',
    name: data.name || '',
    email: data.email || '',
    bScore: data.bScore || 0,
    level: data.level || '',
    fitScore: data.fitScore || 0,
    cScores: JSON.stringify(data.cScores || {}),
    dAnswers: JSON.stringify(data.dAnswers || {}),
    submittedAt: new Date().toISOString(),
  };
  return _post(payload);
}

// ── 寫入教師培訓進度 ──
async function submitProgress(data) {
  const payload = {
    type: 'progress',
    name: data.name || '',
    grade: data.grade || '',
    phase: data.phase || '',
    entryPct: data.entryPct || 0,
    basicPct: data.basicPct || 0,
    advPct: data.advPct || 0,
    radarScores: JSON.stringify(data.radarScores || {}),
    tasks: JSON.stringify(data.tasks || {}),
    updatedAt: new Date().toISOString(),
  };
  return _post(payload);
}

// ── 讀取所有教師資料（培訓官後台用）──
async function fetchAllTeachers() {
  if (!IS_CONFIGURED) return _mockTeachers();
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?sheet=Teachers&t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch(e) {
    console.warn('[sheets.js] fetchAllTeachers 失敗，使用本地快取', e.message);
    return _mockTeachers();
  }
}

// ── 讀取所有問卷填寫記錄（培訓官後台用）──
async function fetchQuestionnaires() {
  if (!IS_CONFIGURED) return _mockQuestionnaires();
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?sheet=Questionnaire&t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch(e) {
    console.warn('[sheets.js] fetchQuestionnaires 失敗，使用本地快取', e.message);
    return _mockQuestionnaires();
  }
}

// ── 讀取單一教師進度 ──
async function fetchTeacher(name) {
  const all = await fetchAllTeachers();
  return all.find(t => t.name === name) || null;
}

// ── 內部 POST ──
async function _post(payload) {
  if (!IS_CONFIGURED) {
    console.info('[sheets.js] 尚未設定 Apps Script URL，資料僅存 localStorage');
    _saveLocalBackup(payload);
    return { status: 'local_only' };
  }
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script CORS workaround
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    _saveLocalBackup(payload); // 同步存本地備份
    return json;
  } catch(e) {
    console.warn('[sheets.js] POST 失敗，資料存入 localStorage 待後續同步', e.message);
    _saveLocalBackup(payload);
    _addPendingSync(payload);
    return { status: 'offline_saved' };
  }
}

// ── 本地備份 ──
function _saveLocalBackup(payload) {
  try {
    const key = 'sheets_backup_' + payload.type;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift({ ...payload, savedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50))); // 最多保留50筆
  } catch(e) {}
}

// ── 離線待同步佇列 ──
function _addPendingSync(payload) {
  try {
    const pending = JSON.parse(localStorage.getItem('sheets_pending') || '[]');
    pending.push({ payload, queuedAt: new Date().toISOString() });
    localStorage.setItem('sheets_pending', JSON.stringify(pending));
  } catch(e) {}
}

// ── 重試離線佇列 ──
async function retryPendingSync() {
  if (!IS_CONFIGURED) return { retried: 0 };
  try {
    const pending = JSON.parse(localStorage.getItem('sheets_pending') || '[]');
    if (!pending.length) return { retried: 0 };
    let success = 0;
    const remaining = [];
    for (const item of pending) {
      try {
        await _post(item.payload);
        success++;
      } catch(e) {
        remaining.push(item);
      }
    }
    localStorage.setItem('sheets_pending', JSON.stringify(remaining));
    return { retried: success, remaining: remaining.length };
  } catch(e) {
    return { retried: 0 };
  }
}

// ── Mock 資料（尚未設定 URL 時使用）──
function _mockTeachers() {
  return [
    { name:'林老師', grade:'低年級', phase:'basic', entryPct:100, basicPct:55, advPct:0, updatedAt:'2026-05-10' },
    { name:'王老師', grade:'中年級', phase:'entry', entryPct:60, basicPct:0, advPct:0, updatedAt:'2026-05-12' },
    { name:'陳老師', grade:'高年級', phase:'advanced', entryPct:100, basicPct:100, advPct:70, updatedAt:'2026-05-14' },
    { name:'張老師', grade:'跨年級段', phase:'basic', entryPct:100, basicPct:30, advPct:0, updatedAt:'2026-05-09' },
  ];
}
function _mockQuestionnaires() {
  return [
    { name:'林老師', email:'lin@example.com', bScore:52, level:'初階起始', fitScore:8, submittedAt:'2026-05-10' },
    { name:'王老師', email:'wang@example.com', bScore:34, level:'入門起始', fitScore:6, submittedAt:'2026-05-12' },
  ];
}

/*
 * ════════════════════════════════════════════════
 *  GOOGLE APPS SCRIPT 程式碼
 *  複製以下程式碼，貼入你的 Google Apps Script 編輯器
 * ════════════════════════════════════════════════
 *
 * const SHEET_ID = "YOUR_GOOGLE_SHEET_ID"; // 替換為試算表 ID
 *
 * function doPost(e) {
 *   try {
 *     const data = JSON.parse(e.postData.contents);
 *     const ss = SpreadsheetApp.openById(SHEET_ID);
 *     if (data.type === "questionnaire") {
 *       const sheet = ss.getSheetByName("Questionnaire") || ss.insertSheet("Questionnaire");
 *       if (sheet.getLastRow() === 0) {
 *         sheet.appendRow(["填寫時間","姓名","Email","B分數","起始等級","D適配分","C分數","D問答"]);
 *       }
 *       sheet.appendRow([data.submittedAt, data.name, data.email, data.bScore, data.level, data.fitScore, data.cScores, data.dAnswers]);
 *     }
 *     if (data.type === "progress") {
 *       const sheet = ss.getSheetByName("Teachers") || ss.insertSheet("Teachers");
 *       if (sheet.getLastRow() === 0) {
 *         sheet.appendRow(["更新時間","姓名","年級段","當前階段","入門%","初階%","進階%","雷達分數","任務狀態"]);
 *       }
 *       const rows = sheet.getDataRange().getValues();
 *       const nameCol = 1; // B欄
 *       let found = false;
 *       for (let i = 1; i < rows.length; i++) {
 *         if (rows[i][nameCol] === data.name) {
 *           sheet.getRange(i+1, 1, 1, 9).setValues([[data.updatedAt, data.name, data.grade, data.phase, data.entryPct, data.basicPct, data.advPct, data.radarScores, data.tasks]]);
 *           found = true; break;
 *         }
 *       }
 *       if (!found) sheet.appendRow([data.updatedAt, data.name, data.grade, data.phase, data.entryPct, data.basicPct, data.advPct, data.radarScores, data.tasks]);
 *     }
 *     return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
 *   } catch(err) {
 *     return ContentService.createTextOutput(JSON.stringify({ status: "error", msg: err.message })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 *
 * function doGet(e) {
 *   const ss = SpreadsheetApp.openById(SHEET_ID);
 *   const sheetName = e.parameter.sheet || "Teachers";
 *   const sheet = ss.getSheetByName(sheetName);
 *   if (!sheet) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
 *   const rows = sheet.getDataRange().getValues();
 *   if (rows.length < 2) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
 *   const headers = rows[0];
 *   const data = rows.slice(1).map(row => {
 *     const obj = {};
 *     headers.forEach((h, i) => { obj[h] = row[i]; });
 *     return obj;
 *   });
 *   return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
 * }
 *
 * ════════════════════════════════════════════════
 */
