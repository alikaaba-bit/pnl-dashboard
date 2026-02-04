# Lingxing → Google Sheets → Dashboard Automation

## Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Lingxing   │ ──── │ Google Sheets │ ──── │  Dashboard  │
│    API      │ 6 AM │  (Data Store) │ Live │   (React)   │
└─────────────┘      └──────────────┘      └─────────────┘
```

## Step 1: Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Petra Brands P&L Data"

## Step 2: Add the Automation Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy the entire contents of `lingxing-to-sheets.gs` and paste it
4. Click **Save** (Ctrl+S)

## Step 3: Configure Your Credentials

In the script, update the `CONFIG` section with your store IDs:

```javascript
const CONFIG = {
  APP_ID: "ak_fK9KCx7hPyvEg",
  APP_SECRET: "xXxCNnqfdn8nB8cxIzHG4w==",
  // Add your stores...
};
```

## Step 4: Test the Connection

1. In Apps Script, select `testConnection` from the function dropdown
2. Click **Run**
3. Check the **Execution log** for success message

## Step 5: Run First Sync

1. Select `syncDailyData` from the dropdown
2. Click **Run**
3. Grant permissions when prompted
4. Check your Google Sheet - you should see new tabs with data

## Step 6: Enable Daily Auto-Refresh

1. Select `setupDailyTrigger` from the dropdown
2. Click **Run**
3. This sets up:
   - **Daily sync** at 6 AM (profit data)
   - **Weekly sync** on Mondays at 7 AM (MTD summary)

## Step 7: Publish Sheet for Dashboard

1. In Google Sheets, go to **File → Share → Publish to web**
2. Select **Entire Document** and **CSV**
3. Click **Publish**
4. Copy the URL - you'll use this in the dashboard

## Step 8: Connect Dashboard to Live Data

Update your Dashboard.jsx to fetch from Google Sheets:

```javascript
// Replace hardcoded RAW data with:
const SHEET_URL = "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:json";

async function fetchSheetData() {
  const response = await fetch(SHEET_URL);
  const text = await response.text();
  // Parse Google Sheets JSON response
  const json = JSON.parse(text.substring(47, text.length - 2));
  return json.table.rows;
}
```

---

## Troubleshooting

### "API sign not correct" error
- The AES encryption in Apps Script is simplified
- For production, use the Node.js version instead

### No data appearing
- Lingxing data has ~1 day delay
- Check if your IP is whitelisted in Lingxing

### Trigger not running
- Go to Apps Script → Triggers (clock icon)
- Check if triggers are listed and enabled

---

## Alternative: Node.js + GitHub Actions

For more reliable automation, see `github-action.yml` which uses the full Node.js client with proper AES encryption.
