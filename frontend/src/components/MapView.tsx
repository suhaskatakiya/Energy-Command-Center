import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../utils/api';
import type { Supplier, ShippingRoute } from '../types';
import { Layers, HelpCircle, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

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

// Custom circle marker styling for chokepoints using simple divIcon
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

  // Static list of Indian Port Nodes
  const portNodes = [
    { name: "Jamnagar Port", lat: 22.4707, lng: 70.0577, cap: "1,500 kbd", refineries: "Jamnagar (RIL), Vadinar (Nayara)" },
    { name: "Kochi Port", lat: 9.9312, lng: 76.2673, cap: "310 kbd", refineries: "Kochi Refinery (BPCL)" },
    { name: "Paradip Port", lat: 20.2606, lng: 86.6664, cap: "300 kbd", refineries: "Paradip Refinery (IOCL)" }
  ];

  // Static list of Strategic Petroleum Reserves (SPRs)
  const sprNodes = [
    { name: "Visakhapatnam SPR", lat: 17.7231, lng: 83.3148, cap: "9.7 Mb", current: "80%" },
    { name: "Mangalore SPR", lat: 12.9141, lng: 74.8560, cap: "11.0 Mb", current: "75%" },
    { name: "Padur SPR", lat: 13.2201, lng: 74.7423, cap: "18.8 Mb", current: "80%" }
  ];

  // Static list of Maritime Chokepoints
  const chokepointNodes = [
    { name: "Strait of Hormuz", lat: 26.3, lng: 56.4, corridor: "Hormuz", desc: "Handles ~20% of global oil flows. Exposure: Iraq and Saudi Arabia imports." },
    { name: "Red Sea (Bab-el-Mandeb)", lat: 12.8, lng: 43.2, corridor: "Red Sea", desc: "Connects Suez Canal to Indian Ocean. Exposure: Russian Urals imports." },
    { name: "Strait of Malacca", lat: 1.45, lng: 101.34, corridor: "Malacca", desc: "Primary lane to East Asia. Low direct exposure for Indian imports." }
  ];

  // Render polyline paths
  const renderRoutes = () => {
    return routes.map((r, idx) => {
      let waypointsList: [number, number][] = [];
      try {
        waypointsList = JSON.parse(r.waypoints);
      } catch {
        return null;
      }
      
      // Determine color based on route risk score
      let color = '#10b981'; // Green (Low risk)
      if (r.risk_score > 60) {
        color = '#ef4444'; // Red (Disrupted / Closed)
      } else if (r.risk_score > 40) {
        color = '#f97316'; // Orange (High risk)
      } else if (r.risk_score > 20) {
        color = '#f59e0b'; // Amber (Medium risk)
      }
      
      if (r.name.includes("Bypass") || r.name.includes("Cape")) {
        color = '#06b6d4'; // Cyan (Alternative routing bypasses)
      }

      return (
        <Polyline 
          key={idx} 
          positions={waypointsList} 
          pathOptions={{ color, weight: r.name.includes("Bypass") ? 3.5 : 3.0, dashArray: r.name.includes("Bypass") ? "6, 6" : undefined }}
        >
          <Popup>
            <div className="text-xs p-1 space-y-1">
              <h4 className="font-extrabold text-slate-200">{r.name}</h4>
              <p className="text-slate-400">Distance: <span className="text-slate-200 font-semibold">{r.distance_nm.toLocaleString()} nm</span></p>
              <p className="text-slate-400">Transit: <span className="text-slate-200 font-semibold">{r.base_transit_days} days</span></p>
              <p className="text-slate-400">Risk Score: <span className="font-bold" style={{ color }}>{r.risk_score}/100</span></p>
            </div>
          </Popup>
        </Polyline>
      );
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="animate-spin text-sky-400" size={24} />
        <span>Loading Digital Twin Map...</span>
      </div>
    );
  }

  // Find risk color for map indicators
  const getCorridorRiskColor = (corridor: string) => {
    // Check if we have active route matching
    const matchingRoute = routes.find(r => r.chokepoints_crossed.includes(corridor));
    const score = matchingRoute ? matchingRoute.risk_score : 15;
    return score > 60 ? '#ef4444' : score > 40 ? '#f97316' : score > 20 ? '#f59e0b' : '#10b981';
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6 animate-fadeIn">
      {/* 1. Left Map Panel */}
      <div className="flex-1 bg-slate-900 border border-brand-border rounded-xl overflow-hidden relative shadow-inner">
        {/* Leaflet Map container */}
        <MapContainer 
          center={[20.0, 68.0]} // Center on Arabian Sea/India
          zoom={4} 
          minZoom={3}
          maxZoom={8}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {/* Draw routes */}
          {renderRoutes()}

          {/* Draw suppliers */}
          {suppliers.map((s, idx) => (
            <Marker 
              key={idx} 
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

          {/* Draw ports */}
          {portNodes.map((p, idx) => (
            <Marker 
              key={idx} 
              position={[p.lat, p.lng]} 
              icon={portIcon}
              eventHandlers={{
                click: () => setSelectedNode({ type: 'port', data: p })
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <h4 className="font-extrabold text-slate-200">{p.name}</h4>
                  <p className="text-slate-450 mt-1">Refineries: <span className="text-slate-250 font-semibold">{p.refineries}</span></p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Draw SPR locations */}
          {sprNodes.map((s, idx) => (
            <Marker
              key={idx}
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

          {/* Draw chokepoint markers */}
          {chokepointNodes.map((cp, idx) => (
            <Marker
              key={idx}
              position={[cp.lat, cp.lng]}
              icon={createChokepointIcon(getCorridorRiskColor(cp.corridor))}
              eventHandlers={{
                click: () => setSelectedNode({ type: 'chokepoint', data: cp })
              }}
            />
          ))}
        </MapContainer>
        
        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-brand-border rounded-lg p-3 z-[1000] text-[10px] space-y-2 pointer-events-auto">
          <p className="font-bold text-slate-450 uppercase tracking-wider">Digital Twin Legend</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-risk-low" />
              <span className="text-slate-350">Low Corridor Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-risk-medium" />
              <span className="text-slate-350">Medium Corridor Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-risk-high animate-pulse" />
              <span className="text-slate-350">High Logistics Threat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-risk-critical animate-ping" />
              <span className="text-slate-350">Corridor Disrupted / Closed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-4.5 border border-dashed border-sky-400 bg-sky-500/10" />
              <span className="text-sky-400 font-medium">Bypass Pipeline / Alternative Cape Path</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Right Info Panel */}
      <div className="w-80 bg-slate-900 border border-brand-border rounded-xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <Layers size={16} className="text-sky-400" />
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
                      <span className="text-slate-200 font-semibold">{selectedNode.data.cap}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 block mb-1">Downstream Refineries Connected</span>
                      <p className="text-slate-300 font-medium leading-relaxed bg-slate-950 p-2 border border-brand-border rounded">
                        {selectedNode.data.refineries}
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
                    <div>
                      <span className="text-slate-450 block mb-1">Chokepoint Profile</span>
                      <p className="text-slate-350 leading-relaxed bg-slate-950 p-2 border border-brand-border rounded">
                        {selectedNode.data.desc}
                      </p>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-3 border border-brand-border rounded-lg">
                      <span className="text-slate-450 font-bold uppercase text-[10px]">Active Risk Index</span>
                      <span className="font-extrabold text-sm" style={{ color: getCorridorRiskColor(selectedNode.data.corridor) }}>
                        {routes.find(r => r.chokepoints_crossed.includes(selectedNode.data.corridor))?.risk_score || 15}/100
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12">
              <HelpCircle size={28} className="stroke-[1.5] mb-2" />
              <p className="text-xs">Click any node, port, or chokepoint on the map twin to inspect details.</p>
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
