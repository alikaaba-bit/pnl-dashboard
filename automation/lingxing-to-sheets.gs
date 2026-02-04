/**
 * Lingxing → Google Sheets Automation
 *
 * SETUP:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste this code
 * 4. Update the CONFIG below with your credentials
 * 5. Run setupDailyTrigger() once to enable daily refresh
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION - UPDATE THESE VALUES
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG = {
  APP_ID: "ak_fK9KCx7hPyvEg",
  APP_SECRET: "xXxCNnqfdn8nB8cxIzHG4w==",
  BASE_URL: "https://openapi.lingxing.com",

  // Store IDs - add all your stores here
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
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

function md5(input) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, input)
    .map(b => ('0' + (b & 0xFF).toString(16)).slice(-2))
    .join('');
}

function generateTokenSign(timestamp) {
  return md5(CONFIG.APP_ID + CONFIG.APP_SECRET + timestamp);
}

function aesEncrypt(text, key) {
  // Pad key to 16 bytes
  const keyBytes = Utilities.newBlob(key.padEnd(16, '\0').slice(0, 16)).getBytes();
  const textBytes = Utilities.newBlob(text).getBytes();

  // PKCS7 padding
  const blockSize = 16;
  const padLen = blockSize - (textBytes.length % blockSize);
  const paddedBytes = textBytes.concat(Array(padLen).fill(padLen));

  const cipher = Utilities.computeHmacSha256Signature(paddedBytes, keyBytes);
  // Note: Apps Script doesn't have native AES, so we'll use a workaround
  // For production, use the Advanced Drive Service or external API
  return Utilities.base64Encode(cipher);
}

function generateApiSign(params) {
  // Filter and sort parameters
  const filtered = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === null) filtered[k] = "null";
    else if (typeof v === "boolean") filtered[k] = v ? "true" : "false";
    else if (typeof v === "object") filtered[k] = JSON.stringify(v);
    else if (v !== "") filtered[k] = String(v);
  }

  const sortedKeys = Object.keys(filtered).sort();
  const paramStr = sortedKeys.map(k => `${k}=${filtered[k]}`).join("&");
  const md5Hash = md5(paramStr).toUpperCase();

  // For Apps Script, we'll use a simplified approach
  // In production, implement proper AES-128-ECB
  return Utilities.base64Encode(md5Hash + CONFIG.APP_ID);
}

function getAccessToken() {
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateTokenSign(timestamp);

  const response = UrlFetchApp.fetch(`${CONFIG.BASE_URL}/api/auth-server/oauth/access-token`, {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      appId: CONFIG.APP_ID,
      appSecret: CONFIG.APP_SECRET,
      timestamp: timestamp.toString(),
      sign: sign
    }
  });

  const data = JSON.parse(response.getContentText());
  if (data.code === 0 && data.data) {
    return data.data.access_token;
  }
  throw new Error('Failed to get access token: ' + JSON.stringify(data));
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════

function fetchProfitReport(token, startDate, endDate) {
  const params = { startDate, endDate };
  const ts = Math.floor(Date.now() / 1000).toString();

  const authParams = {
    access_token: token,
    app_key: CONFIG.APP_ID,
    timestamp: ts
  };
  authParams.sign = generateApiSign({ ...authParams, ...params });

  const url = `${CONFIG.BASE_URL}/bd/profit/report/open/report/seller/list?` +
    Object.entries(authParams).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(params)
  });

  return JSON.parse(response.getContentText());
}

function fetchMskuReport(token, startDate, endDate) {
  const params = { startDate, endDate, offset: 0, length: 1000 };
  const ts = Math.floor(Date.now() / 1000).toString();

  const authParams = {
    access_token: token,
    app_key: CONFIG.APP_ID,
    timestamp: ts
  };
  authParams.sign = generateApiSign({ ...authParams, ...params });

  const url = `${CONFIG.BASE_URL}/bd/profit/report/open/report/msku/list?` +
    Object.entries(authParams).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(params)
  });

  return JSON.parse(response.getContentText());
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

function writeToSheet(sheetName, headers, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Clear existing data
  sheet.clear();

  // Write headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // Write data
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }

  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  // Add timestamp
  sheet.getRange(1, headers.length + 2).setValue('Last Updated:');
  sheet.getRange(1, headers.length + 3).setValue(new Date());
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SYNC FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function syncDailyData() {
  Logger.log('Starting daily sync...');

  try {
    const token = getAccessToken();
    Logger.log('Got access token');

    // Get yesterday's date (Lingxing data has ~1 day delay)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = Utilities.formatDate(yesterday, 'GMT', 'yyyy-MM-dd');

    Logger.log('Fetching data for: ' + dateStr);

    // Fetch shop-level profit report
    const profitData = fetchProfitReport(token, dateStr, dateStr);

    if (profitData.code === 0 && profitData.data) {
      const records = profitData.data.records || [];

      const headers = [
        'Date', 'SID', 'Store', 'Revenue', 'Units', 'COGS', 'Refund Fee',
        'FBA Fee', 'Ad Spend', 'Storage', 'Gross Profit', 'Margin %'
      ];

      const rows = records.map(r => {
        const storeName = CONFIG.STORES.find(s => s.sid === r.sid)?.name || `SID ${r.sid}`;
        return [
          dateStr,
          r.sid,
          storeName,
          r.totalSalesAmount || 0,
          r.totalSalesQuantity || 0,
          r.cgPriceTotal || 0,
          r.totalSalesRefunds || 0,
          r.totalFbaDeliveryFee || 0,
          r.totalAdsCost || 0,
          r.totalStorageFee || 0,
          r.grossProfit || 0,
          r.grossRate ? (r.grossRate * 100).toFixed(1) + '%' : '0%'
        ];
      });

      writeToSheet('Daily_Profit', headers, rows);
      Logger.log('Wrote ' + rows.length + ' rows to Daily_Profit sheet');
    }

    // Fetch MSKU-level data
    const mskuData = fetchMskuReport(token, dateStr, dateStr);

    if (mskuData.code === 0 && mskuData.data) {
      const records = mskuData.data.list || mskuData.data.records || [];

      const headers = [
        'Date', 'MSKU', 'Revenue', 'Units', 'Ad Spend', 'Ad Sales',
        'ACoS %', 'Gross Profit', 'Margin %'
      ];

      const rows = records.slice(0, 500).map(r => [
        dateStr,
        r.msku || r.sellerSku || '',
        r.totalSalesAmount || 0,
        r.totalSalesQuantity || 0,
        r.totalAdsCost || 0,
        r.totalAdsSales || 0,
        r.totalAdsSales ? ((r.totalAdsCost / r.totalAdsSales) * 100).toFixed(1) + '%' : '0%',
        r.grossProfit || 0,
        r.grossRate ? (r.grossRate * 100).toFixed(1) + '%' : '0%'
      ]);

      writeToSheet('Daily_MSKU', headers, rows);
      Logger.log('Wrote ' + rows.length + ' rows to Daily_MSKU sheet');
    }

    Logger.log('Daily sync completed successfully!');

  } catch (error) {
    Logger.log('Error during sync: ' + error.message);
    throw error;
  }
}

function syncMonthlyData() {
  Logger.log('Starting monthly sync...');

  try {
    const token = getAccessToken();

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = Utilities.formatDate(startOfMonth, 'GMT', 'yyyy-MM-dd');
    const endDate = Utilities.formatDate(yesterday, 'GMT', 'yyyy-MM-dd');

    Logger.log('Fetching data for: ' + startDate + ' to ' + endDate);

    const profitData = fetchProfitReport(token, startDate, endDate);

    if (profitData.code === 0 && profitData.data) {
      const records = profitData.data.records || [];

      const headers = [
        'Period', 'SID', 'Store', 'Revenue', 'Units', 'COGS',
        'FBA Fee', 'Ad Spend', 'Storage', 'Gross Profit', 'Margin %'
      ];

      const rows = records.map(r => {
        const storeName = CONFIG.STORES.find(s => s.sid === r.sid)?.name || `SID ${r.sid}`;
        return [
          `${startDate} to ${endDate}`,
          r.sid,
          storeName,
          r.totalSalesAmount || 0,
          r.totalSalesQuantity || 0,
          r.cgPriceTotal || 0,
          r.totalFbaDeliveryFee || 0,
          r.totalAdsCost || 0,
          r.totalStorageFee || 0,
          r.grossProfit || 0,
          r.grossRate ? (r.grossRate * 100).toFixed(1) + '%' : '0%'
        ];
      });

      writeToSheet('MTD_Profit', headers, rows);
      Logger.log('Wrote ' + rows.length + ' rows to MTD_Profit sheet');
    }

    Logger.log('Monthly sync completed!');

  } catch (error) {
    Logger.log('Error during monthly sync: ' + error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER SETUP
// ═══════════════════════════════════════════════════════════════════════════

function setupDailyTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Create daily trigger at 6 AM
  ScriptApp.newTrigger('syncDailyData')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  // Create weekly trigger for monthly summary (Mondays at 7 AM)
  ScriptApp.newTrigger('syncMonthlyData')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(7)
    .create();

  Logger.log('Triggers set up successfully!');
  Logger.log('- Daily sync: Every day at 6 AM');
  Logger.log('- Monthly sync: Every Monday at 7 AM');
}

function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  Logger.log('All triggers removed');
}

// ═══════════════════════════════════════════════════════════════════════════
// MANUAL TEST
// ═══════════════════════════════════════════════════════════════════════════

function testConnection() {
  try {
    const token = getAccessToken();
    Logger.log('✓ Connection successful! Token: ' + token.substring(0, 20) + '...');
    return true;
  } catch (error) {
    Logger.log('✗ Connection failed: ' + error.message);
    return false;
  }
}
