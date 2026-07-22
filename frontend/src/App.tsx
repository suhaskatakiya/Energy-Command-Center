import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Map, Cpu, Sliders, Database, 
  AlertTriangle, RefreshCw, Layers, X, Play, Pause, ChevronRight, CheckCircle
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import RiskIntelligence from './components/RiskIntelligence';
import MapView from './components/MapView';
import DigitalTwin from './pages/DigitalTwin';
import ScenarioSimulator from './components/ScenarioSimulator';
import OptimizationCenter from './components/OptimizationCenter';
import DecisionOrchestrator from './components/DecisionOrchestrator';
import DataSources from './components/DataSources';
import { api } from './utils/api';
import type { DashboardMetrics, GeopoliticalEvent } from './types';

interface DemoStep {
  title: string;
  tab: string;
  desc: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [events, setEvents] = useState<GeopoliticalEvent[]>([]);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [simTrigger, setSimTrigger] = useState<number>(0);

  // Demo Walkthrough State
  const [demoState, setDemoState] = useState({
    isActive: false,
    step: 0,
    isPaused: false
  });

  const demoSteps: DemoStep[] = [
    {
      title: "Geopolitical Threat Signal Ingest",
      tab: "risk-intel",
      desc: "Reading real-time feeds from maritime satellite and news intelligence channels."
    },
    {
      title: "Vessels Geolocation Mapping",
      tab: "map",
      desc: "Visualizing shipping lanes and tracking tanker voyages in potential risk zones."
    },
    {
      title: "Downstream Simulation Solver",
      tab: "simulator",
      desc: "Simulating Strait of Hormuz blockade. Computing refinery run drops & power stress."
    },
    {
      title: "MCDA Optimization Engine",
      tab: "optimize",
      desc: "Recalculating alternative supplier grades & planning Cape shipping detours."
    },
    {
      title: "RAG-Augmented Policy Blueprint",
      tab: "decision",
      desc: "Synthesizing vector precedents and framing final response directions."
    },
    {
      title: "Policy Directive Enactment",
      tab: "decision",
      desc: "Activating the emergency measures. National Resilience Index restored to secure state."
    }
  ];

  const triggerDemoSimulation = async () => {
    try {
      const config = {
        name: "Strait of Hormuz Incident (Walkthrough Demo)",
        disruption_location: "Hormuz",
        severity_pct: 60,
        duration_days: 30,
        demand_kbd: 5000.0,
        base_oil_price: 80.0,
        shipping_cost: 3.0
      };
      const res = await api.simulate(config);
      if (res.results) {
        localStorage.setItem('active_simulation_id', res.id.toString());
        localStorage.setItem('active_disruption_location', "Hormuz");
        localStorage.setItem('active_severity', "60");
        handleSimUpdate();
      }
    } catch (err) {
      console.error("Demo simulation error:", err);
    }
  };

  const startDemoMode = async () => {
    setDemoState({
      isActive: true,
      step: 0,
      isPaused: false
    });
    setActiveTab(demoSteps[0].tab);
  };

  const togglePauseDemo = () => {
    setDemoState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleNextDemoStep = async () => {
    if (demoState.step < 5) {
      const nextStep = demoState.step + 1;
      if (nextStep === 2) {
        await triggerDemoSimulation();
      }
      setDemoState(prev => ({ ...prev, step: nextStep }));
      setActiveTab(demoSteps[nextStep].tab);
    } else {
      setDemoState(prev => ({ ...prev, isActive: false }));
    }
  };

  const handlePrevDemoStep = () => {
    if (demoState.step > 0) {
      const prevStep = demoState.step - 1;
      setDemoState(prev => ({ ...prev, step: prevStep }));
      setActiveTab(demoSteps[prevStep].tab);
    }
  };

  // Demo auto-run timer hook
  useEffect(() => {
    if (!demoState.isActive || demoState.isPaused) return;

    const timer = setTimeout(async () => {
      if (demoState.step < 5) {
        const nextStep = demoState.step + 1;
        if (nextStep === 2) {
          await triggerDemoSimulation();
        }
        setDemoState(prev => ({ ...prev, step: nextStep }));
        setActiveTab(demoSteps[nextStep].tab);
      } else {
        setDemoState(prev => ({ ...prev, isActive: false }));
      }
    }, 6000); // 6 seconds per tab slide

    return () => clearTimeout(timer);
  }, [demoState.isActive, demoState.step, demoState.isPaused]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const fetchedMetrics = await api.getMetrics();
      const fetchedEvents = await api.getEvents();
      setMetrics(fetchedMetrics);
      setEvents(fetchedEvents);
      setIsFallback(api.isFallback());
    } catch (err) {
      console.error("Error loading metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [simTrigger]);

  const handleSimUpdate = () => {
    setSimTrigger(prev => prev + 1);
  };

  const criticalAlerts = events.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL');

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: Activity },
    { id: 'risk-intel', label: 'Risk Intelligence', icon: Shield, badge: criticalAlerts.length > 0 ? criticalAlerts.length : undefined },
    { id: 'map', label: 'Digital Twin Map', icon: Map },
    { id: 'simulator', label: 'Scenario Simulator', icon: Sliders },
    { id: 'optimize', label: 'Optimization Center', icon: Cpu },
    { id: 'decision', label: 'AI Decision Center', icon: Layers },
    { id: 'sources', label: 'System Data Sources', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-brand-darkest text-slate-100 overflow-hidden relative">
      
      {/* Floating Demo Mode Controller overlay */}
      {demoState.isActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[520px] bg-slate-950/95 border border-sky-500/50 rounded-xl p-4 z-[9999] shadow-2xl flex flex-col gap-2.5 backdrop-blur-md animate-fadeIn">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="text-sky-400 animate-pulse" size={15} />
              <span className="text-[10px] font-black text-slate-100 uppercase tracking-wider">Judges' Automated Demo Walkthrough</span>
            </div>
            <button 
              onClick={() => setDemoState(prev => ({ ...prev, isActive: false }))}
              className="text-slate-400 hover:text-slate-200"
            >
              <X size={15} />
            </button>
          </div>
          
          <div className="bg-slate-900 border border-brand-border/60 rounded-lg p-3 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] text-sky-400 font-extrabold uppercase tracking-widest block">Step {demoState.step + 1} of 6: {demoSteps[demoState.step].title}</span>
              <p className="text-[10px] text-slate-300 font-semibold leading-relaxed">{demoSteps[demoState.step].desc}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={handlePrevDemoStep}
                disabled={demoState.step === 0}
                className="p-1 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-400 rounded border border-brand-border text-[9px] font-bold uppercase"
              >
                Prev
              </button>
              <button 
                onClick={togglePauseDemo}
                className="p-1 bg-slate-950 hover:bg-slate-800 text-sky-400 rounded border border-brand-border text-[9px] font-bold uppercase flex items-center gap-1"
              >
                {demoState.isPaused ? <Play size={10} /> : <Pause size={10} />}
                <span>{demoState.isPaused ? 'Play' : 'Pause'}</span>
              </button>
              <button 
                onClick={handleNextDemoStep}
                className="p-1 bg-sky-500 hover:bg-sky-400 text-brand-darkest rounded font-black text-[9px] uppercase flex items-center gap-0.5"
              >
                <span>{demoState.step === 5 ? 'Finish' : 'Next'}</span>
                <ChevronRight size={10} />
              </button>
            </div>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${((demoState.step + 1) / 6) * 100}%` }} />
          </div>
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-brand-border flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Section */}
          <div className="p-6 border-b border-brand-border flex items-center gap-3">
            <div className="bg-risk-optimal p-2 rounded-lg text-brand-darkest shadow-glow-sky">
              <Shield size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-wider text-sky-400">ENERGYGUARD</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Resilience Center</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive 
                      ? 'bg-slate-900 border border-brand-border text-sky-400 shadow-inner' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="bg-risk-critical text-brand-darkest text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Settings & Status */}
        <div className="p-4 border-t border-brand-border space-y-3 bg-slate-950">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Data Ingest System</span>
            <div className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${isFallback ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className={`font-semibold uppercase tracking-wider ${isFallback ? 'text-amber-500' : 'text-emerald-500'}`}>
                {isFallback ? 'Simulated Fallback' : 'Live Connected'}
              </span>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-brand-border hover:bg-slate-900 text-slate-300 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Systems</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Frame */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-brand-border bg-slate-950 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-fadeIn">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
            
            {/* Quick Alerts Banner */}
            {criticalAlerts.length > 0 && (
              <div className="hidden lg:flex items-center gap-2.5 bg-risk-critical/10 border border-risk-critical/30 rounded-full px-4 py-1 text-xs text-risk-critical font-semibold">
                <AlertTriangle size={14} className="animate-pulse" />
                <span>CRITICAL: Strait of Hormuz threat alert active. Run emergency simulation.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Floating judges presentation control hook */}
            <button 
              onClick={startDemoMode}
              className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 border border-sky-400/50 text-[10px] text-sky-400 font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-glow-sky/10"
            >
              <Activity size={12} className="animate-pulse" />
              <span>🏆 Judges' Walkthrough</span>
            </button>

            {/* National Resilience Status Metric */}
            {metrics && (
              <div className="flex items-center gap-4 bg-slate-900 border border-brand-border rounded-lg px-4 py-1.5 shadow-sm">
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Resilience Index</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={`font-black text-sm tracking-wide ${
                      metrics.resilience_color === 'green' ? 'text-risk-low' :
                      metrics.resilience_color === 'yellow' ? 'text-risk-medium' :
                      metrics.resilience_color === 'orange' ? 'text-risk-high' : 'text-risk-critical'
                    }`}>
                      {metrics.energy_resilience_status}
                    </span>
                  </div>
                </div>
                <div className={`h-8 w-12 rounded flex items-center justify-center font-black text-lg ${
                  metrics.resilience_color === 'green' ? 'bg-risk-low/20 text-risk-low border border-risk-low/30 shadow-glow-green' :
                  metrics.resilience_color === 'yellow' ? 'bg-risk-medium/20 text-risk-medium border border-risk-medium/30 shadow-glow-amber' :
                  metrics.resilience_color === 'orange' ? 'bg-risk-high/20 text-risk-high border border-risk-high/30 shadow-glow-orange' :
                  'bg-risk-critical/20 text-risk-critical border border-risk-critical/30 shadow-glow-red'
                }`}>
                  {metrics.energy_resilience_score}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Body Area */}
        <section className="flex-1 overflow-y-auto bg-brand-darkest p-8">
          {isLoading && !metrics ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-sky-400" size={32} />
              <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Synchronizing Command Center Modules...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && metrics && (
                <Dashboard metrics={metrics} events={events} onNavigate={setActiveTab} />
              )}
              {activeTab === 'risk-intel' && (
                <RiskIntelligence events={events} onUpdate={handleSimUpdate} />
              )}
              {activeTab === 'map' && (
                <DigitalTwin />
              )}
              {activeTab === 'simulator' && (
                <ScenarioSimulator onSimulationRun={handleSimUpdate} onNavigate={setActiveTab} />
              )}
              {activeTab === 'optimize' && (
                <OptimizationCenter />
              )}
              {activeTab === 'decision' && (
                <DecisionOrchestrator onApproval={handleSimUpdate} />
              )}
              {activeTab === 'sources' && (
                <DataSources />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
