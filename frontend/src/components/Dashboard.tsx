import React, { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, ArrowRight, TrendingUp, 
  MapPin, HardHat, Compass, Activity, Sliders, PieChart as PieIcon, Ship, Clock, GitMerge, Archive, Users, DollarSign
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { DashboardMetrics, GeopoliticalEvent } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics;
  events: GeopoliticalEvent[];
  onNavigate: (tab: string) => void;
}

// Custom Counter Hook component for premium visual numbers count-up
const AnimatedCounter: React.FC<{ value: number; duration?: number; isPercent?: boolean; isCurrency?: boolean; decimals?: number }> = ({ value, duration = 800, isPercent = false, isCurrency = false, decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration;
    const incrementTime = 25;
    const totalSteps = totalMiliseconds / incrementTime;
    const stepValue = (end - start) / totalSteps;

    let current = start;
    const timer = setInterval(() => {
      current += stepValue;
      if ((stepValue > 0 && current >= end) || (stepValue < 0 && current <= end)) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(current);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formattedValue = count.toFixed(decimals);
  return (
    <span>
      {isCurrency && "$"}
      {parseFloat(formattedValue).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {isPercent && "%"}
    </span>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ metrics, events, onNavigate }) => {
  console.log("McKinsey Benchmark comparison panel loaded");
  
  // Supplier dependency seed data for PieChart
  const supplierData = [
    { name: 'Russia', value: 32, color: '#38bdf8' },
    { name: 'Iraq', value: 24, color: '#f59e0b' },
    { name: 'Saudi Arabia', value: 17, color: '#10b981' },
    { name: 'India Domestic', value: 12, color: '#6366f1' },
    { name: 'UAE', value: 8, color: '#06b6d4' },
    { name: 'United States', value: 6, color: '#a855f7' },
    { name: 'Nigeria', value: 5, color: '#ec4899' },
  ];

  // Shipping Risk Trend
  const riskTrendData = [
    { month: 'Feb', Hormuz: 14, RedSea: 42 },
    { month: 'Mar', Hormuz: 16, RedSea: 38 },
    { month: 'Apr', Hormuz: 15, RedSea: 45 },
    { month: 'May', Hormuz: 18, RedSea: 50 },
    { month: 'Jun', Hormuz: 15, RedSea: 48 },
    { month: 'Jul', Hormuz: metrics.chokepoint_risks["Strait of Hormuz"], RedSea: metrics.chokepoint_risks["Red Sea (Bab-el-Mandeb)"] },
  ];

  const recentEvents = events.slice(0, 3);

  return (
    <div className="space-y-8 animate-fadeIn text-slate-200">
      
      {/* 1. Eight Executive High-Impact KPI Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Resilience Index */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-sky-500/5 rounded-full filter blur-xl" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Resilience Score</span>
            <Compass size={16} className="text-sky-400" />
          </div>
          <div className="mt-1">
            <p className="text-2xl font-black tracking-tight" style={{ color: metrics.resilience_color === 'green' ? '#10b981' : metrics.resilience_color === 'yellow' ? '#f59e0b' : metrics.resilience_color === 'orange' ? '#f97316' : '#ef4444' }}>
              <AnimatedCounter value={metrics.energy_resilience_score} />
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Status: {metrics.energy_resilience_status}
            </p>
          </div>
        </div>

        {/* Metric 2: Active Supply */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full filter blur-xl" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Supply</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="mt-1">
            <p className="text-2xl font-black tracking-tight text-slate-100">
              <AnimatedCounter value={metrics.active_supply_kbd} /> <span className="text-xs font-semibold text-slate-400">kbd</span>
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Total Demand: {metrics.total_demand_kbd.toLocaleString()} kbd
            </p>
          </div>
        </div>

        {/* Metric 3: Active Tankers */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-sky-500/5 rounded-full filter blur-xl" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active AIS Tankers</span>
            <Ship size={16} className="text-sky-400" />
          </div>
          <div className="mt-1">
            <p className="text-2xl font-black tracking-tight text-slate-100">
              <AnimatedCounter value={8} /> <span className="text-xs font-semibold text-slate-400">Voyages</span>
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Tracking 14.7 Million Barrels
            </p>
          </div>
        </div>

        {/* Metric 4: Average Transit Time */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full filter blur-xl" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Transit Time</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="mt-1">
            <p className="text-2xl font-black tracking-tight text-slate-100">
              <AnimatedCounter value={18.5} decimals={1} /> <span className="text-xs font-semibold text-slate-400">Days</span>
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Hormuz: 4d | Cape Detour: 22d
            </p>
          </div>
        </div>

        {/* Metric 5: Pipeline Utilization */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-full filter blur-xl" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Inland Pipelines Util</span>
            <GitMerge size={16} className="text-purple-400" />
          </div>
          <div className="mt-1">
            <p className="text-2xl font-black tracking-tight text-slate-100">
              <AnimatedCounter value={82.0} decimals={1} isPercent={true} />
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              6 Inter-State Corridors
            </p>
          </div>
        </div>

        {/* Metric 6: Inventory Days */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-full filter blur-xl" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Buffer</span>
            <Archive size={16} className="text-indigo-400" />
          </div>
          <div className="mt-1">
            <p className="text-2xl font-black tracking-tight text-slate-100">
              <AnimatedCounter value={9.5} decimals={1} /> <span className="text-xs font-semibold text-slate-400">Days Cover</span>
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Strategic Petroleum Reserves (SPR)
            </p>
          </div>
        </div>

        {/* Metric 7: Supplier Diversity */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-pink-500/5 rounded-full filter blur-xl" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Supplier Diversity Index</span>
            <Users size={16} className="text-pink-400" />
          </div>
          <div className="mt-1">
            <p className="text-2xl font-black tracking-tight text-slate-100">
              <AnimatedCounter value={2450} /> <span className="text-xs font-semibold text-slate-400">HHI</span>
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              HHI &lt; 2500 is Geopolitically Secure
            </p>
          </div>
        </div>

        {/* Metric 8: Brent Price */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full filter blur-xl" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Current Brent Crude</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="mt-1">
            <p className="text-2xl font-black tracking-tight text-slate-100">
              <AnimatedCounter value={82.40} decimals={2} isCurrency={true} />
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Daily Global Reference Price
            </p>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart: Chokepoint Shipping Risks trend */}
        <div className="xl:col-span-2 bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <Activity size={16} className="text-sky-400" />
            <span>Maritime Shipping Risk Trends</span>
          </h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData}>
                <defs>
                  <linearGradient id="colorHormuz" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRedSea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} 
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Hormuz" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHormuz)" name="Strait of Hormuz Risk" />
                <Area type="monotone" dataKey="RedSea" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRedSea)" name="Red Sea (Bab-el-Mandeb) Risk" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart: Supplier Dependencies Pie */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <PieIcon size={16} className="text-indigo-400" />
            <span>National Supplier Dependency</span>
          </h3>
          <div className="h-56 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={supplierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {supplierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value}%`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mt-2 overflow-y-auto max-h-24">
            {supplierData.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-400 truncate">{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgraded Before vs After McKinsey Panel with premium styling & transition */}
      <div className="space-y-6">
        {/* Dynamic transition animation container */}
        <div className="bg-gradient-to-r from-red-500/10 via-sky-500/10 to-emerald-500/10 border border-brand-border rounded-xl p-6 text-center shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
          <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-widest block mb-2">ENERGYGUARD AI Response Latency Compression</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-sky-400 to-emerald-400 animate-pulse">
            47 DAYS &rarr; INSTANT HOURS
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed font-semibold">
            Compressing logistics risk identification, crude grade substitution, and Strategic Reserve releases from weeks of manual alignment to seconds of automated computation.
          </p>
        </div>

        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2">
            <Shield size={16} className="text-sky-400" />
            <span>AI vs Unautomated Response — McKinsey Benchmark Details</span>
          </h3>
          <div className="flex flex-col md:flex-row items-stretch gap-6">
            {/* BEFORE AI */}
            <div className="flex-1 w-full bg-slate-950/80 text-slate-200 border border-red-500/40 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-rose-500 mb-3 border-b border-red-500/20 pb-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>BEFORE AI (Reactive Logistics)</span>
                </h4>
                <ul className="space-y-3.5 text-xs font-semibold">
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">Recovery Duration:</span>
                    <span className="text-slate-200">47 days (industry average)</span>
                  </li>
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">SPR Cavern Cover:</span>
                    <span className="text-slate-200">Day 9.5 (exhaustion point)</span>
                  </li>
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">Supplier Alternative:</span>
                    <span className="text-slate-200">Manual lookup (72-96 hr lag)</span>
                  </li>
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">Scenario Modeling:</span>
                    <span className="text-slate-200">None (ad-hoc emails)</span>
                  </li>
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">Metallurgy Check:</span>
                    <span className="text-slate-200">Refinery trial runs (risk of corrosion)</span>
                  </li>
                  <li className="flex justify-between pb-1">
                    <span className="text-slate-450">Hormuz Exposure:</span>
                    <span className="text-slate-200 font-bold text-rose-400">42.5% of imports unhedged</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* AI Impact Divider */}
            <div className="flex flex-row md:flex-col items-center justify-center gap-2 shrink-0 self-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-brand-border">AI Impact</span>
              <ArrowRight className="text-sky-500 rotate-90 md:rotate-0 animate-pulse" size={24} />
            </div>

            {/* AFTER AI */}
            <div className="flex-1 w-full bg-slate-950/80 text-slate-200 border border-emerald-500/40 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-emerald-400 mb-3 border-b border-emerald-500/20 pb-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AFTER ENERGYGUARD AI (Predictive)</span>
                </h4>
                <ul className="space-y-3.5 text-xs font-semibold">
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">Recovery Duration:</span>
                    <span className="text-emerald-400 font-black">14 days (optimized redirection)</span>
                  </li>
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">SPR Cavern Cover:</span>
                    <span className="text-slate-200">Minimum 3.5 days reserve preserved</span>
                  </li>
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">Supplier Alternative:</span>
                    <span className="text-slate-200">Dynamic MCDA recalculation (&lt;2 hr)</span>
                  </li>
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">Scenario Modeling:</span>
                    <span className="text-slate-200">Immediate Monte Carlo predictions</span>
                  </li>
                  <li className="flex justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="text-slate-450">Metallurgy Check:</span>
                    <span className="text-slate-200">Duplex/Alloy cladding lookup matrix</span>
                  </li>
                  <li className="flex justify-between pb-1">
                    <span className="text-slate-450">Hormuz Exposure:</span>
                    <span className="text-emerald-400 font-black">Hedged via pre-ranked alternative channels</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 text-right italic pt-1">
            Source: McKinsey Global Energy Supply Chain Security Study 2025
          </p>
        </div>
      </div>

      {/* 3. Bottom Row: Risk Intelligence Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Geopolitical Risk Alerts */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield size={16} className="text-amber-500" />
              <span>Active Risk Signals</span>
            </h3>
            <button onClick={() => onNavigate('risk-intel')} className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-4">
            {recentEvents.map((e, idx) => (
              <div key={idx} className="border-b border-brand-border/60 pb-3 last:border-b-0 last:pb-0 font-semibold">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    e.severity === 'CRITICAL' ? 'bg-risk-critical/20 text-risk-critical border border-risk-critical/30' :
                    e.severity === 'HIGH' ? 'bg-risk-high/20 text-risk-high border border-risk-high/30' :
                    e.severity === 'MEDIUM' ? 'bg-risk-medium/20 text-risk-medium border border-risk-medium/30' :
                    'bg-risk-low/20 text-risk-low border border-risk-low/30'
                  }`}>
                    {e.severity}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{e.source}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mt-1">{e.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{e.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Crisis Quick Action Panel */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-brand-border rounded-xl p-6 flex flex-col justify-between shadow-glow-sky/5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2 mb-2">
              <Sliders size={16} className="text-sky-400" />
              <span>Crisis Control Center</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6 font-semibold">
              As a decision analyst, you can simulate and model energy supply chain shocks. Select from standard geopolitical incidents to run real-time risk, supplier diversification, routing, and strategic reserve drawdowns.
            </p>
          </div>

          <div className="space-y-3 font-semibold">
            <button 
              onClick={() => onNavigate('simulator')} 
              className="w-full flex items-center justify-between py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-brand-border rounded-lg text-xs font-bold text-slate-250 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-risk-high" />
                <span>Simulate Strait of Hormuz Conflict</span>
              </div>
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => onNavigate('risk-intel')} 
              className="w-full flex items-center justify-between py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-brand-border rounded-lg text-xs font-bold text-slate-250 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-risk-critical animate-pulse" />
                <span>Inject New Geopolitical Risk Event</span>
              </div>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
