/**
 * js/utils.js — A Plus 耶加培訓系統 · 共用工具函式
 * 所有頁面皆可使用
 */

/* ── localStorage 安全存取 ── */

function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[utils] localStorage 寫入失敗：', key, e.message);
  }
}

/* ── XSS 防護：HTML 跳脫 ── */

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── 日期格式化 ── */

function formatDate(isoString) {
  if (!isoString) return '—';
  return String(isoString).substring(0, 10);
}

/* ── 百分比進度列 HTML ── */

function progressBarHtml(pct, colorClass = '') {
  const safePct = Math.min(100, Math.max(0, Number(pct) || 0));
  return `<div style="height:5px;background:var(--border-light);border-radius:99px;margin-top:4px;">
    <div style="height:100%;width:${safePct}%;border-radius:99px;background:var(--green-light);transition:width .6s ease;${colorClass}"></div>
  </div>`;
}
