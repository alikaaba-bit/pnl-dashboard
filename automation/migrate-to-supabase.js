#!/usr/bin/env node

/**
 * Supabase Migration Script
 *
 * Migrates enriched SKU data to Supabase for Petra Mind analytics
 *
 * Requirements:
 * 1. Install @supabase/supabase-js: npm install @supabase/supabase-js
 * 2. Set environment variables:
 *    - SUPABASE_URL: Your Supabase project URL
 *    - SUPABASE_KEY: Your Supabase service role key (not anon key!)
 *
 * Usage:
 *   node automation/migrate-to-supabase.js [options]
 *
 * Options:
 *   --skip-master    Skip migrating sku_master table
 *   --skip-aggregates Skip migrating sku_aggregates table
 *   --skip-daily     Skip migrating sku_daily_sales table
 *   --limit=N        Limit migration to N SKUs (for testing)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ENRICHED_DATA_PATH = path.join(__dirname, '../src/sku-data-enriched.json');
const EXCEL_PATH = '/Users/ali/Downloads/Lingxing Sales Volume Statistics-ASIN Level.xlsx';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipMaster: args.includes('--skip-master'),
  skipAggregates: args.includes('--skip-aggregates'),
  skipDaily: args.includes('--skip-daily'),
  limit: args.find(arg => arg.startsWith('--limit='))?.split('=')[1],
};

/**
 * Check if Supabase is installed and configured
 */
async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase setup...\n');

  // Check if @supabase/supabase-js is installed
  try {
    require.resolve('@supabase/supabase-js');
    console.log('✅ @supabase/supabase-js is installed');
  } catch (error) {
    console.error('❌ @supabase/supabase-js not found');
    console.error('\nTo install, run:');
    console.error('  npm install @supabase/supabase-js\n');
    process.exit(1);
  }

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials\n');
    console.error('Please set the following environment variables:');
    console.error('  SUPABASE_URL=https://your-project.supabase.co');
    console.error('  SUPABASE_KEY=your-service-role-key\n');
    console.error('You can set them temporarily for this session:');
    console.error('  export SUPABASE_URL="https://your-project.supabase.co"');
    console.error('  export SUPABASE_KEY="your-service-role-key"\n');
    console.error('Or add them to a .env file (requires dotenv package)\n');
    process.exit(1);
  }

  console.log('✅ Environment variables are set\n');

  // Initialize Supabase client
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection
  try {
    const { data, error } = await supabase.from('sku_master').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase\n');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:');
    console.error('  ' + error.message + '\n');
    console.error('Make sure you have run the schema.sql file first:');
    console.error('  1. Go to your Supabase dashboard');
    console.error('  2. Open SQL Editor');
    console.error('  3. Run the contents of supabase/schema.sql\n');
    process.exit(1);
  }

  return supabase;
}

/**
 * Migrate SKU Master data
 */
async function migrateSKUMaster(supabase, skuData) {
  console.log('📦 Migrating SKU Master data...');

  const masterData = skuData.map(sku => ({
    sku: sku.sku,
    msku: sku.msku,
    asin: null, // Can be populated if available
    product_name: sku.productName || sku.product || sku.sku,
    title: sku.title || sku.productName || sku.product || '',
    brand: sku.brand || 'Unknown',
    category: sku.category || '',
    secondary_category: sku.subcategory || '',
    tertiary_category: '',
    theme: sku.theme || 'GENERAL',
    seasonality: sku.seasonality || 'Year-Round',
    seasonality_badge: sku.seasonalityBadge || '🔄',
    is_active: true,
  }));

  console.log(`  Preparing ${masterData.length} SKU records...`);

  // Insert in batches of 1000
  const batchSize = 1000;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < masterData.length; i += batchSize) {
    const batch = masterData.slice(i, i + batchSize);

    try {
      const { data, error } = await supabase
        .from('sku_master')
        .upsert(batch, { onConflict: 'sku' });

      if (error) throw error;

      inserted += batch.length;
      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${masterData.length} SKUs`);
    } catch (error) {
      console.error(`  ❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    }
  }

  console.log(`✅ SKU Master migration complete: ${inserted} records\n`);
}

/**
 * Migrate SKU Aggregates data
 */
async function migrateSKUAggregates(supabase, skuData) {
  console.log('📊 Migrating SKU Aggregates data...');

  const aggregatesData = skuData.map(sku => ({
    sku: sku.sku,
    total_units: sku.units || 0,
    total_revenue: sku.revenue || 0,
    total_cogs: sku.cogs || 0,
    total_fba_fee: sku.fbaFee || 0,
    total_ad_spend: sku.adSpend || 0,
    total_ad_sales: sku.adSales || 0,
    total_storage: sku.storage || 0,
    total_refunds: sku.refunds || 0,
    gross_profit: sku.grossProfit || 0,
    net_profit: (sku.grossProfit || 0) - (sku.storage || 0) - (sku.refunds || 0),
    avg_margin: sku.margin || 0,
    avg_acos: sku.acos || 0,
    refund_rate: sku.refundRate || 0,
    first_sale_date: sku.firstSale || null,
    last_sale_date: sku.lastSale || null,
    peak_month: sku.peakMonth || null,
    avg_daily_sales: sku.avgDailySales || 0,
    historical_units: sku.historicalUnits || 0,
    historical_revenue: sku.historicalRevenue || 0,
    historical_transactions: sku.historicalTransactions || 0,
  }));

  console.log(`  Preparing ${aggregatesData.length} aggregate records...`);

  // Insert in batches
  const batchSize = 1000;
  let inserted = 0;

  for (let i = 0; i < aggregatesData.length; i += batchSize) {
    const batch = aggregatesData.slice(i, i + batchSize);

    try {
      const { data, error } = await supabase
        .from('sku_aggregates')
        .upsert(batch, { onConflict: 'sku' });

      if (error) throw error;

      inserted += batch.length;
      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${aggregatesData.length} aggregates`);
    } catch (error) {
      console.error(`  ❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    }
  }

  console.log(`✅ SKU Aggregates migration complete: ${inserted} records\n`);
}

/**
 * Migrate Daily Sales data (from Excel)
 */
async function migrateDailySales(supabase) {
  console.log('📈 Migrating Daily Sales data from Excel...');

  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    console.log(`  Loaded ${rows.length.toLocaleString()} rows from Excel`);

    // Transform rows to daily sales format
    const dailySalesData = rows.map(row => ({
      sku: row.SKU || row.sku,
      date: row.Date || row.date,
      sales_volume: parseInt(row['Sales volume'] || row.salesVolume || 0),
      transactions: parseInt(row.Transactions || row.transactions || 0),
      sales_amount: parseFloat(row['Sales amount'] || row.salesAmount || 0),
    })).filter(row => row.sku && row.date);

    console.log(`  Prepared ${dailySalesData.length.toLocaleString()} daily sales records`);

    // Insert in batches (smaller batches for daily sales due to volume)
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < dailySalesData.length; i += batchSize) {
      const batch = dailySalesData.slice(i, i + batchSize);

      try {
        const { data, error } = await supabase
          .from('sku_daily_sales')
          .upsert(batch, { onConflict: 'sku,date' });

        if (error) throw error;

        inserted += batch.length;

        if ((i / batchSize) % 10 === 0 || i + batchSize >= dailySalesData.length) {
          console.log(`  ✅ Progress: ${inserted.toLocaleString()}/${dailySalesData.length.toLocaleString()} records`);
        }
      } catch (error) {
        console.error(`  ❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }

    console.log(`✅ Daily Sales migration complete: ${inserted.toLocaleString()} records\n`);

    // Refresh aggregates after loading daily sales
    console.log('🔄 Refreshing aggregate metrics...');
    const { data, error } = await supabase.rpc('refresh_sku_aggregates');
    if (error) {
      console.error('  ⚠️  Could not refresh aggregates:', error.message);
    } else {
      console.log('✅ Aggregates refreshed\n');
    }

  } catch (error) {
    console.error('❌ Error migrating daily sales:', error.message);
    if (error.message.includes('Cannot find module')) {
      console.error('  Make sure xlsx package is installed: npm install xlsx');
    }
  }
}

/**
 * Verify migration
 */
async function verifyMigration(supabase) {
  console.log('🔍 Verifying migration...\n');

  try {
    // Check sku_master count
    const { count: masterCount, error: masterError } = await supabase
      .from('sku_master')
      .select('*', { count: 'exact', head: true });

    if (masterError) throw masterError;
    console.log(`✅ sku_master: ${masterCount} records`);

    // Check sku_aggregates count
    const { count: aggCount, error: aggError } = await supabase
      .from('sku_aggregates')
      .select('*', { count: 'exact', head: true });

    if (aggError) throw aggError;
    console.log(`✅ sku_aggregates: ${aggCount} records`);

    // Check sku_daily_sales count
    const { count: dailyCount, error: dailyError } = await supabase
      .from('sku_daily_sales')
      .select('*', { count: 'exact', head: true });

    if (dailyError) throw dailyError;
    console.log(`✅ sku_daily_sales: ${dailyCount?.toLocaleString() || 0} records`);

    // Test theme performance view
    const { data: themeData, error: themeError } = await supabase
      .from('vw_theme_performance')
      .select('*')
      .limit(5);

    if (themeError) throw themeError;
    console.log(`\n📊 Top 5 Themes by Revenue:`);
    themeData.forEach((theme, idx) => {
      console.log(`  ${idx + 1}. ${theme.theme}: $${parseFloat(theme.theme_revenue || 0).toLocaleString()} (${theme.sku_count} SKUs)`);
    });

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Supabase Migration Script\n');
  console.log('═'.repeat(60) + '\n');

  // Step 1: Check Supabase setup
  const supabase = await checkSupabaseSetup();

  // Step 2: Load enriched data
  console.log('📂 Loading enriched SKU data...');
  let skuData;
  try {
    skuData = JSON.parse(fs.readFileSync(ENRICHED_DATA_PATH, 'utf8'));
    console.log(`✅ Loaded ${skuData.length} SKUs from enriched data\n`);

    // Apply limit if specified
    if (options.limit) {
      const limit = parseInt(options.limit);
      skuData = skuData.slice(0, limit);
      console.log(`⚠️  Limited to ${limit} SKUs for testing\n`);
    }
  } catch (error) {
    console.error('❌ Failed to load enriched data:', error.message);
    console.error('\nMake sure you have run process-historical-data.js first\n');
    process.exit(1);
  }

  // Step 3: Migrate data
  console.log('═'.repeat(60) + '\n');

  if (!options.skipMaster) {
    await migrateSKUMaster(supabase, skuData);
  } else {
    console.log('⏭️  Skipping sku_master migration\n');
  }

  if (!options.skipAggregates) {
    await migrateSKUAggregates(supabase, skuData);
  } else {
    console.log('⏭️  Skipping sku_aggregates migration\n');
  }

  if (!options.skipDaily) {
    console.log('⚠️  Daily sales migration can take 10-15 minutes for 240K+ rows');
    console.log('   You can skip this with --skip-daily flag\n');
    await migrateDailySales(supabase);
  } else {
    console.log('⏭️  Skipping sku_daily_sales migration\n');
  }

  // Step 4: Verify migration
  console.log('═'.repeat(60) + '\n');
  await verifyMigration(supabase);

  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 Migration complete!\n');
  console.log('Next steps:');
  console.log('1. Verify data in Supabase dashboard');
  console.log('2. Test queries using the views (vw_theme_performance, etc.)');
  console.log('3. Integrate with Petra Mind for natural language queries\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { migrateSKUMaster, migrateSKUAggregates, migrateDailySales };
