import React, { useState } from 'react';
import { 
  Sliders, AlertTriangle, ArrowRight, Activity, 
  RefreshCw, TrendingUp 
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
        setSimulationResult(JSON.parse(res.results));
        
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
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Control Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Simulation configuration inputs */}
        <div className="xl:col-span-1 bg-slate-900 border border-brand-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            <Sliders size={16} className="text-sky-400" />
            <span>Crisis Simulator Controls</span>
          </h3>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Disruption Target Corridor</label>
            <select 
              value={location} 
              onChange={(e) => {
                setLocation(e.target.value);
                setName(e.target.value === 'Hormuz' ? 'Strait of Hormuz Conflict' : 'Red Sea Shipping Disruption');
              }}
              className="w-full bg-slate-950 border border-brand-border text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-sky-400"
            >
              <option value="Hormuz">Strait of Hormuz</option>
              <option value="Red Sea">Red Sea (Bab-el-Mandeb)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Disruption Severity: {severity}%</label>
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="5"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
            />
            <div className="flex justify-between text-[8px] text-slate-500 font-semibold mt-1">
              <span>MIN SHOCK</span>
              <span>SEVERE BLOCKED</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Disruption Duration (Days)</label>
            <input 
              type="number" 
              min="5"
              max="120"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-brand-border text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Baseline Crude Price ($/bbl)</label>
            <input 
              type="number" 
              step="0.5"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-brand-border text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Baseline Freight Surcharge ($/bbl)</label>
            <input 
              type="number" 
              step="0.1"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-brand-border text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-sky-400"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-brand-darkest font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-glow-sky/20 flex items-center justify-center gap-2"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                <span>Running Simulation...</span>
              </>
            ) : (
              <span>Run Disruption Simulation</span>
            )}
          </button>
        </div>

        {/* 2. Simulation Results display */}
        <div className="xl:col-span-3 space-y-6">
          {simulationResult ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Quantified impact columns: Baseline, Disruption, Optimized */}
              <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                  <Activity size={16} className="text-sky-400" />
                  <span>Scenario Performance Matrix ({simulationResult.disruption_location} closure - {simulationResult.severity_pct}%)</span>
                </h3>

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

              {/* Macro-Economic Impact Analysis panel (Module 5B) */}
              <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-400" />
                  <span>Macroeconomic Impact Analysis [Scenario Projections]</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Cumulative Import Cost ({duration}d)</span>
                    <p className="text-lg font-black text-slate-100">${simulationResult.comparisons.total_import_cost_b.disruption}B</p>
                    <span className="text-[10px] text-sky-400">Optimized: ${simulationResult.comparisons.total_import_cost_b.optimized}B</span>
                  </div>
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Trade Deficit Increase</span>
                    <p className="text-lg font-black text-risk-critical">+${simulationResult.comparisons.trade_deficit_increase_b.disruption}B</p>
                    <span className="text-[10px] text-sky-400">Optimized: +${simulationResult.comparisons.trade_deficit_increase_b.optimized}B</span>
                  </div>
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Retail Fuel Inflation</span>
                    <p className="text-sm font-black text-risk-critical mt-1">{simulationResult.comparisons.fuel_price_pressure.disruption}</p>
                    <span className="text-[10px] text-sky-400">Optimized: {simulationResult.comparisons.fuel_price_pressure.optimized}</span>
                  </div>
                  <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">GDP Growth Trajectory Drag</span>
                    <p className="text-lg font-black text-risk-critical">{simulationResult.comparisons.gdp_drag_basis_points.disruption} bps</p>
                    <span className="text-[10px] text-sky-400">Optimized: {simulationResult.comparisons.gdp_drag_basis_points.optimized} bps</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 border border-brand-border rounded-lg text-xs leading-relaxed text-slate-400">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block mb-1">Assumptions & Explanations</span>
                  {simulationResult.explanation}
                </div>
              </div>

              {/* Graphic Comparison Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 1: Price and Runs */}
                <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Crude Price & Refinery Performance</span>
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

                {/* Chart 2: Cumulative costs */}
                <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Daily vs Cumulative Import Cost Impact</span>
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

              {/* Next Step Action Trigger */}
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-sky-400 mb-1">AI Recommendation Prepared</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The crisis simulation has run. You can now load the Multi-Agent Decision Engine to optimize suppliers, plan SPR drawdowns, reroute shipping paths, and review the natural-language response blueprint.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('decision')}
                  className="bg-sky-500 hover:bg-sky-400 text-brand-darkest font-extrabold text-xs py-3 px-6 rounded-lg uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Orchestrate Action Plan</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-brand-border rounded-xl p-12 text-center text-slate-500 h-96 flex flex-col items-center justify-center">
              <AlertTriangle className="stroke-[1.5] mb-3 text-slate-600 animate-bounce" size={40} />
              <h4 className="text-slate-400 font-bold mb-1">Simulation Pipeline Offline</h4>
              <p className="text-xs max-w-sm leading-relaxed mb-6">
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
