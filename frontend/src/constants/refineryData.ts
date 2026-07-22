export interface CrudeSpecification {
  name: string;
  origin: string;
  api_gravity: number;
  sulfur_pct: number;
  density: number; // g/cm3
  acidity_tan: number; // mg KOH/g
  viscosity_cst: number;
  wax_content_pct: number;
  pour_point_c: number;
  metal_content_ppm: { nickel: number; vanadium: number };
  compatibility_score: number; // 0 - 100
}

export interface MetallurgyProfile {
  refinery: string;
  metallurgy_type: string;
  max_sulfur_pct: number;
  max_tan: number;
  desalting_stages: number;
  cladding: string;
}

export interface ExpandableComparison {
  name: string;
  expected_yield: {
    lpg: number;
    gasoline: number;
    jet_kero: number;
    diesel: number;
    vgo: number;
    residue: number;
  };
  processing_difficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  expected_margin_usd: number;
  hydrogen_consumption_scf: number;
  energy_requirement_kcal: number;
  catalyst_impact: string;
}

export const CRUDE_SPECIFICATIONS: CrudeSpecification[] = [
  {
    name: "Arab Light",
    origin: "Saudi Arabia",
    api_gravity: 33.4,
    sulfur_pct: 1.80,
    density: 0.858,
    acidity_tan: 0.15,
    viscosity_cst: 9.8,
    wax_content_pct: 4.8,
    pour_point_c: -15,
    metal_content_ppm: { nickel: 4.0, vanadium: 14.5 },
    compatibility_score: 95
  },
  {
    name: "Murban",
    origin: "UAE",
    api_gravity: 40.2,
    sulfur_pct: 0.74,
    density: 0.824,
    acidity_tan: 0.05,
    viscosity_cst: 3.2,
    wax_content_pct: 5.5,
    pour_point_c: -6,
    metal_content_ppm: { nickel: 0.8, vanadium: 2.2 },
    compatibility_score: 98
  },
  {
    name: "Basrah Heavy",
    origin: "Iraq",
    api_gravity: 24.0,
    sulfur_pct: 3.82,
    density: 0.910,
    acidity_tan: 0.42,
    viscosity_cst: 24.5,
    wax_content_pct: 3.1,
    pour_point_c: -21,
    metal_content_ppm: { nickel: 18.0, vanadium: 56.0 },
    compatibility_score: 72
  },
  {
    name: "Bonny Light",
    origin: "Nigeria",
    api_gravity: 35.3,
    sulfur_pct: 0.14,
    density: 0.848,
    acidity_tan: 0.28,
    viscosity_cst: 4.1,
    wax_content_pct: 6.2,
    pour_point_c: 12,
    metal_content_ppm: { nickel: 2.1, vanadium: 1.0 },
    compatibility_score: 88
  },
  {
    name: "URALS",
    origin: "Russia",
    api_gravity: 31.7,
    sulfur_pct: 1.48,
    density: 0.867,
    acidity_tan: 0.22,
    viscosity_cst: 12.4,
    wax_content_pct: 4.2,
    pour_point_c: -12,
    metal_content_ppm: { nickel: 8.5, vanadium: 26.0 },
    compatibility_score: 89
  },
  {
    name: "WTI",
    origin: "USA",
    api_gravity: 39.6,
    sulfur_pct: 0.24,
    density: 0.827,
    acidity_tan: 0.08,
    viscosity_cst: 3.4,
    wax_content_pct: 5.0,
    pour_point_c: -18,
    metal_content_ppm: { nickel: 1.2, vanadium: 3.0 },
    compatibility_score: 96
  }
];

export const METALLURGY_PROFILES: MetallurgyProfile[] = [
  {
    refinery: "Mathura",
    metallurgy_type: "Standard Carbon Steel / Low-Alloy",
    max_sulfur_pct: 2.0,
    max_tan: 0.3,
    desalting_stages: 2,
    cladding: "None (Internal Epoxy Coating)"
  },
  {
    refinery: "Panipat",
    metallurgy_type: "5-Chrome & 9-Chrome Alloy Steel",
    max_sulfur_pct: 3.0,
    max_tan: 0.5,
    desalting_stages: 2,
    cladding: "Type 405 Stainless Steel (Atmospheric Tower Overhead)"
  },
  {
    refinery: "Bina",
    metallurgy_type: "Standard Low-Chrome",
    max_sulfur_pct: 2.2,
    max_tan: 0.25,
    desalting_stages: 2,
    cladding: "None"
  },
  {
    refinery: "Paradip",
    metallurgy_type: "316L Stainless Steel Clad & Alloy 625",
    max_sulfur_pct: 4.0,
    max_tan: 1.0,
    desalting_stages: 3,
    cladding: "316L SS Weld Clad (Vacuum Column High-Temp Zones)"
  },
  {
    refinery: "Jamnagar",
    metallurgy_type: "Duplex 2205 / 317L Stainless Clad",
    max_sulfur_pct: 4.5,
    max_tan: 1.5,
    desalting_stages: 3,
    cladding: "Alloy 825 / Duplex Clad (Full Columns & Flash Zones)"
  }
];

export const EXPANDABLE_COMPARISONS: ExpandableComparison[] = [
  {
    name: "Arab Light",
    expected_yield: { lpg: 2.5, gasoline: 21.0, jet_kero: 13.5, diesel: 32.0, vgo: 19.0, residue: 12.0 },
    processing_difficulty: "MEDIUM",
    expected_margin_usd: 8.50,
    hydrogen_consumption_scf: 450,
    energy_requirement_kcal: 140,
    catalyst_impact: "Low metal deactivation; moderate sulfur loading on HDS catalysts."
  },
  {
    name: "Murban",
    expected_yield: { lpg: 3.2, gasoline: 28.0, jet_kero: 16.5, diesel: 35.0, vgo: 12.0, residue: 5.3 },
    processing_difficulty: "LOW",
    expected_margin_usd: 10.20,
    hydrogen_consumption_scf: 280,
    energy_requirement_kcal: 110,
    catalyst_impact: "Minimal impact; exceptionally clean feed for cracking units."
  },
  {
    name: "Basrah Heavy",
    expected_yield: { lpg: 1.1, gasoline: 12.0, jet_kero: 7.0, diesel: 24.0, vgo: 25.0, residue: 30.9 },
    processing_difficulty: "EXTREME",
    expected_margin_usd: 4.10,
    hydrogen_consumption_scf: 950,
    energy_requirement_kcal: 220,
    catalyst_impact: "Severe nickel/vanadium poisoning; high carbon soot deposit rates."
  },
  {
    name: "Bonny Light",
    expected_yield: { lpg: 2.8, gasoline: 24.5, jet_kero: 15.0, diesel: 36.2, vgo: 16.0, residue: 5.5 },
    processing_difficulty: "LOW",
    expected_margin_usd: 9.80,
    hydrogen_consumption_scf: 220,
    energy_requirement_kcal: 105,
    catalyst_impact: "Extremely low sulfur; low catalyst wear; wax content requires heater adjustments."
  },
  {
    name: "URALS",
    expected_yield: { lpg: 2.2, gasoline: 18.5, jet_kero: 12.0, diesel: 31.0, vgo: 21.0, residue: 15.3 },
    processing_difficulty: "MEDIUM",
    expected_margin_usd: 7.90,
    hydrogen_consumption_scf: 490,
    energy_requirement_kcal: 150,
    catalyst_impact: "Moderate metal deposition; standard regeneration cycles suffice."
  },
  {
    name: "WTI",
    expected_yield: { lpg: 3.5, gasoline: 30.0, jet_kero: 16.0, diesel: 34.0, vgo: 12.0, residue: 4.5 },
    processing_difficulty: "LOW",
    expected_margin_usd: 11.50,
    hydrogen_consumption_scf: 250,
    energy_requirement_kcal: 100,
    catalyst_impact: "Optimal feed; minimal catalyst degradation or regeneration cycles required."
  }
];

export const getRefineryCompatibility = (refinery: string, crude: string): 'Excellent' | 'Good' | 'Acceptable' | 'Poor' => {
  const spec = CRUDE_SPECIFICATIONS.find(c => c.name === crude);
  const profile = METALLURGY_PROFILES.find(p => p.refinery === refinery);
  if (!spec || !profile) return 'Acceptable';

  if (spec.sulfur_pct > profile.max_sulfur_pct || spec.acidity_tan > profile.max_tan) {
    return 'Poor';
  }

  if (spec.sulfur_pct < profile.max_sulfur_pct * 0.5 && spec.acidity_tan < profile.max_tan * 0.5) {
    return 'Excellent';
  }

  if (spec.sulfur_pct <= profile.max_sulfur_pct * 0.8) {
    return 'Good';
  }

  return 'Acceptable';
};
