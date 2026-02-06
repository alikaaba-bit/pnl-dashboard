#!/usr/bin/env node

/**
 * Historical Data Processing Script
 *
 * Processes the Lingxing Excel file (240K+ rows) to:
 * 1. Extract real product names, categories, and titles
 * 2. Aggregate sales data by SKU
 * 3. Auto-extract themes (Christmas, Halloween, etc.)
 * 4. Determine seasonality from historical patterns
 * 5. Merge with existing aggregated metrics
 * 6. Generate enriched sku-data-enriched.json
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const EXCEL_PATH = '/Users/ali/Downloads/Lingxing Sales Volume Statistics-ASIN Level.xlsx';
const EXISTING_DATA_PATH = path.join(__dirname, '../src/sku-data.json');
const OUTPUT_PATH = path.join(__dirname, '../src/sku-data-enriched.json');

/**
 * Extract theme from product information
 */
function extractTheme(productName, title, msku) {
  const text = `${productName || ''} ${title || ''} ${msku || ''}`.toLowerCase();

  // Theme patterns (order matters - most specific first)
  const themes = [
    { pattern: /christmas|xmas|holiday decoration|santa|gingerbread|reindeer/i, theme: 'CHRISTMAS' },
    { pattern: /halloween|spooky|pumpkin|witch|ghost|skeleton/i, theme: 'HALLOWEEN' },
    { pattern: /graduat|grad |diploma|class of \d{4}/i, theme: 'GRADUATION' },
    { pattern: /birthday|bday|hbd|happy birthday/i, theme: 'BIRTHDAY' },
    { pattern: /baby shower|baby|newborn|infant/i, theme: 'BABY SHOWER' },
    { pattern: /wedding|bride|groom|bridal|marriage/i, theme: 'WEDDING' },
    { pattern: /valentine|love|heart|romance/i, theme: 'VALENTINES' },
    { pattern: /easter|bunny|egg hunt|spring/i, theme: 'EASTER' },
    { pattern: /4th july|independence|patriotic|usa|american flag/i, theme: 'JULY 4TH' },
    { pattern: /unicorn|magical|fantasy/i, theme: 'UNICORN' },
    { pattern: /rainbow|colorful/i, theme: 'RAINBOW' },
    { pattern: /farm|barn|animal|cow|pig/i, theme: 'FARM' },
    { pattern: /disco|party|celebration/i, theme: 'PARTY' },
    { pattern: /sports|football|soccer|basketball/i, theme: 'SPORTS' },
    { pattern: /princess|royal|crown/i, theme: 'PRINCESS' },
    { pattern: /dinosaur|dino|prehistoric/i, theme: 'DINOSAUR' },
    { pattern: /space|astronaut|rocket|galaxy/i, theme: 'SPACE' },
    { pattern: /mermaid|ocean|underwater/i, theme: 'MERMAID' },
    { pattern: /superhero|hero|marvel|dc/i, theme: 'SUPERHERO' },
    { pattern: /tropical|luau|hawaii/i, theme: 'TROPICAL' },
  ];

  for (const { pattern, theme } of themes) {
    if (pattern.test(text)) {
      return theme;
    }
  }

  return 'GENERAL';
}

/**
 * Determine seasonality from monthly revenue distribution
 */
function assignSeasonality(monthlyRevenue, theme) {
  // Calculate quarterly revenue
  const q1 = (monthlyRevenue[0] || 0) + (monthlyRevenue[1] || 0) + (monthlyRevenue[2] || 0);  // Jan-Mar
  const q2 = (monthlyRevenue[3] || 0) + (monthlyRevenue[4] || 0) + (monthlyRevenue[5] || 0);  // Apr-Jun
  const q3 = (monthlyRevenue[6] || 0) + (monthlyRevenue[7] || 0) + (monthlyRevenue[8] || 0);  // Jul-Sep
  const q4 = (monthlyRevenue[9] || 0) + (monthlyRevenue[10] || 0) + (monthlyRevenue[11] || 0); // Oct-Dec

  const quarters = { Q1: q1, Q2: q2, Q3: q3, Q4: q4 };
  const total = q1 + q2 + q3 + q4;

  // If no revenue data, use theme-based defaults
  if (total === 0) {
    const themeDefaults = {
      'CHRISTMAS': 'Q4',
      'HALLOWEEN': 'Q4',
      'GRADUATION': 'Q2',
      'VALENTINES': 'Q1',
      'EASTER': 'Q2',
      'JULY 4TH': 'Q3',
      'BABY SHOWER': 'Year-Round',
      'WEDDING': 'Q2',
      'BIRTHDAY': 'Year-Round',
    };
    return themeDefaults[theme] || 'Year-Round';
  }

  // Find peak quarter
  const maxQuarter = Object.keys(quarters).reduce((a, b) =>
    quarters[a] > quarters[b] ? a : b
  );

  // If >60% of revenue in one quarter, it's seasonal
  const peakPercentage = quarters[maxQuarter] / total;
  if (peakPercentage > 0.6) {
    return maxQuarter;
  }

  return 'Year-Round';
}

/**
 * Get seasonality badge emoji
 */
function getSeasonalityBadge(seasonality) {
  const badges = {
    'Q1': '❄️',  // Winter
    'Q2': '🌸',  // Spring
    'Q3': '☀️',  // Summer
    'Q4': '🍂',  // Fall
    'Year-Round': '🔄'
  };
  return badges[seasonality] || '🔄';
}

/**
 * Intelligently truncate Amazon SEO titles
 * Keeps: Brand + Main Product + Size/Quantity + Primary Color
 * Removes: SEO keyword stuffing after the essential info
 *
 * Example:
 * Input:  "HOUSE OF PARTY Christmas Balloon Arch Kit - 165 Pcs Holiday Red, Forest Green, Gold Balloons with..."
 * Output: "HOUSE OF PARTY Christmas Balloon Arch Kit - 165 Pcs Holiday Red"
 */
function truncateProductTitle(title) {
  if (!title) return '';

  // If title is already short, keep it
  if (title.length <= 60) return title;

  let truncated = title;

  // Step 1: Look for patterns that indicate end of core product description
  const earlyStopPatterns = [
    // After "Pcs [Color]" or "[Size] [Color]", stop at next comma
    /(\d+\s*(?:Pcs|Pack|Count|Piece|pc|pcs)\s+[A-Z][a-zA-Z\s]+),/,  // "165 Pcs Holiday Red,"
    /(-\s*[A-Z][a-zA-Z\s]+\s+[A-Z][a-zA-Z\s]+),/,  // "- Holiday Red,"
  ];

  for (const pattern of earlyStopPatterns) {
    const match = title.match(pattern);
    if (match && match.index > 30) {
      // Keep everything up to and including the matched part (but not the comma)
      const endPos = match.index + match[0].length - 1;  // -1 to exclude comma
      truncated = title.substring(0, endPos).trim();
      return truncated;
    }
  }

  // Step 2: If no early stop, look for common SEO stuffing indicators
  const cutoffPatterns = [
    ' with ',         // " with Merry Christmas Foil Balloon"
    ', with ',        // ", with additional items"
    ' - Includes ',   // " - Includes extra stuff"
    ' for ',          // " for Birthday Party Decorations"
    ' | ',            // " | Separator for keywords"
    ', Includes ',    // ", Includes accessories"
    ', Ideal for ',   // ", Ideal for parties"
    ', Perfect for ', // ", Perfect for celebrations"
    ', Great for ',   // ", Great for events"
  ];

  let cutoffPosition = truncated.length;

  for (const pattern of cutoffPatterns) {
    const pos = truncated.indexOf(pattern);
    if (pos > 30 && pos < cutoffPosition) {
      cutoffPosition = pos;
    }
  }

  truncated = truncated.substring(0, cutoffPosition).trim();

  // Step 3: If still too long, cut at reasonable length (word boundary)
  if (truncated.length > 80) {
    truncated = truncated.substring(0, 75);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 50) {
      truncated = truncated.substring(0, lastSpace);
    }
  }

  // Remove any trailing punctuation
  truncated = truncated.replace(/[,\-–—]+$/, '').trim();

  return truncated;
}

/**
 * Process Excel file and aggregate by SKU
 */
function processExcelData() {
  console.log('📊 Processing historical Excel data...');
  console.log(`Reading: ${EXCEL_PATH}`);

  // Read Excel file
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✅ Loaded ${rows.length.toLocaleString()} rows from Excel`);

  // Aggregate by SKU
  const skuMap = new Map();

  rows.forEach((row, index) => {
    if (index % 10000 === 0) {
      console.log(`Processing row ${index.toLocaleString()}...`);
    }

    const sku = row.SKU || row.sku;
    const msku = row.MSKU || row.msku || row['Marketplace SKU'];
    const productName = row['Product Name'] || row.productName || row.product;
    const title = row.Title || row.title;
    const brand = row.Brand || row.brand || 'Unknown';
    const category = row['Secondary Category'] || row.category || '';
    const subcategory = row['Tertiary Category'] || row.subcategory || '';
    const date = row.Date || row.date;
    const salesVolume = parseFloat(row['Sales volume'] || row.salesVolume || 0);
    const salesAmount = parseFloat(row['Sales amount'] || row.salesAmount || 0);
    const transactions = parseInt(row.Transactions || row.transactions || 0);

    if (!sku) return; // Skip rows without SKU

    // Get or create SKU entry
    if (!skuMap.has(sku)) {
      skuMap.set(sku, {
        sku,
        msku: msku || sku,
        productName: productName || sku,
        title: title || productName || sku,
        brand,
        category,
        subcategory,
        // Historical metrics
        historicalUnits: 0,
        historicalRevenue: 0,
        historicalTransactions: 0,
        firstSale: null,
        lastSale: null,
        monthlyRevenue: Array(12).fill(0),
        monthlySales: Array(12).fill(0),
        dailySales: [],
      });
    }

    const skuData = skuMap.get(sku);

    // Aggregate metrics
    skuData.historicalUnits += salesVolume;
    skuData.historicalRevenue += salesAmount;
    skuData.historicalTransactions += transactions;

    // Track date range
    if (date) {
      const dateStr = new Date(date).toISOString().split('T')[0];
      if (!skuData.firstSale || dateStr < skuData.firstSale) {
        skuData.firstSale = dateStr;
      }
      if (!skuData.lastSale || dateStr > skuData.lastSale) {
        skuData.lastSale = dateStr;
      }

      // Track monthly revenue and sales for seasonality analysis
      const month = new Date(date).getMonth();
      skuData.monthlyRevenue[month] += salesAmount;
      skuData.monthlySales[month] += salesVolume;

      // Store ALL daily sales data (we'll filter later for the last 30 days)
      skuData.dailySales.push({
        date: dateStr,
        units: salesVolume,
        revenue: salesAmount,
      });
    }
  });

  console.log(`✅ Aggregated data for ${skuMap.size.toLocaleString()} unique SKUs`);

  // Convert to array and enrich with themes and seasonality
  const enrichedData = Array.from(skuMap.values()).map(sku => {
    // Use truncated title for display
    const displayTitle = truncateProductTitle(sku.title);

    const theme = extractTheme(sku.productName, sku.title, sku.msku);
    const seasonality = assignSeasonality(sku.monthlyRevenue, theme);
    const seasonalityBadge = getSeasonalityBadge(seasonality);

    // Calculate average daily sales
    const daysSinceFirst = sku.firstSale && sku.lastSale
      ? Math.max(1, Math.floor((new Date(sku.lastSale) - new Date(sku.firstSale)) / (1000 * 60 * 60 * 24)))
      : 1;
    const avgDailySales = sku.historicalUnits / daysSinceFirst;

    // Find peak month
    const peakMonthIndex = sku.monthlyRevenue.indexOf(Math.max(...sku.monthlyRevenue));
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const peakMonth = monthNames[peakMonthIndex];

    // Calculate peak month units for the seasonality chart
    const peakMonthUnits = Math.max(...sku.monthlySales);

    // Build monthlySales array for the seasonality chart
    const monthlySalesData = monthShortNames.map((month, idx) => ({
      month,
      units: Math.round(sku.monthlySales[idx]),
      monthName: monthNames[idx]
    }));

    return {
      // Core identifiers
      sku: sku.sku,
      msku: sku.msku,
      productName: displayTitle,  // Use truncated title for display
      title: sku.title,           // Keep full title for reference
      brand: sku.brand,

      // Categorization
      category: sku.category,
      subcategory: sku.subcategory,
      theme,
      seasonality,
      seasonalityBadge,

      // Historical insights
      firstSale: sku.firstSale,
      lastSale: sku.lastSale,
      peakMonth,
      avgDailySales: parseFloat(avgDailySales.toFixed(2)),

      // Historical totals (for comparison)
      historicalUnits: Math.round(sku.historicalUnits),
      historicalRevenue: parseFloat(sku.historicalRevenue.toFixed(2)),
      historicalTransactions: sku.historicalTransactions,

      // Monthly sales data for seasonality chart
      monthlySales: monthlySalesData,
      peakMonthIndex,
      peakMonthUnits,

      // Daily sales data for organic/paid ratio calculation (keep for merging)
      dailySales: sku.dailySales,
    };
  });

  return enrichedData;
}

/**
 * Calculate organic vs paid sales ratio from historical data
 * Date range: Current date - 2 days, going back 30 days
 */
function calculateOrganicPaidRatio(sku, historicalData) {
  // Calculate date range: end date = today - 2 days, start date = end date - 30 days
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 2);

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 30);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Debug: Check if dailySales exists and has data
  const dailySales = historicalData.dailySales || [];

  // Filter daily sales data to the last 30 days (within date range)
  const salesInRange = dailySales.filter(day => {
    return day.date >= startStr && day.date <= endStr;
  });

  // Calculate total sales in the date range from historical data
  const totalSales30d = salesInRange.reduce((sum, day) => sum + (day.revenue || 0), 0);

  // Ad sales from existing aggregated data (already available)
  // Note: This is the total ad sales, we'll use it as-is or scale it proportionally
  const totalAdSales = sku.adSales || 0;
  const totalRevenue = sku.revenue || 0;

  // Calculate ad sales in the 30-day period (proportional to total)
  let paidSales30d = 0;
  if (totalSales30d > 0 && totalRevenue > 0) {
    // Scale ad sales proportionally to the 30-day revenue
    paidSales30d = (totalAdSales / totalRevenue) * totalSales30d;
  } else {
    paidSales30d = 0;
  }

  // Calculate organic sales
  const organicSales30d = Math.max(0, totalSales30d - paidSales30d);

  // Calculate ratio
  let organicToPaidRatio = 0;
  let organicToPaidRatioFormatted = "N/A";

  if (paidSales30d === 0 && organicSales30d > 0) {
    organicToPaidRatioFormatted = "Organic Only";
    organicToPaidRatio = Infinity;
  } else if (totalSales30d === 0) {
    organicToPaidRatioFormatted = "N/A";
    organicToPaidRatio = 0;
  } else if (paidSales30d > 0) {
    organicToPaidRatio = organicSales30d / paidSales30d;
    organicToPaidRatioFormatted = `${organicToPaidRatio.toFixed(1)}:1`;
  }

  return {
    organicSales30d: parseFloat(organicSales30d.toFixed(2)),
    paidSales30d: parseFloat(paidSales30d.toFixed(2)),
    organicToPaidRatio: organicToPaidRatio === Infinity ? Infinity : parseFloat(organicToPaidRatio.toFixed(2)),
    organicToPaidRatioFormatted
  };
}

/**
 * Merge historical data with existing aggregated metrics
 */
function mergeWithExistingData(historicalData) {
  console.log('\n🔗 Merging with existing aggregated metrics...');

  // Read existing data
  let existingData = [];
  try {
    if (fs.existsSync(EXISTING_DATA_PATH)) {
      existingData = JSON.parse(fs.readFileSync(EXISTING_DATA_PATH, 'utf8'));
      console.log(`✅ Loaded ${existingData.length} SKUs from existing data`);
    }
  } catch (error) {
    console.log(`⚠️  Could not load existing data: ${error.message}`);
  }

  // Create lookup map from existing data
  const existingMap = new Map();
  existingData.forEach(sku => {
    existingMap.set(sku.sku, sku);
  });

  // Create lookup map from historical data for organic/paid ratio calculation
  const historicalMap = new Map();
  historicalData.forEach(sku => {
    historicalMap.set(sku.sku, sku);
  });

  // Merge data
  const mergedData = historicalData.map(historical => {
    const existing = existingMap.get(historical.sku);

    if (existing) {
      // Calculate organic vs paid ratio
      const organicPaidMetrics = calculateOrganicPaidRatio(existing, historical);

      // Merge: Keep existing aggregated metrics, add historical enrichment
      // Note: We don't include dailySales in the final output to keep file size manageable
      const { dailySales, ...historicalWithoutDailySales } = historical;

      return {
        ...existing,
        // Override with enriched data (without dailySales)
        productName: historicalWithoutDailySales.productName,
        title: historicalWithoutDailySales.title,
        brand: historicalWithoutDailySales.brand || existing.brand,
        category: historicalWithoutDailySales.category,
        subcategory: historicalWithoutDailySales.subcategory,
        theme: historicalWithoutDailySales.theme,
        seasonality: historicalWithoutDailySales.seasonality,
        seasonalityBadge: historicalWithoutDailySales.seasonalityBadge,
        firstSale: historicalWithoutDailySales.firstSale,
        lastSale: historicalWithoutDailySales.lastSale,
        peakMonth: historicalWithoutDailySales.peakMonth,
        avgDailySales: historicalWithoutDailySales.avgDailySales,
        historicalUnits: historicalWithoutDailySales.historicalUnits,
        historicalRevenue: historicalWithoutDailySales.historicalRevenue,
        historicalTransactions: historicalWithoutDailySales.historicalTransactions,
        // Monthly sales data for seasonality chart
        monthlySales: historicalWithoutDailySales.monthlySales,
        peakMonthIndex: historicalWithoutDailySales.peakMonthIndex,
        peakMonthUnits: historicalWithoutDailySales.peakMonthUnits,
        // Add organic vs paid metrics
        ...organicPaidMetrics
      };
    } else {
      // New SKU from historical data only
      const organicPaidMetrics = calculateOrganicPaidRatio({
        adSales: 0,
        revenue: 0
      }, historical);

      // Remove dailySales from output
      const { dailySales, ...historicalWithoutDailySales } = historical;

      return {
        ...historicalWithoutDailySales,
        // Add empty aggregated metrics
        units: 0,
        revenue: 0,
        cogs: 0,
        refunds: 0,
        refundRate: 0,
        fbaFee: 0,
        adSpend: 0,
        adSales: 0,
        acos: 0,
        storage: 0,
        grossProfit: 0,
        margin: 0,
        product: historicalWithoutDailySales.productName, // Alias for compatibility
        // Add organic vs paid metrics
        ...organicPaidMetrics
      };
    }
  });

  // Add any SKUs that are in existing but not in historical
  existingData.forEach(existing => {
    if (!historicalData.find(h => h.sku === existing.sku)) {
      console.log(`⚠️  SKU ${existing.sku} in existing data but not in historical (keeping with basic enrichment)`);

      // Calculate organic/paid with empty historical data
      const organicPaidMetrics = calculateOrganicPaidRatio(existing, {
        dailySales: []
      });

      mergedData.push({
        ...existing,
        productName: existing.product || existing.sku,
        title: existing.product || existing.sku,
        theme: extractTheme(existing.product, '', existing.sku),
        seasonality: 'Year-Round',
        seasonalityBadge: '🔄',
        // Add organic vs paid metrics
        ...organicPaidMetrics
      });
    }
  });

  console.log(`✅ Merged data: ${mergedData.length} total SKUs`);

  return mergedData;
}

/**
 * Generate summary statistics
 */
function generateSummary(data) {
  console.log('\n📈 Summary Statistics:');
  console.log('─'.repeat(60));

  // Overall stats
  console.log(`Total SKUs: ${data.length.toLocaleString()}`);
  console.log(`With product names: ${data.filter(s => s.productName && s.productName !== s.sku).length.toLocaleString()}`);
  console.log(`With themes: ${data.filter(s => s.theme && s.theme !== 'GENERAL').length.toLocaleString()}`);
  console.log(`With seasonality: ${data.filter(s => s.seasonality).length.toLocaleString()}`);

  // Theme breakdown
  const themeCount = {};
  data.forEach(s => {
    const theme = s.theme || 'GENERAL';
    themeCount[theme] = (themeCount[theme] || 0) + 1;
  });

  console.log('\n🎨 Theme Distribution:');
  Object.entries(themeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([theme, count]) => {
      console.log(`  ${theme.padEnd(20)}: ${count.toLocaleString()}`);
    });

  // Seasonality breakdown
  const seasonCount = {};
  data.forEach(s => {
    const season = s.seasonality || 'Unknown';
    seasonCount[season] = (seasonCount[season] || 0) + 1;
  });

  console.log('\n📅 Seasonality Distribution:');
  Object.entries(seasonCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([season, count]) => {
      const badge = getSeasonalityBadge(season);
      console.log(`  ${badge} ${season.padEnd(15)}: ${count.toLocaleString()}`);
    });

  // Brand breakdown
  const brandCount = {};
  data.forEach(s => {
    const brand = s.brand || 'Unknown';
    brandCount[brand] = (brandCount[brand] || 0) + 1;
  });

  console.log('\n🏢 Brand Distribution:');
  Object.entries(brandCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([brand, count]) => {
      console.log(`  ${brand.padEnd(25)}: ${count.toLocaleString()}`);
    });

  // Organic vs Paid ratio breakdown
  console.log('\n📊 Organic/Paid Ratio Distribution:');
  const organicOnly = data.filter(s => s.organicToPaidRatioFormatted === 'Organic Only').length;
  const highOrganic = data.filter(s => s.organicToPaidRatio > 2 && s.organicToPaidRatio !== Infinity).length;
  const moderate = data.filter(s => s.organicToPaidRatio >= 1 && s.organicToPaidRatio <= 2).length;
  const lowOrganic = data.filter(s => s.organicToPaidRatio > 0 && s.organicToPaidRatio < 1).length;
  const noData = data.filter(s => s.organicToPaidRatioFormatted === 'N/A').length;

  console.log(`  Organic Only: ${organicOnly.toLocaleString()}`);
  console.log(`  High Organic (>2:1): ${highOrganic.toLocaleString()}`);
  console.log(`  Moderate (1:1 to 2:1): ${moderate.toLocaleString()}`);
  console.log(`  Low Organic (<1:1): ${lowOrganic.toLocaleString()}`);
  console.log(`  No Data: ${noData.toLocaleString()}`);

  // Sample enriched SKU
  const sample = data.find(s => s.theme && s.theme !== 'GENERAL' && s.organicToPaidRatio > 0) || data[0];
  console.log('\n🔍 Sample Enriched SKU:');
  console.log(JSON.stringify(sample, null, 2));

  console.log('─'.repeat(60));
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting Historical Data Processing\n');

  try {
    // Step 1: Process Excel data
    const historicalData = processExcelData();

    // Step 2: Merge with existing data
    const enrichedData = mergeWithExistingData(historicalData);

    // Step 3: Sort by revenue (descending)
    enrichedData.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

    // Step 4: Write output
    console.log(`\n💾 Writing enriched data to: ${OUTPUT_PATH}`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enrichedData, null, 2));
    console.log('✅ File written successfully');

    // Step 5: Generate summary
    generateSummary(enrichedData);

    console.log('\n🎉 Processing complete!');
    console.log(`\nNext steps:`);
    console.log(`1. Review the enriched data at: ${OUTPUT_PATH}`);
    console.log(`2. Update SkuBreakdown.jsx to use sku-data-enriched.json`);
    console.log(`3. Test the dashboard to verify enrichment`);

  } catch (error) {
    console.error('❌ Error processing data:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { extractTheme, assignSeasonality, getSeasonalityBadge };
