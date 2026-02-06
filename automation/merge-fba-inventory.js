#!/usr/bin/env node

/**
 * Merge FBA Inventory Product Names
 *
 * Merges product names from FBA Inventory export with enriched SKU data
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// File paths
const FBA_INVENTORY_PATH = '/Users/ali/Downloads/FBA Inventory-All the Accounts.xlsx';
const ENRICHED_DATA_PATH = path.join(__dirname, '../src/sku-data-enriched.json');
const OUTPUT_PATH = path.join(__dirname, '../src/sku-data-enriched.json');

/**
 * Intelligently truncate Amazon SEO titles (reuse from process-historical-data.js)
 */
function truncateProductTitle(title) {
  if (!title) return '';
  if (title.length <= 60) return title;

  let truncated = title;

  // Step 1: Early stop patterns
  const earlyStopPatterns = [
    /(\d+\s*(?:Pcs|Pack|Count|Piece|pc|pcs)\s+[A-Z][a-zA-Z\s]+),/,
    /(-\s*[A-Z][a-zA-Z\s]+\s+[A-Z][a-zA-Z\s]+),/,
  ];

  for (const pattern of earlyStopPatterns) {
    const match = title.match(pattern);
    if (match && match.index > 30) {
      const endPos = match.index + match[0].length - 1;
      truncated = title.substring(0, endPos).trim();
      return truncated;
    }
  }

  // Step 2: Cutoff patterns
  const cutoffPatterns = [
    ' with ',
    ', with ',
    ' - Includes ',
    ' for ',
    ' | ',
    ', Includes ',
    ', Ideal for ',
    ', Perfect for ',
    ', Great for ',
  ];

  let cutoffPosition = truncated.length;

  for (const pattern of cutoffPatterns) {
    const pos = truncated.indexOf(pattern);
    if (pos > 30 && pos < cutoffPosition) {
      cutoffPosition = pos;
    }
  }

  truncated = truncated.substring(0, cutoffPosition).trim();

  // Step 3: Length limit
  if (truncated.length > 80) {
    truncated = truncated.substring(0, 75);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 50) {
      truncated = truncated.substring(0, lastSpace);
    }
  }

  truncated = truncated.replace(/[,\-–—]+$/, '').trim();
  return truncated;
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Merging FBA Inventory Product Names\n');
  console.log('═'.repeat(60) + '\n');

  // Step 1: Load FBA Inventory
  console.log('📂 Loading FBA Inventory file...');
  const workbook = XLSX.readFile(FBA_INVENTORY_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const fbaRows = XLSX.utils.sheet_to_json(sheet);
  console.log(`✅ Loaded ${fbaRows.length} products from FBA Inventory\n`);

  // Create lookup maps by SKU and ASIN
  const skuMap = new Map();
  const asinMap = new Map();

  fbaRows.forEach(row => {
    const sku = row.sku;
    const asin = row.asin;
    const productName = row['product-name'];
    const account = row.Account;

    if (sku && productName) {
      skuMap.set(sku, { productName, account, asin });
    }
    if (asin && productName) {
      asinMap.set(asin, { productName, account, sku });
    }
  });

  console.log(`📊 Created lookup maps:`);
  console.log(`   - SKU map: ${skuMap.size} entries`);
  console.log(`   - ASIN map: ${asinMap.size} entries\n`);

  // Step 2: Load enriched data
  console.log('📂 Loading enriched SKU data...');
  let enrichedData = JSON.parse(fs.readFileSync(ENRICHED_DATA_PATH, 'utf8'));
  console.log(`✅ Loaded ${enrichedData.length} SKUs from enriched data\n`);

  // Step 3: Merge product names
  console.log('🔗 Merging product names...\n');

  let matched = 0;
  let updated = 0;
  let alreadyHadName = 0;

  enrichedData = enrichedData.map(sku => {
    // Check if already has a good product name
    const currentName = sku.productName || '';
    const hasGoodName = currentName && currentName !== sku.sku && currentName.length > sku.sku.length;

    // Try to find match in FBA inventory
    let fbaMatch = skuMap.get(sku.sku);

    // If no SKU match, try ASIN match
    if (!fbaMatch && sku.asin) {
      fbaMatch = asinMap.get(sku.asin);
    }

    if (fbaMatch) {
      matched++;

      // Update product name with truncated version
      const truncatedName = truncateProductTitle(fbaMatch.productName);

      if (!hasGoodName) {
        // Update product name
        updated++;
        console.log(`✅ Updated: ${sku.sku}`);
        console.log(`   From: ${currentName || 'No name'}`);
        console.log(`   To: ${truncatedName}`);
        console.log();

        return {
          ...sku,
          productName: truncatedName,
          title: fbaMatch.productName,  // Store full title
          brand: fbaMatch.account || sku.brand,  // Update brand if available
        };
      } else {
        alreadyHadName++;
      }
    }

    return sku;
  });

  console.log('═'.repeat(60));
  console.log('\n📊 Merge Summary:\n');
  console.log(`   Matched in FBA Inventory: ${matched}`);
  console.log(`   Already had good names: ${alreadyHadName}`);
  console.log(`   Updated with new names: ${updated}`);
  console.log(`   Still missing names: ${enrichedData.filter(s => {
    const name = s.productName || '';
    return !name || name === s.sku || name.length <= s.sku.length;
  }).length}\n`);

  // Step 4: Save updated data
  console.log('💾 Saving updated enriched data...');
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enrichedData, null, 2));
  console.log(`✅ Saved to: ${OUTPUT_PATH}\n`);

  // Step 5: Show statistics
  const withNames = enrichedData.filter(s => {
    const name = s.productName || '';
    return name && name !== s.sku && name.length > s.sku.length;
  }).length;

  const withoutNames = enrichedData.length - withNames;

  console.log('═'.repeat(60));
  console.log('\n📈 Final Statistics:\n');
  console.log(`   Total SKUs: ${enrichedData.length}`);
  console.log(`   With product names: ${withNames} (${((withNames / enrichedData.length) * 100).toFixed(1)}%)`);
  console.log(`   Without names: ${withoutNames} (${((withoutNames / enrichedData.length) * 100).toFixed(1)}%)\n`);

  // Show sample updated products
  const updatedProducts = enrichedData.filter(s => {
    const fbaMatch = skuMap.get(s.sku);
    return fbaMatch && s.productName !== s.sku;
  }).slice(0, 3);

  if (updatedProducts.length > 0) {
    console.log('🔍 Sample Updated Products:\n');
    updatedProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.sku}`);
      console.log(`   Name: ${p.productName}`);
      console.log(`   Brand: ${p.brand}`);
      console.log(`   Revenue: $${(p.revenue || 0).toLocaleString()}`);
      console.log();
    });
  }

  console.log('═'.repeat(60));
  console.log('\n🎉 Merge complete!\n');
  console.log('Next step: Refresh your dashboard to see the updated names.\n');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { truncateProductTitle };
