export interface SystemConfig {
  id: number;
  weight_geopolitical: number;
  weight_maritime: number;
  weight_sanctions: number;
  weight_shipping: number;
  weight_price_volatility: number;
  weight_alternative_availability: number;
}

export interface GeopoliticalEvent {
  id?: number;
  title: string;
  summary: string;
  location: string;
  latitude?: number;
  longitude?: number;
  affected_corridor: 'Hormuz' | 'Red Sea' | 'Malacca' | 'None';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  disruption_probability: number;
  affected_supply_pct: number;
  confidence: number;
  verification_status: 'CONFIRMED' | 'REPORTED' | 'UNVERIFIED' | 'FORECAST' | 'HISTORICAL';
  source: string;
  created_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  crude_grade: string;
  base_price: number;
  shipping_cost: number;
  transit_time_days: number;
  tanker_availability: 'LOW' | 'MEDIUM' | 'HIGH';
  capacity_kbd: number;
  refinery_compatibility: number;
  geopolitical_risk: number;
  is_active: boolean;
}

export interface ShippingRoute {
  id: number;
  name: string;
  source: string;
  destination: string;
  waypoints: string; // JSON string representing coords array
  distance_nm: number;
  base_transit_days: number;
  chokepoints_crossed: string;
  risk_score: number;
}

export interface Simulation {
  id: number;
  name: string;
  disruption_location: string;
  severity_pct: number;
  duration_days: number;
  demand_kbd: number;
  base_oil_price: number;
  shipping_cost: number;
  status: string;
  created_at: string;
  results?: string; // JSON string
}

export interface DecisionPlan {
  id: number;
  simulation_id: number;
  recommended_actions: string; // JSON string
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  expected_impact: string;
  total_cost: number;
  risk_level: string;
  confidence: number;
  reasoning: string;
  alternative_strategies?: string; // JSON string
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_at?: string;
  modified_actions?: string; // JSON string
}

export interface ChokepointRisks {
  "Strait of Hormuz": number;
  "Red Sea (Bab-el-Mandeb)": number;
  "Strait of Malacca": number;
}

export interface DashboardMetrics {
  energy_resilience_score: number;
  energy_resilience_status: string;
  resilience_color: 'green' | 'yellow' | 'orange' | 'red';
  total_demand_kbd: number;
  active_supply_kbd: number;
  supply_gap_kbd: number;
  supply_gap_pct: number;
  critical_alerts_count: number;
  chokepoint_risks: ChokepointRisks;
}
