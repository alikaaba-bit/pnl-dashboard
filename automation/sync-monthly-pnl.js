/**
 * Monthly P&L Sync: Lingxing → pnl-data.json
 *
 * Fetches store-level profit data from Lingxing's seller/list API,
 * aggregates by brand, and writes to src/pnl-data.json in the exact
 * format Dashboard.jsx expects.
 *
 * Usage:
 *   node sync-monthly-pnl.js 2026 2              # Sync Feb 2026
 *   node sync-monthly-pnl.js 2026 1 2026 3       # Sync Jan–Mar 2026
 *   node sync-monthly-pnl.js current              # Sync current month
 *   node sync-monthly-pnl.js 2026 2 --debug       # Log raw API fields
 *
 * Env vars required:
 *   LINGXING_APP_ID, LINGXING_APP_SECRET
 */

const axios = require('axios');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// ── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  APP_ID: process.env.LINGXING_APP_ID,
  APP_SECRET: process.env.LINGXING_APP_SECRET,
  BASE_URL: 'https://openapi.lingxing.com',
  OUTPUT_PATH: path.join(__dirname, '..', 'src', 'pnl-data.json'),

  // Store ID → Brand mapping (aggregate multi-marketplace into one brand)
  // Verified SIDs from Lingxing API response 2026-03-18
  BRAND_MAP: {
    4795: 'Fomin',            // Fomin-US
    4799: 'Fomin',            // Fomin-CA
    4800: 'Fomin',            // Fomin-MX
    4442: 'House of Party',   // HOP-US
    4443: 'House of Party',   // HOP-CA
    4444: 'House of Party',   // HOP-MX
    4817: 'Functions Labs',   // Function-labs-US
    4818: 'Functions Labs',   // Function-labs-CA
    4819: 'Functions Labs',   // Function-labs-MX
    4951: 'Soul Mama',        // Soulmama-US
    4953: 'Soul Mama',        // Soulmama-CA/MX
    6346: 'Roofus Pet',       // ROOFUS-US
    184:  'Custom Products',  // andro-US
    185:  'Custom Products',  // andro-CA
    186:  'Custom Products',  // andro-MX
  }
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Lingxing Auth ────────────────────────────────────────────────────────────

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

  if (!response.data?.data?.access_token) {
    throw new Error('Auth failed: ' + JSON.stringify(response.data));
  }
  return response.data.data.access_token;
}

// ── Data Fetching ────────────────────────────────────────────────────────────

async function fetchSellerPnL(token, startDate, endDate) {
  let allRecords = [];
  let offset = 0;
  const batchSize = 2000;
  let hasMore = true;

  while (hasMore) {
    const params = { startDate, endDate, offset, length: batchSize };
    const ts = Math.floor(Date.now() / 1000).toString();
    const authParams = { access_token: token, app_key: CONFIG.APP_ID, timestamp: ts };
    authParams.sign = generateApiSign({ ...authParams, ...params });

    const response = await axios.post(
      CONFIG.BASE_URL + '/bd/profit/report/open/report/seller/list',
      params,
      { params: authParams }
    );

    const code = response.data.code;
    if (code !== 0 && code !== 200 && code !== '200') {
      throw new Error('API error: ' + JSON.stringify(response.data));
    }

    const records = response.data.data?.records || response.data.data?.list || [];
    allRecords = allRecords.concat(records);

    if (records.length < batchSize) {
      hasMore = false;
    } else {
      offset += batchSize;
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return allRecords;
}

// ── Field Mapping (verified against Lingxing API response 2026-03-18) ─────

function abs(v) { return Math.abs(v || 0); }

function mapRecord(r) {
  // Revenue & units
  const rev = abs(r.totalSalesAmount);
  const units = abs(r.totalSalesQuantity);

  // COGS (product cost + transport + other)
  const cost = abs(r.cgPriceTotal);

  // Referral/selling fee & refund rate
  const refFee = abs(r.platformFee);
  const refRate = r.refundsRate || 0;

  // FBA delivery
  const fba = abs(r.totalFbaDeliveryFee);

  // Ad spend — granular by type
  const sp = abs(r.adsSpCost);
  const sb = abs(r.adsSbCost) + abs(r.adsSbvCost);  // SB + SBV (video)
  const sd = abs(r.adsSdCost);

  // Ad sales — granular by type
  const spSales = abs(r.adsSpSales);
  const sbSales = abs(r.sharedAdsSbSales) + abs(r.sharedAdsSbvSales);
  const sdSales = abs(r.adsSdSales);

  // Promotions (deals, coupons, LD, vine, early reviewer)
  const deal = abs(r.promotionFee)
    + abs(r.sharedLdFee)
    + abs(r.sharedCouponFee)
    + abs(r.sharedVineFee)
    + abs(r.sharedEarlyReviewerProgramFee);

  // Storage & warehouse fees
  const storage = abs(r.totalStorageFee);
  const lts = abs(r.longTermStorageFee);
  const carrier = abs(r.sharedAmazonPartneredCarrierShipmentFee);
  const inbound = abs(r.sharedFbaInboundTransportationProgramFee)
    + abs(r.sharedFbaInboundConvenienceFee);

  // Return, disposal, removal
  const retFee = abs(r.sharedFbaCustomerReturnFee)
    + abs(r.sharedFbaTransactionCustomerReturnFee);
  const disposal = abs(r.sharedFbaDisposalFee);
  const retProc = abs(r.sharedFbaRemovalFee);
  const lowInv = abs(r.sharedFbaInboundDefectFee)
    + abs(r.sharedFbaOverageFee);

  // Adjustments & subscription
  const adj = abs(r.adjustments);
  const sub = abs(r.sharedSubscriptionFee);

  // Gross profit & margin — trust Lingxing's calculation
  const gp = r.grossProfit || 0;
  const gm = r.grossRate || 0;

  return {
    units, rev, cost, refRate, refFee, fba,
    sp, spSales, sb, sbSales, sd, sdSales,
    deal, storage, carrier, inbound, lts,
    retFee, disposal, retProc, lowInv, adj,
    depr: 0, sub, gp, gm
  };
}

// ── Brand Aggregation ────────────────────────────────────────────────────────

function aggregateByBrand(records, debug) {
  if (debug && records.length > 0) {
    console.log('\n=== DEBUG: First API record (all fields) ===');
    console.log(JSON.stringify(records[0], null, 2));
    console.log('\n=== Available fields ===');
    console.log(Object.keys(records[0]).join(', '));
    console.log('========================================\n');
  }

  const agg = {};

  for (const r of records) {
    const brand = CONFIG.BRAND_MAP[r.sid];
    if (!brand) {
      if (debug) console.log(`  Unknown SID ${r.sid}, skipping`);
      continue;
    }

    const mapped = mapRecord(r);

    if (!agg[brand]) {
      agg[brand] = { b: brand };
      for (const k of Object.keys(mapped)) agg[brand][k] = 0;
    }

    for (const [k, v] of Object.entries(mapped)) {
      if (typeof v === 'number') agg[brand][k] += v;
    }
  }

  // Finalize: recalculate rates and round
  const brands = Object.values(agg);
  for (const b of brands) {
    b.refRate = b.rev > 0 ? b.refFee / b.rev : 0;
    b.gm = b.rev > 0 ? b.gp / b.rev : 0;

    // Round monetary values to whole numbers (matches RAW format)
    for (const k of Object.keys(b)) {
      if (k === 'b') continue;
      if (k === 'refRate' || k === 'gm') {
        b[k] = Math.round(b[k] * 1000) / 1000;
      } else {
        b[k] = Math.round(b[k]);
      }
    }
  }

  // Sort: largest revenue first
  brands.sort((a, b) => b.rev - a.rev);
  return brands;
}

// ── Month Sync ───────────────────────────────────────────────────────────────

function formatPeriod(year, month) {
  return `${MONTH_NAMES[month - 1]}-${String(year).slice(2)}`;
}

function getMonthRange(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { startDate, endDate };
}

async function syncMonth(token, year, month, debug) {
  const period = formatPeriod(year, month);
  const { startDate, endDate } = getMonthRange(year, month);

  console.log(`\n--- ${period} (${startDate} to ${endDate}) ---`);

  const records = await fetchSellerPnL(token, startDate, endDate);
  console.log(`  Fetched ${records.length} records`);

  if (records.length === 0) {
    console.log('  No data returned — month may not be finalized yet');
    return null;
  }

  const brands = aggregateByBrand(records, debug);
  console.log(`  Brands: ${brands.map(b => b.b).join(', ')}`);

  for (const b of brands) {
    console.log(`    ${b.b.padEnd(18)} Rev: $${b.rev.toLocaleString().padStart(10)}  GP: $${b.gp.toLocaleString().padStart(9)}  Margin: ${(b.gm * 100).toFixed(1)}%`);
  }

  return { period, brands };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const debug = args.includes('--debug');
  const replace = args.includes('--replace');
  const cleanArgs = args.filter(a => !a.startsWith('--'));

  if (cleanArgs.length === 0 || args.includes('--help')) {
    console.log(`
Monthly P&L Sync: Lingxing -> pnl-data.json

Usage:
  node sync-monthly-pnl.js 2026 2                Sync Feb 2026
  node sync-monthly-pnl.js 2026 1 2026 3         Sync Jan-Mar 2026
  node sync-monthly-pnl.js current                Sync current month
  node sync-monthly-pnl.js backfill               Sync May 2024 to now

Options:
  --debug     Log raw API response fields
  --replace   Replace ALL data (default: merge/update)

Env vars: LINGXING_APP_ID, LINGXING_APP_SECRET
`);
    process.exit(0);
  }

  if (!CONFIG.APP_ID || !CONFIG.APP_SECRET) {
    console.error('ERROR: Set LINGXING_APP_ID and LINGXING_APP_SECRET env vars');
    process.exit(1);
  }

  // Parse month targets
  const months = [];
  if (cleanArgs[0] === 'current') {
    const now = new Date();
    months.push({ year: now.getFullYear(), month: now.getMonth() + 1 });
  } else if (cleanArgs[0] === 'backfill') {
    // May 2024 to current month
    const now = new Date();
    let y = 2024, m = 5;
    while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
      months.push({ year: y, month: m });
      m++;
      if (m > 12) { m = 1; y++; }
    }
  } else if (cleanArgs.length === 2) {
    months.push({ year: parseInt(cleanArgs[0]), month: parseInt(cleanArgs[1]) });
  } else if (cleanArgs.length === 4) {
    let y = parseInt(cleanArgs[0]), m = parseInt(cleanArgs[1]);
    const ey = parseInt(cleanArgs[2]), em = parseInt(cleanArgs[3]);
    while (y < ey || (y === ey && m <= em)) {
      months.push({ year: y, month: m });
      m++;
      if (m > 12) { m = 1; y++; }
    }
  } else {
    console.error('Invalid arguments. Use --help for usage.');
    process.exit(1);
  }

  // Load existing data
  let existing = [];
  if (!replace && fs.existsSync(CONFIG.OUTPUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(CONFIG.OUTPUT_PATH, 'utf8'));
    console.log(`Loaded ${existing.length} existing months from pnl-data.json`);
  }

  // Authenticate once
  console.log('Authenticating with Lingxing...');
  const token = await getAccessToken();
  console.log('Authenticated.\n');

  // Sync each month
  for (const { year, month } of months) {
    try {
      const result = await syncMonth(token, year, month, debug);
      if (!result) continue;

      // Merge: update existing month or append
      const idx = existing.findIndex(d => d.period === result.period);
      if (idx >= 0) {
        console.log(`  -> Updated ${result.period} in pnl-data.json`);
        existing[idx] = result;
      } else {
        console.log(`  -> Added ${result.period} to pnl-data.json`);
        existing.push(result);
      }

      // Rate limit between months
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  // Sort chronologically
  existing.sort((a, b) => {
    const [am, ay] = a.period.split('-');
    const [bm, by] = b.period.split('-');
    return (parseInt(ay) * 100 + MONTH_NAMES.indexOf(am)) -
           (parseInt(by) * 100 + MONTH_NAMES.indexOf(bm));
  });

  // Write output
  fs.writeFileSync(CONFIG.OUTPUT_PATH, JSON.stringify(existing, null, 2));
  console.log(`\nSaved ${existing.length} months to pnl-data.json`);

  // Summary
  const latest = existing[existing.length - 1];
  if (latest) {
    const totalRev = latest.brands.reduce((s, b) => s + b.rev, 0);
    const totalGP = latest.brands.reduce((s, b) => s + b.gp, 0);
    console.log(`Latest month: ${latest.period} — Rev: $${totalRev.toLocaleString()}, GP: $${totalGP.toLocaleString()}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
