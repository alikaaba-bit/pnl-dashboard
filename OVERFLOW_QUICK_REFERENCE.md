# Overflow Fixes - Quick Reference Guide

## For Developers: How to Use These Classes

### 📊 Metric Cards

**Problem**: Large numbers overflow metric cards
**Solution**: Use `responsive-metric` class

```jsx
// ❌ Before
<div className="metric-value">${revenue}</div>

// ✅ After
<div className="metric-value responsive-metric" title={`$${revenue}`}>
  ${revenue}
</div>
```

**Key Classes**:
- `responsive-metric` - Auto-scales from 1.5rem to 2rem
- `text-ellipsis` - Truncates with ellipsis
- Always add `title` attribute for tooltips

---

### 🏷️ Product Names

**Problem**: Long product names break table layout
**Solution**: Use `table-product-name` class

```jsx
// ❌ Before
<td style={{ maxWidth: "350px", overflow: "hidden", ... }}>
  {productName}
</td>

// ✅ After
<td className="table-product-name" title={productName}>
  {productName}
</td>
```

**Max Widths**:
- Desktop: 350px
- Tablet: 280px
- Mobile: 200px

---

### 🔢 SKU Codes

**Problem**: SKUs hard to read and overflow
**Solution**: Use `table-sku` class

```jsx
// ❌ Before
<div className="font-mono">{sku}</div>

// ✅ After
<div className="table-sku" title={sku}>
  SKU: {sku}
</div>
```

**Features**:
- Monospace font automatically applied
- Max width: 200px
- Ellipsis truncation built-in

---

### 🎯 Badges

**Problem**: Multiple badges overflow horizontally
**Solution**: Wrap in `badge-container` and use `text-ellipsis`

```jsx
// ❌ Before
<div>
  <span className="badge">{brand}</span>
  <span className="badge">{theme}</span>
  <span className="badge">{seasonality}</span>
</div>

// ✅ After
<div className="badge-container">
  <span className="badge text-ellipsis" title={brand}>{brand}</span>
  <span className="badge text-ellipsis" title={theme}>{theme}</span>
  <span className="badge text-ellipsis" title={seasonality}>{seasonality}</span>
</div>
```

**Features**:
- `badge-container` adds flex-wrap
- Individual badges truncate at 200px
- Proper spacing maintained (0.5rem gap)

---

### 💰 Large Numbers

**Problem**: Currency values too large or too small
**Solution**: Use context-appropriate number classes

```jsx
// For revenue/profit columns
<td className="table-numeric number-large" title={fmt(revenue)}>
  {fmtK(revenue)}
</td>

// For margin percentages
<td className="table-numeric number-small" title={fmtPct(margin)}>
  {fmtPct(margin)}
</td>
```

**Class Selection Guide**:
| Value Range | Class | Font Size |
|------------|-------|-----------|
| > $1M | `number-large` | 1.5rem - 2.5rem |
| $10K - $1M | `number-medium` | 1.25rem - 1.875rem |
| < $10K | `number-small` | 1rem - 1.5rem |
| Auto | `responsive-metric` | 1.5rem - 2rem |

---

### 📋 Table Cells

**Problem**: Table cells overflow horizontally
**Solution**: Use `table-numeric` for all numeric columns

```jsx
// ❌ Before
<td style={{ textAlign: "right" }}>
  ${value.toLocaleString()}
</td>

// ✅ After
<td className="table-numeric" title={`$${value.toLocaleString()}`}>
  ${value.toLocaleString()}
</td>
```

**Features**:
- Right-aligned automatically
- Tabular numbers (monospace digits)
- Proper ellipsis if overflow
- White-space: nowrap

---

## 🎨 Complete Examples

### Example 1: KPI Card with Overflow Protection
```jsx
const KPI = ({ label, value, change, subtitle }) => (
  <div className="metric-card">
    <div className="metric-label text-ellipsis" title={label}>
      {label}
    </div>
    <div className="metric-value responsive-metric" title={value}>
      {value}
    </div>
    {change && (
      <span className="badge badge-sm text-ellipsis" title={`${change}% change`}>
        {change > 0 ? '+' : ''}{change}%
      </span>
    )}
    {subtitle && (
      <div className="text-ellipsis" title={subtitle}>
        {subtitle}
      </div>
    )}
  </div>
);
```

### Example 2: Product Table Row
```jsx
<tr>
  {/* Product Name */}
  <td className="table-product-name" title={product.name}>
    {product.name}
  </td>

  {/* SKU */}
  <td className="table-sku" title={product.sku}>
    {product.sku}
  </td>

  {/* Revenue */}
  <td className="table-numeric number-medium" title={fmt(product.revenue)}>
    {fmtK(product.revenue)}
  </td>

  {/* Units */}
  <td className="table-numeric" title={product.units.toLocaleString()}>
    {product.units.toLocaleString()}
  </td>

  {/* Margin */}
  <td className="table-numeric" title={fmtPct(product.margin)}>
    {fmtPct(product.margin)}
  </td>
</tr>
```

### Example 3: Badge Group
```jsx
<div className="badge-container">
  {product.brand && (
    <span className="badge badge-neutral text-ellipsis" title={product.brand}>
      {product.brand}
    </span>
  )}
  {product.category && (
    <span className="badge badge-info text-ellipsis" title={product.category}>
      {product.category}
    </span>
  )}
  {product.seasonality && (
    <span className="badge badge-warning text-ellipsis" title={product.seasonality}>
      {product.seasonality}
    </span>
  )}
</div>
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Inline Styles Instead of Classes
```jsx
// Don't do this
<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
  {text}
</div>

// Do this
<div className="text-ellipsis" title={text}>
  {text}
</div>
```

### ❌ Missing Tooltips
```jsx
// Don't do this - user can't see full value
<td className="table-product-name">
  {longProductName}
</td>

// Do this - hover shows full text
<td className="table-product-name" title={longProductName}>
  {longProductName}
</td>
```

### ❌ Wrong Number Class
```jsx
// Don't use number-large for small values
<div className="number-large">$45</div>  // Too big!

// Use appropriate class
<div className="number-small">$45</div>  // Right size
```

### ❌ Forgetting Responsive Design
```jsx
// Don't use fixed font sizes
<div style={{ fontSize: "2rem" }}>
  {value}
</div>

// Use responsive classes
<div className="responsive-metric">
  {value}
</div>
```

---

## 📱 Mobile-First Checklist

When adding new components, ask:

- [ ] Does text truncate properly on 320px screen?
- [ ] Do numbers scale responsively?
- [ ] Do badges wrap to new lines?
- [ ] Are tooltips accessible (long-press on mobile)?
- [ ] Does table scroll horizontally if needed?
- [ ] Are font sizes using clamp() or responsive classes?

---

## 🔍 Debugging Overflow Issues

### Step 1: Identify the Problem
Open DevTools → Elements → Find overflowing element

### Step 2: Check Current Classes
```javascript
// In console
element.className
// Should include: text-ellipsis, table-numeric, etc.
```

### Step 3: Apply Fix
Add appropriate class from this guide

### Step 4: Verify Tooltip
```javascript
// In console
element.title
// Should show full text
```

### Step 5: Test Responsive
Use DevTools responsive mode to test at:
- 320px (mobile portrait)
- 640px (mobile landscape)
- 768px (tablet)
- 1024px (desktop small)
- 1920px (desktop large)

---

## 📚 Class Reference Table

| Class | Purpose | Max Width | Responsive |
|-------|---------|-----------|------------|
| `text-ellipsis` | Single-line truncation | Inherited | ✅ |
| `text-ellipsis-2` | 2-line truncation | Inherited | ✅ |
| `text-ellipsis-3` | 3-line truncation | Inherited | ✅ |
| `word-break` | Break long words | N/A | ✅ |
| `responsive-metric` | Auto-scale numbers | N/A | ✅ |
| `number-large` | Large numbers | N/A | ✅ |
| `number-medium` | Medium numbers | N/A | ✅ |
| `number-small` | Small numbers | N/A | ✅ |
| `table-product-name` | Product names | 350px | ✅ (280px tablet, 200px mobile) |
| `table-sku` | SKU codes | 200px | ✅ |
| `table-numeric` | Numeric columns | 400px | ✅ |
| `badge` | Tag/label | 200px | ✅ (150px mobile) |
| `badge-container` | Badge wrapper | N/A | ✅ (wraps) |

---

## 💡 Pro Tips

1. **Always add title attribute** when truncating text
2. **Use clamp() for responsive sizing** instead of media queries
3. **Test at 320px width** - if it works there, it works everywhere
4. **Group badges in badge-container** for proper wrapping
5. **Right-align numbers** using table-numeric class
6. **Format before displaying** - use fmt(), fmtK(), fmtPct() helpers

---

## 🆘 Need Help?

- Check `/Users/ali/pnl-dashboard/OVERFLOW_FIXES_SUMMARY.md` for detailed implementation
- See `/Users/ali/pnl-dashboard/OVERFLOW_TESTING_CHECKLIST.md` for test cases
- Review `/Users/ali/pnl-dashboard/src/styles/overflow-fixes.css` for all available classes

---

**Document Version**: 1.0
**Last Updated**: February 2026
**For**: Dashboard Development Team
