import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

/**
 * SKU-Level Breakdown Component
 * Shows product-level performance from Daily_MSKU sheet data
 */

// Import actual SKU data from JSON file
import skuDataJson from "./sku-data.json";

function SkuBreakdown({ skuData = skuDataJson }) {
  const [sortBy, setSortBy] = useState("revenue");
  const [filterBrand, setFilterBrand] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Get unique brands
  const brands = useMemo(() => {
    const brandSet = new Set(skuData.map(s => s.brand));
    return ["all", ...Array.from(brandSet).sort()];
  }, [skuData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = skuData;

    // Filter by brand
    if (filterBrand !== "all") {
      data = data.filter(s => s.brand === filterBrand);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(s =>
        s.sku.toLowerCase().includes(term) ||
        s.product.toLowerCase().includes(term)
      );
    }

    // Sort
    data = [...data].sort((a, b) => b[sortBy] - a[sortBy]);

    return data;
  }, [skuData, sortBy, filterBrand, searchTerm]);

  // Top 10 for chart
  const top10 = filteredData.slice(0, 10);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, s) => ({
      revenue: acc.revenue + s.revenue,
      units: acc.units + s.units,
      adSpend: acc.adSpend + s.adSpend,
      grossProfit: acc.grossProfit + s.grossProfit
    }), { revenue: 0, units: 0, adSpend: 0, grossProfit: 0 });
  }, [filteredData]);

  const avgMargin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue * 100).toFixed(1) : 0;
  const avgAcos = totals.adSales > 0 ? (totals.adSpend / totals.adSales * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>📦 SKU-Level Breakdown</h1>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
        <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "5px" }}>Total SKUs</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{filteredData.length}</div>
        </div>
        <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "5px" }}>Total Revenue</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>${totals.revenue.toLocaleString()}</div>
        </div>
        <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "5px" }}>Total Units</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{totals.units.toLocaleString()}</div>
        </div>
        <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "5px" }}>Avg Margin</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{avgMargin}%</div>
        </div>
        <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "5px" }}>Ad Spend</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>${totals.adSpend.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search SKU or product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            flex: "1",
            minWidth: "200px"
          }}
        />
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px" }}
        >
          {brands.map(b => (
            <option key={b} value={b}>{b === "all" ? "All Brands" : b}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #dee2e6", borderRadius: "4px" }}
        >
          <option value="revenue">Sort by Revenue</option>
          <option value="units">Sort by Units</option>
          <option value="grossProfit">Sort by Profit</option>
          <option value="margin">Sort by Margin %</option>
          <option value="acos">Sort by ACoS</option>
        </select>
      </div>

      {/* Top 10 Chart */}
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #dee2e6" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>Top 10 SKUs by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={top10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="sku" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip
              contentStyle={{ background: "white", border: "1px solid #ccc" }}
              formatter={(value) => sortBy === "margin" || sortBy === "acos" ? `${value}%` : `$${value.toLocaleString()}`}
            />
            <Bar dataKey={sortBy} fill="#0066cc">
              {top10.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index < 3 ? "#00cc66" : "#0066cc"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SKU Table */}
      <div style={{ background: "white", borderRadius: "8px", border: "1px solid #dee2e6", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>SKU</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Product</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Brand</th>
                <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Revenue</th>
                <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Units</th>
                <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Ad Spend</th>
                <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>ACoS</th>
                <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Profit</th>
                <th style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 50).map((sku, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #dee2e6", background: idx % 2 === 0 ? "white" : "#f8f9fa" }}>
                  <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "13px" }}>{sku.sku}</td>
                  <td style={{ padding: "12px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sku.product}
                  </td>
                  <td style={{ padding: "12px" }}>{sku.brand}</td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>${sku.revenue.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>{sku.units.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>${sku.adSpend.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: sku.acos > 30 ? "#dc3545" : "#28a745" }}>
                    {sku.acos}%
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>${sku.grossProfit.toLocaleString()}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: sku.margin > 25 ? "#28a745" : sku.margin > 15 ? "#ffc107" : "#dc3545" }}>
                    {sku.margin}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredData.length > 50 && (
          <div style={{ padding: "15px", textAlign: "center", background: "#f8f9fa", color: "#6c757d", fontSize: "14px" }}>
            Showing top 50 of {filteredData.length} SKUs
          </div>
        )}
      </div>
    </div>
  );
}

export default SkuBreakdown;
