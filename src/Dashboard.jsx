import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Area, Cell, Legend, PieChart, Pie } from "recharts";
import SkuBreakdown from "./SkuBreakdown";
import "./styles/overflow-fixes.css";
import RAW from "./pnl-data.json";

// ── P&L Data: loaded from pnl-data.json (synced weekly from Lingxing) ────
// To update: node automation/sync-monthly-pnl.js <year> <month>

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n == null ? "—" : n < 0 ? `-$${Math.abs(n).toLocaleString("en-US",{maximumFractionDigits:0})}` : `$${n.toLocaleString("en-US",{maximumFractionDigits:0})}`;
const fmtK = (n) => n == null ? "—" : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : fmt(n);
const fmtPct = (n) => n == null ? "—" : `${(n*100).toFixed(1)}%`;
const fmtNum = (n) => n == null ? "—" : n.toLocaleString("en-US",{maximumFractionDigits:0});
const pctColor = (v,good="up") => {
  if(v==null) return "var(--text-tertiary)";
  if(good==="up") return v > 0 ? "var(--color-success)" : v < 0 ? "var(--color-danger)" : "var(--text-tertiary)";
  return v < 0 ? "var(--color-success)" : v > 0 ? "var(--color-danger)" : "var(--text-tertiary)";
};
const BRAND_COLORS = {"Fomin":"#3b82f6","House of Party":"#f59e0b","Functions Labs":"#8b5cf6","Custom Products":"#6b7280","Rockport Tools":"#ec4899","Soul Mama":"#14b8a6","Roofus Pet":"#ef4444"};

// ── Compute Enhanced Metrics ────────────────────────────────────────────────
function computeMonth(m) {
  const brands = m.brands.map(b => {
    const totalAd = (b.sp||0)+(b.sb||0)+(b.sd||0);
    const totalAdSales = (b.spSales||0)+(b.sbSales||0)+(b.sdSales||0);
    const tacos = b.rev ? totalAd/b.rev : 0;
    const acos = totalAdSales ? totalAd/totalAdSales : 0;
    const paidRevPct = b.rev ? totalAdSales/b.rev : 0;
    const organicRevPct = 1 - Math.min(paidRevPct, 1);
    const revPerUnit = b.units ? b.rev/b.units : 0;
    const profitPerUnit = b.units ? b.gp/b.units : 0;
    const totalFees = (b.refFee||0)+(b.fba||0)+(b.storage||0)+(b.carrier||0)+(b.inbound||0)+(b.lts||0)+(b.retFee||0)+(b.disposal||0)+(b.retProc||0)+(b.lowInv||0)+(b.deal||0)+(b.sub||0);
    const feeRate = b.rev ? totalFees/b.rev : 0;
    const adRate = b.rev ? totalAd/b.rev : 0;
    const cogsRate = b.rev ? (b.cost||0)/b.rev : 0;
    return {...b, totalAd, totalAdSales, tacos, acos, paidRevPct, organicRevPct, revPerUnit, profitPerUnit, totalFees, feeRate, adRate, cogsRate};
  });
  const totalRev = brands.reduce((s,b)=>s+b.rev,0);
  const totalGP = brands.reduce((s,b)=>s+b.gp,0);
  const totalAd = brands.reduce((s,b)=>s+b.totalAd,0);
  const totalUnits = brands.reduce((s,b)=>s+b.units,0);
  const totalCost = brands.reduce((s,b)=>s+(b.cost||0),0);
  const totalFees = brands.reduce((s,b)=>s+b.totalFees,0);
  return { ...m, brands, totalRev, totalGP, totalAd, totalUnits, totalCost, totalFees, margin: totalRev?totalGP/totalRev:0, tacos: totalRev?totalAd/totalRev:0 };
}

const DATA = RAW.map(computeMonth);

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = ["Executive Summary","P&L Waterfall","Brand Deep Dive","Advertising Intel","Fee Forensics","SKU Breakdown"];

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CTooltip = ({active,payload,label,formatter}) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="card-compact" style={{background:"var(--neutral-900)",border:"1px solid var(--border-medium)",boxShadow:"var(--shadow-lg)"}}>
      <div className="text-sm font-semibold text-secondary mb-2">{label}</div>
      {payload.map((p,i)=>(
        <div key={i} className="flex items-center gap-2 text-xs mb-1">
          <span style={{width:8,height:8,borderRadius:"var(--radius-xs)",background:p.color,display:"inline-block"}}/>
          <span className="text-tertiary">{p.name}:</span>
          <span className="font-mono font-semibold text-primary">{formatter?formatter(p.value):fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────────
function ExecSummary() {
  const latest = DATA[DATA.length-1];
  const prev = DATA[DATA.length-2];
  const yoyIdx = DATA.length >= 13 ? DATA.length-13 : 0;
  const yoy = DATA[yoyIdx];

  const revChange = prev.totalRev ? (latest.totalRev - prev.totalRev)/prev.totalRev : 0;
  const gpChange = prev.totalGP ? (latest.totalGP - prev.totalGP)/prev.totalGP : 0;
  const yoyRevChange = yoy.totalRev ? (latest.totalRev - yoy.totalRev)/yoy.totalRev : 0;

  // Trend data
  const trendData = DATA.map(d => ({
    period: d.period,
    revenue: d.totalRev,
    profit: d.totalGP,
    margin: d.margin*100,
    tacos: d.tacos*100,
    units: d.totalUnits
  }));

  // Alerts
  const alerts = [];
  latest.brands.forEach(b => {
    if(b.gm < 0) alerts.push({type:"critical",msg:`${b.b} is LOSING money (${fmtPct(b.gm)} margin)`});
    else if(b.gm < 0.05) alerts.push({type:"warning",msg:`${b.b} margin critically thin at ${fmtPct(b.gm)}`});
    if(b.tacos > 0.20) alerts.push({type:"warning",msg:`${b.b} TACoS at ${fmtPct(b.tacos)} — ad dependency too high`});
    if(b.refRate > 0.08) alerts.push({type:"warning",msg:`${b.b} refund rate at ${fmtPct(b.refRate)}`});
    if(b.lts > b.rev*0.02) alerts.push({type:"warning",msg:`${b.b} long-term storage fees eating ${fmtPct(b.lts/b.rev)} of revenue`});
  });
  if(latest.margin < 0.10) alerts.push({type:"critical",msg:`Portfolio margin dropped to ${fmtPct(latest.margin)} — below 10% threshold`});

  const KPI = ({label,value,sub,change,goodDir}) => (
    <div className="metric-card animate-fade-in">
      <div className="metric-label text-ellipsis" title={label}>{label}</div>
      <div className="metric-value font-mono responsive-metric" title={value}>{value}</div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {change!=null && <span className={`badge badge-sm text-ellipsis ${change>0 ? (goodDir==="up" ? "badge-success" : "badge-danger") : change<0 ? (goodDir==="up" ? "badge-danger" : "badge-success") : "badge-neutral"}`} title={`${change>0?"+":""}${(change*100).toFixed(1)}% MoM`}>
          {change>0?"+":""}{(change*100).toFixed(1)}% MoM
        </span>}
        {sub && <span className="text-xs text-tertiary text-ellipsis" title={sub}>{sub}</span>}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <div className="heading-6 text-danger mb-3">Action Required — {latest.period}</div>
          <div className="flex flex-col gap-2">
            {alerts.map((a,i) => (
              <div key={i} className={`card-compact ${a.type==="critical"?"bg-danger-50 border-danger-500":"bg-warning-50 border-warning-500"}`} style={{borderLeftWidth:4}}>
                <span className="text-sm font-medium">{a.type==="critical"?"🔴":"🟡"} {a.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-auto-fit gap-3 mb-6">
        <KPI label="Revenue" value={fmt(latest.totalRev)} change={revChange} goodDir="up" sub={`YoY: ${yoyRevChange>0?"+":""}${(yoyRevChange*100).toFixed(0)}%`}/>
        <KPI label="Gross Profit" value={fmt(latest.totalGP)} change={gpChange} goodDir="up"/>
        <KPI label="Margin" value={fmtPct(latest.margin)} change={latest.margin-prev.margin} goodDir="up"/>
        <KPI label="TACoS" value={fmtPct(latest.tacos)} change={latest.tacos-prev.tacos} goodDir="down"/>
        <KPI label="Units" value={fmtNum(latest.totalUnits)} change={prev.totalUnits?(latest.totalUnits-prev.totalUnits)/prev.totalUnits:0} goodDir="up"/>
      </div>

      {/* Revenue + Profit Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="chart-container col-span-2">
          <div className="chart-title text-secondary mb-4">Revenue & Gross Profit Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:10,fill:"var(--text-tertiary)"}} interval={1}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              <Area dataKey="revenue" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={2} name="Revenue"/>
              <Bar dataKey="profit" fill="var(--color-success)" radius={[3,3,0,0]} name="Gross Profit" barSize={16}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <div className="chart-title text-secondary mb-4">Margin vs TACoS</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:10,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`${v}%`} domain={[0,'auto']}/>
              <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
              <Line dataKey="margin" stroke="var(--color-success)" strokeWidth={2} dot={false} name="Margin %"/>
              <Line dataKey="tacos" stroke="var(--color-danger)" strokeWidth={2} dot={false} name="TACoS %"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Brand Scorecards */}
      <div className="heading-6 text-secondary mb-3">Brand Scorecards — {latest.period}</div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {["Brand","Revenue","Units","Gross Profit","Margin","TACoS","ACoS","Organic %","Rev/Unit","Profit/Unit","COGS %","Fee %","Ad %"].map(h=>(
                <th key={h} className={h==="Brand"?"":"table-numeric"}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {latest.brands.map(b => (
              <tr key={b.b}>
                <td className="font-semibold table-product-name" style={{color:BRAND_COLORS[b.b]||"var(--text-primary)"}} title={b.b}><span className="status-dot" style={{background:BRAND_COLORS[b.b]||"var(--neutral-400)"}}></span>{b.b}</td>
                <td className="table-numeric font-mono" title={fmt(b.rev)}>{fmt(b.rev)}</td>
                <td className="table-numeric font-mono text-secondary" title={fmtNum(b.units)}>{fmtNum(b.units)}</td>
                <td className="table-numeric font-mono font-semibold" style={{color:b.gp<0?"var(--color-danger)":"var(--color-success)"}} title={fmt(b.gp)}>{fmt(b.gp)}</td>
                <td className="table-numeric font-mono font-bold" style={{color:b.gm<0?"var(--color-danger)":b.gm<.05?"var(--color-warning)":"var(--color-success)"}} title={fmtPct(b.gm)}>{fmtPct(b.gm)}</td>
                <td className="table-numeric font-mono" style={{color:b.tacos>.20?"var(--color-danger)":b.tacos>.15?"var(--color-warning)":"var(--color-success)"}} title={fmtPct(b.tacos)}>{fmtPct(b.tacos)}</td>
                <td className="table-numeric font-mono text-secondary" title={fmtPct(b.acos)}>{fmtPct(b.acos)}</td>
                <td className="table-numeric font-mono" style={{color:b.organicRevPct<.30?"var(--color-danger)":b.organicRevPct<.50?"var(--color-warning)":"var(--color-success)"}} title={fmtPct(b.organicRevPct)}>{fmtPct(b.organicRevPct)}</td>
                <td className="table-numeric font-mono text-secondary" title={fmt(b.revPerUnit)}>{fmt(b.revPerUnit)}</td>
                <td className="table-numeric font-mono" style={{color:b.profitPerUnit<0?"var(--color-danger)":"var(--text-secondary)"}} title={fmt(b.profitPerUnit)}>{fmt(b.profitPerUnit)}</td>
                <td className="table-numeric font-mono text-tertiary" title={fmtPct(b.cogsRate)}>{fmtPct(b.cogsRate)}</td>
                <td className="table-numeric font-mono text-tertiary" title={fmtPct(b.feeRate)}>{fmtPct(b.feeRate)}</td>
                <td className="table-numeric font-mono text-tertiary" title={fmtPct(b.adRate)}>{fmtPct(b.adRate)}</td>
              </tr>
            ))}
            <tr className="font-bold bg-neutral-50">
              <td>TOTAL</td>
              <td className="table-numeric font-mono">{fmt(latest.totalRev)}</td>
              <td className="table-numeric font-mono">{fmtNum(latest.totalUnits)}</td>
              <td className="table-numeric font-mono text-success">{fmt(latest.totalGP)}</td>
              <td className="table-numeric font-mono text-success">{fmtPct(latest.margin)}</td>
              <td className="table-numeric font-mono">{fmtPct(latest.tacos)}</td>
              <td colSpan={7}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── P&L WATERFALL ──────────────────────────────────────────────────────────
function Waterfall() {
  const [selMonth, setSelMonth] = useState(DATA.length-1);
  const m = DATA[selMonth];

  // Build waterfall steps for the portfolio
  const totalAdSpend = m.brands.reduce((s,b)=>s+b.totalAd,0);
  const totalRefFee = m.brands.reduce((s,b)=>s+(b.refFee||0),0);
  const totalFBA = m.brands.reduce((s,b)=>s+(b.fba||0),0);
  const totalStorage = m.brands.reduce((s,b)=>s+(b.storage||0)+(b.lts||0),0);
  const totalLogistics = m.brands.reduce((s,b)=>s+(b.carrier||0)+(b.inbound||0),0);
  const totalOther = m.brands.reduce((s,b)=>s+(b.retFee||0)+(b.disposal||0)+(b.retProc||0)+(b.lowInv||0)+(b.deal||0)+(b.sub||0),0);
  const totalAdj = m.brands.reduce((s,b)=>s-(b.adj||0),0);

  const steps = [
    {name:"Revenue",value:m.totalRev,type:"total"},
    {name:"COGS",value:-m.totalCost,type:"cost"},
    {name:"Referral Fee",value:-totalRefFee,type:"cost"},
    {name:"FBA Fees",value:-totalFBA,type:"cost"},
    {name:"Ad Spend",value:-totalAdSpend,type:"cost"},
    {name:"Storage",value:-totalStorage,type:"cost"},
    {name:"Logistics",value:-totalLogistics,type:"cost"},
    {name:"Other Fees",value:-totalOther,type:"cost"},
    {name:"Adjustments",value:totalAdj,type:totalAdj>=0?"gain":"cost"},
    {name:"Gross Profit",value:m.totalGP,type:"result"}
  ];

  // For waterfall chart - compute cumulative
  let running = 0;
  const waterfallData = steps.map(s => {
    if(s.type==="total"||s.type==="result") {
      const d = {name:s.name,start:0,end:s.value,value:s.value,type:s.type};
      running = s.value;
      return d;
    }
    const start = running;
    running += s.value;
    return {name:s.name,start:Math.min(start,running),end:Math.max(start,running),value:s.value,type:s.type,bottom:Math.min(start,running)};
  });

  return (
    <div className="animate-fade-in">
      <div className="filters-bar mb-6">
        <div className="filter-group">
          <div className="filter-label">Period:</div>
          <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="form-select">
            {DATA.map((d,i)=><option key={i} value={i}>{d.period}</option>)}
          </select>
        </div>
      </div>

      {/* Waterfall Bars */}
      <div className="chart-container mb-6">
        <div className="chart-title text-secondary mb-4">P&L Waterfall — {m.period}</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:"var(--text-tertiary)"}} interval={0} angle={-25} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
            <Tooltip content={<CTooltip/>}/>
            <Bar dataKey="bottom" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a" radius={[3,3,0,0]}>
              {waterfallData.map((d,i)=>(
                <Cell key={i} fill={d.type==="total"?"#3b82f6":d.type==="result"?(d.value>=0?"var(--color-success)":"var(--color-danger)"):d.type==="gain"?"var(--color-success)":"var(--color-danger)"}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Brand-Level P&L Table */}
      <div className="heading-6 text-secondary mb-3">Brand P&L Breakdown — {m.period}</div>
      <div className="table-container">
        <table className="table table-compact">
          <thead>
            <tr>
              {["Brand","Revenue","COGS","% Rev","Ref Fee","FBA","Ad Spend","Storage+LTS","Logistics","Other","GP","Margin"].map(h=>(
                <th key={h} className={h==="Brand"?"":"table-numeric"}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.brands.map(b=>{
              const stor = (b.storage||0)+(b.lts||0);
              const logi = (b.carrier||0)+(b.inbound||0);
              const other = (b.retFee||0)+(b.disposal||0)+(b.retProc||0)+(b.lowInv||0)+(b.deal||0)+(b.sub||0);
              return (
                <tr key={b.b}>
                  <td className="font-semibold table-product-name" style={{color:BRAND_COLORS[b.b]||"var(--text-primary)"}} title={b.b}>{b.b}</td>
                  <td className="table-numeric font-mono" title={fmt(b.rev)}>{fmt(b.rev)}</td>
                  <td className="table-numeric font-mono text-danger" title={fmt(b.cost)}>{fmt(b.cost)}</td>
                  <td className="table-numeric font-mono text-tertiary text-xs" title={fmtPct(b.cogsRate)}>{fmtPct(b.cogsRate)}</td>
                  <td className="table-numeric font-mono text-danger" title={fmt(b.refFee)}>{fmt(b.refFee)}</td>
                  <td className="table-numeric font-mono text-danger" title={fmt(b.fba)}>{fmt(b.fba)}</td>
                  <td className="table-numeric font-mono text-danger" title={fmt(b.totalAd)}>{fmt(b.totalAd)}</td>
                  <td className="table-numeric font-mono" style={{color:stor>b.rev*.03?"var(--color-danger)":"var(--text-danger)"}} title={fmt(stor)}>{fmt(stor)}</td>
                  <td className="table-numeric font-mono text-danger" title={fmt(logi)}>{fmt(logi)}</td>
                  <td className="table-numeric font-mono text-danger" title={fmt(other)}>{fmt(other)}</td>
                  <td className="table-numeric font-mono font-bold" style={{color:b.gp<0?"var(--color-danger)":"var(--color-success)"}} title={fmt(b.gp)}>{fmt(b.gp)}</td>
                  <td className="table-numeric font-mono font-bold" style={{color:b.gm<0?"var(--color-danger)":b.gm<.05?"var(--color-warning)":"var(--color-success)"}} title={fmtPct(b.gm)}>{fmtPct(b.gm)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── BRAND DEEP DIVE ────────────────────────────────────────────────────────
function BrandDeepDive() {
  const allBrands = [...new Set(DATA.flatMap(d=>d.brands.map(b=>b.b)))];
  const [selBrand, setSelBrand] = useState("Fomin");

  const brandTrend = DATA.map(d => {
    const b = d.brands.find(x=>x.b===selBrand);
    if(!b) return null;
    return { period:d.period, revenue:b.rev, profit:b.gp, margin:b.gm*100, tacos:b.tacos*100, units:b.units, revPerUnit:b.revPerUnit, profitPerUnit:b.profitPerUnit, organicPct:b.organicRevPct*100, adSpend:b.totalAd, storage:(b.storage||0)+(b.lts||0), fba:b.fba||0 };
  }).filter(Boolean);

  return (
    <div className="animate-fade-in">
      <div className="flex gap-2 mb-6 flex-wrap">
        {allBrands.map(b=>(
          <button key={b} onClick={()=>setSelBrand(b)} className={`btn btn-sm ${selBrand===b?"btn-primary":"btn-ghost"}`} style={selBrand===b?{background:BRAND_COLORS[b]}:{}}>{b}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="chart-container">
          <div className="chart-title text-secondary mb-4">Revenue & Profit</div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={brandTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              <Area dataKey="revenue" fill={`${BRAND_COLORS[selBrand]||"#3b82f6"}22`} stroke={BRAND_COLORS[selBrand]||"#3b82f6"} strokeWidth={2} name="Revenue"/>
              <Bar dataKey="profit" fill="var(--color-success)" radius={[2,2,0,0]} name="Profit" barSize={14}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <div className="chart-title text-secondary mb-4">Margin vs TACoS vs Organic %</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={brandTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`${v}%`}/>
              <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
              <Line dataKey="margin" stroke="var(--color-success)" strokeWidth={2} dot={false} name="Margin %"/>
              <Line dataKey="tacos" stroke="var(--color-danger)" strokeWidth={2} dot={false} name="TACoS %"/>
              <Line dataKey="organicPct" stroke="#3b82f6" strokeWidth={2} dot={false} name="Organic %"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="chart-container">
          <div className="chart-title text-secondary mb-4">Unit Economics</div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={brandTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`$${v.toFixed(0)}`}/>
              <Tooltip content={<CTooltip formatter={v=>`$${v.toFixed(2)}`}/>}/>
              <Bar dataKey="revPerUnit" fill="#3b82f6" radius={[2,2,0,0]} name="Rev/Unit" barSize={12}/>
              <Line dataKey="profitPerUnit" stroke="var(--color-success)" strokeWidth={2} dot={false} name="Profit/Unit"/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <div className="chart-title text-secondary mb-4">Ad Spend vs Storage Costs</div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={brandTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              <Bar dataKey="adSpend" fill="var(--color-danger)" radius={[2,2,0,0]} name="Ad Spend" barSize={12}/>
              <Bar dataKey="storage" fill="var(--color-warning)" radius={[2,2,0,0]} name="Storage+LTS" barSize={12}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── ADVERTISING INTEL ──────────────────────────────────────────────────────
function AdvertisingIntel() {
  const adData = DATA.map(d => {
    const totSP = d.brands.reduce((s,b)=>s+(b.sp||0),0);
    const totSB = d.brands.reduce((s,b)=>s+(b.sb||0),0);
    const totSD = d.brands.reduce((s,b)=>s+(b.sd||0),0);
    const totSPsales = d.brands.reduce((s,b)=>s+(b.spSales||0),0);
    const totSBsales = d.brands.reduce((s,b)=>s+(b.sbSales||0),0);
    const totSDsales = d.brands.reduce((s,b)=>s+(b.sdSales||0),0);
    const totalAd = totSP+totSB+totSD;
    const totalAdSales = totSPsales+totSBsales+totSDsales;
    return {
      period: d.period,
      sp: totSP, sb: totSB, sd: totSD,
      spSales: totSPsales, sbSales: totSBsales, sdSales: totSDsales,
      totalAd, totalAdSales,
      spAcos: totSPsales ? totSP/totSPsales*100 : 0,
      sbAcos: totSBsales ? totSB/totSBsales*100 : 0,
      sdAcos: totSDsales ? totSD/totSDsales*100 : 0,
      blendedAcos: totalAdSales ? totalAd/totalAdSales*100 : 0,
      tacos: d.totalRev ? totalAd/d.totalRev*100 : 0,
      adSalesRatio: d.totalRev ? totalAdSales/d.totalRev*100 : 0,
      organicPct: d.totalRev ? (1 - Math.min(totalAdSales/d.totalRev,1))*100 : 0,
      roas: totalAd ? totalAdSales/totalAd : 0,
      spPct: totalAd ? totSP/totalAd*100 : 0,
      sbPct: totalAd ? totSB/totalAd*100 : 0,
      sdPct: totalAd ? totSD/totalAd*100 : 0,
    };
  });

  const latest = adData[adData.length-1];

  return (
    <div className="animate-fade-in">
      {/* MCP Philosophy Banner */}
      <div className="card mb-6" style={{background:"linear-gradient(135deg,var(--primary-950),var(--primary-900))",border:"1px solid var(--primary-700)"}}>
        <div className="heading-6 text-primary-400 mb-2">Advertising MCP Philosophy</div>
        <div className="text-sm text-secondary" style={{lineHeight:1.6}}>
          Structured campaign architecture → Data-driven bid management → Continuous keyword harvesting.
          SP drives 75%+ of spend (exact match & phrase discovery). SB for brand awareness. SD for retargeting & display.
          Healthy portfolio: TACoS declining while revenue grows. Blended ACoS decreasing. Organic revenue share increasing.
        </div>
      </div>

      {/* Ad Spend by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="chart-container col-span-2">
          <div className="chart-title text-secondary mb-4">Ad Spend by Campaign Type</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={adData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              <Bar dataKey="sp" stackId="a" fill="#3b82f6" name="SP (Sponsored Products)" radius={[0,0,0,0]}/>
              <Bar dataKey="sb" stackId="a" fill="#8b5cf6" name="SB (Sponsored Brands)"/>
              <Bar dataKey="sd" stackId="a" fill="#14b8a6" name="SD (Sponsored Display)" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <div className="chart-title text-secondary mb-4">Spend Mix — {latest.period}</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={[{name:"SP",value:latest.sp},{name:"SB",value:latest.sb},{name:"SD",value:latest.sd}]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                <Cell fill="#3b82f6"/><Cell fill="#8b5cf6"/><Cell fill="#14b8a6"/>
              </Pie>
              <Tooltip formatter={v=>fmt(v)}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ACoS by Type + TACoS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="chart-container">
          <div className="chart-title text-secondary mb-4">ACoS by Campaign Type + TACoS</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={adData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`${v}%`}/>
              <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
              <Line dataKey="spAcos" stroke="#3b82f6" strokeWidth={2} dot={false} name="SP ACoS"/>
              <Line dataKey="sbAcos" stroke="#8b5cf6" strokeWidth={2} dot={false} name="SB ACoS"/>
              <Line dataKey="tacos" stroke="var(--color-danger)" strokeWidth={2.5} dot={false} name="TACoS" strokeDasharray="5 5"/>
              <Line dataKey="blendedAcos" stroke="var(--color-warning)" strokeWidth={1.5} dot={false} name="Blended ACoS"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <div className="chart-title text-secondary mb-4">Organic vs Paid Revenue %</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={adData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`${v}%`} domain={[0,100]}/>
              <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
              <Bar dataKey="organicPct" stackId="a" fill="var(--color-success)" name="Organic %" radius={[0,0,0,0]}/>
              <Bar dataKey="adSalesRatio" stackId="a" fill="var(--color-danger)" name="Paid %" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROAS trend */}
      <div className="chart-container">
        <div className="chart-title text-secondary mb-4">ROAS Trend (Return on Ad Spend)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={adData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
            <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
            <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`${v.toFixed(1)}x`}/>
            <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(2)}x`}/>}/>
            <Line dataKey="roas" stroke="var(--color-success)" strokeWidth={2.5} dot={{r:3,fill:"var(--color-success)"}} name="ROAS"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── FEE FORENSICS ─────────────────────────────────────────────────────────
function FeeForensics() {
  const feeData = DATA.map(d => {
    const cogs = d.totalCost;
    const ref = d.brands.reduce((s,b)=>s+(b.refFee||0),0);
    const fba = d.brands.reduce((s,b)=>s+(b.fba||0),0);
    const stor = d.brands.reduce((s,b)=>s+(b.storage||0),0);
    const lts = d.brands.reduce((s,b)=>s+(b.lts||0),0);
    const logistics = d.brands.reduce((s,b)=>s+(b.carrier||0)+(b.inbound||0),0);
    const ads = d.totalAd;
    return {
      period: d.period, revenue: d.totalRev,
      cogsPct: d.totalRev?cogs/d.totalRev*100:0,
      refPct: d.totalRev?ref/d.totalRev*100:0,
      fbaPct: d.totalRev?fba/d.totalRev*100:0,
      storPct: d.totalRev?stor/d.totalRev*100:0,
      ltsPct: d.totalRev?lts/d.totalRev*100:0,
      logPct: d.totalRev?logistics/d.totalRev*100:0,
      adsPct: d.totalRev?ads/d.totalRev*100:0,
      cogs, ref, fba, stor, lts, logistics, ads
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="chart-container mb-6">
        <div className="chart-title text-secondary mb-4">Cost as % of Revenue — Where the Money Goes</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={feeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
            <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={1}/>
            <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`${v}%`}/>
            <Tooltip content={<CTooltip formatter={v=>`${v.toFixed(1)}%`}/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="cogsPct" stackId="a" fill="#64748b" name="COGS"/>
            <Bar dataKey="refPct" stackId="a" fill="var(--color-warning)" name="Referral Fee"/>
            <Bar dataKey="fbaPct" stackId="a" fill="var(--color-danger)" name="FBA"/>
            <Bar dataKey="adsPct" stackId="a" fill="#8b5cf6" name="Ads"/>
            <Bar dataKey="storPct" stackId="a" fill="#f97316" name="Storage"/>
            <Bar dataKey="ltsPct" stackId="a" fill="#ec4899" name="Long-term Storage"/>
            <Bar dataKey="logPct" stackId="a" fill="#06b6d4" name="Logistics" radius={[2,2,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Storage cost deep dive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="chart-container">
          <div className="chart-title text-danger mb-1">Storage Cost Escalation</div>
          <div className="text-xs text-tertiary mb-4">Storage + LTS fees have become a major margin drag — tracking by brand</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={DATA.map(d=>({
              period:d.period,
              ...Object.fromEntries(d.brands.map(b=>[b.b,(b.storage||0)+(b.lts||0)]))
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
              <XAxis dataKey="period" tick={{fontSize:9,fill:"var(--text-tertiary)"}} interval={2}/>
              <YAxis tick={{fontSize:10,fill:"var(--text-tertiary)"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<CTooltip/>}/>
              {Object.keys(BRAND_COLORS).map(b=><Bar key={b} dataKey={b} stackId="a" fill={BRAND_COLORS[b]}/>)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title text-secondary mb-4">FBA Fee Ratio by Brand (Latest)</div>
          {DATA[DATA.length-1].brands.map(b=>{
            const fbaRate = b.rev ? (b.fba||0)/b.rev : 0;
            return (
              <div key={b.b} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold" style={{color:BRAND_COLORS[b.b]||"var(--text-primary)"}}>{b.b}</span>
                  <span className="font-mono" style={{color:fbaRate>.35?"var(--color-danger)":fbaRate>.28?"var(--color-warning)":"var(--color-success)"}}>{fmtPct(fbaRate)}</span>
                </div>
                <div style={{height:8,background:"var(--neutral-200)",borderRadius:"var(--radius-base)",overflow:"hidden"}}>
                  <div style={{width:`${Math.min(fbaRate*100/.5*100,100)}%`,height:"100%",background:fbaRate>.35?"var(--color-danger)":fbaRate>.28?"var(--color-warning)":"var(--color-success)",borderRadius:"var(--radius-base)",transition:"width 0.5s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────
// ── Sync Button: triggers GitHub Actions workflow ─────────────────────────
function SyncButton() {
  const [status, setStatus] = useState("idle");

  async function triggerSync() {
    let token = localStorage.getItem("gh_pat");
    if (!token) {
      token = prompt("Enter a GitHub Personal Access Token (needs repo scope):");
      if (!token) return;
      localStorage.setItem("gh_pat", token);
    }

    setStatus("syncing");
    try {
      const res = await fetch(
        "https://api.github.com/repos/alikaaba-bit/pnl-dashboard/actions/workflows/weekly-pnl-sync.yml/dispatches",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({ ref: "main", inputs: { month: "current" } }),
        }
      );
      if (res.status === 204) {
        setStatus("done");
        setTimeout(() => setStatus("idle"), 120000);
      } else if (res.status === 401) {
        localStorage.removeItem("gh_pat");
        setStatus("error");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const label = {
    idle: "Sync from Lingxing",
    syncing: "Triggering...",
    done: "Sync started — refresh in ~3 min",
    error: "Failed — click to retry",
  };

  return (
    <button
      onClick={triggerSync}
      disabled={status === "syncing" || status === "done"}
      className="btn btn-ghost text-xs"
      style={{
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-sm)",
        padding: "4px 12px",
        cursor: status === "done" ? "default" : "pointer",
        opacity: status === "done" ? 0.6 : 1,
      }}
    >
      {label[status]}
    </button>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState(0);

  const firstPeriod = DATA[0]?.period || "";
  const lastPeriod = DATA[DATA.length - 1]?.period || "";

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-xs font-semibold text-tertiary tracking-widest uppercase">PETRA BRANDS</div>
            <div className="heading-3 mt-1">Amazon P&L Command Center</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-tertiary">Data Range</div>
            <div className="text-sm font-semibold text-secondary">{firstPeriod} — {lastPeriod}</div>
            <div className="text-xs text-tertiary mb-2">{DATA.length} months · {DATA.reduce((s,d)=>s+d.brands.length,0)} brand-months</div>
            <SyncButton />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((t,i)=>(
            <button key={t} onClick={()=>setTab(i)} className={`btn btn-ghost text-sm ${tab===i?"font-bold":"font-medium"}`} style={{
              borderBottom:tab===i?"2px solid var(--color-primary)":"2px solid transparent",
              borderRadius:0,
              color:tab===i?"var(--text-primary)":"var(--text-tertiary)"
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content container">
        {tab===0 && <ExecSummary/>}
        {tab===1 && <Waterfall/>}
        {tab===2 && <BrandDeepDive/>}
        {tab===3 && <AdvertisingIntel/>}
        {tab===4 && <FeeForensics/>}
        {tab===5 && <SkuBreakdown/>}
      </div>
    </div>
  );
}
