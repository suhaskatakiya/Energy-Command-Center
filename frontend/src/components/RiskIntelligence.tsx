import React, { useState } from 'react';
import { 
  ShieldAlert, Send, Layers, Trash2, CheckCircle, 
  HelpCircle, AlertTriangle, AlertCircle, RefreshCw 
} from 'lucide-react';
import { api } from '../utils/api';
import type { GeopoliticalEvent } from '../types';

interface RiskIntelligenceProps {
  events: GeopoliticalEvent[];
  onUpdate: () => void;
}

const RiskIntelligence: React.FC<RiskIntelligenceProps> = ({ events, onUpdate }) => {
  const [newsText, setNewsText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<Omit<GeopoliticalEvent, 'id'> | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const sampleNews = [
    {
      label: "Hormuz Drone Threat",
      text: "BREAKING: The US Navy has issued a commercial shipping warning for the Strait of Hormuz after Iranian naval patrol forces reportedly launched drone operations near shipping corridors. Insurance premiums for crude oil tankers crossing Hormuz are climbing rapidly as security risks increase. Analysts estimate a 78% probability of freight transit delays, affecting up to 18% of global energy supply paths."
    },
    {
      label: "Red Sea Rocket Strike",
      text: "ADEN PORT: Houthi rebel forces have launched a cruise missile attack targeting a commercial container tanker in the southern Red Sea, near the Bab-el-Mandeb Strait. While the ship sustained minor hull damage, major logistics liners are pausing transits. A diversion around Africa's Cape of Good Hope is predicted for 80% of European and Indian cargo, increasing shipping costs and delay."
    }
  ];

  const handleAnalyze = async () => {
    if (!newsText.trim()) return;
    setIsAnalyzing(true);
    setMessage('');
    try {
      const parsedResult = await api.analyzeNews(newsText);
      setAnalysisResult(parsedResult);
    } catch (err) {
      console.error("Error analyzing news:", err);
      setMessage("News parsing failed. Check server connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInject = async () => {
    if (!analysisResult) return;
    setIsInjecting(true);
    try {
      await api.createEvent(analysisResult);
      setMessage("Geopolitical incident successfully injected into data layer! System metrics updated.");
      setAnalysisResult(null);
      setNewsText('');
      onUpdate(); // Trigger refresh on parent metrics
    } catch (err) {
      console.error("Error injecting event:", err);
      setMessage("Failed to inject event.");
    } finally {
      setIsInjecting(false);
    }
  };

  const handleClearSimulated = async () => {
    try {
      await api.clearEvents();
      setMessage("All simulated mock events cleared. System reset to baseline.");
      onUpdate();
    } catch (err) {
      console.error("Error clearing events:", err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Event Analyzer Tool */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* News Input Panel */}
        <div className="xl:col-span-2 bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <ShieldAlert size={16} className="text-sky-400" />
              <span>AI Geopolitical Event Miner</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Paste raw intelligence reports or news articles. The AI Geopolitical Risk Agent will parse locations, corridors, threat levels, and estimated supply exposure percentages.
            </p>

            {/* Quick Templates */}
            <div className="flex gap-2 mb-4">
              {sampleNews.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setNewsText(sample.text)}
                  className="text-[10px] font-bold tracking-wider uppercase bg-slate-800 hover:bg-slate-750 text-sky-400 px-3 py-1.5 rounded-lg border border-brand-border transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <textarea
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
              placeholder="Paste raw geopolitical news text here..."
              className="w-full h-44 bg-slate-950 border border-brand-border rounded-lg p-4 text-slate-200 text-sm focus:outline-none focus:border-sky-400 transition-colors resize-none placeholder-slate-600"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !newsText.trim()}
              className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-brand-darkest font-bold rounded-lg text-sm transition-all shadow-glow-sky/20 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>AI Risk Agent is Parsing...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Analyze Geopolitical Text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Structured Output Extraction Panel */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col justify-between">
          <div className="h-full flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-indigo-400" />
              <span>Structured Risk Report</span>
            </h3>

            {analysisResult ? (
              <div className="flex-1 space-y-4 text-xs">
                {/* Event attributes */}
                <div className="bg-slate-950 border border-brand-border rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Geopolitical Event</span>
                    <span className="font-extrabold text-sm text-slate-200">{analysisResult.title}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Location</span>
                      <span className="font-bold text-slate-300">{analysisResult.location}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Corridor</span>
                      <span className="font-black text-sky-400">{analysisResult.affected_corridor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Severity</span>
                      <span className={`font-extrabold ${
                        analysisResult.severity === 'CRITICAL' ? 'text-risk-critical' :
                        analysisResult.severity === 'HIGH' ? 'text-risk-high' :
                        analysisResult.severity === 'MEDIUM' ? 'text-risk-medium' : 'text-risk-low'
                      }`}>{analysisResult.severity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Disruption Prob</span>
                      <span className="font-bold text-slate-300">{Math.round(analysisResult.disruption_probability * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Summary</span>
                    <p className="text-slate-400 leading-relaxed mt-0.5">{analysisResult.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 bg-slate-950 border border-brand-border/40 p-3 rounded-lg">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <span>Agent Confidence: {Math.round(analysisResult.confidence * 100)}% ({analysisResult.verification_status})</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                <HelpCircle size={32} className="stroke-[1.5] mb-2" />
                <p className="text-xs">No analysis computed yet. Paste a news snippet and click analyze.</p>
              </div>
            )}
          </div>

          {analysisResult && (
            <button
              onClick={handleInject}
              disabled={isInjecting}
              className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-brand-darkest font-bold rounded-lg text-sm tracking-wider uppercase transition-all shadow-glow-green/20"
            >
              {isInjecting ? 'Injecting...' : 'Inject Event into Supply Chain'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Message Alerts Banner */}
      {message && (
        <div className="bg-slate-900 border border-brand-border rounded-xl px-6 py-3.5 flex items-center gap-3">
          <AlertCircle className="text-emerald-500" size={16} />
          <p className="text-xs font-semibold text-emerald-400">{message}</p>
        </div>
      )}

      {/* 3. Ingested Events Feed */}
      <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers size={16} className="text-sky-400" />
            <span>Active Geopolitical Incident Logs</span>
          </h3>
          {events.some(e => e.source === 'Simulated') && (
            <button
              onClick={handleClearSimulated}
              className="text-xs text-risk-critical hover:text-red-400 font-bold flex items-center gap-1 bg-risk-critical/10 border border-risk-critical/30 rounded px-3 py-1.5 transition-colors"
            >
              <Trash2 size={12} />
              <span>Clear Simulated Events</span>
            </button>
          )}
        </div>

        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3">Event Title</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Affected Corridor</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Disruption Prob</th>
                  <th className="pb-3">Verification</th>
                  <th className="pb-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {events.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="py-4 font-semibold text-slate-200">
                      <div>
                        {e.title}
                        <p className="text-[10px] text-slate-500 font-normal leading-normal mt-0.5">{e.summary}</p>
                      </div>
                    </td>
                    <td className="py-4 text-slate-350">{e.location}</td>
                    <td className="py-4 font-bold text-sky-400">{e.affected_corridor}</td>
                    <td className="py-4">
                      <span className={`font-bold ${
                        e.severity === 'CRITICAL' ? 'text-risk-critical' :
                        e.severity === 'HIGH' ? 'text-risk-high' :
                        e.severity === 'MEDIUM' ? 'text-risk-medium' : 'text-risk-low'
                      }`}>
                        {e.severity}
                      </span>
                    </td>
                    <td className="py-4 text-slate-350">{Math.round(e.disruption_probability * 100)}%</td>
                    <td className="py-4 text-slate-400 font-medium">{e.verification_status}</td>
                    <td className="py-4 text-slate-500 font-semibold">{e.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <AlertTriangle className="mx-auto mb-2 text-slate-600" size={28} />
            <p className="text-xs">No active event logs. Use the Geopolitical Event Miner above to inject reports.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskIntelligence;
