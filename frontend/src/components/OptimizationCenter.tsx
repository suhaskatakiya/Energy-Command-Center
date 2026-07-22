import React, { useState, useEffect } from 'react';
import { 
  Cpu, Award, Compass, RefreshCw, Calendar 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../utils/api';

const OptimizationCenter: React.FC = () => {
  const [priority, setPriority] = useState<string>('balanced');
  const [loading, setLoading] = useState<boolean>(true);
  const [procureResults, setProcureResults] = useState<any>(null);
  const [sprResults, setSprResults] = useState<any>(null);
  const [routeResults, setRouteResults] = useState<any>(null);
  const [simName, setSimName] = useState<string>('');

  // Loads active simulation context
  const loadOptimizationData = async () => {
    setLoading(true);
    try {
      const simIdStr = localStorage.getItem('active_simulation_id');
      const location = localStorage.getItem('active_disruption_location') || 'Hormuz';
      
      let gap = 1270.0; // Default gap
      let duration = 30;
      
      if (simIdStr) {
        const id = parseInt(simIdStr);
        const simLog = await api.getSimulations();
        const activeSim = simLog.find(s => s.id === id);
        if (activeSim && activeSim.results) {
          setSimName(activeSim.name);
          const results = JSON.parse(activeSim.results);
          gap = results.supply_loss_kbd;
          duration = activeSim.duration_days;
        }
      } else {
        setSimName("Baseline Demonstration");
      }

      const closedCp = location !== 'None' ? [location] : [];

      // Trigger parallel solver endpoint executions
      const procure = await api.optimizeProcurement(gap, priority, closedCp);
      const spr = await api.optimizeSpr(gap, duration);
      
      // Calculate detoured route for Russian oil (main detour in our seed)
      const route = await api.optimizeRoute(
        location === 'Red Sea' ? 'Russia' : 'Saudi Arabia',
        'Jamnagar Port',
        priority,
        closedCp
      );

      setProcureResults(procure);
      setSprResults(spr);
      setRouteResults(route);
    } catch (err) {
      console.error("Solver error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptimizationData();
  }, [priority]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="animate-spin text-sky-400" size={24} />
        <span>Executing Optimization Algorithms...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Optimization Control Panel */}
      <div className="bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">National Procurement & Logistics Solvers</h3>
          <p className="text-xs text-slate-400 mt-1">Active Scenario: <span className="text-sky-400 font-semibold">{simName}</span> (Gap: {procureResults?.supply_gap_kbd} kbd)</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select Solver Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-slate-950 border border-brand-border text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-sky-400"
          >
            <option value="balanced">Balanced Risk & Cost</option>
            <option value="lowest_cost">Lowest Cost</option>
            <option value="lowest_risk">Lowest Risk</option>
            <option value="fastest">Fastest Delivery Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Module 6: Adaptive Procurement Orchestrator */}
        <div className="xl:col-span-2 space-y-6">
          {/* Supplier Rankings */}
          <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 mb-6 flex items-center gap-2">
              <Award size={16} className="text-sky-400" />
              <span>Alternative Supplier MCDA Rankings</span>
            </h3>

            <div className="space-y-4">
              {procureResults?.rankings.map((r: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-brand-border/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-200">{r.supplier_name}</span>
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold border border-brand-border">{r.transit_days} Days Transit</span>
                    </div>
                    {/* Advantages/Risks */}
                    <div className="text-[10px] space-y-0.5 mt-1.5">
                      <p className="text-emerald-400"><span className="font-bold uppercase tracking-widest text-[8px] text-slate-500 mr-1">Advantages:</span>{r.advantages.join(', ')}</p>
                      <p className="text-risk-high"><span className="font-bold uppercase tracking-widest text-[8px] text-slate-500 mr-1">Risks:</span>{r.risks.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 shrink-0 text-right">
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Delivered Cost</span>
                      <span className="text-xs text-slate-300 font-bold">${r.delivered_cost_per_barrel}/bbl</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Refinery Compat</span>
                      <span className="text-xs text-slate-300 font-bold">{Math.round(r.refinery_compatibility * 100)}%</span>
                    </div>
                    <div className="bg-slate-900 border border-brand-border h-12 w-14 rounded flex flex-col justify-center items-center">
                      <span className="text-[8px] text-slate-500 font-bold uppercase">MCDA</span>
                      <span className="text-sm font-black text-sky-400">{r.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Volume Allocations */}
          <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 mb-6 flex items-center gap-2">
              <Cpu size={16} className="text-indigo-400" />
              <span>Recommended Procurement Allocations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {procureResults?.allocation_plan.map((alloc: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-brand-border p-4 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-sky-500/5 rounded-full filter blur-xl" />
                  <div>
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Supplier Target</span>
                    <h4 className="font-extrabold text-sm text-slate-200">{alloc.supplier_name}</h4>
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-black text-sky-400">+{alloc.allocated_volume_kbd} <span className="text-xs font-semibold text-slate-400">kbd</span></p>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Share: {alloc.share_pct}% | Surcharge: {alloc.days_to_arrival}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Solvers Panel: Route Routing & SPR Drawdown */}
        <div className="space-y-6">
          {/* Module 7: Route Optimization */}
          <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 mb-2 flex items-center gap-2">
              <Compass size={16} className="text-sky-400" />
              <span>Route Rerouting Detours</span>
            </h3>

            {routeResults?.success ? (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-brand-border rounded-lg p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Detour Path</span>
                    <span className="font-bold text-slate-300">{routeResults.source} → {routeResults.destination}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-brand-border/60 pt-2">
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Distance (NM)</span>
                      <span className="font-bold text-slate-350">{routeResults.total_distance_nm.toLocaleString()} nm</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Transit Duration</span>
                      <span className="font-bold text-slate-350">{routeResults.transit_time_days} days</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Freight Cost</span>
                      <span className="font-bold text-sky-400">${routeResults.cost_per_barrel}/bbl</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Max Route Risk</span>
                      <span className={`font-black ${routeResults.route_risk > 50 ? 'text-risk-high' : 'text-risk-low'}`}>{routeResults.route_risk}/100</span>
                    </div>
                  </div>
                </div>

                <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-3 text-[10px] text-sky-400 leading-relaxed">
                  <strong>Routing Strategy:</strong> {routeResults.route_risk > 40 ? 'Bypassing Suez Canal via Cape of Good Hope due to Red Sea security incidents.' : 'Utilizing UAE East Coast pipeline bypass, loading at Fujairah directly.'}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-6 text-xs">
                No active rerouting needed. Routes are operating at low baseline risk.
              </div>
            )}
          </div>

          {/* Module 8: SPR Drawdown Schedule */}
          <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              <span>SPR Release Schedule</span>
            </h3>

            {sprResults ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-550 font-bold block uppercase">Total Released</span>
                    <span className="text-sm font-black text-slate-200">{sprResults.total_drawn_mb} Mb</span>
                  </div>
                  <div className="bg-slate-950 p-3 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-550 font-bold block uppercase">Remaining SPR</span>
                    <span className="text-sm font-black text-emerald-400">{sprResults.remaining_reserve_mb} Mb ({sprResults.reserve_capacity_pct}%)</span>
                  </div>
                </div>

                {/* Drawdown chart over days */}
                <div className="h-32 bg-slate-950 border border-brand-border rounded-lg p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sprResults.schedule.filter((_: any, idx: number) => idx % 5 === 0 || idx === sprResults.schedule.length - 1)}>
                      <XAxis dataKey="day" stroke="#475569" fontSize={8} tickLine={false} label={{ value: 'Simulation Days', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 8 }} />
                      <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="remaining_reserve_mb" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Remaining SPR (Mb)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-950 p-3 border border-brand-border rounded-lg text-[10px] text-slate-400">
                  <strong className="text-slate-350 uppercase tracking-wider block mb-1">SPR Status Policy Recommendation</strong>
                  {sprResults.recommendation}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-6 text-xs">
                Run simulation first to schedule reserves.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationCenter;
