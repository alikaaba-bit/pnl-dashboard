import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, AreaChart, Area } from "recharts";

/**
 * SKU-Level Breakdown Component
 * Shows product-level performance from Daily_MSKU sheet data
 */

// Import enriched SKU data from JSON file
import skuDataJson from "./sku-data-enriched.json";

function SkuBreakdown({ skuData = skuDataJson }) {
  const [sortBy, setSortBy] = useState("revenue");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterTheme, setFilterTheme] = useState("all");
  const [filterSeasonality, setFilterSeasonality] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [showOnlyNamed, setShowOnlyNamed] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  // Get unique brands, themes, and seasonality options
  const brands = useMemo(() => {
    const brandSet = new Set(skuData.map(s => s.brand));
    return ["all", ...Array.from(brandSet).sort()];
  }, [skuData]);

  const themes = useMemo(() => {
    const themeSet = new Set(skuData.map(s => s.theme).filter(Boolean));
    return ["all", ...Array.from(themeSet).sort()];
  }, [skuData]);

  const seasonalities = useMemo(() => {
    return ["all", "Q1", "Q2", "Q3", "Q4", "Year-Round"];
  }, []);

  const years = useMemo(() => {
    const yearSet = new Set();
    skuData.forEach(s => {
      if (s.firstSale) {
        const year = new Date(s.firstSale).getFullYear();
        yearSet.add(year);
      }
      if (s.lastSale) {
        const year = new Date(s.lastSale).getFullYear();
        yearSet.add(year);
      }
    });
    return ["all", ...Array.from(yearSet).sort()];
  }, [skuData]);

  const months = [
    "all", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = skuData;

    if (filterBrand !== "all") {
      data = data.filter(s => s.brand === filterBrand);
    }

    if (filterTheme !== "all") {
      data = data.filter(s => s.theme === filterTheme);
    }

    if (filterSeasonality !== "all") {
      data = data.filter(s => s.seasonality === filterSeasonality);
    }

    if (filterYear !== "all") {
      const year = parseInt(filterYear);
      data = data.filter(s => {
        if (!s.firstSale && !s.lastSale) return false;
        const firstYear = s.firstSale ? new Date(s.firstSale).getFullYear() : year;
        const lastYear = s.lastSale ? new Date(s.lastSale).getFullYear() : year;
        return year >= firstYear && year <= lastYear;
      });
    }

    if (filterMonth !== "all") {
      data = data.filter(s => s.peakMonth === filterMonth);
    }

    if (showOnlyNamed) {
      data = data.filter(s => {
        const name = s.productName || s.product || '';
        return name && name !== s.sku && name.length > s.sku.length;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(s =>
        s.sku.toLowerCase().includes(term) ||
        (s.product && s.product.toLowerCase().includes(term)) ||
        (s.productName && s.productName.toLowerCase().includes(term)) ||
        (s.title && s.title.toLowerCase().includes(term))
      );
    }

    data = [...data].sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return bVal - aVal;
    });

    return data;
  }, [skuData, sortBy, filterBrand, filterTheme, filterSeasonality, filterYear, filterMonth, showOnlyNamed, searchTerm]);

  const top10 = filteredData.slice(0, 10).map(sku => ({
    ...sku,
    displayName: (sku.productName && sku.productName !== sku.sku)
      ? sku.productName.substring(0, 30) + (sku.productName.length > 30 ? '...' : '')
      : `Product ${sku.sku.substring(0, 15)}`
  }));

  const totals = useMemo(() => {
    return filteredData.reduce((acc, s) => ({
      revenue: acc.revenue + s.revenue,
      units: acc.units + s.units,
      adSpend: acc.adSpend + s.adSpend,
      grossProfit: acc.grossProfit + s.grossProfit
    }), { revenue: 0, units: 0, adSpend: 0, grossProfit: 0 });
  }, [filteredData]);

  const avgMargin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue * 100).toFixed(1) : 0;

  return (
    <div className="dashboard-content" style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <h1 className="heading-2 mb-6">SKU-Level Breakdown</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8 animate-fade-in">
        <div className="metric-card">
          <div className="metric-label text-ellipsis">Total SKUs</div>
          <div className="metric-value responsive-metric">{filteredData.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label text-ellipsis">Total Revenue</div>
          <div className="metric-value responsive-metric" title={`$${totals.revenue.toLocaleString()}`}>${totals.revenue.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label text-ellipsis">Total Units</div>
          <div className="metric-value responsive-metric" title={totals.units.toLocaleString()}>{totals.units.toLocaleString()}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label text-ellipsis">Avg Margin</div>
          <div className="metric-value responsive-metric">{avgMargin}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar animate-fade-in">
        <input
          type="text"
          className="form-input"
          placeholder="Search SKU or product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: "1", minWidth: "250px" }}
        />
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="form-select"
        >
          {brands.map(b => (
            <option key={b} value={b}>{b === "all" ? "All Brands" : b}</option>
          ))}
        </select>
        <select
          value={filterTheme}
          onChange={(e) => setFilterTheme(e.target.value)}
          className="form-select"
        >
          {themes.map(t => (
            <option key={t} value={t}>{t === "all" ? "All Themes" : t}</option>
          ))}
        </select>
        <select
          value={filterSeasonality}
          onChange={(e) => setFilterSeasonality(e.target.value)}
          className="form-select"
        >
          {seasonalities.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Seasons" : s}</option>
          ))}
        </select>
      </div>

      {/* Time Filters & Options */}
      <div className="filters-bar animate-fade-in" style={{ alignItems: "center" }}>
        <div className="flex gap-3 items-center">
          <span className="filter-label">Time Filters:</span>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="form-select"
            style={{ minWidth: "120px" }}
          >
            {years.map(y => (
              <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>
            ))}
          </select>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="form-select"
            style={{ minWidth: "140px" }}
          >
            {months.map(m => (
              <option key={m} value={m}>{m === "all" ? "All Peak Months" : m}</option>
            ))}
          </select>
        </div>

        <label className="flex gap-2 items-center" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showOnlyNamed}
            onChange={(e) => setShowOnlyNamed(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <span className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>
            Only show products with names ({skuData.filter(s => {
              const name = s.productName || s.product || '';
              return name && name !== s.sku && name.length > s.sku.length;
            }).length.toLocaleString()} products)
          </span>
        </label>

        <div style={{ marginLeft: "auto" }} className="flex gap-3 items-center">
          <span className="filter-label">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-select"
            style={{ minWidth: "150px" }}
          >
            <option value="revenue">Revenue</option>
            <option value="units">Units</option>
            <option value="grossProfit">Profit</option>
            <option value="margin">Margin %</option>
            <option value="acos">ACoS</option>
            <option value="historicalRevenue">Historical Revenue</option>
            <option value="organicToPaidRatio">Organic/Paid Ratio</option>
          </select>
        </div>
      </div>

      {/* Top 10 Chart */}
      <div className="card p-6 mb-8 animate-fade-in">
        <h2 className="text-lg font-semibold mb-4">Top 10 Products by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={top10}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" />
            <XAxis
              dataKey="displayName"
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: "11px" }}
            />
            <YAxis />
            <Tooltip
              contentStyle={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}
              formatter={(value) => sortBy === "margin" || sortBy === "acos" ? `${value}%` : `$${value.toLocaleString()}`}
              labelFormatter={(label) => `Product: ${label}`}
            />
            <Bar dataKey={sortBy} fill="var(--primary-600)">
              {top10.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index < 3 ? "var(--success-600)" : "var(--primary-600)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SKU Table */}
      <div className="table-container animate-fade-in">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "30px" }}></th>
              <th style={{ borderRight: "2px solid var(--border-light)" }}>
                <div>Product Info</div>
                <div className="text-xs font-normal text-tertiary">SKU / Name / Category</div>
              </th>
              <th style={{ textAlign: "right", borderRight: "2px solid var(--border-light)" }}>
                <div>Performance</div>
                <div className="text-xs font-normal text-tertiary">Units / Revenue</div>
              </th>
              <th style={{ textAlign: "right", borderRight: "2px solid var(--border-light)" }}>
                <div>Costs</div>
                <div className="text-xs font-normal text-tertiary">COGS / FBA / Ads</div>
              </th>
              <th style={{ textAlign: "right", borderRight: "2px solid var(--border-light)" }}>
                <div>Organic/Paid Ratio</div>
                <div className="text-xs font-normal text-tertiary">Last 30 Days</div>
              </th>
              <th style={{ textAlign: "right" }}>
                <div>Profitability</div>
                <div className="text-xs font-normal text-tertiary">Profit / Margin</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.slice(0, 50).map((sku, idx) => {
              const isExpanded = expandedRow === idx;
              const rawName = sku.productName || sku.product || '';
              const hasRealName = rawName && rawName !== sku.sku && rawName.length > sku.sku.length;
              const displayName = hasRealName ? rawName : null;

              return (
                <React.Fragment key={idx}>
                  <tr
                    style={{
                      borderBottom: isExpanded ? "none" : "1px solid var(--border-light)",
                      cursor: "pointer"
                    }}
                    onClick={() => setExpandedRow(isExpanded ? null : idx)}
                  >
                    <td style={{ textAlign: "center" }}>
                      <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </td>
                    <td style={{ borderRight: "2px solid var(--border-light)" }}>
                      {displayName ? (
                        <>
                          <div className="font-semibold mb-2 table-product-name" style={{
                            fontSize: "var(--text-sm)"
                          }} title={displayName}>
                            {displayName}
                          </div>
                          <div className="font-mono text-secondary mb-2 table-sku" title={sku.sku}>
                            SKU: {sku.sku}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold mb-2 table-sku" style={{ fontSize: "var(--text-sm)" }} title={sku.sku}>
                            <span className="font-mono">SKU: {sku.sku}</span>
                          </div>
                          <div className="badge badge-warning mb-2 text-ellipsis" style={{ fontSize: "var(--text-xs)" }}>
                            Product name not available
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 flex-wrap items-center badge-container">
                        {sku.brand && sku.brand !== "Unknown" && (
                          <span className="badge badge-neutral text-ellipsis" style={{ fontSize: "11px" }} title={sku.brand}>
                            {sku.brand}
                          </span>
                        )}
                        {sku.theme && sku.theme !== "GENERAL" && (
                          <span className="badge badge-info text-ellipsis" title={sku.theme}>
                            {sku.theme}
                          </span>
                        )}
                        {sku.seasonalityBadge && sku.seasonality !== "Year-Round" && (
                          <span className="badge badge-warning text-ellipsis" title={`${sku.seasonalityBadge} ${sku.seasonality}`}>
                            {sku.seasonalityBadge} {sku.seasonality}
                          </span>
                        )}
                        {sku.category && (
                          <span className="text-tertiary text-ellipsis" style={{ fontSize: "var(--text-xs)", maxWidth: "150px" }} title={sku.category}>
                            {sku.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", borderRight: "2px solid var(--border-light)" }}>
                      <div className="font-semibold mb-2 table-numeric" title={`${(sku.units || 0).toLocaleString()} units`}>
                        {(sku.units || 0).toLocaleString()} units
                      </div>
                      <div className="font-semibold text-success table-numeric" title={`$${(sku.revenue || 0).toLocaleString()}`}>
                        ${(sku.revenue || 0).toLocaleString()}
                      </div>
                      {sku.historicalRevenue > 0 && (
                        <div className="text-tertiary table-numeric" style={{ fontSize: "var(--text-xs)", marginTop: "2px" }} title={`Historical: $${(sku.historicalRevenue || 0).toLocaleString()}`}>
                          Historical: ${(sku.historicalRevenue || 0).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "right", borderRight: "2px solid var(--border-light)" }}>
                      <div className="mb-2 table-numeric" style={{ fontSize: "var(--text-sm)" }} title={`COGS: $${(sku.cogs || 0).toLocaleString()}`}>
                        COGS: ${(sku.cogs || 0).toLocaleString()}
                      </div>
                      <div className="mb-2 table-numeric" style={{ fontSize: "var(--text-sm)" }} title={`FBA: $${(sku.fbaFee || 0).toLocaleString()}`}>
                        FBA: ${(sku.fbaFee || 0).toLocaleString()}
                      </div>
                      <div className="table-numeric" style={{ fontSize: "var(--text-sm)" }} title={`Ads: $${(sku.adSpend || 0).toLocaleString()}`}>
                        Ads: ${(sku.adSpend || 0).toLocaleString()}
                        {sku.acos > 0 && (
                          <span style={{
                            color: sku.acos > 30 ? "var(--danger-600)" : "var(--success-600)",
                            marginLeft: "4px"
                          }}>
                            ({sku.acos}%)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", borderRight: "2px solid var(--border-light)" }}>
                      {sku.organicToPaidRatioFormatted === "N/A" ? (
                        <div className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>
                          N/A
                        </div>
                      ) : sku.organicToPaidRatioFormatted === "Organic Only" ? (
                        <div className="badge badge-success" style={{ fontSize: "var(--text-sm)" }}>
                          Organic Only
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold mb-2" style={{
                            fontSize: "var(--text-lg)",
                            color: sku.organicToPaidRatio > 2 ? "var(--success-600)" :
                                   sku.organicToPaidRatio >= 1 ? "var(--warning-600)" :
                                   "var(--danger-600)"
                          }}>
                            {sku.organicToPaidRatioFormatted}
                          </div>
                          <div className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>
                            Org: ${(sku.organicSales30d || 0).toLocaleString()}
                          </div>
                          <div className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>
                            Paid: ${(sku.paidSales30d || 0).toLocaleString()}
                          </div>
                        </>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="font-semibold mb-2 table-numeric number-medium" title={`$${(sku.grossProfit || 0).toLocaleString()}`}>
                        ${(sku.grossProfit || 0).toLocaleString()}
                      </div>
                      <div className="font-semibold table-numeric" style={{
                        color: (sku.margin || 0) > 25 ? "var(--success-600)" : (sku.margin || 0) > 15 ? "var(--warning-600)" : "var(--danger-600)"
                      }} title={`${(sku.margin || 0)}% margin`}>
                        {(sku.margin || 0)}% margin
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td colSpan="6" className="p-6">
                        <SeasonalityChart sku={sku} />
                        <CostBreakdown sku={sku} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filteredData.length > 50 && (
          <div className="p-4 text-secondary text-center" style={{ background: "var(--surface-sunken)", fontSize: "var(--text-sm)" }}>
            Showing top 50 of {filteredData.length} SKUs
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Seasonality Chart Component
 * Displays monthly sales trend over the last 12 months
 */
function SeasonalityChart({ sku }) {
  // Check if monthly sales data is available
  if (!sku.monthlySales || sku.monthlySales.length === 0) {
    return (
      <div className="card p-4 mb-4" style={{ background: "var(--surface-sunken)" }}>
        <div className="text-sm text-tertiary text-center">
          No seasonality data available
        </div>
      </div>
    );
  }

  // Check if all months are zero
  const totalUnits = sku.monthlySales.reduce((sum, m) => sum + m.units, 0);
  if (totalUnits === 0) {
    return (
      <div className="card p-4 mb-4" style={{ background: "var(--surface-sunken)" }}>
        <div className="text-sm text-tertiary text-center">
          No sales in last 12 months
        </div>
      </div>
    );
  }

  const peakMonthIndex = sku.peakMonthIndex !== undefined ? sku.peakMonthIndex :
    sku.monthlySales.findIndex(m => m.units === Math.max(...sku.monthlySales.map(x => x.units)));

  return (
    <div className="card p-4 mb-4">
      <h4 className="text-sm font-medium mb-4 text-secondary">
        Monthly Sales Trend (Last 12 Months)
      </h4>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={sku.monthlySales}>
          <defs>
            <linearGradient id={`gradient-${sku.sku}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00d2ff" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            style={{ fontSize: "11px" }}
            stroke="var(--text-tertiary)"
            axisLine={{ stroke: "var(--border-light)" }}
          />
          <YAxis
            hide={true}
          />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              fontSize: "12px"
            }}
            formatter={(value, name, props) => [
              `${value.toLocaleString()} units`,
              props.payload.monthName
            ]}
            labelFormatter={(label) => ""}
          />
          <Area
            type="monotone"
            dataKey="units"
            stroke="#00d2ff"
            strokeWidth={2}
            fill={`url(#gradient-${sku.sku})`}
            activeDot={{ r: 6, fill: "#00d2ff" }}
            dot={(props) => {
              const { cx, cy, index } = props;
              if (index === peakMonthIndex) {
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={5} fill="#00d2ff" stroke="white" strokeWidth={2} />
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize="11px"
                      fontWeight="600"
                    >
                      Peak
                    </text>
                  </g>
                );
              }
              return null;
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Cost Breakdown Component
 */
function CostBreakdown({ sku }) {
  const revenue = sku.revenue || 0;
  const cogs = sku.cogs || 0;
  const fbaFee = sku.fbaFee || 0;
  const adSpend = sku.adSpend || 0;
  const storage = sku.storage || 0;
  const refunds = sku.refunds || 0;

  const afterCogs = revenue - cogs;
  const afterFba = afterCogs - fbaFee;
  const afterAds = afterFba - adSpend;
  const afterStorage = afterAds - storage;
  const netProfit = afterStorage - refunds;

  const waterfallData = [
    { name: "Revenue", value: revenue, color: "var(--success-600)", cumulative: revenue },
    { name: "- COGS", value: -cogs, color: "var(--danger-600)", cumulative: afterCogs },
    { name: "- FBA Fee", value: -fbaFee, color: "var(--danger-600)", cumulative: afterFba },
    { name: "- Ad Spend", value: -adSpend, color: "var(--danger-600)", cumulative: afterAds },
    { name: "- Storage", value: -storage, color: "var(--danger-600)", cumulative: afterStorage },
    { name: "- Refunds", value: -refunds, color: "var(--danger-600)", cumulative: netProfit },
    { name: "Net Profit", value: netProfit, color: netProfit > 0 ? "var(--primary-600)" : "var(--danger-600)", cumulative: netProfit },
  ];

  const costBreakdown = [
    { label: "COGS", amount: cogs, percent: revenue > 0 ? ((cogs / revenue) * 100).toFixed(1) : 0, color: "#ff6b6b" },
    { label: "FBA Fee", amount: fbaFee, percent: revenue > 0 ? ((fbaFee / revenue) * 100).toFixed(1) : 0, color: "#4ecdc4" },
    { label: "Ad Spend", amount: adSpend, percent: revenue > 0 ? ((adSpend / revenue) * 100).toFixed(1) : 0, color: "#45b7d1" },
    { label: "Storage", amount: storage, percent: revenue > 0 ? ((storage / revenue) * 100).toFixed(1) : 0, color: "#96ceb4" },
    { label: "Refunds", amount: refunds, percent: revenue > 0 ? ((refunds / revenue) * 100).toFixed(1) : 0, color: "#dda15e" },
    { label: "Net Profit", amount: netProfit, percent: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0, color: netProfit > 0 ? "var(--primary-600)" : "var(--danger-600)" },
  ];

  return (
    <div className="p-4">
      <h3 className="text-base font-semibold mb-4 text-secondary">Cost Breakdown & Profitability Analysis</h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Waterfall Chart */}
        <div>
          <h4 className="text-sm font-medium mb-4 text-secondary">Revenue to Net Profit Waterfall</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-color)" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} style={{ fontSize: "12px" }} />
              <YAxis style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}
                formatter={(value) => `$${Math.abs(value).toLocaleString()}`}
              />
              <Bar dataKey="cumulative" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-4 text-secondary">Cost Component Breakdown</h4>
          <div className="card p-4">
            {costBreakdown.map((item, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex justify-between mb-2">
                  <span style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: idx === costBreakdown.length - 1 ? "600" : "normal"
                  }}>
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold">
                    ${item.amount.toLocaleString()} ({item.percent}%)
                  </span>
                </div>
                <div style={{
                  background: "var(--neutral-200)",
                  height: "8px",
                  borderRadius: "var(--radius-base)",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${item.percent}%`,
                    height: "100%",
                    background: item.color,
                    transition: "width var(--transition-base)"
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Additional Metrics */}
          {sku.firstSale && (
            <div className="card p-4 mt-4" style={{ background: "var(--surface-sunken)" }}>
              <div className="text-xs font-semibold mb-2 text-secondary">
                Product Lifecycle:
              </div>
              <div className="text-xs text-tertiary">
                First Sale: {sku.firstSale} • Last Sale: {sku.lastSale || 'N/A'}
              </div>
              {sku.peakMonth && (
                <div className="text-xs text-tertiary">
                  Peak Month: {sku.peakMonth} • Avg Daily Sales: {sku.avgDailySales || 0} units
                </div>
              )}
              {sku.category && (
                <div className="text-xs text-tertiary mt-2">
                  Category: {sku.category} {sku.subcategory && `> ${sku.subcategory}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profitability Classification */}
      <div className="card p-4 mt-4" style={{ background: "var(--warning-50)" }}>
        <strong style={{ fontSize: "var(--text-sm)" }}>
          {getProfitabilityClassification(sku.units, sku.margin)}
        </strong>
      </div>
    </div>
  );
}

function getProfitabilityClassification(units, margin) {
  const highVolume = units > 1000;
  const highMargin = margin > 25;

  if (highVolume && highMargin) {
    return "Star Product - High margin, high volume. Keep investing!";
  } else if (!highVolume && highMargin) {
    return "Question Mark - High margin, low volume. Consider increasing marketing.";
  } else if (highVolume && !highMargin) {
    return "Cash Cow - Low margin, high volume. Optimize costs or pricing.";
  } else {
    return "Dog Product - Low margin, low volume. Consider discontinuing or repositioning.";
  }
}

export default SkuBreakdown;
