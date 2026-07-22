import React from 'react';
import { 
  Shield, AlertTriangle, ArrowRight, TrendingUp, 
  MapPin, HardHat, Compass, Activity, Sliders, PieChart as PieIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { DashboardMetrics, GeopoliticalEvent } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics;
  events: GeopoliticalEvent[];
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, events, onNavigate }) => {
  // Supplier dependency seed data for PieChart
  const supplierData = [
    { name: 'Russia', value: 32, color: '#38bdf8' },       // Cyan
    { name: 'Iraq', value: 24, color: '#f59e0b' },         // Amber
    { name: 'Saudi Arabia', value: 17, color: '#10b981' }, // Emerald
    { name: 'India Domestic', value: 12, color: '#6366f1' },// Indigo
    { name: 'UAE', value: 8, color: '#06b6d4' },          // Cyan-500
    { name: 'United States', value: 6, color: '#a855f7' }, // Purple
    { name: 'Nigeria', value: 5, color: '#ec4899' },       // Pink
  ];

  // Shipping Risk Trend (Simulated historical 6-month risk scores for Hormuz vs Red Sea)
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
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Critical Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Metric: Resilience Score */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Resilience System</span>
            <Compass size={18} />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-black tracking-tight" style={{ color: metrics.resilience_color === 'green' ? '#10b981' : metrics.resilience_color === 'yellow' ? '#f59e0b' : metrics.resilience_color === 'orange' ? '#f97316' : '#ef4444' }}>
              {metrics.energy_resilience_score}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              National Index Status: {metrics.energy_resilience_status}
            </p>
          </div>
        </div>

        {/* Metric: Active Supply */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Active Supply</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-black tracking-tight text-slate-100">
              {metrics.active_supply_kbd.toLocaleString()} <span className="text-sm font-normal text-slate-400">kbd</span>
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              National Oil Demand: {metrics.total_demand_kbd.toLocaleString()} kbd
            </p>
          </div>
        </div>

        {/* Metric: Supply Gap */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">National Supply Deficit</span>
            <HardHat size={18} className={metrics.supply_gap_kbd > 0 ? "text-risk-critical animate-pulse" : "text-slate-500"} />
          </div>
          <div className="mt-2">
            <p className={`text-3xl font-black tracking-tight ${metrics.supply_gap_kbd > 0 ? 'text-risk-critical' : 'text-slate-100'}`}>
              {metrics.supply_gap_kbd.toLocaleString()} <span className="text-sm font-normal text-slate-400">kbd</span>
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Deficit Exposure: {metrics.supply_gap_pct}%
            </p>
          </div>
        </div>

        {/* Metric: Active Warnings */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 shadow-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Threat Levels</span>
            <AlertTriangle size={18} className={metrics.critical_alerts_count > 0 ? 'text-risk-critical animate-bounce' : ''} />
          </div>
          <div className="mt-2">
            <p className={`text-3xl font-black tracking-tight ${metrics.critical_alerts_count > 0 ? 'text-risk-critical' : 'text-slate-100'}`}>
              {metrics.critical_alerts_count}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Confirmed Corridor Disruptions
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
              <div key={idx} className="border-b border-brand-border/60 pb-3 last:border-b-0 last:pb-0">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
              <Sliders size={16} className="text-sky-400" />
              <span>Crisis Control Center</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              As a decision analyst, you can simulate and model energy supply chain shocks. Select from standard geopolitical incidents to run real-time risk, supplier diversification, routing, and strategic reserve drawdowns.
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => onNavigate('simulator')} 
              className="w-full flex items-center justify-between py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-brand-border rounded-lg text-sm font-bold text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-risk-high" />
                <span>Simulate Strait of Hormuz Conflict</span>
              </div>
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => onNavigate('risk-intel')} 
              className="w-full flex items-center justify-between py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-brand-border rounded-lg text-sm font-bold text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-risk-critical" />
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
