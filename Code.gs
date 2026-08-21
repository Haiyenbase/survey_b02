// ════════════════════════════════════════════════════════════════
// Google Apps Script — Survey S02 Backend
// Base.vn Training Series 2026
//
// SETUP:
//   1. Tạo Google Sheet mới
//   2. Extensions → Apps Script → dán file này vào Code.gs
//   3. Deploy → New deployment → Web App
//      - Execute as: Me
//      - Who has access: Anyone
//   4. Copy Web App URL → điền vào survey.html (APPS_SCRIPT_URL)
//   5. File → Share → Publish to web → Sheet "responses" → CSV
//      → Copy URL → điền vào results.html (SHEET_CSV_URL)
// ════════════════════════════════════════════════════════════════

const SHEET_NAME   = 'responses';
const ALLOWED_ORIGIN = '*'; // đổi thành domain Vercel sau khi deploy nếu muốn restrict

// ── Header row (cột A→K) ─────────────────────────────────────────
const HEADERS = [
  'Thời gian',
  'Tên',
  'Vai trò',           // q1: SE;DA;DE
  'Vướng theo role',   // roleq: se_qualify;da_need;...
  'Tiếp xúc KH',      // q3: daily/weekly/monthly/rare
  'Điểm hiểu KH',     // q4: 1-5
  'Khó khăn chung',   // q5: need;trust;...
  'Case study',        // q6: free text
  'Phối hợp nội bộ',  // q7: handoff;language;...
  'Takeaway',          // q8: segment;role;...
  'Câu hỏi diễn giả', // q9: free text
];

// ── Helpers ──────────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#1E3A5F');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setColumnWidth(7, 300); // case study column wider
    sheet.setColumnWidth(10, 200);

    Logger.log('Sheet "responses" created with headers.');
  }

  return sheet;
}

function jsonResponse(data, status) {
  const payload = JSON.stringify({ status: status || 'ok', ...data });
  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

// ── doPost — nhận data từ survey.html ────────────────────────────
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ message: 'No data received' }, 'error');
    }

    const d     = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    // Validate required fields
    if (!d.q1 || !d.q1.length) {
      return jsonResponse({ message: 'Missing role (q1)' }, 'error');
    }

    const arr = val => Array.isArray(val) ? val.join(';') : (val || '');

    sheet.appendRow([
      d.ts    || new Date().toLocaleString('vi-VN'),
      d.name  || 'Ẩn danh',
      arr(d.q1),
      arr(d.roleq),
      d.q3    || '',
      d.q4    || '',
      arr(d.q5),
      d.q6    || '',
      arr(d.q7),
      arr(d.q8),
      d.q9    || '',
    ]);

    Logger.log('New response from: ' + (d.name || 'Ẩn danh'));
    return jsonResponse({ message: 'Saved successfully' });

  } catch (err) {
    Logger.log('Error in doPost: ' + err.message);
    return jsonResponse({ message: err.message }, 'error');
  }
}

// ── doGet — health check + optional stats ────────────────────────
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const count = Math.max(0, sheet.getLastRow() - 1); // trừ header

    return jsonResponse({
      message:   'Survey S02 backend is alive',
      responses: count,
      time:      new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse({ message: err.message }, 'error');
  }
}

// ── clearSheet — chạy thủ công để reset data (không expose qua HTTP) ──
function clearSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return;
  // Giữ header, xóa data từ row 2
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  Logger.log('Sheet cleared. Headers preserved.');
}

// ── seedTestData — tạo data mẫu để test results.html ─────────────
function seedTestData() {
  const sheet  = getOrCreateSheet();
  const now    = new Date();

  const samples = [
    {
      ts:    Utilities.formatDate(new Date(now - 3600000*3), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm'),
      name:  'Minh Nguyễn',
      q1:    'SE',
      roleq: 'se_demo;se_objection',
      q3:    'daily',
      q4:    '3',
      q5:    'trust;stakeholder',
      q6:    'KH hỏi nhiều về giá nhưng không chốt được, sau 3 buổi demo vẫn pending',
      q7:    'handoff;timing',
      q8:    'role;case',
      q9:    'Làm sao biết KH đang thật sự cân nhắc hay chỉ so sánh giá?',
    },
    {
      ts:    Utilities.formatDate(new Date(now - 3600000*2), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm'),
      name:  'Linh Trần',
      q1:    'DA',
      roleq: 'da_need;da_story',
      q3:    'weekly',
      q4:    '2',
      q5:    'need;translate',
      q6:    'KH nói muốn báo cáo realtime nhưng thực ra chỉ cần export tuần 1 lần',
      q7:    'language;feedback',
      q8:    'data;toolkit',
      q9:    'DA nên tham gia từ bước nào trong quy trình SE?',
    },
    {
      ts:    Utilities.formatDate(new Date(now - 3600000*1), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm'),
      name:  'Hùng Lê',
      q1:    'DE',
      roleq: 'de_requirement;de_context',
      q3:    'rare',
      q4:    '2',
      q5:    'translate;signal',
      q6:    '',
      q7:    'handoff;language',
      q8:    'role;data',
      q9:    'DE hiểu KH qua data như thế nào khi không trực tiếp gặp họ?',
    },
    {
      ts:    Utilities.formatDate(new Date(now - 1800000), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm'),
      name:  'Ẩn danh',
      q1:    'SE;DA',
      roleq: 'se_followup;da_trust;da_scope',
      q3:    'daily',
      q4:    '4',
      q5:    'stakeholder;segment',
      q6:    'Deal SME 50 nhân viên vs Enterprise 500 nhân viên — approach hoàn toàn khác nhau nhưng chưa có playbook',
      q7:    'timing;feedback',
      q8:    'segment;case',
      q9:    '',
    },
    {
      ts:    Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm'),
      name:  'Phương Phạm',
      q1:    'DA',
      roleq: 'da_need;da_handoff',
      q3:    'monthly',
      q4:    '3',
      q5:    'need;trust;signal',
      q6:    'Nhận brief từ SE thiếu context — không biết KH đang ở giai đoạn nào của deal',
      q7:    'handoff',
      q8:    'role;toolkit',
      q9:    'Có template handoff nào chuẩn từ SE sang DA không?',
    },
  ];

  samples.forEach(s => {
    sheet.appendRow([
      s.ts, s.name, s.q1, s.roleq, s.q3,
      s.q4, s.q5,  s.q6, s.q7,   s.q8, s.q9,
    ]);
  });

  Logger.log('Seeded ' + samples.length + ' test responses.');
}
