# Dashboard Overflow Fixes - Testing Checklist

## Pre-Testing Setup
- [ ] Clear browser cache
- [ ] Test in Chrome/Firefox/Safari
- [ ] Test at viewport widths: 320px, 640px, 768px, 1024px, 1440px, 1920px
- [ ] Enable browser DevTools responsive mode

---

## 1. Executive Summary Tab - KPI Cards

### Test: Metric Cards with Large Numbers
- [ ] **Revenue Card**: Display $1,275,844
  - Verify font size scales between 1.5rem-2rem
  - Check for ellipsis if number doesn't fit
  - Hover to verify tooltip shows full value

- [ ] **Units Card**: Display 125,678 units
  - Check comma formatting
  - Verify no horizontal overflow

- [ ] **Margin Card**: Display 18.7%
  - Check percentage sign doesn't wrap

### Test: Metric Labels
- [ ] Long label: "Year-over-Year Growth"
  - Verify truncation with ellipsis
  - Hover shows full text in tooltip

### Test: Change Badges
- [ ] Multiple badges in one row
  - Verify badges wrap to new line on mobile
  - Check ellipsis on long percentage text

**Pass Criteria**:
- ✅ No horizontal scroll
- ✅ All text readable at all breakpoints
- ✅ Tooltips work on hover

---

## 2. Brand Scorecards Table

### Test: Brand Name Column
- [ ] "House of Party" (15 chars)
  - Should display fully

- [ ] "Fomin Eco Products International" (33 chars)
  - Should truncate with ellipsis at ~350px
  - Hover shows full name

### Test: Numeric Columns (Large Numbers)
| Column | Test Value | Expected |
|--------|-----------|----------|
| Revenue | $1,275,844 | $1,276K displayed, full in tooltip |
| Units | 125,678 | 125,678 with commas |
| Gross Profit | $245,123 | $245K displayed |
| Margin | 18.7% | Full display |

- [ ] All numbers right-aligned
- [ ] Monospace font for consistency
- [ ] Tooltips show unformatted full value

### Test: Mobile View (640px)
- [ ] Table has horizontal scroll if needed
- [ ] Headers remain visible
- [ ] Touch tooltips work (long press)

**Pass Criteria**:
- ✅ Table doesn't break layout
- ✅ All columns accessible via scroll
- ✅ Numbers properly formatted

---

## 3. SKU Breakdown Tab - Summary Cards

### Test: Total Revenue Card
- [ ] Display $5,678,912
  - Font scales responsively
  - Tooltip shows full value: "$5,678,912"
  - No overflow on 320px screen

### Test: Total Units Card
- [ ] Display 1,234,567 units
  - Comma formatting present
  - Responsive font sizing applied

**Pass Criteria**:
- ✅ Cards maintain aspect ratio
- ✅ No text cutoff
- ✅ Readable on smallest screen (320px)

---

## 4. SKU Table - Product Info Column

### Test: Long Product Names
- [ ] **Test Case 1**: "Fomin Eco-Friendly Dishwasher Detergent Tablets with Extra Cleaning Power and Lemon Scent - 100 Count Mega Value Pack" (120 chars)
  - Truncates at 350px with ellipsis
  - Full text in title tooltip
  - Hover shows complete name

- [ ] **Test Case 2**: "Home Party Decorations" (22 chars)
  - Displays fully without truncation

### Test: SKU Codes
- [ ] **Test Case 1**: "FMDC-2024-Q4-PROMO-001" (22 chars)
  - Monospace font applied
  - Truncates at 200px if needed
  - Full SKU in tooltip

- [ ] **Test Case 2**: Short SKU "FOM-001" (7 chars)
  - Displays fully

### Test: Multiple Badges
- [ ] Product with: Brand + Theme + Seasonality + Category
  - Example: "Fomin" + "CLEANING" + "🎄 Q4" + "Household > Kitchen"
  - Badges wrap to multiple lines
  - Each badge truncates individually if too long
  - Gap spacing maintained (0.5rem)
  - No horizontal overflow

- [ ] Mobile (320px): Badges stack properly

**Pass Criteria**:
- ✅ Product names never break layout
- ✅ SKU codes monospace and readable
- ✅ Badges wrap gracefully
- ✅ All badges have tooltips

---

## 5. SKU Table - Numeric Columns

### Test: Revenue Column
- [ ] Test values:
  - $1,275,844.24 → "$1,275,844" displayed
  - $45.67 → "$46" displayed
  - Tooltip shows full value with cents

### Test: COGS/FBA/Ads Column
- [ ] Stack of three numbers:
  ```
  COGS: $125,678
  FBA: $45,123
  Ads: $12,456 (25.3%)
  ```
  - All align properly
  - Percentages don't wrap
  - Tooltips on each line

### Test: Gross Profit Column
- [ ] Large profit: $845,123
  - Uses `.number-medium` class
  - Font size: `clamp(1.25rem, 3vw, 1.875rem)`
  - Responsive scaling verified at 640px, 768px, 1024px

**Pass Criteria**:
- ✅ All numbers right-aligned
- ✅ Commas in correct places
- ✅ Currency symbols consistent
- ✅ Responsive sizing works

---

## 6. Cost Breakdown (Expanded Row)

### Test: Waterfall Chart
- [ ] Labels don't overlap on mobile
- [ ] X-axis labels rotate properly
- [ ] Chart responsive at all widths

### Test: Cost Component Breakdown
- [ ] Progress bars don't overflow container
- [ ] Percentages display correctly
- [ ] Labels truncate if too long

**Pass Criteria**:
- ✅ Chart readable at 640px
- ✅ No overlapping text
- ✅ Maintains aspect ratio

---

## 7. Responsive Breakpoint Tests

### Mobile Portrait (320px - 480px)
- [ ] All metric cards stack vertically
- [ ] Font sizes scale down appropriately
- [ ] Tables have horizontal scroll
- [ ] Badges wrap correctly
- [ ] No horizontal page scroll

### Mobile Landscape (481px - 767px)
- [ ] 2-column grid for metric cards
- [ ] Tables slightly wider but still scrollable
- [ ] Product names max 200px

### Tablet (768px - 1024px)
- [ ] 3-4 column grid for cards
- [ ] Product names max 280px
- [ ] Most content fits without scroll

### Desktop (1025px+)
- [ ] Full layout width
- [ ] Product names max 350px
- [ ] All columns visible without scroll

**Pass Criteria**:
- ✅ Smooth transitions between breakpoints
- ✅ No layout breaks
- ✅ Content readable at all sizes

---

## 8. Browser-Specific Tests

### Chrome/Edge
- [ ] Clamp() function works
- [ ] -webkit-line-clamp for multi-line ellipsis
- [ ] Tooltips appear on hover

### Firefox
- [ ] Clamp() function works
- [ ] Line clamping works
- [ ] Tooltips appear on hover

### Safari (Desktop & iOS)
- [ ] -webkit-box support verified
- [ ] Font rendering smooth
- [ ] Touch tooltips work (long-press)

**Pass Criteria**:
- ✅ Consistent appearance across browsers
- ✅ No rendering glitches
- ✅ Tooltips work everywhere

---

## 9. Accessibility Tests

### Keyboard Navigation
- [ ] Tab through table rows
- [ ] Focus visible on cells
- [ ] Tooltips appear on focus (not just hover)

### Screen Reader
- [ ] Product names read fully (via title attribute)
- [ ] Numbers announced correctly
- [ ] Table structure clear

**Pass Criteria**:
- ✅ WCAG 2.1 Level AA compliance
- ✅ All content accessible via keyboard
- ✅ Screen reader friendly

---

## 10. Performance Tests

### Load Time
- [ ] CSS file loads < 50ms
- [ ] No render blocking
- [ ] No layout shifts on load

### Scroll Performance
- [ ] Smooth scrolling in tables
- [ ] No jank when expanding rows
- [ ] 60fps maintained

### Memory
- [ ] No memory leaks on navigation
- [ ] Tooltips don't accumulate

**Pass Criteria**:
- ✅ Lighthouse Performance > 90
- ✅ No console errors
- ✅ Smooth user experience

---

## 11. Edge Cases

### Very Long Numbers
- [ ] $999,999,999,999.99 (12 digits)
  - Displays as "$1,000B" or similar
  - Full value in tooltip
  - No overflow

### Empty/Null Values
- [ ] Product name: null
  - Displays "Product name not available" badge
  - No error in console

### Special Characters
- [ ] Product name with emojis: "🎄 Holiday Party Pack"
  - Displays correctly
  - Truncates properly

### Multiple Same Badges
- [ ] 5 badges in one row
  - All wrap properly
  - No overlap

**Pass Criteria**:
- ✅ Graceful handling of edge cases
- ✅ No errors or warnings
- ✅ Fallbacks work as expected

---

## 12. Visual Regression

### Before vs After Comparison
- [ ] Take screenshots at 1920px
  - Executive Summary tab
  - SKU Breakdown tab
  - Table with long product names

- [ ] Compare with baseline
  - Text more compact but readable
  - No layout shifts
  - Colors/styling consistent

**Pass Criteria**:
- ✅ Intentional changes only
- ✅ No unintended visual regressions
- ✅ Design system consistency maintained

---

## Sign-Off Checklist

- [ ] All tests passed
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Performance metrics acceptable
- [ ] Accessibility verified
- [ ] Cross-browser compatible
- [ ] Mobile responsive
- [ ] Tooltips functional
- [ ] Edge cases handled

**Tester Name**: _________________
**Date**: _________________
**Build Version**: _________________
**Status**: ☐ Pass ☐ Fail ☐ Needs Review

---

## Failure Reporting Template

**Test ID**: [e.g., 4.1 - Long Product Names]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Screenshot**: [Attach if applicable]
**Browser**: [Chrome 122, Firefox 123, etc.]
**Viewport**: [320px, 1920px, etc.]
**Severity**: [Critical / High / Medium / Low]
**Steps to Reproduce**:
1. ...
2. ...

---

**Document Version**: 1.0
**Last Updated**: February 2026
**Status**: Ready for QA
