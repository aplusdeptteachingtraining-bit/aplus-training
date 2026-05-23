# A Plus 耶加教師培訓系統 · 開發指引

## 專案概覽

A Plus 耶加教育機構的教師入職培訓管理系統。純前端靜態網站，以 Google Apps Script 作為後端資料庫（Serverless）。

**GitHub Repo：** `aplusdeptteachingtraining-bit/aplus-training`

---

## 檔案結構

```
index.html          首頁／培訓手冊（入口頁）
questionnaire.html  入職評估問卷（A/B/C/D 四部分）
tasks.html          培訓任務清單（三階段進度 + 雷達圖）
standards.html      達標標準說明
admin.html          培訓官後台（需密碼登入）
sheets.js           Google Sheets / Apps Script 串接模組
```

## 技術棧

- **前端**：Vanilla HTML / CSS / JavaScript（無框架，無建置工具）
- **字體**：Noto Sans TC（Google Fonts CDN）
- **圖示**：Tabler Icons（jsDelivr CDN）
- **圖表**：Chart.js（jsDelivr CDN，tasks.html 雷達圖）
- **後端**：Google Apps Script（部署為 Web App，doGet / doPost）
- **資料庫**：Google Sheets（Questionnaire + Teachers 兩個工作表）
- **本地儲存**：localStorage（主要資料存取；GAS 為雲端同步）

## 設計系統

CSS 變數（所有頁面共用）：

| 變數 | 值 | 用途 |
|------|-----|------|
| `--green` | `#1B4332` | 主色 / Hero 背景 |
| `--green-mid` | `#2D6A4F` | 按鈕 / 強調 |
| `--green-light` | `#52B788` | 進度條 / hover |
| `--green-pale` | `#D8F3DC` | 淺底色 |
| `--gold` | `#F6E05E` | 標題強調 |
| `--cream` | `#F9F6F0` | 頁面底色 |
| `--radius` | `14px` | 標準圓角 |
| `--radius-sm` | `8px` | 小圓角 |

---

## Commit 規則

每次變更必須使用以下格式 commit 並 push：

```
動作(項目):繁中說明
```

### 動作關鍵字

| 關鍵字 | 說明 |
|--------|------|
| `新增` | 全新功能、頁面、檔案 |
| `修復` | 修正 bug 或錯誤行為 |
| `更新` | 調整現有功能或內容 |
| `重構` | 程式碼整理，不改行為 |
| `樣式` | CSS / 視覺調整 |
| `安全` | 資安強化或漏洞修補 |
| `文件` | README / CLAUDE.md 等文件 |
| `刪除` | 移除功能或檔案 |

### 範例

```
新增(問卷):加入 D 段適配分析結果頁
修復(後台):修正教師進度百分比計算錯誤
更新(首頁):調整入職 Checklist 項目順序
安全(後台):改用 server-side token 驗證管理員身份
樣式(任務清單):修正手機版雷達圖版面跑版
```

---

## Google Apps Script 串接

`sheets.js` 負責所有 GAS 通訊：

- `APPS_SCRIPT_URL`：部署後填入（請勿 commit 真實 URL，改用環境變數或 config 檔）
- `IS_CONFIGURED`：自動偵測是否已設定
- 未設定時自動切換 mock 資料，不影響開發
- 離線時寫入 `localStorage` 待後續 `retryPendingSync()` 補傳

### Apps Script 工作表結構

**Questionnaire**：填寫時間、姓名、Email、B分數、起始等級、D適配分、C分數、D問答

**Teachers**：更新時間、姓名、年級段、當前階段、入門%、初階%、進階%、雷達分數、任務狀態

---

## 資安規範（重要）

### 已知風險與應對

1. **後台登入**：目前為純前端密碼比對（client-side only），**任何人都可看到原始碼中的密碼**。
   - 短期方案：混淆 + hash 比對
   - 長期方案：改用 Google OAuth 或 GAS 發 session token

2. **Apps Script URL 保護**：GAS Web App URL 若公開，任何人可寫入資料。
   - GAS `doPost` 務必加入 **Secret Token 驗證**（header 或 body 夾帶）
   - URL 不得 commit 至 repo；使用 `.gitignore` 排除 `config.js`

3. **輸入驗證**：所有表單輸入在送出前須 sanitize（防 XSS）
   - 使用 `textContent` 而非 `innerHTML` 顯示使用者輸入
   - GAS 端收到資料後再次驗證欄位型別與長度

4. **localStorage**：使用者可在 DevTools 直接竄改進度資料
   - 培訓官後台以 GAS 端資料為準，不信任前端帶來的數字
   - 重要進度判定在 GAS 端做驗算

5. **CORS workaround**：`Content-Type: text/plain` 是繞過 preflight 的常見手法
   - GAS 端務必驗證 payload 結構，拒絕格式異常的請求

6. **敏感資料**：學生名單連結（Lark Suite）、Google Drive 資料夾 ID 不得外洩
   - 確認 Drive 資料夾共享設定為「限定人員」

### .gitignore 注意事項

以下檔案禁止 commit：
- `config.js`（含 GAS URL 與 secret token）
- `.env`
- 任何含真實 API Key 的檔案

---

## 開發注意事項

- 所有頁面為獨立 HTML，共用設計系統但不共用 JS 模組（除 `sheets.js`）
- 新增頁面時需同步更新 `index.html` 的導覽按鈕與 sidebar
- 手機版斷點：768px（隱藏 sidebar）、480px（縮排調整）
- `index (1).html` 與 `questionnaire (1).html` 為備份檔，不需維護
- 培訓階段定義：entry（入門，e前綴）、basic（初階，b前綴）、advanced（進階，a前綴）
