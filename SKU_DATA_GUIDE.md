# SKU-Level Breakdown - Setup Guide

## ✅ What's Been Added

1. **New Tab**: "SKU Breakdown" - 7th tab in your dashboard
2. **SKU Component**: Full-featured product-level analysis
3. **Data Scripts**: Two ways to populate SKU data

---

## 🎯 Features

### SKU Breakdown Tab Shows:
- **Summary Cards**: Total SKUs, Revenue, Units, Avg Margin, Ad Spend
- **Top 10 Chart**: Visual ranking of top products
- **Detailed Table**: Up to 50 SKUs with full metrics
- **Filters**:
  - Search by SKU or product name
  - Filter by brand
  - Sort by revenue, units, profit, margin, or ACoS
- **Color Coding**: Green/yellow/red indicators for performance

---

## 📊 How to Populate Data

Your sync script (`automation/sync-to-sheets.js`) **already pulls** SKU data to the `Daily_MSKU` sheet in Google Sheets!

### Option 1: Export from Google Sheets (Recommended)

```bash
cd ~/pnl-dashboard
node automation/export-sku-data.js
```

**What it does:**
- Reads `Daily_MSKU` sheet from Google Sheets
- Aggregates SKUs across all dates
- Calculates totals for revenue, units, ad spend, profit
- Saves to `src/sku-data.json`
- Dashboard automatically loads this file

**Required env vars:**
```bash
export GOOGLE_SHEETS_ID="1qLZUGYRGOWnZyEL_75pe5NE8hDyTRA_27ziw2-vr374"
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Option 2: Direct LingXing API (Alternative)

```bash
node automation/fetch-sku-data.js
```

**What it does:**
- Fetches last 90 days from LingXing API
- Pulls product-level data directly
- Aggregates by SKU
- Saves to `src/sku-data.json`

**Required env vars:**
```bash
export LINGXING_APP_ID="ak_fK9KCx7hPyvEg"
export LINGXING_APP_SECRET="xXxCNnqfdn8nB8cxIzHG4w=="
```

---

## 🔄 Automation Setup

### Daily Updates

Add to your GitHub Actions workflow (`.github/workflows/sync.yml`):

```yaml
name: Update SKU Data
on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM daily
  workflow_dispatch:

jobs:
  update-sku-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install

      - name: Export SKU Data
        env:
          GOOGLE_SHEETS_ID: ${{ secrets.GOOGLE_SHEETS_ID }}
          GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}
        run: node automation/export-sku-data.js

      - name: Commit Data
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add src/sku-data.json src/sku-data-meta.json
          git commit -m "Update SKU data $(date +'%Y-%m-%d')" || echo "No changes"
          git push
```

---

## 📁 Data Structure

The `sku-data.json` file contains an array of SKU objects:

```json
[
  {
    "sku": "FOM-NTOW-50PK-RTL",
    "product": "Clean Facial Towels 50 Pack",
    "brand": "Fomin",
    "revenue": 125430.50,
    "units": 12543,
    "adSpend": 8500.25,
    "adSales": 32000.00,
    "acos": 26.6,
    "grossProfit": 38000.00,
    "margin": 30.3
  }
]
```

---

## 🚀 Test It Now

1. **Run the export script:**
   ```bash
   cd ~/pnl-dashboard
   node automation/export-sku-data.js
   ```

2. **Check the data:**
   ```bash
   cat src/sku-data.json | head -50
   ```

3. **Start the dashboard locally:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   - Go to http://localhost:3000
   - Click the **"SKU Breakdown"** tab (rightmost tab)
   - You should see your SKU data!

---

## 📋 Checklist

- [ ] Run `export-sku-data.js` to populate initial data
- [ ] Verify `src/sku-data.json` has SKU data
- [ ] Test dashboard locally (`npm start`)
- [ ] Check "SKU Breakdown" tab shows data
- [ ] Set up GitHub Actions for daily updates (optional)
- [ ] Deploy to GitHub Pages

---

## 🐛 Troubleshooting

### "No data found in Daily_MSKU sheet"
- Your sync script needs to run first: `node automation/sync-to-sheets.js daily`
- Check that `Daily_MSKU` sheet exists in Google Sheets
- Verify MSKU data is being written by the sync

### "Cannot find module './sku-data.json'"
- Run `node automation/export-sku-data.js` to create the file
- The placeholder `[]` file exists but needs real data

### "Unauthorized" when accessing Google Sheets
- Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is set correctly
- Check service account has access to the Google Sheet
- Share the sheet with service account email

### SKU data looks wrong
- Check date range in `fetchMskuData` function
- Verify `Daily_MSKU` sheet has correct columns
- Look at the `sku-data-meta.json` file for summary stats

---

## 📊 Next Steps

Once you have SKU data working:

1. **Connect to Petra Mind**: Export SKU data to petra-mind for SQL analytics
2. **Add Product Names**: Enhance with full product names from LingXing
3. **Add Images**: Pull product images for visual dashboard
4. **Trend Analysis**: Show SKU performance over time
5. **Inventory Alerts**: Flag low-stock or high-refund SKUs

---

## 💡 Pro Tips

- Run the export weekly to keep data fresh
- Filter by brand to see brand-specific top products
- Sort by margin to find most profitable SKUs
- Sort by acos to identify which products need ad optimization
- Use search to quickly find specific SKUs

---

**Questions?** Check the automation scripts or create an issue on GitHub!

**Last Updated:** February 5, 2026
