/**
 * Lingxing → Google Sheets Sync Script (Node.js)
 *
 * This is the production-ready version with proper AES encryption.
 * Run with: node sync-to-sheets.js
 *
 * Required env vars:
 * - LINGXING_APP_ID
 * - LINGXING_APP_SECRET
 * - GOOGLE_SHEETS_ID
 * - GOOGLE_SERVICE_ACCOUNT_KEY (JSON string)
 */

const axios = require('axios');
const CryptoJS = require('crypto-js');
const { google } = require('googleapis');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  APP_ID: process.env.LINGXING_APP_ID || "ak_fK9KCx7hPyvEg",
  APP_SECRET: process.env.LINGXING_APP_SECRET || "xXxCNnqfdn8nB8cxIzHG4w==",
  BASE_URL: "https://openapi.lingxing.com",
  SHEETS_ID: process.env.GOOGLE_SHEETS_ID,

  STORES: [
    { sid: 4795, name: "Fomin-US" },
    { sid: 4799, name: "Fomin-CA" },
    { sid: 4800, name: "Fomin-MX" },
    { sid: 4442, name: "HOP-US" },
    { sid: 4443, name: "HOP-CA" },
    { sid: 4444, name: "HOP-MX" },
    { sid: 4817, name: "Function-labs-US" },
    { sid: 4951, name: "Soulmama-US" },
    { sid: 6346, name: "ROOFUS-US" },
    { sid: 184, name: "andro-US" }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// LINGXING AUTH (Same as MCP server)
// ═══════════════════════════════════════════════════════════════════════════

function generateTokenSign(timestamp) {
  return CryptoJS.MD5(`${CONFIG.APP_ID}${CONFIG.APP_SECRET}${timestamp}`).toString();
}

function generateApiSign(params) {
  const filtered = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === null) filtered[k] = "null";
    else if (typeof v === "boolean") filtered[k] = v ? "true" : "false";
    else if (typeof v === "object") filtered[k] = JSON.stringify(v);
    else if (v !== "") filtered[k] = String(v);
  }
  const sortedKeys = Object.keys(filtered).sort();
  const paramStr = sortedKeys.map(k => `${k}=${filtered[k]}`).join("&");
  const md5Hash = CryptoJS.MD5(paramStr).toString().toUpperCase();
  const key = CryptoJS.enc.Utf8.parse(CONFIG.APP_ID.padEnd(16, "\0").slice(0, 16));
  const encrypted = CryptoJS.AES.encrypt(md5Hash, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

async function getAccessToken() {
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateTokenSign(timestamp);

  const response = await axios.post(
    `${CONFIG.BASE_URL}/api/auth-server/oauth/access-token`,
    new URLSearchParams({
      appId: CONFIG.APP_ID,
      appSecret: CONFIG.APP_SECRET,
      timestamp: timestamp.toString(),
      sign: sign
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  if ((response.data.code === 0 || response.data.code === "200" || response.data.code === 200) && response.data.data) {
    return response.data.data.access_token;
  }
  throw new Error(`Token failed: ${JSON.stringify(response.data)}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════

async function fetchProfitReport(token, startDate, endDate) {
  const params = { startDate, endDate };
  const ts = Math.floor(Date.now() / 1000).toString();
  const authParams = { access_token: token, app_key: CONFIG.APP_ID, timestamp: ts };
  authParams.sign = generateApiSign({ ...authParams, ...params });

  const response = await axios.post(
    `${CONFIG.BASE_URL}/bd/profit/report/open/report/seller/list`,
    params,
    { params: authParams }
  );

  return response.data;
}

async function fetchMskuReport(token, startDate, endDate) {
  const params = { startDate, endDate, offset: 0, length: 1000 };
  const ts = Math.floor(Date.now() / 1000).toString();
  const authParams = { access_token: token, app_key: CONFIG.APP_ID, timestamp: ts };
  authParams.sign = generateApiSign({ ...authParams, ...params });

  const response = await axios.post(
    `${CONFIG.BASE_URL}/bd/profit/report/open/report/msku/list`,
    params,
    { params: authParams }
  );

  return response.data;
}

// Orders API - for real-time daily tracking (includes pending)
async function fetchOrders(token, startDate, endDate) {
  const params = {
    start_date: startDate,
    end_date: endDate,
    offset: 0,
    length: 1000
  };
  const ts = Math.floor(Date.now() / 1000).toString();
  const authParams = { access_token: token, app_key: CONFIG.APP_ID, timestamp: ts };
  authParams.sign = generateApiSign({ ...authParams, ...params });

  const response = await axios.post(
    `${CONFIG.BASE_URL}/erp/sc/data/mws/orders`,
    params,
    { params: authParams }
  );

  return response.data;
}

// Monthly settlement/profit report - for finance P&L
async function fetchMonthlySettlement(token, startDate, endDate) {
  const params = { startDate, endDate };
  const ts = Math.floor(Date.now() / 1000).toString();
  const authParams = { access_token: token, app_key: CONFIG.APP_ID, timestamp: ts };
  authParams.sign = generateApiSign({ ...authParams, ...params });

  const response = await axios.post(
    `${CONFIG.BASE_URL}/bd/profit/report/open/report/seller/list`,
    params,
    { params: authParams }
  );

  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS
// ═══════════════════════════════════════════════════════════════════════════

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

async function writeToSheet(sheets, sheetName, headers, rows) {
  const values = [headers, ...rows];

  // First, try to create the sheet if it doesn't exist
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: CONFIG.SHEETS_ID,
      resource: {
        requests: [{
          addSheet: {
            properties: { title: sheetName }
          }
        }]
      }
    });
    console.log(`Created new sheet: ${sheetName}`);
  } catch (e) {
    // Sheet already exists, that's fine
  }

  // Clear existing data
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: CONFIG.SHEETS_ID,
      range: `${sheetName}!A:Z`
    });
  } catch (e) {
    // Ignore clear errors
  }

  // Write new data
  await sheets.spreadsheets.values.update({
    spreadsheetId: CONFIG.SHEETS_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values }
  });

  console.log(`✓ Wrote ${rows.length} rows to ${sheetName}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SYNC
// ═══════════════════════════════════════════════════════════════════════════

async function syncDaily() {
  console.log('Starting daily sync (Orders API - real-time)...');
  console.log('Time:', new Date().toISOString());

  const token = await getAccessToken();
  console.log('✓ Got Lingxing token');

  const sheets = await getSheets();
  console.log('✓ Connected to Google Sheets');

  // Today's date for orders (real-time data)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Also get yesterday for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  console.log(`Fetching orders for: ${yesterdayStr} to ${todayStr}`);

  // Fetch orders (real-time, includes pending)
  const ordersData = await fetchOrders(token, yesterdayStr, todayStr);
  console.log('Orders API response:', JSON.stringify(ordersData).substring(0, 500));

  if ((ordersData.code === 0 || ordersData.code === "200" || ordersData.code === 200) && ordersData.data) {
    const orders = ordersData.data.list || ordersData.data.records || ordersData.data || [];

    // Aggregate by store
    const storeAgg = {};
    orders.forEach(o => {
      const sid = o.sid || o.sellerId || 'unknown';
      if (!storeAgg[sid]) {
        storeAgg[sid] = { orders: 0, units: 0, revenue: 0, pending: 0, shipped: 0 };
      }
      storeAgg[sid].orders++;
      storeAgg[sid].units += o.quantity || o.itemQuantity || 1;
      storeAgg[sid].revenue += parseFloat(o.amount || o.orderTotal || o.itemPrice || 0);
      if (o.orderStatus === 'Pending' || o.status === 'Pending') {
        storeAgg[sid].pending++;
      } else {
        storeAgg[sid].shipped++;
      }
    });

    const headers = ['Date', 'SID', 'Store', 'Orders', 'Units', 'Revenue', 'Pending', 'Shipped'];
    const rows = Object.entries(storeAgg).map(([sid, data]) => {
      const store = CONFIG.STORES.find(s => String(s.sid) === String(sid));
      return [
        todayStr,
        sid,
        store?.name || `SID ${sid}`,
        data.orders,
        data.units,
        data.revenue.toFixed(2),
        data.pending,
        data.shipped
      ];
    });

    if (rows.length > 0) {
      await writeToSheet(sheets, 'Daily_Orders', headers, rows);
    } else {
      console.log('No orders found for date range');
    }
  }

  // Also fetch MSKU data for product-level tracking
  const mskuData = await fetchMskuReport(token, yesterdayStr, yesterdayStr);
  console.log('MSKU API response:', JSON.stringify(mskuData).substring(0, 500));

  if ((mskuData.code === 0 || mskuData.code === "200" || mskuData.code === 200) && mskuData.data) {
    const records = mskuData.data.list || mskuData.data.records || [];

    const headers = [
      'Date', 'MSKU', 'Revenue', 'Units', 'Ad Spend', 'Ad Sales', 'ACoS %', 'Gross Profit', 'Margin %'
    ];

    const rows = records.slice(0, 500).map(r => [
      yesterdayStr,
      r.msku || r.sellerSku || '',
      r.totalSalesAmount || 0,
      r.totalSalesQuantity || 0,
      Math.abs(r.totalAdsCost || 0),
      r.totalAdsSales || 0,
      r.totalAdsSales ? ((Math.abs(r.totalAdsCost) / r.totalAdsSales) * 100).toFixed(1) + '%' : '0%',
      r.grossProfit || 0,
      ((r.grossRate || 0) * 100).toFixed(1) + '%'
    ]);

    await writeToSheet(sheets, 'Daily_MSKU', headers, rows);
  }

  console.log('✓ Daily sync completed!');
}

// Monthly P&L sync - uses settlement data for finance
// Runs on 3rd of each month, pulls PREVIOUS month's data
async function syncMonthly() {
  console.log('Starting monthly P&L sync (Settlement data)...');
  console.log('Time:', new Date().toISOString());

  const token = await getAccessToken();
  console.log('✓ Got Lingxing token');

  const sheets = await getSheets();
  console.log('✓ Connected to Google Sheets');

  // PREVIOUS month range (finance runs on 3rd, needs last month's data)
  const now = new Date();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const startDate = startOfPrevMonth.toISOString().split('T')[0];
  const endDate = endOfPrevMonth.toISOString().split('T')[0];
  const monthName = startOfPrevMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  console.log(`Fetching settlement data for: ${startDate} to ${endDate}`);

  // Fetch settlement/profit data (confirmed financials)
  const profitData = await fetchMonthlySettlement(token, startDate, endDate);
  console.log('Settlement API response:', JSON.stringify(profitData).substring(0, 500));

  if ((profitData.code === 0 || profitData.code === "200" || profitData.code === 200) && profitData.data) {
    const records = profitData.data.records || [];

    const headers = [
      'Month', 'SID', 'Store', 'Revenue', 'Units', 'COGS', 'Refund Fee',
      'FBA Fee', 'Ad Spend', 'Storage', 'Gross Profit', 'Margin %'
    ];

    const rows = records.map(r => {
      const store = CONFIG.STORES.find(s => s.sid === r.sid);
      return [
        monthName,
        r.sid,
        store?.name || `SID ${r.sid}`,
        r.totalSalesAmount || 0,
        r.totalSalesQuantity || 0,
        Math.abs(r.cgPriceTotal || 0),
        Math.abs(r.totalSalesRefunds || 0),
        Math.abs(r.totalFbaDeliveryFee || 0),
        Math.abs(r.totalAdsCost || 0),
        Math.abs(r.totalStorageFee || 0),
        r.grossProfit || 0,
        ((r.grossRate || 0) * 100).toFixed(1) + '%'
      ];
    });

    await writeToSheet(sheets, 'Monthly_PnL', headers, rows);
  }

  console.log('✓ Monthly P&L sync completed!');
}

// Run based on command line argument
const mode = process.argv[2] || 'daily';

if (mode === 'monthly') {
  syncMonthly().catch(console.error);
} else if (mode === 'both') {
  syncDaily().then(() => syncMonthly()).catch(console.error);
} else {
  syncDaily().catch(console.error);
}
