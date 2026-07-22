import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, Map, Cpu, Sliders, Database, 
  AlertTriangle, RefreshCw, Layers 
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import RiskIntelligence from './components/RiskIntelligence';
import MapView from './components/MapView';
import ScenarioSimulator from './components/ScenarioSimulator';
import OptimizationCenter from './components/OptimizationCenter';
import DecisionOrchestrator from './components/DecisionOrchestrator';
import DataSources from './components/DataSources';
import { api } from './utils/api';
import type { DashboardMetrics, GeopoliticalEvent } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [events, setEvents] = useState<GeopoliticalEvent[]>([]);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [simTrigger, setSimTrigger] = useState<number>(0); // Trigger to reload metrics on simulation update

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
    // Poll status every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [simTrigger]);

  const handleSimUpdate = () => {
    setSimTrigger(prev => prev + 1);
  };

  const criticalAlerts = events.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL');

  // Sidebar navigation options
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
    <div className="flex h-screen bg-brand-darkest text-slate-100 overflow-hidden">
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
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
            
            {/* Quick Alerts Banner */}
            {criticalAlerts.length > 0 && (
              <div className="hidden lg:flex items-center gap-2.5 bg-risk-critical/10 border border-risk-critical/30 rounded-full px-4 py-1 text-xs text-risk-critical font-semibold animate-pulse-slow">
                <AlertTriangle size={14} />
                <span>CRITICAL INCIDENT: Strait of Hormuz logistics threat alert active. Run emergency simulation.</span>
              </div>
            )}
          </div>

          {/* National Resilience Status Metric */}
          {metrics && (
            <div className="flex items-center gap-4 bg-slate-900 border border-brand-border rounded-lg px-4 py-1.5 shadow-sm">
              <div className="text-right">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">National Resilience Index</p>
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
                <MapView />
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
