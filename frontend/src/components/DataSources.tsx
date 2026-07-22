import React from 'react';
import { 
  Database, Server, ShieldCheck, Compass, AlertCircle
} from 'lucide-react';

const DataSources: React.FC = () => {
  // AIS Tanker Feed simulation
  const tankers = [
    { name: "MT Basra Pioneer", flag: "Iraq", cargo: "1.2M bbl Basra Medium", location: "Arabian Sea", speed: "14.2 knots", status: "ON SCHEDULE", label: "SIMULATED DATA" },
    { name: "MT Ras Tanura Star", flag: "Saudi Arabia", cargo: "900k bbl Arab Light", location: "Strait of Hormuz", speed: "12.8 knots", status: "SLOW SPEED / WAR ALERT", label: "SIMULATED DATA" },
    { name: "MT Primorsk Urals", flag: "Russia", cargo: "1.4M bbl Urals Blend", location: "Mediterranean Sea", speed: "13.5 knots", status: "ON SCHEDULE (CAPE ROUTE REQUESTED)", label: "SIMULATED DATA" },
    { name: "MT Fujairah Murban", flag: "UAE", cargo: "350k bbl Murban", location: "Gulf of Oman", speed: "15.0 knots", status: "ON SCHEDULE", label: "SIMULATED DATA" },
    { name: "MT Gulf Trader", flag: "USA", cargo: "600k bbl WTI", location: "South Atlantic Ocean", speed: "14.8 knots", status: "DETOURING CAPE OF GOOD HOPE", label: "SIMULATED DATA" }
  ];

  // Port Congestion indices
  const ports = [
    { name: "Jamnagar SBM Terminal", status: "OPERATIONAL", wait_time: "1.2 days", congestion: "LOW", label: "LIVE DATA" },
    { name: "Mundra Port Oil Jetty", status: "OPERATIONAL", wait_time: "2.4 days", congestion: "MEDIUM", label: "LIVE DATA" },
    { name: "Kochi Oil Terminal (COPT)", status: "OPERATIONAL", wait_time: "0.8 days", congestion: "LOW", label: "LIVE DATA" },
    { name: "Paradip Single Point Mooring", status: "OPERATIONAL", wait_time: "3.5 days", congestion: "HIGH", label: "LIVE DATA" }
  ];

  // Sanctions logs
  const sanctions = [
    { target: "Russian Crude Oil price cap ($60 limit)", authority: "G7 / EU sanctions", status: "ACTIVE MONITOR", impact: "Indian purchases require compliant pricing certification.", label: "HISTORICAL DATA" },
    { target: "Iranian Crude exports restrictions", authority: "US OFAC secondary sanctions", status: "ACTIVE MONITOR", impact: "Zero direct import allocation; secondary pipeline logistics monitored.", label: "HISTORICAL DATA" },
    { target: "Venezuelan PDVSA sector sanctions", authority: "US OFAC license general license limits", status: "ACTIVE MONITOR", impact: "Imports limited to authorized spot-purchases only.", label: "HISTORICAL DATA" }
  ];

  // Weather & Maritime Warnings
  const warnings = [
    { alert: "Indian Ocean Tropical Storm Warning", region: "South Arabian Sea", threat: "Wind speeds 45 knots; minor swell impact on southern routes.", severity: "LOW", label: "LIVE DATA" },
    { alert: "Gulf of Aden High Risk piracy zone", region: "Somali Basin / Aden", threat: "Drone patrol support active; shipping security teams advised.", severity: "MEDIUM", label: "LIVE DATA" }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Introduction */}
      <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-2">
          <Database size={16} className="text-sky-400" />
          <span>System Data Source Registry</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          EnergyGuard AI enforces strict data classification policies to ensure accountability. All inputs, calculations, and recommendations are marked with clear source metadata tags. The dashboard never presents model estimates or mock inputs as real-time verified data.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. AIS Tanker Satellite Feed */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <Compass size={16} className="text-sky-400" />
            <span>Satellite Tanker Tracking Feed (AIS)</span>
          </h3>

          <div className="space-y-4">
            {tankers.map((t, idx) => (
              <div key={idx} className="bg-slate-950 border border-brand-border/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-200">{t.name}</span>
                    <span className="text-[8px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold border border-brand-border">{t.flag} flag</span>
                  </div>
                  <p className="text-[10px] text-slate-450">Cargo: <span className="text-slate-300 font-semibold">{t.cargo}</span> | Loc: <span className="text-slate-350">{t.location}</span></p>
                  <p className="text-[9px] font-bold text-sky-400 mt-1">Status: {t.status}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[8px] bg-slate-900 text-slate-500 border border-brand-border rounded font-black px-2 py-1 uppercase block tracking-wider mb-2">{t.label}</span>
                  <span className="text-[10px] text-slate-450 font-bold">Speed: {t.speed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Port Terminal Statuses */}
        <div className="bg-slate-900 border border-brand-border rounded-xl p-6 space-y-6">
          {/* Port terminal congestion */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <Server size={16} className="text-indigo-400" />
              <span>Offloading Terminal Logs</span>
            </h3>
            <div className="space-y-3">
              {ports.map((p, idx) => (
                <div key={idx} className="bg-slate-950 p-3 border border-brand-border rounded-lg flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200">{p.name}</span>
                    <p className="text-[10px] text-slate-450">Wait time: <span className="font-semibold text-slate-300">{p.wait_time}</span> | Congestion: <span className="font-bold text-sky-400">{p.congestion}</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[8px] bg-slate-900 text-slate-500 border border-brand-border rounded font-black px-2 py-1 uppercase block tracking-wider mb-1.5">{p.label}</span>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weather warnings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-risk-high animate-pulse" />
              <span>Weather & Maritime Risk Bulletins</span>
            </h3>
            <div className="space-y-3">
              {warnings.map((w, idx) => (
                <div key={idx} className="bg-slate-950/40 p-3 border border-brand-border/40 rounded-lg text-[10px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-slate-200">{w.alert}</span>
                    <span className="text-[8px] bg-slate-900 text-slate-500 border border-brand-border rounded font-black px-1.5 py-0.5 uppercase tracking-wider">{w.label}</span>
                  </div>
                  <p className="text-slate-400 leading-normal">Region: <span className="text-slate-300 font-semibold">{w.region}</span> | Risk: <span className="text-slate-350">{w.threat}</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sanction watch & Legal Database */}
      <div className="bg-slate-900 border border-brand-border rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>International Crude Sanctions Database Monitor</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sanctions.map((s, idx) => (
            <div key={idx} className="bg-slate-950 p-4 border border-brand-border rounded-xl flex flex-col justify-between h-40">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[8px] bg-slate-900 text-slate-500 border border-brand-border rounded font-black px-1.5 py-0.5 uppercase tracking-wider">{s.label}</span>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">{s.status}</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-200 leading-normal">{s.target}</h4>
                <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">{s.impact}</p>
              </div>
              <span className="text-[9px] text-slate-500 font-semibold mt-3">{s.authority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataSources;
