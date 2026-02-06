/**
 * Export SKU data from Google Sheets to JSON for dashboard
 * Run with: node export-sku-data.js
 *
 * Required env vars:
 * - GOOGLE_SHEETS_ID
 * - GOOGLE_SERVICE_ACCOUNT_KEY (JSON string)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  SHEETS_ID: process.env.GOOGLE_SHEETS_ID || '1qLZUGYRGOWnZyEL_75pe5NE8hDyTRA_27ziw2-vr374',
  OUTPUT_PATH: path.join(__dirname, '..', 'src', 'sku-data.json')
};

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  return google.sheets({ version: 'v4', auth });
}

async function fetchMskuData() {
  const sheets = await getSheets();

  // Fetch data from Daily_MSKU sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.SHEETS_ID,
    range: 'Daily_MSKU!A:I' // Date, MSKU, Revenue, Units, Ad Spend, Ad Sales, ACoS %, Gross Profit, Margin %
  });

  const rows = response.data.values || [];

  if (rows.length === 0) {
    console.log('No data found in Daily_MSKU sheet');
    return [];
  }

  // First row is headers
  const headers = rows[0];
  console.log('Headers:', headers);

  // Process data rows
  const skuData = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[1]) continue; // Skip if no MSKU

    const sku = row[1];
    const revenue = parseFloat(row[2]) || 0;
    const units = parseInt(row[3]) || 0;
    const adSpend = parseFloat(row[4]) || 0;
    const adSales = parseFloat(row[5]) || 0;
    const acosStr = row[6] || '0%';
    const acos = parseFloat(acosStr.replace('%', '')) || 0;
    const grossProfit = parseFloat(row[7]) || 0;
    const marginStr = row[8] || '0%';
    const margin = parseFloat(marginStr.replace('%', '')) || 0;

    // Aggregate by SKU (sum across days)
    if (!skuData[sku]) {
      skuData[sku] = {
        sku,
        product: sku, // We don't have product names in this sheet
        brand: determineBrand(sku),
        revenue: 0,
        units: 0,
        adSpend: 0,
        adSales: 0,
        acos: 0,
        grossProfit: 0,
        margin: 0
      };
    }

    skuData[sku].revenue += revenue;
    skuData[sku].units += units;
    skuData[sku].adSpend += adSpend;
    skuData[sku].adSales += adSales;
    skuData[sku].grossProfit += grossProfit;
  }

  // Calculate averages and format
  const skuArray = Object.values(skuData).map(s => {
    const acos = s.adSales > 0 ? (s.adSpend / s.adSales * 100) : 0;
    const margin = s.revenue > 0 ? (s.grossProfit / s.revenue * 100) : 0;

    return {
      sku: s.sku,
      product: s.product,
      brand: s.brand,
      revenue: Math.round(s.revenue * 100) / 100,
      units: s.units,
      adSpend: Math.round(s.adSpend * 100) / 100,
      adSales: Math.round(s.adSales * 100) / 100,
      acos: Math.round(acos * 10) / 10,
      grossProfit: Math.round(s.grossProfit * 100) / 100,
      margin: Math.round(margin * 10) / 10
    };
  });

  // Sort by revenue descending
  skuArray.sort((a, b) => b.revenue - a.revenue);

  return skuArray;
}

function determineBrand(sku) {
  const skuUpper = sku.toUpperCase();
  if (skuUpper.startsWith('FOM-')) return 'Fomin';
  if (skuUpper.startsWith('HOP-')) return 'House of Party';
  if (skuUpper.includes('FUNCTION')) return 'Functions Labs';
  if (skuUpper.includes('ROOFUS') || skuUpper.includes('RFP-')) return 'Roofus Pet';
  if (skuUpper.includes('LUNA') || skuUpper.startsWith('LUN-')) return 'Luna Naturals';
  return 'Other';
}

async function run() {
  console.log('📊 Exporting SKU data from Google Sheets...');

  try {
    const skuData = await fetchMskuData();

    console.log(`✅ Fetched ${skuData.length} SKUs`);
    console.log('\nTop 5 SKUs by Revenue:');
    skuData.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.sku}: $${s.revenue.toLocaleString()} revenue, ${s.units} units`);
    });

    // Write to JSON file
    fs.writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(skuData, null, 2));
    console.log(`\n✅ Saved to ${CONFIG.OUTPUT_PATH}`);

    // Also create a timestamp file
    const timestamp = {
      lastUpdated: new Date().toISOString(),
      skuCount: skuData.length,
      totalRevenue: skuData.reduce((sum, s) => sum + s.revenue, 0),
      totalUnits: skuData.reduce((sum, s) => sum + s.units, 0)
    };

    const metaPath = path.join(__dirname, '..', 'src', 'sku-data-meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(timestamp, null, 2));
    console.log(`✅ Metadata saved to ${metaPath}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

run();
