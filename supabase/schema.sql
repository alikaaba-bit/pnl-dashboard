-- Supabase Database Schema for Enhanced SKU Dashboard
-- This schema stores enriched SKU data for Petra Mind analytics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: SKU Master (Product Catalog)
-- Stores product information, categorization, and theme data
CREATE TABLE IF NOT EXISTS sku_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  msku TEXT,
  asin TEXT,
  product_name TEXT NOT NULL,
  title TEXT,
  brand TEXT,

  -- Categorization
  category TEXT,
  secondary_category TEXT,
  tertiary_category TEXT,
  theme TEXT,
  seasonality TEXT,
  seasonality_badge TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT sku_master_sku_key UNIQUE (sku)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sku_master_brand ON sku_master(brand);
CREATE INDEX IF NOT EXISTS idx_sku_master_theme ON sku_master(theme);
CREATE INDEX IF NOT EXISTS idx_sku_master_seasonality ON sku_master(seasonality);
CREATE INDEX IF NOT EXISTS idx_sku_master_category ON sku_master(category);
CREATE INDEX IF NOT EXISTS idx_sku_master_is_active ON sku_master(is_active);

-- Table 2: SKU Daily Sales (Time-Series Data)
-- Stores historical daily sales data for trend analysis
CREATE TABLE IF NOT EXISTS sku_daily_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL REFERENCES sku_master(sku) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Daily metrics
  sales_volume INTEGER DEFAULT 0,
  transactions INTEGER DEFAULT 0,
  sales_amount DECIMAL(12, 2) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicate entries
  CONSTRAINT sku_daily_sales_sku_date_key UNIQUE (sku, date)
);

-- Create indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_sku_daily_sales_sku ON sku_daily_sales(sku);
CREATE INDEX IF NOT EXISTS idx_sku_daily_sales_date ON sku_daily_sales(date);
CREATE INDEX IF NOT EXISTS idx_sku_daily_sales_sku_date ON sku_daily_sales(sku, date);

-- Table 3: SKU Aggregates (Pre-computed Summaries)
-- Stores aggregated metrics for fast dashboard queries
CREATE TABLE IF NOT EXISTS sku_aggregates (
  sku TEXT PRIMARY KEY REFERENCES sku_master(sku) ON DELETE CASCADE,

  -- Aggregated metrics (from existing sku-data.json)
  total_units INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_cogs DECIMAL(12, 2) DEFAULT 0,
  total_fba_fee DECIMAL(12, 2) DEFAULT 0,
  total_ad_spend DECIMAL(12, 2) DEFAULT 0,
  total_ad_sales DECIMAL(12, 2) DEFAULT 0,
  total_storage DECIMAL(12, 2) DEFAULT 0,
  total_refunds DECIMAL(12, 2) DEFAULT 0,

  -- Calculated metrics
  gross_profit DECIMAL(12, 2) DEFAULT 0,
  net_profit DECIMAL(12, 2) DEFAULT 0,
  avg_margin DECIMAL(5, 2) DEFAULT 0,
  avg_acos DECIMAL(5, 2) DEFAULT 0,
  refund_rate DECIMAL(5, 2) DEFAULT 0,

  -- Historical insights
  first_sale_date DATE,
  last_sale_date DATE,
  peak_month TEXT,
  avg_daily_sales DECIMAL(10, 2) DEFAULT 0,
  historical_units INTEGER DEFAULT 0,
  historical_revenue DECIMAL(12, 2) DEFAULT 0,
  historical_transactions INTEGER DEFAULT 0,

  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for aggregated queries
CREATE INDEX IF NOT EXISTS idx_sku_aggregates_revenue ON sku_aggregates(total_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_sku_aggregates_units ON sku_aggregates(total_units DESC);
CREATE INDEX IF NOT EXISTS idx_sku_aggregates_margin ON sku_aggregates(avg_margin DESC);

-- View 1: Theme Performance Summary
-- Aggregates performance by theme for quick analysis
CREATE OR REPLACE VIEW vw_theme_performance AS
SELECT
  sm.theme,
  sm.seasonality,
  COUNT(DISTINCT sm.sku) as sku_count,
  SUM(sa.total_revenue) as theme_revenue,
  SUM(sa.total_units) as theme_units,
  SUM(sa.gross_profit) as theme_profit,
  AVG(sa.avg_margin) as avg_margin,
  AVG(sa.avg_acos) as avg_acos,
  SUM(sa.total_ad_spend) as total_ad_spend
FROM sku_master sm
LEFT JOIN sku_aggregates sa ON sm.sku = sa.sku
WHERE sm.is_active = true
GROUP BY sm.theme, sm.seasonality
ORDER BY theme_revenue DESC;

-- View 2: Brand Performance Summary
-- Aggregates performance by brand
CREATE OR REPLACE VIEW vw_brand_performance AS
SELECT
  sm.brand,
  COUNT(DISTINCT sm.sku) as sku_count,
  SUM(sa.total_revenue) as brand_revenue,
  SUM(sa.total_units) as brand_units,
  SUM(sa.gross_profit) as brand_profit,
  AVG(sa.avg_margin) as avg_margin,
  AVG(sa.avg_acos) as avg_acos
FROM sku_master sm
LEFT JOIN sku_aggregates sa ON sm.sku = sa.sku
WHERE sm.is_active = true
GROUP BY sm.brand
ORDER BY brand_revenue DESC;

-- View 3: Seasonality Performance
-- Aggregates performance by seasonality for inventory planning
CREATE OR REPLACE VIEW vw_seasonality_performance AS
SELECT
  sm.seasonality,
  sm.seasonality_badge,
  COUNT(DISTINCT sm.sku) as sku_count,
  SUM(sa.total_revenue) as season_revenue,
  SUM(sa.total_units) as season_units,
  SUM(sa.gross_profit) as season_profit,
  AVG(sa.avg_margin) as avg_margin
FROM sku_master sm
LEFT JOIN sku_aggregates sa ON sm.sku = sa.sku
WHERE sm.is_active = true
GROUP BY sm.seasonality, sm.seasonality_badge
ORDER BY season_revenue DESC;

-- View 4: Top Performers (Stars)
-- High margin, high volume products
CREATE OR REPLACE VIEW vw_top_performers AS
SELECT
  sm.sku,
  sm.product_name,
  sm.brand,
  sm.theme,
  sm.seasonality,
  sa.total_revenue,
  sa.total_units,
  sa.avg_margin,
  sa.gross_profit
FROM sku_master sm
JOIN sku_aggregates sa ON sm.sku = sa.sku
WHERE
  sm.is_active = true
  AND sa.total_units > 1000
  AND sa.avg_margin > 25
ORDER BY sa.gross_profit DESC;

-- View 5: Monthly Sales Trends
-- Aggregates sales by month for trend analysis
CREATE OR REPLACE VIEW vw_monthly_sales_trends AS
SELECT
  DATE_TRUNC('month', date) as month,
  COUNT(DISTINCT sku) as active_skus,
  SUM(sales_volume) as total_units,
  SUM(sales_amount) as total_revenue,
  SUM(transactions) as total_transactions
FROM sku_daily_sales
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- Function: Update aggregate timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update timestamps on sku_master
CREATE TRIGGER update_sku_master_updated_at
  BEFORE UPDATE ON sku_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update timestamps on sku_aggregates
CREATE TRIGGER update_sku_aggregates_updated_at
  BEFORE UPDATE ON sku_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Refresh aggregate metrics
-- Call this function after inserting new daily sales data
CREATE OR REPLACE FUNCTION refresh_sku_aggregates(p_sku TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF p_sku IS NULL THEN
    -- Refresh all SKUs
    UPDATE sku_aggregates sa
    SET
      historical_units = COALESCE((
        SELECT SUM(sales_volume)
        FROM sku_daily_sales sds
        WHERE sds.sku = sa.sku
      ), 0),
      historical_revenue = COALESCE((
        SELECT SUM(sales_amount)
        FROM sku_daily_sales sds
        WHERE sds.sku = sa.sku
      ), 0),
      historical_transactions = COALESCE((
        SELECT SUM(transactions)
        FROM sku_daily_sales sds
        WHERE sds.sku = sa.sku
      ), 0),
      first_sale_date = (
        SELECT MIN(date)
        FROM sku_daily_sales sds
        WHERE sds.sku = sa.sku
      ),
      last_sale_date = (
        SELECT MAX(date)
        FROM sku_daily_sales sds
        WHERE sds.sku = sa.sku
      );
  ELSE
    -- Refresh specific SKU
    UPDATE sku_aggregates sa
    SET
      historical_units = COALESCE((
        SELECT SUM(sales_volume)
        FROM sku_daily_sales sds
        WHERE sds.sku = p_sku
      ), 0),
      historical_revenue = COALESCE((
        SELECT SUM(sales_amount)
        FROM sku_daily_sales sds
        WHERE sds.sku = p_sku
      ), 0),
      historical_transactions = COALESCE((
        SELECT SUM(transactions)
        FROM sku_daily_sales sds
        WHERE sds.sku = p_sku
      ), 0),
      first_sale_date = (
        SELECT MIN(date)
        FROM sku_daily_sales sds
        WHERE sds.sku = p_sku
      ),
      last_sale_date = (
        SELECT MAX(date)
        FROM sku_daily_sales sds
        WHERE sds.sku = p_sku
      )
    WHERE sa.sku = p_sku;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE sku_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_aggregates ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- Example: Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON sku_master
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON sku_daily_sales
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON sku_aggregates
  FOR ALL USING (auth.role() = 'authenticated');

-- Example Queries for Petra Mind Integration

-- Query 1: Get Q4 products for House of Party
-- SELECT * FROM sku_master WHERE brand = 'HOUSE OF PARTY' AND seasonality = 'Q4';

-- Query 2: Which themes have the highest margins?
-- SELECT * FROM vw_theme_performance ORDER BY avg_margin DESC;

-- Query 3: Show me products to stock for summer
-- SELECT * FROM sku_master WHERE seasonality = 'Q3' AND is_active = true;

-- Query 4: Top performing products by profit
-- SELECT * FROM vw_top_performers LIMIT 10;

-- Query 5: Monthly sales trends for the last 12 months
-- SELECT * FROM vw_monthly_sales_trends WHERE month >= NOW() - INTERVAL '12 months';

COMMENT ON TABLE sku_master IS 'Product catalog with categorization and theme data';
COMMENT ON TABLE sku_daily_sales IS 'Historical daily sales data for trend analysis';
COMMENT ON TABLE sku_aggregates IS 'Pre-computed aggregate metrics for fast dashboard queries';
COMMENT ON VIEW vw_theme_performance IS 'Aggregated performance by theme';
COMMENT ON VIEW vw_brand_performance IS 'Aggregated performance by brand';
COMMENT ON VIEW vw_seasonality_performance IS 'Aggregated performance by seasonality';
COMMENT ON VIEW vw_top_performers IS 'High margin, high volume star products';
COMMENT ON VIEW vw_monthly_sales_trends IS 'Monthly sales aggregates for trend analysis';
