# Quick Start Guide - Enhanced SKU Dashboard

## 🚀 What's New?

Your SKU dashboard now has powerful new features:

### 1. Real Product Names ✨
No more cryptic SKU codes! See actual product names like:
- "Theme Balloon Series-Pastel Rainbow Balloon Garland Kit"
- "HOUSE OF PARTY Christmas Balloon Arch"

### 2. Smart Filters 🔍
Filter products by:
- **Brand**: HOUSE OF PARTY, SOUL MAMA, FOMIN, etc.
- **Theme**: CHRISTMAS, HALLOWEEN, BIRTHDAY, GRADUATION, etc.
- **Seasonality**: Q1 (Winter), Q2 (Spring), Q3 (Summer), Q4 (Fall)
- **Search**: Find products by name or SKU

### 3. Visual Badges 🎨
Quick visual indicators:
- **Theme badges**: Shows product theme (CHRISTMAS, BIRTHDAY, etc.)
- **Season badges**: ❄️ Q1, 🌸 Q2, ☀️ Q3, 🍂 Q4, 🔄 Year-Round

### 4. Cost Breakdown 💰
Click any product row to see:
- **Waterfall chart**: Visual breakdown from revenue to profit
- **Cost percentages**: See what % each cost represents
- **Product lifecycle**: First sale, last sale, peak month
- **Profitability classification**: Star, Question Mark, Cash Cow, or Dog

---

## 📋 Common Use Cases

### Find Q4 Products for Holiday Season
1. Select **"Q4"** from Seasonality dropdown
2. Optionally select **"HOUSE OF PARTY"** from Brand dropdown
3. Results: 146 products optimized for Oct-Dec sales

### Identify High-Margin Birthday Products
1. Select **"BIRTHDAY"** from Theme dropdown
2. Click **"Sort by Margin %"**
3. Review top performers
4. Results: 275 birthday-themed products sorted by profitability

### Analyze Cost Structure of Top Seller
1. Find your top product in the list
2. Click the row to expand
3. Review the waterfall chart
4. Identify optimization opportunities (high FBA fees? high ad spend?)

### Plan Summer Inventory
1. Select **"Q3"** from Seasonality dropdown
2. Review products with peak sales in Jul-Sep
3. Note peak month for each product
4. Results: 77 summer products

### Compare Theme Performance
1. Try different themes (CHRISTMAS, HALLOWEEN, GRADUATION)
2. Note total revenue and SKU count at top
3. Compare margins across themes
4. Identify which themes are most profitable

---

## 🎯 Understanding the New Columns

### Product Info Section
- **SKU**: Unique product identifier (code)
- **Product Name**: Human-readable product name
- **Brand**: HOUSE OF PARTY, SOUL MAMA, etc.
- **Theme Badge**: Product theme category (if not GENERAL)
- **Season Badge**: Peak selling quarter

### Performance Section
- **Units**: Total units sold
- **Revenue**: Total sales revenue
- **Historical**: Revenue from 2022-2026 historical data

### Costs Section
- **COGS**: Cost of goods sold
- **FBA**: Amazon fulfillment fees
- **Ads**: Advertising spend (with ACoS %)

### Profitability Section
- **Gross Profit**: Revenue minus direct costs
- **Margin %**: Profit as percentage of revenue
  - 🟢 Green: >25% (excellent)
  - 🟡 Yellow: 15-25% (good)
  - 🔴 Red: <15% (needs attention)

---

## 💡 Pro Tips

### Tip 1: Use Multiple Filters
Combine filters for precise targeting:
- Brand: HOUSE OF PARTY + Theme: CHRISTMAS + Season: Q4
- Result: Christmas products from House of Party optimized for Q4

### Tip 2: Check Historical Revenue
Products with high historical revenue but low current revenue may indicate:
- Seasonal products outside their peak season
- Products that need marketing boost
- Discontinued or phased-out products

### Tip 3: Use Cost Breakdown for Optimization
Common insights from cost breakdown:
- **High FBA fees**: Consider FBA optimization or product size/weight
- **High ad spend**: Review ad campaigns, adjust targeting
- **High COGS**: Negotiate with suppliers, consider alternatives
- **High refunds**: Quality issues, wrong product description

### Tip 4: Profitability Classifications
- ⭐ **Stars**: Invest more, scale up
- ❓ **Question Marks**: Increase marketing to boost volume
- 🐄 **Cash Cows**: Optimize costs, maintain position
- 🐕 **Dogs**: Consider discontinuing or repositioning

### Tip 5: Plan Inventory by Season
Use the seasonality filter to:
- **Q1 (Jan-Mar)**: Valentine's, Winter clearance
- **Q2 (Apr-Jun)**: Graduation, Easter, Spring, Weddings
- **Q3 (Jul-Sep)**: July 4th, Summer, Back to school
- **Q4 (Oct-Dec)**: Halloween, Thanksgiving, Christmas

---

## 📊 Dashboard Metrics Explained

### Summary Cards (Top of Page)
- **Total SKUs**: Number of products matching your filters
- **Total Revenue**: Sum of revenue for filtered products
- **Total Units**: Sum of units sold for filtered products
- **Avg Margin**: Average profit margin across filtered products
- **Ad Spend**: Total advertising spend for filtered products

### Top 10 Chart
- Shows top 10 products by selected sort metric
- Green bars = top 3 performers
- Blue bars = ranks 4-10

### Table (Bottom)
- Shows top 50 products matching filters
- Click any row to see detailed cost breakdown
- Sorted by selected metric (default: revenue)

---

## 🔧 Troubleshooting

### "Unknown" Brand Showing
Some products are marked as "Unknown" brand because:
- Not in historical Excel data
- Brand field empty in source data
- Can be manually updated if needed

### "GENERAL" Theme Showing
Products marked as GENERAL theme because:
- Auto-classification didn't find matching patterns
- Not a themed product (generic items)
- 70% of products are GENERAL (expected)

### No Historical Revenue
Some products show $0 historical revenue because:
- Not in the Excel historical export
- Recently added products
- Data export may not include all SKUs

### Dashboard Not Updating
After running data processing:
1. Refresh browser page (Ctrl+R / Cmd+R)
2. Clear cache if needed (Ctrl+Shift+R / Cmd+Shift+R)
3. Check console for errors (F12)

---

## 📈 Example Workflows

### Workflow 1: Prepare for Q4 Holiday Season
1. **Step 1**: Filter Seasonality = "Q4"
2. **Step 2**: Filter Brand = "HOUSE OF PARTY"
3. **Step 3**: Sort by "Units" to see volume sellers
4. **Step 4**: Click top products to check margins
5. **Step 5**: Plan inventory for products with high margin + high volume
6. **Result**: 146 Q4 products identified, top 10 ready for inventory planning

### Workflow 2: Optimize Product Costs
1. **Step 1**: Sort by "Margin %" ascending (lowest first)
2. **Step 2**: Click low-margin products to expand
3. **Step 3**: Review cost breakdown chart
4. **Step 4**: Identify highest cost component
5. **Step 5**: Plan optimization (negotiate COGS, reduce ads, etc.)
6. **Result**: Action plan to improve margins on 10+ products

### Workflow 3: Discover New Opportunities
1. **Step 1**: Filter Theme = "BIRTHDAY" (or other theme)
2. **Step 2**: Sort by "Profit"
3. **Step 3**: Identify high-profit products
4. **Step 4**: Check similar products in catalog
5. **Step 5**: Consider expanding this theme category
6. **Result**: Identified birthday theme as opportunity (275 SKUs, strong performance)

---

## 🎓 Next Steps

### Immediate Actions
1. ✅ Explore the enhanced dashboard at http://localhost:3000
2. ✅ Try different filter combinations
3. ✅ Click products to see cost breakdowns
4. ✅ Identify Q4 products for upcoming season

### Optional: Supabase Integration
If you want natural language queries via Petra Mind:
1. See `IMPLEMENTATION_SUMMARY.md` for setup guide
2. Run Supabase schema: `supabase/schema.sql`
3. Migrate data: `node automation/migrate-to-supabase.js`
4. Query with Petra Mind: "Show me Q4 products for House of Party"

### Learn More
- **Full implementation details**: See `IMPLEMENTATION_SUMMARY.md`
- **Technical details**: See `memory/pnl-dashboard-enhancements.md`
- **Original plan**: See conversation transcript

---

## 🆘 Need Help?

Common questions:
1. **How do I refresh data?** Run `node automation/process-historical-data.js`
2. **How do I add new themes?** Edit `automation/process-historical-data.js` theme patterns
3. **How do I customize filters?** Edit `src/SkuBreakdown.jsx` filter logic
4. **How do I deploy?** Run `npm run deploy` (already configured for GitHub Pages)

---

**Dashboard URL**: http://localhost:3000
**Last Updated**: February 5, 2026
**Total Enhanced SKUs**: 3,390
