import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../utils/api';
import type { Supplier, ShippingRoute } from '../types';
import { Layers, HelpCircle, RefreshCw, Activity, AlertTriangle, Shield } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import {
  MOCK_GIS_VESSELS,
  MOCK_GIS_PIPELINES,
  MOCK_GIS_CHOKEPOINTS,
  MOCK_GIS_ROUTES,
  STATIC_PORTS,
  STATIC_REFINERIES
} from '../constants/gisData';

// Fix default Leaflet icon paths in react builds
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const supplierIcon = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -30]
});

const portIcon = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [22, 35],
  iconAnchor: [11, 35],
  popupAnchor: [0, -33]
});

const refineryIcon = L.divIcon({
  html: `<div style="
    background-color: #f97316;
    border: 2px solid #ffffff;
    border-radius: 4px;
    width: 14px;
    height: 14px;
    box-shadow: 0 0 6px #f97316;
  "></div>`,
  className: 'bg-transparent',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Custom circle marker styling for chokepoints using divIcon
const createChokepointIcon = (color: string) => {
  return L.divIcon({
    html: `<div class="w-4 h-4 rounded-full border-2 border-slate-900 animate-pulse" style="background-color: ${color}"></div>`,
    className: 'bg-transparent',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const MapView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [routes, setRoutes] = useState<ShippingRoute[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [vessels, setVessels] = useState<any[]>(MOCK_GIS_VESSELS);

  // Layer toggles state
  const [layers, setLayers] = useState({
    routes: true,
    tankers: true,
    pipelines: true,
    ports: true,
    refineries: true,
    riskZones: true,
    weather: true,
    chokepoints: true
  });

  // Animated flow lines logic
  useEffect(() => {
    console.log("Vessel position animation loop active");
    const destinationCoords: Record<string, [number, number]> = {
      "Jamnagar Port": [22.4707, 70.0577],
      "Paradip Port": [20.2606, 86.6664],
      "Kochi Port": [9.9312, 76.2673],
      "Vizag Port": [17.69, 83.22],
      "Mumbai JNPT": [18.95, 72.95],
      "Chennai Port": [13.08, 80.30]
    };

    const interval = setInterval(() => {
      setVessels(prev => {
        const updated = prev.map(v => {
          const dest = destinationCoords[v.destination];
          if (!dest) return v;
          const [lat, lng] = v.position;
          const [destLat, destLng] = dest;
          const dLat = destLat - lat;
          const dLng = destLng - lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          if (dist < 0.5) return v; // Stop animation when within 0.5 degrees
          const ratio = 0.05 / dist;
          const newLat = lat + dLat * Math.min(1, ratio);
          const newLng = lng + dLng * Math.min(1, ratio);
          return {
            ...v,
            position: [newLat, newLng]
          };
        });
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadMapData = async () => {
      setLoading(true);
      try {
        const sup = await api.getSuppliers();
        const r = await api.getRoutes();
        setSuppliers(sup);
        setRoutes(r);
      } catch (err) {
        console.error("Error loading map assets:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMapData();
  }, []);

  // Static list of Strategic Petroleum Reserves (SPRs)
  const sprNodes = [
    { name: "Visakhapatnam SPR", lat: 17.7231, lng: 83.3148, cap: "9.7 Mb", current: "80%" },
    { name: "Mangalore SPR", lat: 12.9141, lng: 74.8560, cap: "11.0 Mb", current: "75%" },
    { name: "Padur SPR", lat: 13.2201, lng: 74.7423, cap: "18.8 Mb", current: "80%" }
  ];

  // Weather alerts data
  const weatherAlerts = [
    { name: "Tropical Cyclone Warning (Arabian Sea)", lat: 14.5, lng: 64.2, severity: "High Wind Shear / Wave Height > 6m", icon: "🌀" },
    { name: "Monsoon Depression Alert (Bay of Bengal)", lat: 8.5, lng: 86.0, severity: "Squally Winds & Reduced Visibility", icon: "⛈️" }
  ];

  // Risk Zones circles
  const riskZones = [
    { name: "Hormuz High Threat Corridor", lat: 26.5, lng: 56.4, radius: 250000, color: "#ef4444" },
    { name: "Red Sea Active Attack Alert Zone", lat: 15.0, lng: 41.5, radius: 450000, color: "#ef4444" }
  ];

  // Find risk color for map indicators
  const getCorridorRiskColor = (corridor: string) => {
    const matchingRoute = routes.find(r => r.chokepoints_crossed.includes(corridor));
    const score = matchingRoute ? matchingRoute.risk_score : 15;
    return score > 60 ? '#ef4444' : score > 40 ? '#f97316' : score > 20 ? '#f59e0b' : '#10b981';
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6 animate-fadeIn">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow-dash {
          to {
            stroke-dashoffset: -32;
          }
        }
        .animated-flow-line {
          stroke-dasharray: 8, 8;
          animation: flow-dash 1.2s linear infinite;
        }
        @keyframes pulse-vessel {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .vessel-pulse-Hormuz {
          animation: pulse-vessel 1.5s infinite;
          border-radius: 50%;
        }
        .vessel-pulse-RedSea {
          animation: pulse-vessel 1.5s infinite;
          border-radius: 50%;
        }
      `}} />

      {/* 1. Left Map Panel */}
      <div className="flex-1 bg-slate-900 border border-brand-border rounded-xl overflow-hidden relative shadow-inner">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 gap-2">
            <RefreshCw className="animate-spin text-sky-400" size={24} />
            <span>Loading Digital Twin Map...</span>
          </div>
        ) : (
          <MapContainer
            center={[20.0, 68.0]}
            zoom={4}
            minZoom={3}
            maxZoom={8}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* A. Shipping Routes */}
            {layers.routes && routes.map((r, idx) => {
              let waypointsList: [number, number][] = [];
              try {
                waypointsList = JSON.parse(r.waypoints);
              } catch {
                return null;
              }

              let color = '#10b981'; // safe
              let riskLabel = 'Safe';
              if (r.risk_score > 60) { color = '#ef4444'; riskLabel = 'High Risk'; }
              else if (r.risk_score > 40) { color = '#f97316'; riskLabel = 'Moderate'; }
              else if (r.risk_score > 20) { color = '#f59e0b'; riskLabel = 'Moderate'; }

              if (r.name.includes("Bypass") || r.name.includes("Cape")) {
                color = '#06b6d4';
              }

              return (
                <React.Fragment key={idx}>
                  {/* Outer animated flow line */}
                  <Polyline
                    positions={waypointsList}
                    pathOptions={{ color, weight: 3.5, lineCap: 'round', className: 'animated-flow-line' }}
                  />
                  {/* Core static line */}
                  <Polyline
                    positions={waypointsList}
                    pathOptions={{ color, weight: 1.5, opacity: 0.8 }}
                  >
                    <Popup>
                      <div className="text-xs p-1 space-y-1">
                        <h4 className="font-extrabold text-slate-200">{r.name}</h4>
                        <p className="text-slate-450">Distance: <span className="text-slate-200 font-bold">{r.distance_nm.toLocaleString()} nm</span></p>
                        <p className="text-slate-450">Transit: <span className="text-slate-200 font-bold">{r.base_transit_days} days</span></p>
                        <p className="text-slate-450">Risk Level: <span className="font-extrabold" style={{ color }}>{riskLabel} ({r.risk_score}/100)</span></p>
                      </div>
                    </Popup>
                  </Polyline>
                </React.Fragment>
              );
            })}

            {/* B. Weather Layer */}
            {layers.weather && weatherAlerts.map((w, idx) => (
              <Marker
                key={`weather_${idx}`}
                position={[w.lat, w.lng]}
                icon={L.divIcon({
                  html: `<div style="font-size: 26px; cursor: pointer; text-shadow: 0 0 10px rgba(255,255,255,0.4);" class="animate-bounce">${w.icon}</div>`,
                  className: 'bg-transparent',
                  iconSize: [30, 30],
                  iconAnchor: [15, 15]
                })}
              >
                <Popup>
                  <div className="text-xs p-1.5 space-y-1">
                    <h4 className="font-extrabold text-amber-500 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      <span>{w.name}</span>
                    </h4>
                    <p className="text-slate-200 font-medium">{w.severity}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* C. Risk Zones Layer */}
            {layers.riskZones && riskZones.map((z, idx) => (
              <Circle
                key={`zone_${idx}`}
                center={[z.lat, z.lng]}
                radius={z.radius}
                pathOptions={{
                  color: z.color,
                  fillColor: z.color,
                  fillOpacity: 0.1,
                  weight: 1.5,
                  dashArray: "4, 6"
                }}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">Geopolitical Alert Zone</span>
                    <span className="font-extrabold text-slate-200">{z.name}</span>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* D. Suppliers Layer */}
            {suppliers.map((s, idx) => (
              <Marker
                key={`supplier_${idx}`}
                position={[s.latitude, s.longitude]}
                icon={supplierIcon}
                eventHandlers={{
                  click: () => setSelectedNode({ type: 'supplier', data: s })
                }}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <h4 className="font-extrabold text-slate-200">{s.name}</h4>
                    <p className="text-slate-400 mt-1">Grade: <span className="text-slate-200 font-semibold">{s.crude_grade}</span></p>
                    <p className="text-slate-400">Risk Score: <span className="font-bold text-sky-400">{s.geopolitical_risk}/100</span></p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* E. Ports Layer */}
            {layers.ports && STATIC_PORTS.map((p, idx) => (
              <Marker
                key={`port_${idx}`}
                position={[p.lat, p.lng]}
                icon={portIcon}
                eventHandlers={{
                  click: () => setSelectedNode({ type: 'port', data: p })
                }}
              >
                <Popup>
                  <div className="text-xs p-1.5 space-y-1">
                    <h4 className="font-extrabold text-slate-200">{p.name}</h4>
                    <p className="text-slate-450 mt-1">Capacity: <span className="text-slate-200 font-bold">{p.capacity}</span></p>
                    <p className="text-slate-450">Connected Refineries: <span className="text-slate-300 font-medium">{p.refineries}</span></p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* F. Refineries Layer */}
            {layers.refineries && STATIC_REFINERIES.map((ref, idx) => (
              <Marker
                key={`refinery_${idx}`}
                position={[ref.lat, ref.lng]}
                icon={refineryIcon}
                eventHandlers={{
                  click: () => setSelectedNode({ type: 'refinery', data: ref })
                }}
              >
                <Popup>
                  <div className="text-xs p-1.5 space-y-1">
                    <h4 className="font-extrabold text-orange-400">{ref.name}</h4>
                    <p className="text-slate-450">Capacity: <span className="text-slate-200 font-bold">{ref.capacity}</span></p>
                    <p className="text-slate-450">Technology: <span className="text-slate-350">{ref.tech}</span></p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* G. Strategic Petroleum Reserves Layer */}
            {sprNodes.map((s, idx) => (
              <Marker
                key={`spr_${idx}`}
                position={[s.lat, s.lng]}
                icon={L.divIcon({
                  html: `<div class="bg-indigo-500 w-4.5 h-4.5 rounded border border-slate-900 flex items-center justify-center text-[8px] font-black text-brand-darkest shadow-sm">SPR</div>`,
                  className: 'bg-transparent',
                  iconSize: [18, 18],
                  iconAnchor: [9, 9]
                })}
                eventHandlers={{
                  click: () => setSelectedNode({ type: 'spr', data: s })
                }}
              />
            ))}

            {/* H. Chokepoints Layer */}
            {layers.chokepoints && MOCK_GIS_CHOKEPOINTS.map((cp, idx) => (
              <Marker
                key={`choke_${idx}`}
                position={cp.position}
                icon={createChokepointIcon(getCorridorRiskColor(cp.id === 'choke_hormuz' ? 'Hormuz' : cp.id === 'choke_mandeb' ? 'Red Sea' : 'Malacca'))}
                eventHandlers={{
                  click: () => setSelectedNode({ type: 'chokepoint', data: cp })
                }}
              >
                <Popup>
                  <div className="text-xs p-2 space-y-1.5 text-slate-100 min-w-[220px]">
                    <h4 className="font-extrabold text-amber-400 text-sm">{cp.name}</h4>
                    <div className="space-y-1 pt-1.5 border-t border-slate-700/50">
                      <p><span className="text-slate-400 font-semibold">Congestion Index:</span> <span className="font-black text-rose-400">{cp.congestion}</span></p>
                      <p><span className="text-slate-400 font-semibold">Risk Score:</span> <span className="font-black text-red-500">{cp.risk_score}/100</span></p>
                      <p><span className="text-slate-400 font-semibold">Transit Delay:</span> <span className="font-black text-slate-200">{cp.transit_delay_days} days</span></p>
                      <div className="pt-1.5">
                        <span className="text-slate-400 block font-bold mb-0.5">Historical Incidents:</span>
                        <ul className="list-disc pl-3.5 space-y-0.5 text-[10px] text-slate-350">
                          {cp.historical_incidents.map((inc, iIdx) => (
                            <li key={iIdx}>{inc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* I. Tankers Layer */}
            {layers.tankers && vessels.map((v) => {
              let borderColor = '#10b981'; // green for Cape
              if (v.corridor === 'Hormuz') borderColor = '#ef4444'; // red
              else if (v.corridor === 'Red Sea') borderColor = '#f59e0b'; // amber

              const vesselIcon = L.divIcon({
                html: `<div class="${v.corridor === 'Hormuz' ? 'vessel-pulse-Hormuz' : v.corridor === 'Red Sea' ? 'vessel-pulse-RedSea' : ''}" style="
                  transform: rotate(${v.heading}deg);
                  background-color: #0f172a;
                  border: 2.5px solid ${borderColor};
                  border-radius: 50%;
                  width: 26px;
                  height: 26px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 13px;
                  box-shadow: 0 0 8px ${borderColor};
                ">🛢️</div>`,
                className: 'bg-transparent',
                iconSize: [26, 26],
                iconAnchor: [13, 13]
              });

              return (
                <Marker
                  key={v.id}
                  position={v.position as [number, number]}
                  icon={vesselIcon}
                  eventHandlers={{
                    click: () => setSelectedNode({ type: 'vessel', data: v })
                  }}
                >
                  <Popup>
                    <div className="text-xs p-3 space-y-2 min-w-[240px] text-slate-100 bg-slate-900 border border-brand-border rounded-lg">
                      <div className="flex justify-between items-center border-b border-slate-700/60 pb-1.5">
                        <h4 className="font-extrabold text-sky-400 text-sm">{v.name}</h4>
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-black uppercase">{v.type}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                        <div><span className="text-slate-450 font-semibold block">Cargo Grade</span><span className="font-bold text-slate-200">{v.cargo}</span></div>
                        <div><span className="text-slate-450 font-semibold block">Volume</span><span className="font-bold text-emerald-400">{(v.volume_bbl || 1500000).toLocaleString()} bbl</span></div>
                        <div><span className="text-slate-450 font-semibold block">Speed</span><span className="font-bold text-slate-200">{v.speed_knots} kn</span></div>
                        <div><span className="text-slate-450 font-semibold block">ETA</span><span className="font-bold text-slate-200">{v.eta_days} days</span></div>
                        <div className="col-span-2"><span className="text-slate-450 font-semibold block">Origin Port</span><span className="font-medium text-slate-300">{v.origin}</span></div>
                        <div className="col-span-2"><span className="text-slate-450 font-semibold block">Destination Port</span><span className="font-medium text-slate-300">{v.destination}</span></div>
                        <div><span className="text-slate-450 font-semibold block">Supplier</span><span className="font-bold text-slate-200">{v.supplier || 'N/A'}</span></div>
                        <div><span className="text-slate-450 font-semibold block">Risk Level</span><span className="font-extrabold uppercase" style={{ color: v.risk_level === 'HIGH' || v.risk_level === 'CRITICAL' ? '#ef4444' : '#10b981' }}>{v.risk_level}</span></div>
                        <div className="col-span-2 border-t border-slate-700/40 pt-1.5 flex justify-between items-center">
                          <span className="text-slate-450 font-bold uppercase text-[8px]">Status</span>
                          <span className="text-sky-400 font-extrabold">{v.status || 'At Sea'}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* J. Pipelines Layer */}
            {layers.pipelines && MOCK_GIS_PIPELINES.map((pipe) => (
              <Polyline
                key={pipe.id}
                positions={pipe.coords as [number, number][]}
                pathOptions={{
                  color: pipe.risk_status === 'ALERT' ? '#ef4444' : pipe.risk_status === 'EVALUATING' ? '#f59e0b' : '#a78bfa',
                  weight: 2.5,
                  dashArray: '8, 6'
                }}
                eventHandlers={{
                  click: () => setSelectedNode({ type: 'pipeline', data: pipe })
                }}
              >
                <Popup>
                  <div className="text-xs p-2.5 space-y-1.5 text-slate-100 min-w-[200px]">
                    <h4 className="font-bold text-purple-400">{pipe.name}</h4>
                    <div className="space-y-1 pt-1.5 border-t border-slate-700/50 text-[10px]">
                      <p><span className="text-slate-450">Operator:</span> <span className="font-bold text-slate-200">{pipe.operator}</span></p>
                      <p><span className="text-slate-450">Length:</span> <span className="font-bold text-slate-200">{pipe.length_km} km</span></p>
                      <p><span className="text-slate-450">Capacity:</span> <span className="font-bold text-slate-200">{pipe.capacity_mbpd} MBPD</span></p>
                      <p><span className="text-slate-450">Utilization:</span> <span className="font-bold text-slate-200">{pipe.utilization_pct}%</span></p>
                      <p><span className="text-slate-450">Refinery Dest:</span> <span className="font-bold text-slate-200">{pipe.destination_refinery}</span></p>
                      <p className="flex justify-between items-center border-t border-slate-700/30 pt-1.5">
                        <span className="text-slate-450 font-bold uppercase text-[8px]">Risk Status</span>
                        <span className="font-black text-[9px]" style={{ color: pipe.risk_status === 'ALERT' ? '#ef4444' : pipe.risk_status === 'EVALUATING' ? '#f59e0b' : '#10b981' }}>{pipe.risk_status}</span>
                      </p>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            ))}
          </MapContainer>
        )}

        {/* GIS Layers Control Overlays */}
        <div className="absolute top-4 right-4 bg-slate-950/90 border border-brand-border rounded-xl p-4 z-[1000] text-[10px] space-y-3 pointer-events-auto shadow-2xl min-w-[170px] backdrop-blur-md">
          <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border/60 pb-2">
            <Layers size={13} className="text-sky-400 animate-pulse" />
            <span>GIS Control Panel</span>
          </h4>
          <div className="grid grid-cols-1 gap-2 font-semibold text-slate-400">
            {Object.entries(layers).map(([layerKey, val]) => (
              <label key={layerKey} className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition-colors capitalize">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={() => setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey as keyof typeof prev] }))}
                  className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                />
                <span>{layerKey.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-brand-border rounded-lg p-3 z-[1000] text-[10px] space-y-2 pointer-events-auto">
          <p className="font-bold text-slate-450 uppercase tracking-wider">Digital Twin Legend</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-risk-low" />
              <span className="text-slate-350">Low Corridor Risk / Safe Channel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-risk-medium" />
              <span className="text-slate-350">Medium Corridor Risk / Moderate Channel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-risk-high animate-pulse" />
              <span className="text-slate-350">High Logistics Threat Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-risk-critical animate-ping" />
              <span className="text-slate-350">Corridor Blocked / Disrupted / Closed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-4.5 border border-dashed border-sky-400 bg-sky-500/10" />
              <span className="text-sky-400 font-medium">Bypass Pipeline / Alternative Route</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Right Info Panel */}
      <div className="w-80 bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <Shield size={16} className="text-sky-400 animate-pulse" />
            <span>Digital Twin Inspector</span>
          </h3>

          {selectedNode ? (
            <div className="space-y-6">
              {/* Supplier Inspection Details */}
              {selectedNode.type === 'supplier' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-brand-border/60 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Crude Supplier Node</span>
                    <span className="text-base font-extrabold text-slate-200">{selectedNode.data.name}</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Crude Grade</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.crude_grade}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Base Price</span>
                      <span className="text-slate-200 font-semibold">${selectedNode.data.base_price.toFixed(2)}/bbl</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Transit Lead Time</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.transit_time_days} days</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">National Capacity</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.capacity_kbd.toLocaleString()} kbd</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Refinery Compat</span>
                      <span className="text-slate-200 font-bold">{Math.round(selectedNode.data.refinery_compatibility * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Supplier Geopol Risk</span>
                      <span className="text-sky-400 font-black">{selectedNode.data.geopolitical_risk}/100</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Port Inspection Details */}
              {selectedNode.type === 'port' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-brand-border/60 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Indian Offloading Port</span>
                    <span className="text-base font-extrabold text-slate-200">{selectedNode.data.name}</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Daily Import Capacity</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.capacity || selectedNode.data.cap}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 block mb-1">Downstream Refineries Connected</span>
                      <p className="text-slate-350 font-medium leading-relaxed bg-slate-950 p-2 border border-brand-border rounded">
                        {selectedNode.data.refineries}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Refinery Inspection Details */}
              {selectedNode.type === 'refinery' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-brand-border/60 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Indian Oil Refinery</span>
                    <span className="text-base font-extrabold text-slate-200">{selectedNode.data.name}</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Operational Capacity</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.capacity}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 block mb-1">Metallurgy Tech Profile</span>
                      <p className="text-slate-355 font-medium leading-relaxed bg-slate-950 p-2 border border-brand-border rounded">
                        {selectedNode.data.tech}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SPR Inspection Details */}
              {selectedNode.type === 'spr' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-brand-border/60 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Strategic Petroleum Reserve (SPR)</span>
                    <span className="text-base font-extrabold text-slate-200">{selectedNode.data.name}</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Storage Capacity</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.cap}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Current Stock Inventory</span>
                      <span className="text-emerald-400 font-bold">{selectedNode.data.current}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chokepoint Inspection Details */}
              {selectedNode.type === 'chokepoint' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-brand-border/60 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Global Maritime Chokepoint</span>
                    <span className="text-base font-extrabold text-slate-200">{selectedNode.data.name}</span>
                  </div>
                  <div className="text-xs space-y-3">
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Congestion Status</span>
                      <span className="text-slate-200 font-bold">{selectedNode.data.congestion}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Transit Delay Days</span>
                      <span className="text-slate-200 font-bold">{selectedNode.data.transit_delay_days} days</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-3 border border-brand-border rounded-lg">
                      <span className="text-slate-450 font-bold uppercase text-[10px]">Active Risk Index</span>
                      <span className="font-extrabold text-sm text-rose-500">
                        {selectedNode.data.risk_score}/100
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-450 block font-bold mb-1.5">Incident Reports</span>
                      <div className="space-y-1.5">
                        {selectedNode.data.historical_incidents.map((inc: string, iIdx: number) => (
                          <div key={iIdx} className="bg-slate-950 p-2 border border-brand-border rounded text-[10px] text-slate-400">
                            {inc}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vessel Inspection Details */}
              {selectedNode.type === 'vessel' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-brand-border/60 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">AIS Vessel Node</span>
                    <span className="text-base font-extrabold text-slate-200">{selectedNode.data.name}</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Cargo type</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.cargo} ({(selectedNode.data.volume_bbl || 1500000).toLocaleString()} bbl)</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Vessel Type</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.type}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Destination</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.destination}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Transit Speed</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.speed_knots} knots</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">ETA Remaining</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.eta_days} days</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Operational Status</span>
                      <span className="text-sky-400 font-bold">{selectedNode.data.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Corridor Route</span>
                      <span className="text-sky-400 font-black">{selectedNode.data.corridor}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pipeline Inspection Details */}
              {selectedNode.type === 'pipeline' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-brand-border/60 p-4 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Inland Pipeline Corridor</span>
                    <span className="text-base font-extrabold text-slate-200">{selectedNode.data.name}</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Total Length</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.length_km} km</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Daily Capacity</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.capacity_mbpd} MBPD</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border pb-1.5">
                      <span className="text-slate-450">Current Utilization</span>
                      <span className="text-slate-200 font-semibold">{selectedNode.data.utilization_pct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Destination</span>
                      <span className="text-sky-400 font-black">{selectedNode.data.destination_refinery}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12">
              <HelpCircle size={28} className="stroke-[1.5] mb-2" />
              <p className="text-xs">Click any node, port, pipeline, vessel, or chokepoint on the map twin to inspect details.</p>
            </div>
          )}
        </div>

        <div className="bg-slate-950 border border-brand-border/60 rounded-lg p-4 text-[10px] text-slate-500 font-medium leading-relaxed mt-6">
          <p className="font-bold text-slate-450 uppercase tracking-wider mb-1">Geospatial Sync</p>
          Coordinates mapping matches maritime AIS satellite transponder tracking. Supplier coordinates represent loading berths; ports represent offloading hubs.
        </div>
      </div>
    </div>
  );
};

export default MapView;
