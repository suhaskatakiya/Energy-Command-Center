import React, { useState, useEffect } from 'react';
import { 
  Cpu, Award, Compass, RefreshCw, Calendar, Sliders, ChevronDown, ChevronUp, Shield, BarChart3, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { api } from '../utils/api';
import {
  CRUDE_SPECIFICATIONS,
  METALLURGY_PROFILES,
  EXPANDABLE_COMPARISONS,
  getRefineryCompatibility
} from '../constants/refineryData';

const OptimizationCenter: React.FC = () => {
  const [priority, setPriority] = useState<string>('balanced');
  const [loading, setLoading] = useState<boolean>(true);
  const [procureResults, setProcureResults] = useState<any>(null);
  const [sprResults, setSprResults] = useState<any>(null);
  const [routeResults, setRouteResults] = useState<any>(null);
  const [simName, setSimName] = useState<string>('');
  
  // Expanded states for crude comparison cards
  const [expandedCrude, setExpandedCrude] = useState<Record<string, boolean>>({});

  // Dynamic MCDA weight sliders
  const [weights, setWeights] = useState({
    spotPrice: 0.15,
    shippingCost: 0.15,
    transitTime: 0.10,
    supplierReliability: 0.10,
    geopoliticalRisk: 0.15,
    portCongestion: 0.08,
    pipelineAvailability: 0.07,
    refineryCompatibility: 0.12,
    carbonFootprint: 0.04,
    inventoryBuffer: 0.05
  });

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: parseFloat(value.toFixed(2))
    }));
  };

  // Re-calculate MCDA rankings dynamically in frontend based on sliders!
  const getDynamicRankings = () => {
    if (!procureResults?.rankings) return [];

    const baseSuppliers = [
      { name: "Saudi Arabia", cost: 86.20, compatibility: 0.95, risk: 40, reliability: 95, transit: 4, footprint: 68, pipelines: 85, congestion: 60, inventory: 80, advantages: ["High reserve buffer", "Established refinery recipes"], risks: ["Strait of Hormuz transit exposure"] },
      { name: "UAE", cost: 87.50, compatibility: 0.98, risk: 25, reliability: 98, transit: 3, footprint: 62, pipelines: 80, congestion: 50, inventory: 85, advantages: ["Bypass pipeline bypasses Hormuz", "Ultra-low sulfur crude"], risks: ["High spot cargo price premiums"] },
      { name: "Iraq", cost: 82.10, compatibility: 0.72, risk: 55, reliability: 82, transit: 7, footprint: 84, pipelines: 60, congestion: 75, inventory: 70, advantages: ["Deep spot discounts offered", "High volume production availability"], risks: ["Basrah oil loading terminal delays"] },
      { name: "Nigeria", cost: 89.80, compatibility: 0.88, risk: 45, reliability: 80, transit: 18, footprint: 90, pipelines: 50, congestion: 40, inventory: 60, advantages: ["Low sulfur sweet grade composition", "Detours Suez hazards completely"], risks: ["High transport ton-mile premiums"] },
      { name: "USA", cost: 92.40, compatibility: 0.96, risk: 10, reliability: 96, transit: 28, footprint: 55, pipelines: 90, congestion: 30, inventory: 90, advantages: ["Lowest geopolitical supply risk", "Highly transparent spot market"], risks: ["Extreme transit time lag (28 days)"] },
      { name: "Russia", cost: 74.50, compatibility: 0.89, risk: 70, reliability: 88, transit: 22, footprint: 78, pipelines: 70, congestion: 65, inventory: 75, advantages: ["Deep geopolitical sanction discounts", "Consistent supply volume channel"], risks: ["Sanctions compliance audit overheads"] }
    ];

    const sumWeights = Object.values(weights).reduce((a, b) => a + b, 0) || 1.0;

    return baseSuppliers.map(s => {
      // Normalize cost: lower cost = higher score
      const score_cost = Math.max(0, 100 - (s.cost - 70) * 3);
      // Normalize shipping: lower transit time = higher score
      const score_transit = Math.max(0, 100 - s.transit * 3.2);
      // Normalize risk: lower risk = higher score
      const score_risk = 100 - s.risk;
      const score_footprint = 100 - s.footprint;
      const score_congestion = 100 - s.congestion;

      const weightedSum = 
        (weights.spotPrice * score_cost * 100) +
        (weights.shippingCost * (100 - (s.cost * 0.1)) * 10) + // proxy
        (weights.transitTime * score_transit * 10) +
        (weights.supplierReliability * s.reliability * 10) +
        (weights.geopoliticalRisk * score_risk * 10) +
        (weights.portCongestion * score_congestion * 10) +
        (weights.pipelineAvailability * s.pipelines * 10) +
        (weights.refineryCompatibility * s.compatibility * 1000) +
        (weights.carbonFootprint * score_footprint * 10) +
        (weights.inventoryBuffer * s.inventory * 10);

      const score = Math.round(weightedSum / (sumWeights * 100));

      return {
        supplier_name: s.name,
        score: Math.min(99, Math.max(30, score)),
        delivered_cost_per_barrel: s.cost,
        refinery_compatibility: s.compatibility,
        transit_days: s.transit,
        advantages: s.advantages,
        risks: s.risks
      };
    }).sort((a, b) => b.score - a.score);
  };

  // Loads active simulation context
  const loadOptimizationData = async () => {
    setLoading(true);
    try {
      const simIdStr = localStorage.getItem('active_simulation_id');
      const location = localStorage.getItem('active_disruption_location') || 'Hormuz';
      
      let gap = 1270.0;
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

      const procure = await api.optimizeProcurement(gap, priority, closedCp);
      const spr = await api.optimizeSpr(gap, duration);
      
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

  // Format Recharts radar weights data
  const radarData = [
    { subject: 'Price', value: weights.spotPrice * 100 },
    { subject: 'Freight', value: weights.shippingCost * 100 },
    { subject: 'Lead Time', value: weights.transitTime * 100 },
    { subject: 'Reliability', value: weights.supplierReliability * 100 },
    { subject: 'Geopol Risk', value: weights.geopoliticalRisk * 100 },
    { subject: 'Port Cong.', value: weights.portCongestion * 100 },
    { subject: 'Pipelines', value: weights.pipelineAvailability * 100 },
    { subject: 'Refinery Compat', value: weights.refineryCompatibility * 100 },
    { subject: 'CO2 Footprint', value: weights.carbonFootprint * 100 },
    { subject: 'Inventory', value: weights.inventoryBuffer * 100 }
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 gap-2 py-24">
        <RefreshCw className="animate-spin text-sky-400" size={24} />
        <span>Executing Optimization Algorithms...</span>
      </div>
    );
  }

  const dynamicRankings = getDynamicRankings();

  return (
    <div className="space-y-8 animate-fadeIn text-slate-200">
      {/* 1. Header Control Panel */}
      <div className="bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
        {/* Left Columns: Supplier MCDA & Scoring Engine */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Dynamic Scoring Engine & Radar Chart */}
          <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 mb-6 flex items-center gap-2">
              <Sliders size={16} className="text-sky-400" />
              <span>Multi-Criteria Weights Engine (MCDA)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sliders Block */}
              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-1">
                    <span>Spot Price Weight</span>
                    <span className="text-sky-400">{(weights.spotPrice * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="0.30" step="0.01"
                    value={weights.spotPrice}
                    onChange={(e) => handleWeightChange('spotPrice', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-1">
                    <span>Shipping Freight Cost</span>
                    <span className="text-sky-400">{(weights.shippingCost * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="0.30" step="0.01"
                    value={weights.shippingCost}
                    onChange={(e) => handleWeightChange('shippingCost', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-1">
                    <span>Transit Lead Time</span>
                    <span className="text-sky-400">{(weights.transitTime * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="0.25" step="0.01"
                    value={weights.transitTime}
                    onChange={(e) => handleWeightChange('transitTime', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-1">
                    <span>Geopolitical Risk</span>
                    <span className="text-sky-400">{(weights.geopoliticalRisk * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="0.30" step="0.01"
                    value={weights.geopoliticalRisk}
                    onChange={(e) => handleWeightChange('geopoliticalRisk', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-1">
                    <span>Refinery Compatibility</span>
                    <span className="text-sky-400">{(weights.refineryCompatibility * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="0.25" step="0.01"
                    value={weights.refineryCompatibility}
                    onChange={(e) => handleWeightChange('refineryCompatibility', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

              {/* Radar Chart Block */}
              <div className="h-56 bg-slate-950 border border-brand-border/60 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Active Weights Radar</span>
                <ResponsiveContainer width="100%" height="85%">
                  <RadarChart cx="50%" cy="50%" radius="80%" data={radarData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 30]} stroke="#334155" fontSize={7} />
                    <Radar name="Weights" dataKey="value" stroke="#38bdf8" fill="#0284c7" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Supplier Rankings */}
          <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 mb-6 flex items-center gap-2">
              <Award size={16} className="text-sky-400 animate-pulse" />
              <span>Alternative Supplier MCDA Rankings (Real-Time Recalculated)</span>
            </h3>

            <div className="space-y-4">
              {dynamicRankings.map((r: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-brand-border/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-200">{r.supplier_name}</span>
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold border border-brand-border">{r.transit_days} Days Transit</span>
                    </div>
                    <div className="text-[10px] space-y-0.5 mt-1.5 font-semibold">
                      <p className="text-emerald-400"><span className="font-bold uppercase tracking-widest text-[8px] text-slate-500 mr-1">Advantages:</span>{r.advantages.join(', ')}</p>
                      <p className="text-risk-high"><span className="font-bold uppercase tracking-widest text-[8px] text-slate-500 mr-1">Risks:</span>{r.risks.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 shrink-0 text-right font-bold text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">Delivered Cost</span>
                      <span className="text-slate-350">${r.delivered_cost_per_barrel}/bbl</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">Refinery Compat</span>
                      <span className="text-slate-350">{Math.round(r.refinery_compatibility * 100)}%</span>
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
          
          {/* Route Rerouting Detours */}
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
                    <span className="font-bold text-slate-350">{routeResults.source} → {routeResults.destination}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-brand-border/60 pt-2 font-semibold">
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Distance (NM)</span>
                      <span className="text-slate-350">{routeResults.total_distance_nm.toLocaleString()} nm</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Transit Duration</span>
                      <span className="text-slate-350">{routeResults.transit_time_days} days</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-550 block font-bold uppercase tracking-wider">Freight Cost</span>
                      <span className="text-sky-400">${routeResults.cost_per_barrel}/bbl</span>
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

          {/* SPR Release Schedule */}
          <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              <span>SPR Release Schedule</span>
            </h3>

            {sprResults ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 font-semibold">
                  <div className="bg-slate-950 p-3 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Total Released</span>
                    <span className="text-sm font-black text-slate-200">{sprResults.total_drawn_mb} Mb</span>
                  </div>
                  <div className="bg-slate-950 p-3 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Remaining SPR</span>
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

      {/* 2. Refinery Compatibility Engine */}
      <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2 border-b border-brand-border/40 pb-4">
          <Shield size={16} className="text-sky-400" />
          <span>Refinery Crude Compatibility & Metallurgy Engine</span>
        </h3>

        {/* Crude Specifications Table */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crude Grade Technical Specifications</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3">Crude Grade</th>
                  <th className="pb-3 text-center">API Gravity</th>
                  <th className="pb-3 text-center">Sulfur %</th>
                  <th className="pb-3 text-center">Density (g/cm³)</th>
                  <th className="pb-3 text-center">Acidity (TAN)</th>
                  <th className="pb-3 text-center">Viscosity (cSt)</th>
                  <th className="pb-3 text-center">Wax %</th>
                  <th className="pb-3 text-center">Pour Point</th>
                  <th className="pb-3 text-center">Metals (Ni/V)</th>
                  <th className="pb-3 text-right">Base Compat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 font-semibold text-slate-200">
                {CRUDE_SPECIFICATIONS.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="py-3">
                      <span className="font-extrabold text-slate-200">{c.name}</span>
                      <span className="text-[10px] text-slate-500 block font-normal">{c.origin}</span>
                    </td>
                    <td className="py-3 text-center text-slate-350">{c.api_gravity}°</td>
                    <td className="py-3 text-center text-slate-350">{c.sulfur_pct}%</td>
                    <td className="py-3 text-center text-slate-350">{c.density}</td>
                    <td className="py-3 text-center text-slate-350">{c.acidity_tan}</td>
                    <td className="py-3 text-center text-slate-350">{c.viscosity_cst} cSt</td>
                    <td className="py-3 text-center text-slate-350">{c.wax_content_pct}%</td>
                    <td className="py-3 text-center text-slate-350">{c.pour_point_c}°C</td>
                    <td className="py-3 text-center text-slate-350">{c.metal_content_ppm.nickel} / {c.metal_content_ppm.vanadium} ppm</td>
                    <td className="py-3 text-right">
                      <span className="text-sky-400 font-black">{c.compatibility_score}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metallurgy Profiles & Compatibility Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metallurgy Profiles */}
          <div className="bg-slate-950 border border-brand-border/60 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-brand-border/40 pb-2">Refinery Metallurgy Architecture</h4>
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2">
              {METALLURGY_PROFILES.map((p, idx) => (
                <div key={idx} className="bg-slate-900 border border-brand-border/40 rounded-lg p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-sky-400">{p.refinery} Refinery</span>
                    <span className="text-[9px] bg-slate-950 border border-brand-border text-slate-400 px-2 py-0.5 rounded font-black uppercase">{p.desalting_stages}-Stage Desalter</span>
                  </div>
                  <p className="text-[10px] text-slate-350"><span className="text-slate-500 font-bold uppercase tracking-wider mr-1">Metallurgy:</span>{p.metallurgy_type}</p>
                  <p className="text-[10px] text-slate-350"><span className="text-slate-500 font-bold uppercase tracking-wider mr-1">Max Limits:</span>Sulfur: {p.max_sulfur_pct}% | TAN: {p.max_tan}</p>
                  <p className="text-[10px] text-slate-350"><span className="text-slate-500 font-bold uppercase tracking-wider mr-1">Cladding:</span>{p.cladding}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Compatibility Matrix Card */}
          <div className="bg-slate-950 border border-brand-border/60 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-brand-border/40 pb-2">Refinery Metallurgy Compatibility Matrix</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-border/40 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-2">Refinery</th>
                    {CRUDE_SPECIFICATIONS.map((c, idx) => (
                      <th key={idx} className="pb-2 text-center text-[10px]">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40 font-semibold text-slate-200">
                  {METALLURGY_PROFILES.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2.5 font-bold text-slate-300">{p.refinery}</td>
                      {CRUDE_SPECIFICATIONS.map((c, cIdx) => {
                        const status = getRefineryCompatibility(p.refinery, c.name);
                        let bg = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
                        if (status === 'Good') bg = 'text-sky-400 bg-sky-500/10 border border-sky-500/20';
                        else if (status === 'Acceptable') bg = 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
                        else if (status === 'Poor') bg = 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
                        return (
                          <td key={cIdx} className="py-2.5 text-center">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${bg}`}>
                              {status}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Expandable Comparison Cards */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Crude Product Yields & Refinery Economics (Expand to inspect)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EXPANDABLE_COMPARISONS.map((item, idx) => {
              const isExpanded = expandedCrude[item.name] || false;
              return (
                <div key={idx} className="bg-slate-950 border border-brand-border rounded-xl overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setExpandedCrude(prev => ({ ...prev, [item.name]: !isExpanded }))}
                    className="w-full p-4 flex justify-between items-center hover:bg-slate-900/40 text-left"
                  >
                    <div>
                      <span className="font-extrabold text-slate-200">{item.name} Yields</span>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Difficulty: <span className={item.processing_difficulty === 'LOW' ? 'text-emerald-400' : 'text-amber-500'}>{item.processing_difficulty}</span></p>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-brand-border/60 space-y-4 text-[11px] leading-normal animate-fadeIn">
                      {/* Yield distributions */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Expected Product Split</span>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className="bg-slate-900 p-1.5 rounded border border-brand-border/40"><span className="text-slate-500 block">LPG</span><span className="font-black text-slate-200">{item.expected_yield.lpg}%</span></div>
                          <div className="bg-slate-900 p-1.5 rounded border border-brand-border/40"><span className="text-slate-500 block">Gasoline</span><span className="font-black text-slate-200">{item.expected_yield.gasoline}%</span></div>
                          <div className="bg-slate-900 p-1.5 rounded border border-brand-border/40"><span className="text-slate-500 block">Jet/Kero</span><span className="font-black text-slate-200">{item.expected_yield.jet_kero}%</span></div>
                          <div className="bg-slate-900 p-1.5 rounded border border-brand-border/40"><span className="text-slate-500 block">Diesel</span><span className="font-black text-slate-200">{item.expected_yield.diesel}%</span></div>
                          <div className="bg-slate-900 p-1.5 rounded border border-brand-border/40"><span className="text-slate-500 block">VGO</span><span className="font-black text-slate-200">{item.expected_yield.vgo}%</span></div>
                          <div className="bg-slate-900 p-1.5 rounded border border-brand-border/40"><span className="text-slate-500 block">Residue</span><span className="font-black text-slate-200">{item.expected_yield.residue}%</span></div>
                        </div>
                      </div>

                      {/* Economics */}
                      <div className="space-y-2 border-t border-brand-border/40 pt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-450 font-bold">Expected Margin:</span>
                          <span className="text-emerald-400 font-black">${item.expected_margin_usd.toFixed(2)}/bbl</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450 font-bold">H2 Consumption:</span>
                          <span className="font-bold text-slate-200">{item.hydrogen_consumption_scf} scf/bbl</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450 font-bold">CDU Energy:</span>
                          <span className="font-bold text-slate-200">{item.energy_requirement_kcal} kcal/kg</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded border border-brand-border/40 mt-1">
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest block mb-0.5">CDU Catalyst Impact</span>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{item.catalyst_impact}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationCenter;
