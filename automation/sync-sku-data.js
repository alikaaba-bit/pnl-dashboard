/**
 * Smart Incremental SKU Data Sync
 *
 * FIRST RUN: Backfills data from 2023-01-01 to today
 * DAILY RUNS: Only fetches yesterday's data and appends
 *
 * Run with:
 *   node sync-sku-data.js backfill  (first time - gets all historical data)
 *   node sync-sku-data.js daily     (subsequent runs - only yesterday)
 */

const axios = require('axios');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  APP_ID: process.env.LINGXING_APP_ID || 'ak_fK9KCx7hPyvEg',
  APP_SECRET: process.env.LINGXING_APP_SECRET || 'xXxCNnqfdn8nB8cxIzHG4w==',
  BASE_URL: 'https://openapi.lingxing.com',
  OUTPUT_PATH: path.join(__dirname, '..', 'src', 'sku-data.json'),
  META_PATH: path.join(__dirname, '..', 'src', 'sku-data-meta.json'),

  STORES: [
    { sid: 4795, name: 'Fomin-US', brand: 'Fomin' },
    { sid: 4799, name: 'Fomin-CA', brand: 'Fomin' },
    { sid: 4800, name: 'Fomin-MX', brand: 'Fomin' },
    { sid: 4442, name: 'HOP-US', brand: 'House of Party' },
    { sid: 4443, name: 'HOP-CA', brand: 'House of Party' },
    { sid: 4444, name: 'HOP-MX', brand: 'House of Party' },
    { sid: 4817, name: 'Function-labs-US', brand: 'Functions Labs' },
    { sid: 4951, name: 'Soulmama-US', brand: 'Soulmama' },
    { sid: 6346, name: 'ROOFUS-US', brand: 'Roofus Pet' },
    { sid: 184, name: 'andro-US', brand: 'Custom Products' }
  ]
};

function generateTokenSign(timestamp) {
  return CryptoJS.MD5(CONFIG.APP_ID + CONFIG.APP_SECRET + timestamp).toString();
}

function generateApiSign(params) {
  const filtered = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === null) filtered[k] = 'null';
    else if (typeof v === 'boolean') filtered[k] = v ? 'true' : 'false';
    else if (typeof v === 'object') filtered[k] = JSON.stringify(v);
    else if (v !== '') filtered[k] = String(v);
  }
  const sortedKeys = Object.keys(filtered).sort();
  const paramStr = sortedKeys.map(k => k + '=' + filtered[k]).join('&');
  const md5Hash = CryptoJS.MD5(paramStr).toString().toUpperCase();
  const key = CryptoJS.enc.Utf8.parse(CONFIG.APP_ID.padEnd(16, '\0').slice(0, 16));
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
    CONFIG.BASE_URL + '/api/auth-server/oauth/access-token',
    new URLSearchParams({
      appId: CONFIG.APP_ID,
      appSecret: CONFIG.APP_SECRET,
      timestamp: timestamp.toString(),
      sign: sign
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return response.data.data.access_token;
}

async function fetchSkuDataForDateRange(token, startDate, endDate) {
  console.log(`  Fetching SKU data: ${startDate} to ${endDate}`);

  let allRecords = [];
  let offset = 0;
  const batchSize = 1000; // Fetch 1000 at a time
  let hasMore = true;

  // Keep fetching until no more records
  while (hasMore) {
    const params = { startDate, endDate, offset, length: batchSize };
    const ts = Math.floor(Date.now() / 1000).toString();
    const authParams = { access_token: token, app_key: CONFIG.APP_ID, timestamp: ts };
    authParams.sign = generateApiSign({ ...authParams, ...params });

    try {
      const response = await axios.post(
        CONFIG.BASE_URL + '/bd/profit/report/open/report/msku/list',
        params,
        { params: authParams }
      );

      const records = response.data.data.records || response.data.data.list || [];

      if (records.length === 0) {
        hasMore = false;
      } else {
        allRecords = allRecords.concat(records);
        offset += batchSize;

        // If we got less than batchSize, we're done
        if (records.length < batchSize) {
          hasMore = false;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`  ⚠️ Error at offset ${offset}: ${error.message}`);
      hasMore = false;
    }
  }

  console.log(`  ✓ Fetched ${allRecords.length} SKU records (${Math.ceil(allRecords.length / batchSize)} batches)`);
  return allRecords;
}

function processRecords(records, existingSkuData = {}) {
  records.forEach(r => {
    const store = CONFIG.STORES.find(s => s.sid === r.sid);

    // For MSKU endpoint, use msku, sellerSku, or localSku
    const sku = r.msku || r.sellerSku || r.localSku || r.sku || 'UNKNOWN';

    // Skip if still unknown
    if (!sku || sku === 'UNKNOWN' || sku === '') return;

    const key = `${store?.brand || 'Unknown'}-${sku}`;

    if (!existingSkuData[key]) {
      existingSkuData[key] = {
        sku: sku,
        productName: r.productName || r.title || r.productTitle || sku,
        brand: store?.brand || 'Unknown',
        marketplace: store?.name || '',
        units: 0,
        revenue: 0,
        cogs: 0,
        refunds: 0,
        refundRate: 0,
        fbaFee: 0,
        adSpend: 0,
        adSales: 0,
        storage: 0,
        grossProfit: 0,
        margin: 0,
        acos: 0
      };
    }

    // Aggregate metrics
    existingSkuData[key].units += r.totalSalesQuantity || 0;
    existingSkuData[key].revenue += r.totalSalesAmount || 0;
    existingSkuData[key].cogs += Math.abs(r.cgPriceTotal || 0);
    existingSkuData[key].refunds += Math.abs(r.totalSalesRefunds || 0);
    existingSkuData[key].fbaFee += Math.abs(r.totalFbaDeliveryFee || 0);
    existingSkuData[key].adSpend += Math.abs(r.totalAdsCost || 0);
    existingSkuData[key].adSales += r.totalAdsOrdersSalesAmount || r.totalAdsSales || 0;
    existingSkuData[key].storage += Math.abs(r.totalStorageFee || 0);
    existingSkuData[key].grossProfit += r.grossProfit || 0;
  });

  return existingSkuData;
}

function formatSkuData(skuData) {
  const skuArray = Object.values(skuData).map(s => {
    const margin = s.revenue > 0 ? (s.grossProfit / s.revenue) * 100 : 0;
    const refundRate = s.revenue > 0 ? (s.refunds / s.revenue) * 100 : 0;
    const acos = s.adSales > 0 ? (s.adSpend / s.adSales) * 100 : 0;

    return {
      sku: s.sku,
      productName: s.productName.substring(0, 100),
      brand: s.brand,
      marketplace: s.marketplace,
      units: Math.round(s.units),
      revenue: Math.round(s.revenue * 100) / 100,
      cogs: Math.round(s.cogs * 100) / 100,
      refunds: Math.round(s.refunds * 100) / 100,
      refundRate: Math.round(refundRate * 10) / 10,
      fbaFee: Math.round(s.fbaFee * 100) / 100,
      adSpend: Math.round(s.adSpend * 100) / 100,
      adSales: Math.round(s.adSales * 100) / 100,
      acos: Math.round(acos * 10) / 10,
      storage: Math.round(s.storage * 100) / 100,
      grossProfit: Math.round(s.grossProfit * 100) / 100,
      margin: Math.round(margin * 10) / 10
    };
  });

  skuArray.sort((a, b) => b.revenue - a.revenue);
  return skuArray;
}

async function backfill() {
  console.log('🔄 BACKFILL MODE: Fetching all historical data from 2023-01-01');
  console.log('=' .repeat(80));

  const token = await getAccessToken();
  console.log('✓ Got access token\n');

  let skuData = {};

  // Fetch data in monthly chunks from 2023-01-01 to today
  const startYear = 2023;
  const endDate = new Date();
  const currentYear = endDate.getFullYear();
  const currentMonth = endDate.getMonth(); // 0-indexed

  for (let year = startYear; year <= currentYear; year++) {
    const startMonth = year === startYear ? 0 : 0; // Start from January
    const endMonth = year === currentYear ? currentMonth : 11; // End at December or current month

    for (let month = startMonth; month <= endMonth; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0); // Last day of month

      const startDateStr = monthStart.toISOString().split('T')[0];
      const endDateStr = monthEnd.toISOString().split('T')[0];

      console.log(`\n📅 ${year}-${String(month + 1).padStart(2, '0')}`);

      try {
        const records = await fetchSkuDataForDateRange(token, startDateStr, endDateStr);
        skuData = processRecords(records, skuData);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`  ❌ Error fetching ${startDateStr}: ${error.message}`);
      }
    }
  }

  const skuArray = formatSkuData(skuData);

  // Save data
  fs.writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(skuArray, null, 2));

  // Save metadata
  const meta = {
    lastUpdated: new Date().toISOString(),
    lastFetchDate: endDate.toISOString().split('T')[0],
    skuCount: skuArray.length,
    totalRevenue: skuArray.reduce((sum, s) => sum + s.revenue, 0),
    totalUnits: skuArray.reduce((sum, s) => sum + s.units, 0),
    mode: 'backfill',
    dateRange: {
      start: '2023-01-01',
      end: endDate.toISOString().split('T')[0]
    }
  };
  fs.writeFileSync(CONFIG.META_PATH, JSON.stringify(meta, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('✅ BACKFILL COMPLETE');
  console.log(`   SKUs: ${skuArray.length}`);
  console.log(`   Total Revenue: $${meta.totalRevenue.toLocaleString()}`);
  console.log(`   Total Units: ${meta.totalUnits.toLocaleString()}`);
  console.log(`   Date Range: ${meta.dateRange.start} to ${meta.dateRange.end}`);
}

async function daily() {
  console.log('📅 DAILY MODE: Fetching yesterday\'s data only');
  console.log('=' .repeat(80));

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  console.log(`Date: ${yesterdayStr}\n`);

  const token = await getAccessToken();
  console.log('✓ Got access token\n');

  // Load existing data
  let existingSkuData = {};
  if (fs.existsSync(CONFIG.OUTPUT_PATH)) {
    const existingArray = JSON.parse(fs.readFileSync(CONFIG.OUTPUT_PATH, 'utf8'));
    // Convert array back to map
    existingArray.forEach(sku => {
      const key = `${sku.brand}-${sku.sku}`;
      existingSkuData[key] = sku;
    });
    console.log(`✓ Loaded ${existingArray.length} existing SKUs\n`);
  } else {
    console.log('⚠️  No existing data found. Run "backfill" first!\n');
  }

  // Fetch yesterday's data
  const records = await fetchSkuDataForDateRange(token, yesterdayStr, yesterdayStr);
  existingSkuData = processRecords(records, existingSkuData);

  const skuArray = formatSkuData(existingSkuData);

  // Save updated data
  fs.writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(skuArray, null, 2));

  // Update metadata
  const meta = {
    lastUpdated: new Date().toISOString(),
    lastFetchDate: yesterdayStr,
    skuCount: skuArray.length,
    totalRevenue: skuArray.reduce((sum, s) => sum + s.revenue, 0),
    totalUnits: skuArray.reduce((sum, s) => sum + s.units, 0),
    mode: 'daily'
  };
  fs.writeFileSync(CONFIG.META_PATH, JSON.stringify(meta, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('✅ DAILY UPDATE COMPLETE');
  console.log(`   SKUs: ${skuArray.length}`);
  console.log(`   Yesterday: ${yesterdayStr}`);
  console.log(`   New Records: ${records.length}`);
}

// Main
const mode = process.argv[2] || 'daily';

if (mode === 'backfill') {
  backfill().catch(console.error);
} else if (mode === 'daily') {
  daily().catch(console.error);
} else {
  console.error('Usage: node sync-sku-data.js [backfill|daily]');
  process.exit(1);
}
