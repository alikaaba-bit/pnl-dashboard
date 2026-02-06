const axios = require('axios');
const CryptoJS = require('crypto-js');
const fs = require('fs');

const CONFIG = {
  APP_ID: process.env.LINGXING_APP_ID,
  APP_SECRET: process.env.LINGXING_APP_SECRET,
  BASE_URL: 'https://openapi.lingxing.com',
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

async function fetchSkuData(startDate, endDate) {
  // Get access token
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateTokenSign(timestamp);
  const tokenRes = await axios.post(
    CONFIG.BASE_URL + '/api/auth-server/oauth/access-token',
    new URLSearchParams({
      appId: CONFIG.APP_ID,
      appSecret: CONFIG.APP_SECRET,
      timestamp: timestamp.toString(),
      sign: sign
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const token = tokenRes.data.data.access_token;

  // Fetch P&L data
  const params = { startDate, endDate, offset: 0, length: 5000 };
  const ts = Math.floor(Date.now() / 1000).toString();
  const authParams = { access_token: token, app_key: CONFIG.APP_ID, timestamp: ts };
  authParams.sign = generateApiSign({ ...authParams, ...params });

  const response = await axios.post(
    CONFIG.BASE_URL + '/bd/profit/report/open/report/seller/list',
    params,
    { params: authParams }
  );

  const records = response.data.data.records || [];

  // Process SKU-level data
  const skuData = {};

  records.forEach(r => {
    const store = CONFIG.STORES.find(s => s.sid === r.sid);
    const sku = r.localSku || r.sku || 'UNKNOWN';
    const key = `${store?.brand || 'Unknown'}-${sku}`;

    if (!skuData[key]) {
      skuData[key] = {
        sku: sku,
        productName: r.productName || r.title || '',
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
    skuData[key].units += r.totalSalesQuantity || 0;
    skuData[key].revenue += r.totalSalesAmount || 0;
    skuData[key].cogs += Math.abs(r.cgPriceTotal || 0);
    skuData[key].refunds += Math.abs(r.totalSalesRefunds || 0);
    skuData[key].fbaFee += Math.abs(r.totalFbaDeliveryFee || 0);
    skuData[key].adSpend += Math.abs(r.totalAdsCost || 0);
    skuData[key].adSales += r.totalAdsOrdersSalesAmount || 0;
    skuData[key].storage += Math.abs(r.totalStorageFee || 0);
    skuData[key].grossProfit += r.grossProfit || 0;
  });

  // Calculate rates and format
  const skuArray = Object.values(skuData).map(s => {
    const margin = s.revenue > 0 ? (s.grossProfit / s.revenue) * 100 : 0;
    const refundRate = s.revenue > 0 ? (s.refunds / s.revenue) * 100 : 0;
    const acos = s.adSales > 0 ? (s.adSpend / s.adSales) * 100 : 0;

    return {
      sku: s.sku,
      productName: s.productName.substring(0, 80), // Truncate long names
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

  // Sort by revenue descending
  skuArray.sort((a, b) => b.revenue - a.revenue);

  return skuArray;
}

async function run() {
  // Fetch last 3 months of data
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  console.log(`Fetching SKU data from ${startDate} to ${endDate}...`);

  const skuData = await fetchSkuData(startDate, endDate);

  console.log(`\nFetched ${skuData.length} SKUs`);
  console.log('\nTop 10 SKUs by Revenue:');
  console.log(JSON.stringify(skuData.slice(0, 10), null, 2));

  // Save to file for dashboard
  const outputPath = './src/sku-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(skuData, null, 2));
  console.log(`\n✅ SKU data saved to ${outputPath}`);
}

// If run directly
if (require.main === module) {
  run().catch(console.error);
}

module.exports = { fetchSkuData };
