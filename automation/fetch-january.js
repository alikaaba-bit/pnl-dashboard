const axios = require('axios');
const CryptoJS = require('crypto-js');

const CONFIG = {
  APP_ID: process.env.LINGXING_APP_ID,
  APP_SECRET: process.env.LINGXING_APP_SECRET,
  BASE_URL: 'https://openapi.lingxing.com',
  STORES: [
    { sid: 4795, name: 'Fomin-US' },
    { sid: 4799, name: 'Fomin-CA' },
    { sid: 4800, name: 'Fomin-MX' },
    { sid: 4442, name: 'HOP-US' },
    { sid: 4443, name: 'HOP-CA' },
    { sid: 4444, name: 'HOP-MX' },
    { sid: 4817, name: 'Function-labs-US' },
    { sid: 4951, name: 'Soulmama-US' },
    { sid: 6346, name: 'ROOFUS-US' },
    { sid: 184, name: 'andro-US' }
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

async function run() {
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

  const params = { startDate: '2026-01-01', endDate: '2026-01-31', offset: 0, length: 2000 };
  const ts = Math.floor(Date.now() / 1000).toString();
  const authParams = { access_token: token, app_key: CONFIG.APP_ID, timestamp: ts };
  authParams.sign = generateApiSign({ ...authParams, ...params });

  const response = await axios.post(
    CONFIG.BASE_URL + '/bd/profit/report/open/report/seller/list',
    params,
    { params: authParams }
  );

  const records = response.data.data.records || [];

  // Aggregate by store (sid)
  const storeAgg = {};
  records.forEach(r => {
    const sid = r.sid;
    if (!storeAgg[sid]) {
      const store = CONFIG.STORES.find(s => s.sid === sid);
      storeAgg[sid] = {
        store: store?.name || 'SID ' + sid,
        sid: sid,
        revenue: 0,
        units: 0,
        cogs: 0,
        refunds: 0,
        fbaFee: 0,
        adSpend: 0,
        storage: 0,
        grossProfit: 0
      };
    }
    storeAgg[sid].revenue += r.totalSalesAmount || 0;
    storeAgg[sid].units += r.totalSalesQuantity || 0;
    storeAgg[sid].cogs += Math.abs(r.cgPriceTotal || 0);
    storeAgg[sid].refunds += Math.abs(r.totalSalesRefunds || 0);
    storeAgg[sid].fbaFee += Math.abs(r.totalFbaDeliveryFee || 0);
    storeAgg[sid].adSpend += Math.abs(r.totalAdsCost || 0);
    storeAgg[sid].storage += Math.abs(r.totalStorageFee || 0);
    storeAgg[sid].grossProfit += r.grossProfit || 0;
  });

  // Calculate margins and format
  const summary = Object.values(storeAgg).map(s => ({
    ...s,
    revenue: Math.round(s.revenue * 100) / 100,
    cogs: Math.round(s.cogs * 100) / 100,
    refunds: Math.round(s.refunds * 100) / 100,
    fbaFee: Math.round(s.fbaFee * 100) / 100,
    adSpend: Math.round(s.adSpend * 100) / 100,
    storage: Math.round(s.storage * 100) / 100,
    grossProfit: Math.round(s.grossProfit * 100) / 100,
    margin: s.revenue > 0 ? ((s.grossProfit / s.revenue) * 100).toFixed(1) + '%' : '0%'
  }));

  console.log('JANUARY 2026 P&L SUMMARY (Aggregated by Store):');
  console.log(JSON.stringify(summary, null, 2));
}

run();
