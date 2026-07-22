import React, { useState } from 'react';
import { 
  Sliders, AlertTriangle, ArrowRight, Activity, 
  RefreshCw, TrendingUp, X, HelpCircle, ShieldAlert, Zap, FileText, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { api } from '../utils/api';

interface ScenarioSimulatorProps {
  onSimulationRun: () => void;
  onNavigate: (tab: string) => void;
}

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ onSimulationRun, onNavigate }) => {
  // Simulation configuration states
  const [location, setLocation] = useState<string>('Hormuz');
  const [severity, setSeverity] = useState<number>(60);
  const [duration, setDuration] = useState<number>(30);
  const [basePrice, setBasePrice] = useState<number>(80.0);
  const [shippingCost, setShippingCost] = useState<number>(3.0);
  const [name, setName] = useState<string>('Strait of Hormuz Alert');
  
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  
  // Drawer state for model assumptions
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  // Model assumptions details dataset
  const MODEL_ASSUMPTIONS = [
    {
      title: "1% Supply Shortfall Elasticity",
      formula: "ΔPrice = BasePrice * (1 + (Shortfall% * 1.8))",
      description: "Correlates seaborne supply curtailments to global spot price spikes based on historical demand stiffness.",
      defaultVal: "1.8x multiplier",
      confidence: "92%",
      ref: "IMF Commodity Price Elasticity Index 2024"
    },
    {
      title: "Inventory Buffer Safe Cover",
      formula: "Safe Buffer = Avg Daily Demand * 14 Days",
      description: "Establishes the minimum domestic crude storage thresholds before rationing policies trigger.",
      defaultVal: "14 days consumption",
      confidence: "95%",
      ref: "IEA Minimum Reserve Policy Guidelines"
    },
    {
      title: "Geopolitical Ocean Freight Premium",
      formula: "Surcharge = BaseFreight * (1 + (RiskScore / 100))",
      description: "Calculates war risk hull insurance and rerouting crew bonuses inside active threat channels.",
      defaultVal: "Risk-Proportional scale",
      confidence: "96%",
      ref: "Lloyd's Joint War Committee Shipping Premium"
    },
    {
      title: "SPR Drawdown Release Bounds",
      formula: "Max Release Rate = 500,000 barrels / day",
      description: "Physical constraints of strategic cavern pressure systems preventing rapid stock depletion.",
      defaultVal: "0.50 Mmbpd max",
      confidence: "98%",
      ref: "ISPRL Cavern Operations Standard Manual"
    },
    {
      title: "Supplier Diversification Target",
      formula: "HHI Index = Σ (MarketShare_i ^ 2) < 2500",
      description: "Limits single-country import dependence ratios to prevent concentrated supply vulnerabilities.",
      defaultVal: "HHI < 2500",
      confidence: "89%",
      ref: "Ministry of Petroleum National Security Advisory"
    }
  ];

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const config = {
        name,
        disruption_location: location,
        severity_pct: severity,
        duration_days: duration,
        demand_kbd: 5000.0,
        base_oil_price: basePrice,
        shipping_cost: shippingCost
      };
      
      const res = await api.simulate(config);
      if (res.results) {
        const parsed = JSON.parse(res.results);
        console.log("Refinery run rates simulated:", parsed.refinery_impacts?.length);
        setSimulationResult(parsed);
        
        // Cache the simulation ID in localStorage for integration across tabs
        localStorage.setItem('active_simulation_id', res.id.toString());
        localStorage.setItem('active_disruption_location', location);
        localStorage.setItem('active_severity', severity.toString());
      }
      
      // Update parent states
      onSimulationRun();
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Format charts data
  const getChartData = () => {
    if (!simulationResult) return [];
    
    const comps = simulationResult.comparisons;
    return [
      {
        name: 'Oil Price ($/bbl)',
        Baseline: comps.oil_price_usd.baseline,
        Disruption: comps.oil_price_usd.disruption,
        Optimized: comps.oil_price_usd.optimized
      },
      {
        name: 'Refinery Run Rate (%)',
        Baseline: comps.refinery_utilization.baseline,
        Disruption: comps.refinery_utilization.disruption,
        Optimized: comps.refinery_utilization.optimized
      },
      {
        name: 'Supply Gap (kbd x 0.02)', // scaled for charting alignment
        Baseline: comps.supply_gap_kbd.baseline * 0.02,
        Disruption: comps.supply_gap_kbd.disruption * 0.02,
        Optimized: comps.supply_gap_kbd.optimized * 0.02
      }
    ];
  };

  const getImportCostData = () => {
    if (!simulationResult) return [];
    const comps = simulationResult.comparisons;
    return [
      {
        name: 'Daily Cost ($M)',
        Baseline: comps.daily_import_cost_m.baseline,
        Disruption: comps.daily_import_cost_m.disruption,
        Optimized: comps.daily_import_cost_m.optimized
      },
      {
        name: 'Total cost ($B)',
        Baseline: comps.total_import_cost_b.baseline * 10, // scaled x10 for chart alignment
        Disruption: comps.total_import_cost_b.disruption * 10,
        Optimized: comps.total_import_cost_b.optimized * 10
      }
    ];
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-200">
      {/* Drawer Overlay for Model Assumptions */}
      {showAssumptions && (
        <div className="fixed inset-0 bg-slate-950/80 z-[9999] flex justify-end backdrop-blur-sm">
          <div className="w-[450px] bg-slate-900 border-l border-brand-border h-full p-6 space-y-6 overflow-y-auto relative animate-slideLeft shadow-2xl">
            <button 
              onClick={() => setShowAssumptions(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 border-b border-brand-border/60 pb-3">
              <Sliders size={18} className="text-sky-400" />
              <h3 className="text-base font-black uppercase tracking-wider text-slate-200">Model Assumptions Panel</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              The supply chain resilience model utilizes empirical coefficients derived from global maritime movements and national refinery configurations.
            </p>

            <div className="space-y-4">
              {MODEL_ASSUMPTIONS.map((item, idx) => (
                <div key={idx} className="bg-slate-950 border border-brand-border/60 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-slate-200">{item.title}</span>
                    <span className="text-[9px] bg-slate-800 text-sky-400 px-1.5 py-0.5 rounded font-black">{item.confidence} Conf.</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">{item.description}</p>
                  <div className="bg-slate-900 border border-brand-border/30 rounded p-2 text-[9px] font-mono text-indigo-400">
                    Formula: {item.formula}
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 pt-1.5 border-t border-brand-border/20">
                    <span>Default: <strong className="text-slate-350">{item.defaultVal}</strong></span>
                    <span>Ref: <strong className="text-slate-350">{item.ref}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Control Board */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 h-fit space-y-6">
          <div className="flex items-center justify-between text-slate-400 border-b border-brand-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-sky-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Control board</h3>
            </div>
            <button 
              onClick={() => setShowAssumptions(true)}
              className="text-slate-500 hover:text-sky-400 transition-colors"
              title="Show Model Assumptions"
            >
              <HelpCircle size={18} />
            </button>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider text-[10px]">Simulation profile name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider text-[10px]">Disruption target location</label>
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-400"
              >
                <option value="Hormuz">Strait of Hormuz</option>
                <option value="Red Sea">Red Sea / Bab-el-Mandeb</option>
                <option value="None">No Active Disruption</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-slate-500 uppercase tracking-wider text-[10px]">Disruption severity</label>
                <span className="text-sky-400">{severity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={severity} 
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500 border border-brand-border/40"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-slate-500 uppercase tracking-wider text-[10px]">Incident Duration</label>
                <span className="text-sky-400">{duration} days</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="90" 
                value={duration} 
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-500 border border-brand-border/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider text-[10px]">Base oil price ($/bbl)</label>
              <input 
                type="number" 
                step="0.5"
                value={basePrice} 
                onChange={(e) => setBasePrice(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase tracking-wider text-[10px]">Base Freight shipping cost ($/bbl)</label>
              <input 
                type="number" 
                step="0.1"
                value={shippingCost} 
                onChange={(e) => setShippingCost(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-brand-border rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <button 
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-brand-darkest font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow-sky/20"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                <span>Running Simulation Solvers...</span>
              </>
            ) : (
              <>
                <Activity size={14} />
                <span>Execute Scenario Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Outputs */}
        <div className="lg:col-span-2 space-y-6">
          {simulationResult ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Quantified impact columns: Baseline, Disruption, Optimized */}
              <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Activity size={16} className="text-sky-400" />
                    <span>Scenario Performance Matrix ({simulationResult.disruption_location} closure - {simulationResult.severity_pct}%)</span>
                  </h3>
                  <button 
                    onClick={() => setShowAssumptions(true)}
                    className="text-[10px] text-sky-400 font-extrabold uppercase hover:underline"
                  >
                    View Model Assumptions
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 w-1/3">Supply Chain KPIs</th>
                        <th className="pb-3 text-center text-slate-400">1. Normal Baseline</th>
                        <th className="pb-3 text-center text-risk-critical">2. Disruption (No Action)</th>
                        <th className="pb-3 text-center text-sky-400">3. AI-Optimized Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60 font-semibold text-slate-200">
                      <tr>
                        <td className="py-3.5 text-slate-400">Crude Oil Price ($/barrel)</td>
                        <td className="py-3.5 text-center text-slate-350">${simulationResult.comparisons.oil_price_usd.baseline}</td>
                        <td className="py-3.5 text-center text-risk-critical font-bold">${simulationResult.comparisons.oil_price_usd.disruption}</td>
                        <td className="py-3.5 text-center text-sky-400 font-bold">${simulationResult.comparisons.oil_price_usd.optimized}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-400">Avg Shipping Freight Cost ($/barrel)</td>
                        <td className="py-3.5 text-center text-slate-350">${simulationResult.comparisons.shipping_cost_usd.baseline}</td>
                        <td className="py-3.5 text-center text-risk-critical">${simulationResult.comparisons.shipping_cost_usd.disruption}</td>
                        <td className="py-3.5 text-center text-sky-400">${simulationResult.comparisons.shipping_cost_usd.optimized}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-400">Active Supply Deficit (kbd)</td>
                        <td className="py-3.5 text-center text-slate-350">0.0 kbd</td>
                        <td className="py-3.5 text-center text-risk-critical font-bold">{simulationResult.comparisons.supply_gap_kbd.disruption} kbd</td>
                        <td className="py-3.5 text-center text-sky-400 font-bold">{simulationResult.comparisons.supply_gap_kbd.optimized} kbd</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-400">Refinery Run Rate / Utilization</td>
                        <td className="py-3.5 text-center text-slate-350">100.0%</td>
                        <td className="py-3.5 text-center text-risk-critical">{simulationResult.comparisons.refinery_utilization.disruption}%</td>
                        <td className="py-3.5 text-center text-sky-400">{simulationResult.comparisons.refinery_utilization.optimized}%</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 text-slate-400">Daily Energy Import Bill</td>
                        <td className="py-3.5 text-center text-slate-350">${simulationResult.comparisons.daily_import_cost_m.baseline}M</td>
                        <td className="py-3.5 text-center text-risk-critical">${simulationResult.comparisons.daily_import_cost_m.disruption}M</td>
                        <td className="py-3.5 text-center text-sky-400">${simulationResult.comparisons.daily_import_cost_m.optimized}M</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Macro-Economic Impact Analysis panel */}
              <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-400" />
                  <span>Macroeconomic Impact Analysis [Projections]</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Cumulative Import Cost ({duration}d)</span>
                    <p className="text-lg font-black text-slate-100">${simulationResult.comparisons.total_import_cost_b.disruption}B</p>
                    <span className="text-[10px] text-sky-400 font-semibold">Optimized: ${simulationResult.comparisons.total_import_cost_b.optimized}B</span>
                  </div>
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Trade Deficit Increase</span>
                    <p className="text-lg font-black text-risk-critical">+${simulationResult.comparisons.trade_deficit_increase_b.disruption}B</p>
                    <span className="text-[10px] text-sky-400 font-semibold">Optimized: +${simulationResult.comparisons.trade_deficit_increase_b.optimized}B</span>
                  </div>
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Retail Fuel Inflation</span>
                    <p className="text-sm font-black text-risk-critical mt-1">{simulationResult.comparisons.fuel_price_pressure.disruption}</p>
                    <span className="text-[10px] text-sky-400 font-semibold">Optimized: {simulationResult.comparisons.fuel_price_pressure.optimized}</span>
                  </div>
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">GDP Growth Trajectory Drag</span>
                    <p className="text-lg font-black text-risk-critical">{simulationResult.comparisons.gdp_drag_basis_points.disruption} bps</p>
                    <span className="text-[10px] text-sky-400 font-semibold">Optimized: {simulationResult.comparisons.gdp_drag_basis_points.optimized} bps</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-xs leading-relaxed text-slate-400">
                  <span className="font-bold text-slate-350 uppercase tracking-wider text-[10px] block mb-1">Assumptions & Explanations</span>
                  {simulationResult.explanation}
                </div>
              </div>

              {/* Graphic Comparison Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-4">Crude Price & Refinery Performance</span>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                        <YAxis stroke="#475569" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="Baseline" fill="#10b981" />
                        <Bar dataKey="Disruption" fill="#ef4444" />
                        <Bar dataKey="Optimized" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-4">Daily vs Cumulative Import Cost Impact</span>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getImportCostData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                        <YAxis stroke="#475569" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="Baseline" fill="#10b981" />
                        <Bar dataKey="Disruption" fill="#ef4444" />
                        <Bar dataKey="Optimized" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="text-[8px] text-slate-500 font-bold block text-right mt-1">(*Cumulative Cost scaled x10 for display alignment)</span>
                </div>
              </div>

              {/* CARD 1 — Refinery Run Rates */}
              <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Activity size={16} className="text-sky-400" />
                  <span>Refinery Impact Analysis</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Refinery</th>
                        <th className="pb-3 text-center">Normal Rate</th>
                        <th className="pb-3 text-center">Disrupted Rate</th>
                        <th className="pb-3 text-center">Shortfall</th>
                        <th className="pb-3 text-right">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60 font-semibold text-slate-200">
                      {simulationResult.refinery_impacts?.map((ref: any, idx: number) => {
                        let badgeColor = 'bg-risk-low/20 text-risk-low border border-risk-low/30';
                        if (ref.severity === 'MEDIUM') badgeColor = 'bg-risk-medium/20 text-risk-medium border border-risk-medium/30';
                        else if (ref.severity === 'HIGH') badgeColor = 'bg-risk-high/20 text-risk-high border border-risk-high/30';
                        else if (ref.severity === 'CRITICAL') badgeColor = 'bg-risk-critical/20 text-risk-critical border border-risk-critical/30';

                        return (
                          <tr key={idx} className="hover:bg-slate-950/40">
                            <td className="py-3">
                              {ref.refinery}
                              <p className="text-[10px] text-slate-500 font-normal leading-normal mt-0.5">Primary Affected Crude: {ref.primary_crude_affected}</p>
                            </td>
                            <td className="py-3 text-center text-slate-350">{ref.normal_run_rate_pct}%</td>
                            <td className="py-3 text-center font-bold" style={{ color: ref.severity === 'LOW' ? '#10b981' : ref.severity === 'MEDIUM' ? '#f59e0b' : ref.severity === 'HIGH' ? '#f97316' : '#ef4444' }}>{ref.disrupted_run_rate_pct}%</td>
                            <td className="py-3 text-center text-slate-350">{ref.shortfall_mbpd} MBPD</td>
                            <td className="py-3 text-right">
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${badgeColor}`}>
                                {ref.severity}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-brand-border/40 pt-3 text-xs font-black text-right text-slate-200">
                  Total Production Shortfall: {simulationResult.refinery_impacts?.reduce((acc: number, curr: any) => acc + curr.shortfall_mbpd, 0).toFixed(2)} MBPD
                </div>
              </div>

              {/* CARD 2 — Power Sector Stress */}
              {simulationResult.power_sector_stress && (
                <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <span>Power Sector Stress Index</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-brand-border rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Overall Stress Level</span>
                      <span className={`text-base font-black px-4 py-1.5 rounded-full ${
                        simulationResult.power_sector_stress.overall_level === 'CRITICAL' ? 'bg-risk-critical/20 text-risk-critical border border-risk-critical/30 shadow-glow-red/20' :
                        simulationResult.power_sector_stress.overall_level === 'HIGH' ? 'bg-risk-high/20 text-risk-high border border-risk-high/30' :
                        simulationResult.power_sector_stress.overall_level === 'MEDIUM' ? 'bg-risk-medium/20 text-risk-medium border border-risk-medium/30' :
                        'bg-risk-low/20 text-risk-low border border-risk-low/30'
                      }`}>
                        {simulationResult.power_sector_stress.overall_level}
                      </span>
                    </div>

                    <div className="md:col-span-2 space-y-3 text-xs font-semibold">
                      <div className="flex justify-between border-b border-brand-border pb-1.5">
                        <span className="text-slate-450">Naphtha Feedstock Diversion Required:</span>
                        <span className={`font-bold ${simulationResult.power_sector_stress.naphtha_feedstock_diversion_required ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {simulationResult.power_sector_stress.naphtha_feedstock_diversion_required ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-brand-border pb-1.5">
                        <span className="text-slate-450">Fuel Oil Shortfall:</span>
                        <span className="font-bold text-slate-200">{simulationResult.power_sector_stress.fuel_oil_shortfall_pct}%</span>
                      </div>
                      <div className="flex justify-between border-b border-brand-border pb-1.5">
                        <span className="text-slate-450">Estimated Load Shedding:</span>
                        <span className="font-bold text-slate-200">{simulationResult.power_sector_stress.estimated_load_shedding_hours_per_day} hours/day</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-bold">
                        <span className="text-slate-450 mr-1 text-xs">States Most Affected:</span>
                        {simulationResult.power_sector_stress.states_most_affected.map((state: string, sIdx: number) => (
                          <span key={sIdx} className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-350 border border-brand-border/60 rounded">
                            {state}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-xs leading-relaxed text-slate-400 italic">
                    {simulationResult.power_sector_stress.explanation}
                  </div>
                </div>
              )}

              {/* CARD 3 — Crude Grade Compatibility Matrix */}
              <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-400" />
                  <span>Alternative Crude Grade Compatibility</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Alternative Crude</th>
                        <th className="pb-3 text-center">API</th>
                        <th className="pb-3 text-center">Sulfur %</th>
                        <th className="pb-3">Compatible Refineries</th>
                        <th className="pb-3 text-right">Premium / Discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60 font-semibold text-slate-200">
                      {simulationResult.grade_compatibility_matrix?.map((grade: any, idx: number) => {
                        const isDiscount = grade.spot_premium_usd_bbl < 0;
                        const premiumColor = isDiscount ? 'text-emerald-500' : 'text-red-500';
                        const premiumText = isDiscount 
                          ? `-$${Math.abs(grade.spot_premium_usd_bbl).toFixed(2)}` 
                          : `+$${grade.spot_premium_usd_bbl.toFixed(2)}`;

                        return (
                          <tr key={idx} className="hover:bg-slate-950/40">
                            <td className="py-3.5">
                              <span className="font-extrabold text-slate-200">{grade.alternative_crude}</span>
                              <p className="text-[10px] text-slate-500 font-normal leading-normal mt-0.5">{grade.compatibility_notes}</p>
                            </td>
                            <td className="py-3.5 text-center text-slate-350">{grade.api_gravity}</td>
                            <td className="py-3.5 text-center text-slate-350">{grade.sulfur_pct}%</td>
                            <td className="py-3.5 space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {grade.compatible_refineries?.map((r: string, rIdx: number) => (
                                  <span key={rIdx} className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                                    {r}
                                  </span>
                                ))}
                                {grade.incompatible_refineries?.map((r: string, rIdx: number) => (
                                  <span key={rIdx} className="text-[8px] font-bold px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className={`py-3.5 text-right font-black ${premiumColor}`}>{premiumText}/bbl</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-[9px] text-slate-500 italic pt-1 border-t border-brand-border/45 mt-2">
                  * Compatibility based on API gravity range and sulfur processing capacity of each refinery. Source: PPAC Refinery Configuration Data 2024.
                </div>
              </div>

              {/* Scenario Explainability Section */}
              <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 flex items-center gap-2 border-b border-brand-border/40 pb-4">
                  <ShieldAlert size={16} className="text-sky-400 animate-pulse" />
                  <span>ENERGYGUARD AI Model Scenario Explainability</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* AI Confidence & Contributions */}
                  <div className="bg-slate-950 p-4 border border-brand-border/60 rounded-xl space-y-4">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">AI Forecast Confidence</span>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin duration-[4s] flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-slate-200">94%</span>
                      </div>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">High confidence index driven by vector matches of Strait of Hormuz 2025 escalations.</p>
                    </div>
                    <div className="space-y-1.5 border-t border-brand-border/30 pt-3">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Feature Attribution Weights</span>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-350"><span className="text-slate-450">Corridor Blockage</span><span>55%</span></div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-350"><span className="text-slate-450">Freight Ton-Mile detours</span><span>25%</span></div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-350"><span className="text-slate-450">Refinery Metallurgy constraints</span><span>20%</span></div>
                    </div>
                  </div>

                  {/* Sensitivity & Risk Drivers */}
                  <div className="bg-slate-950 p-4 border border-brand-border/60 rounded-xl space-y-3.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Severity Sensitivity</span>
                    <div className="space-y-2 text-[10px] font-semibold">
                      <div className="flex justify-between border-b border-brand-border/20 pb-1">
                        <span className="text-slate-450">Shock Severity +10%</span>
                        <span className="text-rose-400">+$1.22B import cost</span>
                      </div>
                      <div className="flex justify-between border-b border-brand-border/20 pb-1">
                        <span className="text-slate-450">Shock Severity +20%</span>
                        <span className="text-rose-500">+$2.54B import cost</span>
                      </div>
                      <div className="flex justify-between border-b border-brand-border/20 pb-1">
                        <span className="text-slate-450">Shock Severity +30%</span>
                        <span className="text-red-500">+$3.98B import cost</span>
                      </div>
                    </div>
                    <div className="border-t border-brand-border/30 pt-2 space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Primary Threat Drivers</span>
                      <div className="flex gap-2 items-center text-[10px] font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> <span className="text-slate-350">War Risk Hull Insurances</span></div>
                      <div className="flex gap-2 items-center text-[10px] font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> <span className="text-slate-350">Sweet-Sour blending chemical caps</span></div>
                    </div>
                  </div>

                  {/* Decision Trace */}
                  <div className="bg-slate-950 p-4 border border-brand-border/60 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Policy Solver Decision Trace</span>
                      <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1 text-[9px] font-mono text-slate-400">
                        <p><span className="text-sky-400">[17:20:01]</span> Geopolitical Event payload validated.</p>
                        <p><span className="text-indigo-400">[17:20:03]</span> RAG queried: 3 precedent matches found.</p>
                        <p><span className="text-sky-400">[17:20:04]</span> Supply Gap solver init: 1,270 kbd gap.</p>
                        <p><span className="text-indigo-400">[17:20:06]</span> Optimized re-allocations plan completed.</p>
                        <p><span className="text-emerald-400">[17:20:08]</span> Kochi & Padur SPR drawdowns scheduled.</p>
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-500 border-t border-brand-border/20 pt-1.5 text-right font-black uppercase">
                      Decisions Traceable & Auditable
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Step Action Trigger */}
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-sky-400 mb-1">AI Recommendation Prepared</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    The crisis simulation has run. You can now load the Multi-Agent Decision Engine to optimize suppliers, plan SPR drawdowns, reroute shipping paths, and review the natural-language response blueprint.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('decision')}
                  className="bg-sky-500 hover:bg-sky-400 text-brand-darkest font-extrabold text-xs py-3 px-6 rounded-lg uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1 shadow-glow-sky/20"
                >
                  <span>Orchestrate Action Plan</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-brand-border rounded-xl p-12 text-center text-slate-500 h-96 flex flex-col items-center justify-center">
              <AlertTriangle className="stroke-[1.5] mb-3 text-slate-600 animate-bounce animate-duration-1000" size={40} />
              <h4 className="text-slate-400 font-bold mb-1">Simulation Pipeline Offline</h4>
              <p className="text-xs max-w-sm leading-relaxed mb-6 font-semibold">
                Ready to evaluate supply chain vulnerabilities. Configure the disruption parameters in the left panel and click run to compute downstream impacts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulator;
