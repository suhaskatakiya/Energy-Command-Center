import type { DashboardMetrics, GeopoliticalEvent, Supplier, ShippingRoute, Simulation, DecisionPlan } from '../types';

const API_BASE = 'http://localhost:8000/api';

// Realistic local mock state for client-side fallback
let mockEvents: GeopoliticalEvent[] = [
  {
    id: 1,
    title: "Suez Canal Maintenance Operations",
    summary: "Routine dredging operations in the Suez Canal are causing brief transit delays of up to 4 hours. No significant impact on commercial shipping volumes is reported.",
    location: "Suez Canal",
    affected_corridor: "Red Sea",
    severity: "LOW",
    disruption_probability: 0.05,
    affected_supply_pct: 0.0,
    confidence: 0.95,
    verification_status: "CONFIRMED",
    source: "Suez Canal Authority",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "Routine Maritime Security Drills",
    summary: "Joint naval task forces are conducting routine security drills in the Gulf of Oman and near the Strait of Hormuz to ensure free passage of trade ships. High naval presence acts as a stabilizer.",
    location: "Gulf of Oman",
    affected_corridor: "Hormuz",
    severity: "LOW",
    disruption_probability: 0.02,
    affected_supply_pct: 0.0,
    confidence: 0.90,
    verification_status: "CONFIRMED",
    source: "Combined Maritime Forces",
    created_at: new Date().toISOString()
  }
];

let mockSuppliers: Supplier[] = [
  { id: 1, name: "Iraq", latitude: 30.5081, longitude: 47.7835, crude_grade: "Basra Medium", base_price: 78.5, shipping_cost: 2.8, transit_time_days: 14, tanker_availability: "HIGH", capacity_kbd: 1200, refinery_compatibility: 0.95, geopolitical_risk: 45, is_active: true },
  { id: 2, name: "Saudi Arabia", latitude: 26.6368, longitude: 50.1706, crude_grade: "Arab Light", base_price: 81.2, shipping_cost: 2.6, transit_time_days: 12, tanker_availability: "HIGH", capacity_kbd: 850, refinery_compatibility: 0.98, geopolitical_risk: 35, is_active: true },
  { id: 3, name: "Russia", latitude: 60.3639, longitude: 28.6186, crude_grade: "Urals", base_price: 68.0, shipping_cost: 6.5, transit_time_days: 28, tanker_availability: "MEDIUM", capacity_kbd: 1600, refinery_compatibility: 0.88, geopolitical_risk: 65, is_active: true },
  { id: 4, name: "UAE", latitude: 25.1164, longitude: 56.3601, crude_grade: "Murban", base_price: 82.5, shipping_cost: 2.1, transit_time_days: 10, tanker_availability: "HIGH", capacity_kbd: 400, refinery_compatibility: 0.97, geopolitical_risk: 20, is_active: true },
  { id: 5, name: "Nigeria", latitude: 4.4372, longitude: 7.1685, crude_grade: "Bonny Light", base_price: 84.0, shipping_cost: 4.8, transit_time_days: 22, tanker_availability: "MEDIUM", capacity_kbd: 250, refinery_compatibility: 0.92, geopolitical_risk: 40, is_active: true },
  { id: 6, name: "United States", latitude: 29.7604, longitude: -95.3698, crude_grade: "WTI", base_price: 76.2, shipping_cost: 7.5, transit_time_days: 35, tanker_availability: "HIGH", capacity_kbd: 300, refinery_compatibility: 0.85, geopolitical_risk: 10, is_active: true },
  { id: 7, name: "India Domestic", latitude: 19.4167, longitude: 71.3333, crude_grade: "Mumbai High", base_price: 75.0, shipping_cost: 0.5, transit_time_days: 1, tanker_availability: "HIGH", capacity_kbd: 600, refinery_compatibility: 1.0, geopolitical_risk: 5, is_active: true }
];

let mockConfig = {
  id: 1,
  weight_geopolitical: 0.25,
  weight_maritime: 0.20,
  weight_sanctions: 0.15,
  weight_shipping: 0.15,
  weight_price_volatility: 0.15,
  weight_alternative_availability: 0.10
};

let mockSimulations: Simulation[] = [];
let mockDecisionPlans: DecisionPlan[] = [];

// Helper to determine if backend is online
let isBackendOnline = false;

async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE}/`);
    isBackendOnline = res.ok;
  } catch {
    isBackendOnline = false;
  }
}

// Initial status check
checkBackendStatus();

export const api = {
  isFallback: () => !isBackendOnline,

  getMetrics: async (): Promise<DashboardMetrics> => {
    await checkBackendStatus();
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/metrics`);
      return res.json();
    }
    
    // Fallback Mock Calculation
    const activeCritical = mockEvents.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL');
    const hasHormuz = activeCritical.some(e => e.affected_corridor === 'Hormuz');
    const hasRedSea = activeCritical.some(e => e.affected_corridor === 'Red Sea');
    
    let hormuzRisk = hasHormuz ? 82.0 : 15.0;
    let redseaRisk = hasRedSea ? 74.0 : 22.0;
    let malaccaRisk = 12.0;
    
    const deductions = (hormuzRisk * 0.45) + (redseaRisk * 0.25) + (malaccaRisk * 0.1);
    const score = Math.max(0.0, Math.min(100.0, 100.0 - deductions));
    
    const totalDemand = 5000;
    let activeSupply = totalDemand;
    if (hasHormuz) {
      activeSupply -= (1200 + 850) * 0.8; // 80% loss
    }
    if (hasRedSea) {
      activeSupply -= 1600 * 0.7; // 70% loss
    }
    
    const gap = Math.max(0.0, totalDemand - activeSupply);
    const status = score >= 80 ? 'OPTIMAL' : score >= 60 ? 'STABLE' : score >= 40 ? 'VULNERABLE' : 'CRITICAL RISK';
    const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : score >= 40 ? 'orange' : 'red';
    
    return {
      energy_resilience_score: Math.round(score * 10) / 10,
      energy_resilience_status: status,
      resilience_color: color as any,
      total_demand_kbd: totalDemand,
      active_supply_kbd: Math.round(activeSupply * 10) / 10,
      supply_gap_kbd: Math.round(gap * 10) / 10,
      supply_gap_pct: Math.round((gap / totalDemand) * 100 * 10) / 10,
      critical_alerts_count: activeCritical.length,
      chokepoint_risks: {
        "Strait of Hormuz": hormuzRisk,
        "Red Sea (Bab-el-Mandeb)": redseaRisk,
        "Strait of Malacca": malaccaRisk
      }
    };
  },

  getEvents: async (): Promise<GeopoliticalEvent[]> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/events`);
      return res.json();
    }
    return mockEvents;
  },

  createEvent: async (event: Omit<GeopoliticalEvent, 'id'>): Promise<GeopoliticalEvent> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      return res.json();
    }
    
    const newEvent = { ...event, id: mockEvents.length + 1, created_at: new Date().toISOString() };
    mockEvents = [newEvent, ...mockEvents];
    return newEvent;
  },

  clearEvents: async (): Promise<any> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/events/clear`, { method: 'DELETE' });
      return res.json();
    }
    mockEvents = mockEvents.filter(e => e.source !== 'Simulated');
    return { message: "Mock events cleared" };
  },

  getSuppliers: async (): Promise<Supplier[]> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/suppliers`);
      return res.json();
    }
    return mockSuppliers;
  },

  updateSupplier: async (id: number, updates: Partial<Supplier>): Promise<Supplier> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.json();
    }
    mockSuppliers = mockSuppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    return mockSuppliers.find(s => s.id === id)!;
  },

  getRoutes: async (): Promise<ShippingRoute[]> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/routes`);
      return res.json();
    }
    return [];
  },

  getConfig: async (): Promise<any> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/config`);
      return res.json();
    }
    return mockConfig;
  },

  updateConfig: async (config: any): Promise<any> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/data/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return res.json();
    }
    mockConfig = { ...mockConfig, ...config };
    return mockConfig;
  },

  // News analyzer endpoint
  analyzeNews: async (newsText: string): Promise<any> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/agent/analyze-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news_text: newsText })
      });
      return res.json();
    }
    
    // Client-side rule analyzer
    const text = newsText.toLowerCase();
    let title = "Strait of Hormuz Tension Escales";
    let summary = "Geopolitical tension spikes following incident details.";
    let location = "Strait of Hormuz";
    let corridor = "Hormuz";
    let severity = "HIGH";
    let prob = 0.78;
    let supply_pct = 18.0;
    
    if (text.includes("red sea") || text.includes("houthi")) {
      title = "Red Sea Shipping Disruption Escalates";
      summary = "Drone strikes target logistics operations forcing re-routing protocols.";
      location = "Bab-el-Mandeb Strait";
      corridor = "Red Sea";
      severity = "HIGH";
      prob = 0.75;
      supply_pct = 12.0;
    }
    
    return {
      event: {
        title,
        summary,
        location,
        affected_corridor: corridor,
        severity,
        disruption_probability: prob,
        affected_supply_pct: supply_pct,
        confidence: 0.85,
        verification_status: "REPORTED",
        source: "System Intelligence Parser"
      },
      retrieved_docs: []
    };
  },

  // Crisis Simulator
  simulate: async (config: {
    name: string;
    disruption_location: string;
    severity_pct: number;
    duration_days: number;
    demand_kbd: number;
    base_oil_price: number;
    shipping_cost: number;
  }): Promise<Simulation> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return res.json();
    }
    
    // Client-side Mock Simulator
    const results = {
      disruption_location: config.disruption_location,
      severity_pct: config.severity_pct,
      duration_days: config.duration_days,
      demand_kbd: config.demand_kbd,
      supply_loss_kbd: config.disruption_location === 'Hormuz' ? (1200 + 850) * (config.severity_pct / 100) : 1600 * (config.severity_pct / 100),
      total_supply_loss_mb: 0,
      comparisons: {
        oil_price_usd: { label: "Crude Price ($/bbl)", baseline: config.base_oil_price, disruption: config.base_oil_price + (config.severity_pct * 0.25), optimized: config.base_oil_price + (config.severity_pct * 0.18) },
        shipping_cost_usd: { label: "Avg Shipping Cost ($/bbl)", baseline: config.shipping_cost, disruption: config.shipping_cost * (1 + config.severity_pct/100 * 2), optimized: config.shipping_cost * (1 + config.severity_pct/100 * 0.9) },
        supply_gap_kbd: { label: "Supply Gap (kbd)", baseline: 0.0, disruption: config.disruption_location === 'Hormuz' ? (1200 + 850) * (config.severity_pct / 100) : 1600 * (config.severity_pct / 100), optimized: 40.0 },
        supply_gap_pct: { label: "Supply Gap (%)", baseline: 0.0, disruption: config.disruption_location === 'Hormuz' ? ((1200 + 850) * (config.severity_pct / 100) / config.demand_kbd * 100) : (1600 * (config.severity_pct / 100) / config.demand_kbd * 100), optimized: 0.8 },
        refinery_utilization: { label: "Refinery Utilization (%)", baseline: 100, disruption: 100 - (config.severity_pct * 0.35), optimized: 99.2 },
        daily_import_cost_m: { label: "Daily Import Cost ($M)", baseline: 360, disruption: 480, optimized: 410 },
        total_import_cost_b: { label: "Cumulative Import Cost ($B)", baseline: 10.8, disruption: 14.4, optimized: 12.3 },
        trade_deficit_increase_b: { label: "Trade Deficit Increase ($B)", baseline: 0.0, disruption: 3.6, optimized: 1.5 },
        inflation_pressure_pct: { label: "Inflation Impact (% CPI increase)", baseline: 0.0, disruption: 1.25, optimized: 0.45 },
        gdp_drag_basis_points: { label: "GDP Impact (basis points drag)", baseline: 0.0, disruption: -35, optimized: -12 },
        fuel_price_pressure: { label: "Retail Fuel Price Pressure", baseline: "Baseline", disruption: "HIGH (+15%)", optimized: "MODERATE (+4%)" },
        power_sector_stress: { label: "Power Grid Feedstock Stress", baseline: "Low", disruption: "High", optimized: "Low" }
      },
      explanation: `Mock: The disruption of the ${config.disruption_location} corridor affects oil imports. Drawing down SPR mitigates the domestic deficit.`
    };
    results.total_supply_loss_mb = Number(((results.supply_loss_kbd * config.duration_days) / 1000).toFixed(2));
    
    const newSim: Simulation = {
      id: mockSimulations.length + 1,
      name: config.name,
      disruption_location: config.disruption_location,
      severity_pct: config.severity_pct,
      duration_days: config.duration_days,
      demand_kbd: config.demand_kbd,
      base_oil_price: config.base_oil_price,
      shipping_cost: config.shipping_cost,
      status: "COMPLETED",
      created_at: new Date().toISOString(),
      results: JSON.stringify(results)
    };
    mockSimulations = [newSim, ...mockSimulations];
    return newSim;
  },

  getSimulations: async (): Promise<Simulation[]> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/simulate`);
      return res.json();
    }
    return mockSimulations;
  },

  // Optimizers endpoints
  optimizeProcurement: async (gap: number, priority: string, chokepoints: string[]): Promise<any> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/optimize/procure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supply_gap_kbd: gap, priority, closed_chokepoints: chokepoints })
      });
      return res.json();
    }
    
    // Mock
    const alloc = [];
    if (chokepoints.includes('Hormuz')) {
      alloc.push({ supplier_name: "UAE", allocated_volume_kbd: gap * 0.35, share_pct: 35.0, days_to_arrival: 10, delivered_cost_million_usd_daily: gap * 0.35 * 84.6 / 1000 });
      alloc.push({ supplier_name: "Nigeria", allocated_volume_kbd: gap * 0.4, share_pct: 40.0, days_to_arrival: 22, delivered_cost_million_usd_daily: gap * 0.4 * 88.8 / 1000 });
      alloc.push({ supplier_name: "United States", allocated_volume_kbd: gap * 0.25, share_pct: 25.0, days_to_arrival: 35, delivered_cost_million_usd_daily: gap * 0.25 * 83.7 / 1000 });
    } else {
      alloc.push({ supplier_name: "Iraq", allocated_volume_kbd: gap * 0.6, share_pct: 60.0, days_to_arrival: 14, delivered_cost_million_usd_daily: gap * 0.6 * 81.3 / 1000 });
      alloc.push({ supplier_name: "Saudi Arabia", allocated_volume_kbd: gap * 0.4, share_pct: 40.0, days_to_arrival: 12, delivered_cost_million_usd_daily: gap * 0.4 * 83.8 / 1000 });
    }
    return {
      supply_gap_kbd: gap,
      filled_volume_kbd: gap,
      unfilled_volume_kbd: 0,
      allocation_plan: alloc,
      rankings: mockSuppliers.filter(s => s.name !== 'India Domestic').map(s => ({
        supplier_name: s.name,
        score: 95 - s.geopolitical_risk * 0.4,
        delivered_cost_per_barrel: s.base_price + s.shipping_cost,
        transit_days: s.transit_time_days,
        refinery_compatibility: s.refinery_compatibility,
        available_capacity_kbd: s.capacity_kbd,
        geopolitical_risk_score: s.geopolitical_risk,
        advantages: ["Provides stable grades"],
        risks: ["Transit subject to general delays"]
      }))
    };
  },

  optimizeSpr: async (loss: number, duration: number): Promise<any> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/optimize/spr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supply_loss_kbd: loss, duration_days: duration })
      });
      return res.json();
    }
    
    // Mock
    const schedule = [];
    let reserve = 39.5;
    for (let i = 1; i <= duration; i++) {
      const draw = i <= 7 ? loss * 0.5 : i <= 15 ? loss * 0.8 : i <= 23 ? loss * 0.3 : loss * 0.1;
      const draw_mb = draw * 0.001;
      reserve = Math.max(7.9, reserve - draw_mb);
      schedule.push({
        day: i,
        phase: i <= 7 ? "Immediate Buffer" : i <= 15 ? "Peak Disruption" : "Stabilization",
        drawdown_rate_kbd: draw,
        drawn_volume_mb: draw_mb,
        remaining_reserve_mb: reserve,
        reserve_capacity_pct: (reserve / 39.5) * 100
      });
    }
    
    return {
      initial_reserve_mb: 39.5,
      remaining_reserve_mb: reserve,
      total_drawn_mb: 39.5 - reserve,
      reserve_depletion_pct: ((39.5 - reserve) / 39.5) * 100,
      safety_threshold_mb: 7.9,
      avg_drawdown_rate_kbd: loss * 0.4,
      schedule,
      is_safe: reserve > 7.9,
      recommendation: "SPR release plan is sustainable."
    };
  },

  optimizeRoute: async (source: string, destination: string, priority: string, chokepoints: string[]): Promise<any> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/optimize/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination, priority, closed_chokepoints: chokepoints })
      });
      return res.json();
    }
    return {
      source,
      destination,
      path: ["Russia", "Cape of Good Hope", "Indian Ocean Segment", "Kochi Port"],
      total_distance_nm: 11200,
      transit_time_days: 42,
      cost_per_barrel: 8.5,
      route_risk: 10.0,
      chokepoints_crossed: ["None"],
      waypoints: [
        [60.3639, 28.6186],
        [50.0, -15.0],
        [-34.35, 18.5],
        [9.9312, 76.2673]
      ],
      success: true
    };
  },

  // Decision Orchestrator Agent endpoints
  orchestrateAgent: async (simId: number, priority: string): Promise<DecisionPlan> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/agent/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulation_id: simId, priority })
      });
      return res.json();
    }
    
    // Mock Agent Orchestrator
    const actions = [
      { action: "Initiate Phased SPR Drawdown of 320 kbd", impact: "Releases crude over simulation timeline to buffer local shortages.", owner: "ISPRL", priority: "HIGH" },
      { action: "Ramp up UAE crude procurement via Fujairah pipeline bypass (+250 kbd)", impact: "Procures crude without crossing Strait of Hormuz.", owner: "IOCL / BPCL", priority: "HIGH" },
      { action: "Squeeze spot capacity from US WTI and Nigerian Bonny Light (+400 kbd)", impact: "Imports detour via Cape of Good Hope, bypassing Bab-el-Mandeb.", owner: "Chartering Desk", priority: "MEDIUM" }
    ];
    
    const reasoning = `### 1. Executive Summary
The emergency declaration requires activating the national crisis plan. Re-routing tankers around the Cape and utilizing the UAE land pipeline bypass neutralizes the supply gap.

### 2. Historical Precedent & Lessons (RAG Grounding)
This resembles the **2024 Red Sea shipping crisis** where logistics detours around Cape of Good Hope added +10 days to transit. The primary lesson is that routing security immediately increases delivered costs, requiring preemptive alternative contracts and local buffers.

### 3. Action Plan Breakdown
* Release Strategic Petroleum Reserve (SPR) stock at 320 kbd to cushion the initial shipping delay window.
* Reroute Russian Urals and Persian Gulf flows to safe alternative lanes.

### 4. Refinery Blending
Adjust refinery blending configurations to accept sweeter WTI/Bonny Light crude compositions, mitigating potential grade mismatch risks.`;

    const newPlan: DecisionPlan = {
      id: mockDecisionPlans.length + 1,
      simulation_id: simId,
      recommended_actions: JSON.stringify(actions),
      priority: "HIGH",
      expected_impact: "Bridges supply gap to 0.8%, preserving refinery capacity.",
      total_cost: 1.8,
      risk_level: "Medium",
      confidence: 0.88,
      reasoning,
      status: "PENDING"
    };
    mockDecisionPlans = [newPlan, ...mockDecisionPlans];
    return newPlan;
  },

  getDecisionPlan: async (simId: number): Promise<DecisionPlan> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/agent/decision-plans/${simId}`);
      return res.json();
    }
    return mockDecisionPlans.find(p => p.simulation_id === simId) || mockDecisionPlans[0];
  },

  approveDecisionPlan: async (planId: number, status: 'APPROVED' | 'REJECTED', modifiedActions?: string): Promise<DecisionPlan> => {
    if (isBackendOnline) {
      const res = await fetch(`${API_BASE}/agent/decision-plans/${planId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, modified_actions: modifiedActions })
      });
      return res.json();
    }
    
    mockDecisionPlans = mockDecisionPlans.map(p => p.id === planId ? { ...p, status, approved_at: new Date().toISOString(), modified_actions: modifiedActions } : p);
    return mockDecisionPlans.find(p => p.id === planId)!;
  }
};
