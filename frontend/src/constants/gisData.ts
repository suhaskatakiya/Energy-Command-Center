export interface GisVessel {
  id: string;
  name: string;
  type: string;
  cargo: string;
  volume_bbl: number;
  origin: string;
  destination: string;
  position: [number, number];
  heading: number;
  speed_knots: number;
  eta_days: number;
  corridor: string;
  supplier: string;
  crude_grade: string;
  flag: string;
  status: 'At Sea' | 'Approaching Port' | 'Waiting at Anchorage' | 'Loading' | 'Discharging' | 'Delayed';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface GisPipeline {
  id: string;
  name: string;
  coords: [number, number][];
  destination_refinery: string;
  length_km: number;
  capacity_mbpd: number;
  operator: string;
  utilization_pct: number;
  risk_status: 'NORMAL' | 'EVALUATING' | 'ALERT';
}

export interface GisChokepoint {
  id: string;
  name: string;
  position: [number, number];
  congestion: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_score: number;
  transit_delay_days: number;
  historical_incidents: string[];
}

export interface GisRoute {
  id: string;
  name: string;
  waypoints: [number, number][];
  risk_level: 'Safe' | 'Moderate' | 'High Risk';
  risk_score: number;
  distance_nm: number;
  base_transit_days: number;
}

export const MOCK_GIS_VESSELS: GisVessel[] = [
  {
    id: "MT_GULF_STAR",
    name: "MT Gulf Star",
    type: "VLCC",
    cargo: "Arab Light",
    volume_bbl: 2000000,
    origin: "Ras Tanura, Saudi Arabia",
    destination: "Jamnagar Port",
    position: [26.1, 56.3],
    heading: 112,
    speed_knots: 13.2,
    eta_days: 4,
    corridor: "Hormuz",
    supplier: "Saudi Arabia",
    crude_grade: "Arab Light",
    flag: "🇸🇦",
    status: "At Sea",
    risk_level: "HIGH"
  },
  {
    id: "MT_INDIAN_OCEAN",
    name: "MT Indian Ocean",
    type: "Suezmax",
    cargo: "Basrah Heavy",
    volume_bbl: 1000000,
    origin: "Basra, Iraq",
    destination: "Paradip Port",
    position: [22.5, 63.8],
    heading: 98,
    speed_knots: 11.8,
    eta_days: 7,
    corridor: "Hormuz",
    supplier: "Iraq",
    crude_grade: "Basrah Heavy",
    flag: "🇮🇶",
    status: "Approaching Port",
    risk_level: "MEDIUM"
  },
  {
    id: "MT_CAPE_RUNNER",
    name: "MT Cape Runner",
    type: "VLCC",
    cargo: "Bonny Light",
    volume_bbl: 2100000,
    origin: "Bonny Terminal, Nigeria",
    destination: "Kochi Port",
    position: [-15.2, 12.4],
    heading: 88,
    speed_knots: 14.1,
    eta_days: 18,
    corridor: "Cape of Good Hope",
    supplier: "Nigeria",
    crude_grade: "Bonny Light",
    flag: "🇳🇬",
    status: "At Sea",
    risk_level: "LOW"
  },
  {
    id: "MT_URALS_EXPRESS",
    name: "MT Urals Express",
    type: "Aframax",
    cargo: "URALS Blend",
    volume_bbl: 750000,
    origin: "Novorossiysk, Russia",
    destination: "Vizag Port",
    position: [-32.6, 27.8],
    heading: 95,
    speed_knots: 12.4,
    eta_days: 22,
    corridor: "Cape of Good Hope",
    supplier: "Russia",
    crude_grade: "URALS",
    flag: "🇷🇺",
    status: "Waiting at Anchorage",
    risk_level: "MEDIUM"
  },
  {
    id: "MT_MURBAN_1",
    name: "MT Murban 1",
    type: "VLCC",
    cargo: "Murban Crude",
    volume_bbl: 1950000,
    origin: "Ruwais, UAE",
    destination: "Jamnagar Port",
    position: [24.8, 58.1],
    heading: 108,
    speed_knots: 13.8,
    eta_days: 3,
    corridor: "Hormuz",
    supplier: "UAE",
    crude_grade: "Murban",
    flag: "🇦🇪",
    status: "Loading",
    risk_level: "HIGH"
  },
  {
    id: "MT_RED_SEA_1",
    name: "MT Red Sea Voyager",
    type: "Suezmax",
    cargo: "Arab Medium",
    volume_bbl: 1100000,
    origin: "Yanbu, Saudi Arabia",
    destination: "Kochi Port",
    position: [18.4, 41.2],
    heading: 160,
    speed_knots: 10.2,
    eta_days: 9,
    corridor: "Red Sea",
    supplier: "Saudi Arabia",
    crude_grade: "Arab Medium",
    flag: "🇸🇦",
    status: "Delayed",
    risk_level: "CRITICAL"
  },
  {
    id: "MT_WTI_1",
    name: "MT Houston Star",
    type: "VLCC",
    cargo: "WTI Light Sweet",
    volume_bbl: 2000000,
    origin: "Houston, USA",
    destination: "Mumbai JNPT",
    position: [8.2, -18.5],
    heading: 92,
    speed_knots: 14.5,
    eta_days: 28,
    corridor: "Cape of Good Hope",
    supplier: "USA",
    crude_grade: "WTI",
    flag: "🇺🇸",
    status: "At Sea",
    risk_level: "LOW"
  },
  {
    id: "MT_KUWAIT_1",
    name: "MT Kuwait Express",
    type: "Aframax",
    cargo: "Kuwait Export",
    volume_bbl: 800000,
    origin: "Mina Al Ahmadi, Kuwait",
    destination: "Chennai Port",
    position: [19.6, 65.4],
    heading: 115,
    speed_knots: 12.9,
    eta_days: 6,
    corridor: "Hormuz",
    supplier: "Kuwait",
    crude_grade: "Kuwait Export",
    flag: "🇰🇼",
    status: "Discharging",
    risk_level: "HIGH"
  }
];

export const MOCK_GIS_PIPELINES: GisPipeline[] = [
  {
    id: "pipe_jamnagar_bina",
    name: "Jamnagar–Bina Pipeline (JBPL)",
    coords: [[22.4707, 70.0577], [23.1, 72.0], [23.8, 74.5], [24.2, 78.2]],
    destination_refinery: "Bina Refinery",
    length_km: 1269,
    capacity_mbpd: 0.18,
    operator: "BPCL",
    utilization_pct: 78.4,
    risk_status: "NORMAL"
  },
  {
    id: "pipe_paradip_haldia",
    name: "Paradip–Haldia–Barauni Pipeline (PHBPL)",
    coords: [[20.2606, 86.6664], [22.0, 87.5], [24.0, 87.0], [25.3, 86.2]],
    destination_refinery: "Barauni Refinery",
    length_km: 722,
    capacity_mbpd: 0.06,
    operator: "IOCL",
    utilization_pct: 89.2,
    risk_status: "NORMAL"
  },
  {
    id: "pipe_kochi_coimbatore",
    name: "Kochi–Coimbatore Pipeline",
    coords: [[9.9312, 76.2673], [10.5, 77.0], [11.0, 77.25]],
    destination_refinery: "Coimbatore Terminal",
    length_km: 247,
    capacity_mbpd: 0.09,
    operator: "BPCL",
    utilization_pct: 64.5,
    risk_status: "NORMAL"
  },
  {
    id: "pipe_mundra_panipat",
    name: "Mundra–Panipat Pipeline (MPPL)",
    coords: [[22.84, 69.7], [24.5, 71.5], [26.8, 73.0], [29.4, 76.9]],
    destination_refinery: "Panipat Refinery",
    length_km: 1194,
    capacity_mbpd: 0.25,
    operator: "IOCL",
    utilization_pct: 92.5,
    risk_status: "ALERT"
  },
  {
    id: "pipe_vadinar_bina",
    name: "Vadinar–Bina Pipeline",
    coords: [[22.43, 69.72], [23.5, 73.0], [24.2, 78.2]],
    destination_refinery: "Bina Refinery",
    length_km: 935,
    capacity_mbpd: 0.15,
    operator: "BORL",
    utilization_pct: 82.0,
    risk_status: "NORMAL"
  },
  {
    id: "pipe_salaya_mathura",
    name: "Salaya–Mathura Pipeline (SMPL)",
    coords: [[22.3, 69.6], [24.0, 72.0], [26.0, 75.0], [27.4, 77.7]],
    destination_refinery: "Mathura Refinery",
    length_km: 1205,
    capacity_mbpd: 0.21,
    operator: "IOCL",
    utilization_pct: 85.0,
    risk_status: "EVALUATING"
  }
];

export const MOCK_GIS_CHOKEPOINTS: GisChokepoint[] = [
  {
    id: "choke_hormuz",
    name: "Strait of Hormuz",
    position: [26.5, 56.4],
    congestion: "HIGH",
    risk_score: 88,
    transit_delay_days: 3.5,
    historical_incidents: [
      "2019 Tanker Seizure Incident",
      "2021 Drone Attack on Mercer Street",
      "2025 Naval Live-Fire Escalation Warnings"
    ]
  },
  {
    id: "choke_mandeb",
    name: "Bab-el-Mandeb",
    position: [12.6, 43.3],
    congestion: "HIGH",
    risk_score: 92,
    transit_delay_days: 12.0,
    historical_incidents: [
      "2023 Houthi Anti-Ship Missile Strike",
      "2024 Suez Detours via Cape Route",
      "2026 Red Sea High Insurance Zone Alert"
    ]
  },
  {
    id: "choke_suez",
    name: "Suez Canal",
    position: [29.9, 32.5],
    congestion: "MEDIUM",
    risk_score: 45,
    transit_delay_days: 1.5,
    historical_incidents: [
      "2021 Ever Given Grounding Blockage",
      "2024 Red Sea Traffic Redirection Drops"
    ]
  },
  {
    id: "choke_malacca",
    name: "Malacca Strait",
    position: [2.5, 101.5],
    congestion: "HIGH",
    risk_score: 35,
    transit_delay_days: 0.5,
    historical_incidents: [
      "2022 Maritime Piracy Boarding Incidents",
      "2025 Congestion Delays in Singapore Anchors"
    ]
  }
];

export const MOCK_GIS_ROUTES: GisRoute[] = [
  {
    id: "route_pg_india",
    name: "Persian Gulf - India Route",
    waypoints: [
      [26.1, 50.0],
      [26.5, 56.4],
      [24.8, 59.0],
      [22.47, 70.06]
    ],
    risk_level: "High Risk",
    risk_score: 82,
    distance_nm: 1100,
    base_transit_days: 4
  },
  {
    id: "route_suez_india",
    name: "Suez Route (Mediterranean - India)",
    waypoints: [
      [31.2, 32.3],
      [29.9, 32.5],
      [23.5, 37.0],
      [12.6, 43.3],
      [11.5, 55.0],
      [9.93, 76.27]
    ],
    risk_level: "High Risk",
    risk_score: 88,
    distance_nm: 3400,
    base_transit_days: 12
  },
  {
    id: "route_cape_india",
    name: "Cape Route (West Africa - India)",
    waypoints: [
      [4.3, 7.0],
      [-15.0, 8.0],
      [-34.8, 20.0],
      [-25.0, 45.0],
      [-5.0, 65.0],
      [9.93, 76.27]
    ],
    risk_level: "Safe",
    risk_score: 15,
    distance_nm: 6500,
    base_transit_days: 22
  },
  {
    id: "route_russia_india",
    name: "Russia (Novorossiysk) - India Route",
    waypoints: [
      [44.7, 37.8],
      [40.8, 29.0],
      [36.0, 25.0],
      [34.5, 15.0],
      [36.0, -5.0],
      [15.0, -18.0],
      [-34.8, 20.0],
      [-20.0, 50.0],
      [17.69, 83.22]
    ],
    risk_level: "Moderate",
    risk_score: 42,
    distance_nm: 8900,
    base_transit_days: 28
  },
  {
    id: "route_us_india",
    name: "US Gulf Coast - India Route",
    waypoints: [
      [29.5, -95.0],
      [25.0, -85.0],
      [20.0, -60.0],
      [5.0, -30.0],
      [-15.0, -5.0],
      [-34.8, 20.0],
      [-10.0, 55.0],
      [18.95, 72.95]
    ],
    risk_level: "Safe",
    risk_score: 18,
    distance_nm: 10400,
    base_transit_days: 34
  }
];

export const STATIC_PORTS = [
  { name: "Jamnagar Port (Sikka)", lat: 22.4707, lng: 70.0577, capacity: "1,500 kbd", refineries: "Jamnagar (RIL), Vadinar (Nayara)" },
  { name: "Kochi Port", lat: 9.9312, lng: 76.2673, capacity: "310 kbd", refineries: "Kochi Refinery (BPCL)" },
  { name: "Paradip Port", lat: 20.2606, lng: 86.6664, capacity: "300 kbd", refineries: "Paradip Refinery (IOCL)" },
  { name: "Mundra Port", lat: 22.84, lng: 69.7, capacity: "800 kbd", refineries: "Panipat, Mathura via pipelines" },
  { name: "JNPT Mumbai", lat: 18.95, lng: 72.95, capacity: "250 kbd", refineries: "Mumbai Refinery (HPCL/BPCL)" },
  { name: "Visakhapatnam Port", lat: 17.69, lng: 83.22, capacity: "170 kbd", refineries: "Vizag Refinery (HPCL)" },
  { name: "Chennai Port", lat: 13.08, lng: 80.3, capacity: "210 kbd", refineries: "Manali Refinery (CPCL)" },
  { name: "Mangalore Port", lat: 12.87, lng: 74.84, capacity: "300 kbd", refineries: "Mangaluru Refinery (MRPL)" }
];

export const STATIC_REFINERIES = [
  { name: "Jamnagar Refinery (RIL)", lat: 22.35, lng: 69.85, capacity: "1.24 MBPD", tech: "High Conversion Deep Sour Coker" },
  { name: "Vadinar Refinery (Nayara)", lat: 22.43, lng: 69.72, capacity: "0.40 MBPD", tech: "High-Conversion Refinery" },
  { name: "Mathura Refinery (IOCL)", lat: 27.4, lng: 77.7, capacity: "0.16 MBPD", tech: "Medium-conversion hydrocracker" },
  { name: "Panipat Refinery (IOCL)", lat: 29.4, lng: 76.9, capacity: "0.30 MBPD", tech: "High conversion FCC/HC" },
  { name: "Bina Refinery (BPCL)", lat: 24.2, lng: 78.2, capacity: "0.15 MBPD", tech: "Medium sour configuration" },
  { name: "Mumbai Refineries (BPCL/HPCL)", lat: 19.0, lng: 72.9, capacity: "0.31 MBPD", tech: "Lube-integrated sweet/sour setup" },
  { name: "Barauni Refinery (IOCL)", lat: 25.3, lng: 86.2, capacity: "0.12 MBPD", tech: "Low-conversion configuration" },
  { name: "Haldia Refinery (IOCL)", lat: 22.0, lng: 88.1, capacity: "0.16 MBPD", tech: "CDU + Lube block" },
  { name: "Kochi Refinery (BPCL)", lat: 9.96, lng: 76.35, capacity: "0.31 MBPD", tech: "SDA & High Conversion FCC" }
];
