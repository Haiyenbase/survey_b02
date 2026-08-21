# Survey S02 — Hiểu khách hàng
Base.vn Training Series 2026

## Files
```
index.html    ← form khảo sát (trang chính)
results.html  ← dashboard kết quả
Code.gs       ← dán vào Google Apps Script
```

## Deploy — 3 bước

### 1. Google Apps Script
- Tạo Google Sheet mới
- Extensions → Apps Script → dán `Code.gs` vào → Save
- Chạy `seedTestData()` để tạo data mẫu test
- Deploy → New deployment → Web App
  - Execute as: **Me**
  - Who has access: **Anyone**
- Copy **Web App URL**
- Dán vào `index.html` dòng: `const APPS_SCRIPT_URL = '...'`

### 2. Publish Google Sheet
- File → Share → Publish to web
- Chọn sheet **responses** → **CSV** → Publish
- Copy URL
- Dán vào `results.html` dòng: `const SHEET_CSV_URL = '...'`

### 3. GitHub Pages
```bash
git init
git add .
git commit -m "init survey S02"
gh repo create survey-s02 --public --push --source=.
```
- Vào repo GitHub → **Settings → Pages**
- Source: **Deploy from branch → main → / (root) → Save**
- Sau ~1 phút có URL: `https://username.github.io/survey-s02/`

## URLs sau khi deploy
| URL | Dùng cho |
|-----|----------|
| `https://username.github.io/survey-s02/` | Form cho team điền |
| `https://username.github.io/survey-s02/results.html` | Dashboard trainer xem |

## Cập nhật sau này
```bash
# Sửa file xong rồi:
git add .
git commit -m "update: ..."
git push
# GitHub Pages tự deploy lại trong ~1 phút
```
