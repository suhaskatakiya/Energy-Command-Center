import React, { useState, useEffect } from 'react';
import { 
  Layers, ShieldCheck, CheckCircle2, 
  RefreshCw, AlertTriangle, UserCheck, Play 
} from 'lucide-react';
import { api } from '../utils/api';
import type { DecisionPlan } from '../types';

interface DecisionOrchestratorProps {
  onApproval: () => void;
}

const DecisionOrchestrator: React.FC<DecisionOrchestratorProps> = ({ onApproval }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [plan, setPlan] = useState<DecisionPlan | null>(null);
  const [message, setMessage] = useState<string>('');

  const loadPlan = async () => {
    setLoading(true);
    try {
      const activeSimIdStr = localStorage.getItem('active_simulation_id');
      if (activeSimIdStr) {
        const id = parseInt(activeSimIdStr);
        
        // Trigger orchestrator run
        const orchestrate = await api.orchestrateAgent(id, 'balanced');
        setPlan(orchestrate);
      }
    } catch (err) {
      console.error("Orchestrator failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleStatusChange = async (status: 'APPROVED' | 'REJECTED') => {
    if (!plan) return;
    setIsProcessing(true);
    try {
      await api.approveDecisionPlan(plan.id, status);
      setMessage(`Decision Plan successfully ${status}! System indicators updated.`);
      
      // If approved, we can clear simulated warnings or set a status
      if (status === 'APPROVED') {
        // Mocking recovery - reduce risk slightly in metrics
        localStorage.removeItem('active_simulation_id'); // Reset active simulation
        onApproval();
      }
      
      // Reload updated plan
      setPlan(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      console.error("Approval error:", err);
      setMessage("Approval failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="animate-spin text-sky-400" size={24} />
        <span>Multi-Agent Engine is Coordinating Blueprint...</span>
      </div>
    );
  }

  // Parses recommended actions JSON list
  const actionsList = plan ? JSON.parse(plan.recommended_actions) : [];

  // Agent collaboration dialogue logs for display
  const agentLogs = [
    { name: "Risk Intelligence Agent", role: "Geopol Monitoring", color: "text-amber-500", log: "Strait of Hormuz threat verified at 78% probability. Supply exposure: 2,050 kbd crude imports." },
    { name: "Maritime Logistics Agent", role: "Route Pathfinder", color: "text-sky-400", log: "Persian Gulf route compromised. Rerouting Russian Urals tankers via Cape of Good Hope detour. Adjusting transit +14 days." },
    { name: "Procurement Agent", role: "Crude Allocator", color: "text-indigo-400", log: "MCDA completed. Initiating UAE Murban pipeline bypass cargo (Fujairah) +250 kbd. Blending sweet West African barrels." },
    { name: "Strategic Reserve Agent", role: "SPR Planner", color: "text-emerald-400", log: "SPR daily buffer drawdown calculated at 320 kbd. Remaining inventory: 32.1 Mb (Sustainable buffer maintained)." },
    { name: "Decision Orchestrator Agent", role: "Coordinator", color: "text-purple-400", log: "Compiling combined response plan. Injecting RAG historical precedence context. Ready for Human review." }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Message */}
      {message && (
        <div className="bg-slate-900 border border-brand-border rounded-xl px-6 py-4 flex items-center gap-3">
          <CheckCircle2 className="text-emerald-500" size={20} />
          <p className="text-sm font-bold text-emerald-400">{message}</p>
        </div>
      )}

      {/* Grid: Agent Logs and Before vs After comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agent console */}
        <div className="xl:col-span-1 bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col justify-between h-[28rem]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-455 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-sky-400" />
              <span>Multi-Agent Discussion Log</span>
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-[19rem] pr-2">
              {agentLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-950 p-3 border border-brand-border/40 rounded-lg text-[10px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-black ${log.color}`}>{log.name}</span>
                    <span className="text-slate-500 font-bold uppercase text-[8px]">{log.role}</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed font-medium">{log.log}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold border-t border-brand-border pt-4">
            Status: Collaborative consensus achieved
          </div>
        </div>

        {/* Before vs After comparison cards (Module 13) */}
        <div className="xl:col-span-2 bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col justify-between h-[28rem]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-455 mb-6 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Quantified Optimization Impact (Before vs After)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: BEFORE AI */}
              <div className="bg-slate-950/60 border border-risk-critical/30 rounded-xl p-6 space-y-4">
                <h4 className="text-xs font-black text-risk-critical uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>Before AI Response (No Action)</span>
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-brand-border/60 pb-1.5">
                    <span className="text-slate-500 font-semibold">National Supply Risk</span>
                    <span className="text-risk-critical font-black">CRITICAL</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-border/60 pb-1.5">
                    <span className="text-slate-500 font-semibold">Crude Supply Gap</span>
                    <span className="text-risk-critical font-black">{plan ? Math.round(plan.total_cost * 280) : 1200} kbd (24.0%)</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-border/60 pb-1.5">
                    <span className="text-slate-500 font-semibold">Refinery Utilization</span>
                    <span className="text-risk-critical font-bold">76.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Economic Surcharge</span>
                    <span className="text-risk-critical font-bold">Severe Price Spikes</span>
                  </div>
                </div>
              </div>

              {/* Card: AFTER AI */}
              <div className="bg-sky-950/20 border border-sky-500/30 rounded-xl p-6 space-y-4 shadow-glow-sky/5">
                <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>After AI-Optimized Response</span>
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-brand-border/60 pb-1.5">
                    <span className="text-slate-500 font-semibold">National Supply Risk</span>
                    <span className="text-sky-400 font-black">STABLE (MEDIUM)</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-border/60 pb-1.5">
                    <span className="text-slate-500 font-semibold">Crude Supply Gap</span>
                    <span className="text-sky-400 font-black">40.0 kbd (0.8%)</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-border/60 pb-1.5">
                    <span className="text-slate-500 font-semibold">Refinery Utilization</span>
                    <span className="text-sky-400 font-bold">99.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Economic Surcharge</span>
                    <span className="text-sky-400 font-bold">Surcharge Mitigated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Human-in-the-loop triggers */}
          {plan ? (
            <div className="border-t border-brand-border pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} />
                  <span>Human Approval Required</span>
                </span>
              </div>

              {plan.status === 'PENDING' ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleStatusChange('APPROVED')} 
                    disabled={isProcessing}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-brand-darkest font-extrabold text-xs py-2.5 px-5 rounded-lg uppercase tracking-wider transition-colors"
                  >
                    Approve Response Plan
                  </button>
                  <button 
                    onClick={() => handleStatusChange('REJECTED')} 
                    disabled={isProcessing}
                    className="bg-slate-800 hover:bg-slate-750 text-risk-critical font-bold text-xs py-2.5 px-5 rounded-lg border border-brand-border uppercase tracking-wider transition-colors"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-lg">
                  Plan Executed - Active Status: {plan.status}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs">Run simulation first.</div>
          )}
        </div>
      </div>

      {/* Explanatory Document: Multi-agent and RAG explanation */}
      {plan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Markdown blueprint */}
          <div className="lg:col-span-2 bg-slate-900 border border-brand-border rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-455 mb-6 flex items-center gap-2">
              <Play size={14} className="text-sky-400" />
              <span>AI Response Strategy Blueprint (RAG Grounded)</span>
            </h3>
            <div className="bg-slate-950 p-6 border border-brand-border/60 rounded-xl max-h-[30rem] overflow-y-auto text-xs leading-relaxed text-slate-300 prose prose-invert max-w-none">
              {/* Render simple formatting or HTML from markdown */}
              <div className="space-y-4">
                {plan.reasoning.split('\n\n').map((para, idx) => {
                  if (para.startsWith('###')) {
                    return <h4 key={idx} className="font-extrabold text-sm text-sky-400 uppercase tracking-wider pt-2">{para.replace('###', '').trim()}</h4>;
                  }
                  if (para.startsWith('*')) {
                    return (
                      <ul key={idx} className="list-disc pl-4 space-y-1.5">
                        {para.split('\n').map((li, lidx) => (
                          <li key={lidx}>{li.replace('*', '').trim()}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={idx}>{para}</p>;
                })}
              </div>
            </div>
          </div>

          {/* Action checklist */}
          <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-455 mb-6">Actionable Items Checklist</h3>
            <div className="space-y-4">
              {actionsList.map((item: any, idx: number) => (
                <div key={idx} className="border-l-2 border-sky-400 pl-4 py-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[8px] font-bold uppercase tracking-wider">{item.owner}</span>
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      item.priority === 'CRITICAL' ? 'bg-risk-critical/20 text-risk-critical' :
                      item.priority === 'HIGH' ? 'bg-risk-high/20 text-risk-high' : 'bg-slate-800 text-slate-400'
                    }`}>{item.priority}</span>
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs">{item.action}</h4>
                  <p className="text-[10px] text-slate-450 leading-normal">{item.impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-brand-border rounded-xl p-12 text-center text-slate-500">
          Run a scenario simulation to generate the decision plan and RAG intelligence blueprint.
        </div>
      )}
    </div>
  );
};

export default DecisionOrchestrator;
