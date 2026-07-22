from sqlalchemy.orm import Session
from ..models import Supplier, SystemConfig
from .risk_scoring import calculate_corridor_risk
import json

def simulate_disruption(
    location: str, # Hormuz, Red Sea
    severity_pct: float, # 0 to 100
    duration_days: int,
    base_oil_price: float,
    base_shipping_cost: float,
    db: Session
) -> dict:
    """
    Simulates the direct supply chain and macroeconomic impacts of a shipping corridor disruption.
    Returns metrics comparing:
    1. Baseline (Normal operations)
    2. Disruption (Crisis with NO intervention)
    3. AI-Optimized Response (Procurement re-allocation + Route detours + SPR release)
    """
    # India demand defaults
    demand_kbd = 5000.0 # 5 million barrels per day
    
    # 1. Calculate affected volumes based on supplier dependencies
    # If Hormuz is disrupted: Iraq (1200 kbd) and Saudi Arabia (850 kbd) are affected
    # If Red Sea is disrupted: Russia (1600 kbd) is affected
    affected_suppliers = []
    base_affected_volume = 0.0
    
    if location == "Hormuz":
        affected_suppliers = ["Iraq", "Saudi Arabia"]
        base_affected_volume = 1200.0 + 850.0
    elif location == "Red Sea":
        affected_suppliers = ["Russia"]
        base_affected_volume = 1600.0
    else:
        # Other or generic disruption
        affected_suppliers = ["Iraq"]
        base_affected_volume = 1200.0
        
    actual_supply_loss_kbd = base_affected_volume * (severity_pct / 100.0)
    
    # 2. Crude Price Impact (Brent crude increase)
    # Strait of Hormuz handles ~20% of global oil. Closure spikes world prices.
    # We use a standard price response function:
    # 1% volume loss globally ~ 2% price increase. Hormuz is global chokepoint.
    price_increase_usd = base_oil_price * (severity_pct / 100.0) * (0.35 if location == "Hormuz" else 0.15)
    disrupted_oil_price = base_oil_price + price_increase_usd
    
    # In optimized response, diversification and SPR release help stabilize price impact slightly (-20% of the spike)
    optimized_oil_price = base_oil_price + (price_increase_usd * 0.8)

    # 3. Shipping Freight Cost Impact
    # Red Sea closure forces Cape route (+200% shipping cost). Hormuz closure drives insurance premium spikes (+300%).
    shipping_increase_multiplier = (3.0 if location == "Hormuz" else 1.8) * (severity_pct / 100.0)
    disrupted_shipping_cost = base_shipping_cost * (1.0 + shipping_increase_multiplier)
    
    # Rerouting and pipeline optimization lowers average shipping cost in optimized state
    optimized_shipping_cost = base_shipping_cost * (1.0 + (shipping_increase_multiplier * 0.5))

    # 4. Supply Gap and Refinery Utilization
    # No Response: Gap is the entire supply loss
    disrupted_gap_kbd = actual_supply_loss_kbd
    disrupted_gap_pct = (disrupted_gap_kbd / demand_kbd) * 100.0
    refinery_util_disrupted = max(50.0, 100.0 - disrupted_gap_pct)
    
    # AI-Optimized Response: We buffer with SPR (approx 30% of loss) and alternative procurement (approx 60% of loss)
    # This leaves a tiny residual gap (approx 10% of loss or max capacity constraints)
    spr_contribution_kbd = min(actual_supply_loss_kbd * 0.40, 500.0) # SPR max daily rate 500kbd
    alt_procure_contribution_kbd = min(actual_supply_loss_kbd * 0.50, 800.0) # Alternative suppliers max capacity bounds
    
    optimized_gap_kbd = max(0.0, actual_supply_loss_kbd - spr_contribution_kbd - alt_procure_contribution_kbd)
    optimized_gap_pct = (optimized_gap_kbd / demand_kbd) * 100.0
    refinery_util_optimized = 100.0 - optimized_gap_pct

    # 5. Financial & Macroeconomic Calculations
    # Import cost = Volume imported * (Oil Price + Shipping Cost)
    # Baseline daily import cost
    baseline_imports_kbd = demand_kbd - 600.0 # Exclude domestic 600kbd
    baseline_daily_cost_m = baseline_imports_kbd * 1000 * (base_oil_price + base_shipping_cost) / 1000000.0
    
    # Disrupted daily import cost (paying higher prices on the oil we CAN get)
    disrupted_imports_kbd = baseline_imports_kbd - disrupted_gap_kbd
    disrupted_daily_cost_m = disrupted_imports_kbd * 1000 * (disrupted_oil_price + disrupted_shipping_cost) / 1000000.0
    
    # Optimized daily import cost (includes alternative supplier prices and SPR drawdown cost which is valued at base book price)
    # Alternative procurement volume
    opt_imports_kbd = baseline_imports_kbd - optimized_gap_kbd - spr_contribution_kbd
    # Base imports from unaffected suppliers (unaffected volume * higher price) + alternative imports (volume * alt price)
    opt_daily_cost_m = (
        (opt_imports_kbd - alt_procure_contribution_kbd) * 1000 * (optimized_oil_price + optimized_shipping_cost) +
        alt_procure_contribution_kbd * 1000 * (optimized_oil_price + 2.0 + optimized_shipping_cost * 1.1) + # Alt suppliers are slightly more expensive
        spr_contribution_kbd * 1000 * (base_oil_price) # SPR is booked at cheaper historical base price
    ) / 1000000.0

    # Total cumulative costs over duration
    baseline_total_cost_b = (baseline_daily_cost_m * duration_days) / 1000.0
    disrupted_total_cost_b = (disrupted_daily_cost_m * duration_days) / 1000.0
    optimized_total_cost_b = (opt_daily_cost_m * duration_days) / 1000.0

    # Trade Deficit Increase (Billion USD)
    trade_deficit_disrupted = max(0.0, disrupted_total_cost_b - baseline_total_cost_b)
    trade_deficit_optimized = max(0.0, optimized_total_cost_b - baseline_total_cost_b)

    # Inflation Pressure (WPI/CPI baseline increase in percentage points)
    # Rule of thumb: $10/bbl crude price rise adds 0.6% to CPI
    price_delta_disrupted = disrupted_oil_price - base_oil_price
    price_delta_optimized = optimized_oil_price - base_oil_price
    
    inflation_disrupted = price_delta_disrupted * 0.06
    inflation_optimized = price_delta_optimized * 0.06

    # GDP Impact (basis points drag, e.g. -50 bps = -0.5% GDP growth)
    # Rule of thumb: $10/bbl crude price rise drags GDP by 12 basis points
    gdp_disrupted = -price_delta_disrupted * 1.2
    gdp_optimized = -price_delta_optimized * 1.2

    # Fuel Price Pressure (Domestic petrol/diesel pump price pressure)
    fuel_price_disrupted = "CRITICAL (+18% to +25%)" if severity_pct > 50 else "HIGH (+8% to +15%)"
    fuel_price_optimized = "MODERATE (+5% to +10%)" if severity_pct > 50 else "LOW (+2% to +5%)"

    # Power Sector Stress
    power_stress_disrupted = "HIGH" if disrupted_gap_pct > 15 else "MEDIUM" if disrupted_gap_pct > 5 else "LOW"
    power_stress_optimized = "MEDIUM" if optimized_gap_pct > 15 else "LOW"

    return {
        "disruption_location": location,
        "severity_pct": severity_pct,
        "duration_days": duration_days,
        "demand_kbd": demand_kbd,
        "supply_loss_kbd": round(actual_supply_loss_kbd, 1),
        "total_supply_loss_mb": round((actual_supply_loss_kbd * duration_days) / 1000.0, 2),
        
        "comparisons": {
            "oil_price_usd": {
                "label": "Crude Price ($/bbl)",
                "baseline": round(base_oil_price, 2),
                "disruption": round(disrupted_oil_price, 2),
                "optimized": round(optimized_oil_price, 2)
            },
            "shipping_cost_usd": {
                "label": "Avg Shipping Cost ($/bbl)",
                "baseline": round(base_shipping_cost, 2),
                "disruption": round(disrupted_shipping_cost, 2),
                "optimized": round(optimized_shipping_cost, 2)
            },
            "supply_gap_kbd": {
                "label": "Supply Gap (kbd)",
                "baseline": 0.0,
                "disruption": round(disrupted_gap_kbd, 1),
                "optimized": round(optimized_gap_kbd, 1)
            },
            "supply_gap_pct": {
                "label": "Supply Gap (%)",
                "baseline": 0.0,
                "disruption": round(disrupted_gap_pct, 1),
                "optimized": round(optimized_gap_pct, 1)
            },
            "refinery_utilization": {
                "label": "Refinery Utilization (%)",
                "baseline": 100.0,
                "disruption": round(refinery_util_disrupted, 1),
                "optimized": round(refinery_util_optimized, 1)
            },
            "daily_import_cost_m": {
                "label": "Daily Import Cost ($M)",
                "baseline": round(baseline_daily_cost_m, 2),
                "disruption": round(disrupted_daily_cost_m, 2),
                "optimized": round(opt_daily_cost_m, 2)
            },
            "total_import_cost_b": {
                "label": "Cumulative Import Cost ($B)",
                "baseline": round(baseline_total_cost_b, 2),
                "disruption": round(disrupted_total_cost_b, 2),
                "optimized": round(optimized_total_cost_b, 2)
            },
            "trade_deficit_increase_b": {
                "label": "Trade Deficit Increase ($B)",
                "baseline": 0.0,
                "disruption": round(trade_deficit_disrupted, 2),
                "optimized": round(trade_deficit_optimized, 2)
            },
            "inflation_pressure_pct": {
                "label": "Inflation Impact (% CPI increase)",
                "baseline": 0.0,
                "disruption": round(inflation_disrupted, 2),
                "optimized": round(inflation_optimized, 2)
            },
            "gdp_drag_basis_points": {
                "label": "GDP Impact (basis points drag)",
                "baseline": 0.0,
                "disruption": round(gdp_disrupted, 1),
                "optimized": round(gdp_optimized, 1)
            },
            "fuel_price_pressure": {
                "label": "Retail Fuel Price Pressure",
                "baseline": "Baseline",
                "disruption": fuel_price_disrupted,
                "optimized": fuel_price_optimized
            },
            "power_sector_stress": {
                "label": "Power Grid Feedstock Stress",
                "baseline": "Low",
                "disruption": power_stress_disrupted,
                "optimized": power_stress_optimized
            }
        },

        "refinery_impacts": [
             {
                 "refinery": "Jamnagar RIL",
                 "normal_run_rate_pct": 100,
                 "disrupted_run_rate_pct": round(max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.72)), 2),
                 "shortfall_mbpd": round(1.24 * (1 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.72)) / 100.0), 3),
                 "primary_crude_affected": "Arab Light",
                 "severity": "CRITICAL" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.72))) > 40.0 else "HIGH" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.72))) >= 25.0 else "MEDIUM" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.72))) >= 10.0 else "LOW"
             },
             {
                 "refinery": "Jamnagar HPCL",
                 "normal_run_rate_pct": 100,
                 "disrupted_run_rate_pct": round(max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.68)), 2),
                 "shortfall_mbpd": round(0.18 * (1 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.68)) / 100.0), 3),
                 "primary_crude_affected": "Murban Crude",
                 "severity": "CRITICAL" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.68))) > 40.0 else "HIGH" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.68))) >= 25.0 else "MEDIUM" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.68))) >= 10.0 else "LOW"
             },
             {
                 "refinery": "Paradip IOCL",
                 "normal_run_rate_pct": 100,
                 "disrupted_run_rate_pct": round(max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.55)), 2),
                 "shortfall_mbpd": round(0.30 * (1 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.55)) / 100.0), 3),
                 "primary_crude_affected": "Basrah Heavy",
                 "severity": "CRITICAL" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.55))) > 40.0 else "HIGH" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.55))) >= 25.0 else "MEDIUM" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.55))) >= 10.0 else "LOW"
             },
             {
                 "refinery": "Kochi BPCL",
                 "normal_run_rate_pct": 100,
                 "disrupted_run_rate_pct": round(max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.48)), 2),
                 "shortfall_mbpd": round(0.31 * (1 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.48)) / 100.0), 3),
                 "primary_crude_affected": "Murban Crude",
                 "severity": "CRITICAL" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.48))) > 40.0 else "HIGH" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.48))) >= 25.0 else "MEDIUM" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.48))) >= 10.0 else "LOW"
             },
             {
                 "refinery": "Vizag HPCL",
                 "normal_run_rate_pct": 100,
                 "disrupted_run_rate_pct": round(max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.61)), 2),
                 "shortfall_mbpd": round(0.17 * (1 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.61)) / 100.0), 3),
                 "primary_crude_affected": "Basrah Heavy",
                 "severity": "CRITICAL" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.61))) > 40.0 else "HIGH" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.61))) >= 25.0 else "MEDIUM" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.61))) >= 10.0 else "LOW"
             },
             {
                 "refinery": "Chennai CPCL",
                 "normal_run_rate_pct": 100,
                 "disrupted_run_rate_pct": round(max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.52)), 2),
                 "shortfall_mbpd": round(0.21 * (1 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.52)) / 100.0), 3),
                 "primary_crude_affected": "Arab Light",
                 "severity": "CRITICAL" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.52))) > 40.0 else "HIGH" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.52))) >= 25.0 else "MEDIUM" if (100.0 - max(0.0, 100.0 - ((severity_pct if location == "Hormuz" else 0.0) * 0.52))) >= 10.0 else "LOW"
             }
         ],
         
         "power_sector_stress": {
             "overall_level": "CRITICAL" if disrupted_gap_pct > 15 else "HIGH" if disrupted_gap_pct > 8 else "MEDIUM" if disrupted_gap_pct > 3 else "LOW",
             "naphtha_feedstock_diversion_required": disrupted_gap_pct > 8,
             "fuel_oil_shortfall_pct": round(disrupted_gap_pct * 1.5 if disrupted_gap_pct > 15 else disrupted_gap_pct * 1.2 if disrupted_gap_pct > 8 else disrupted_gap_pct * 0.8 if disrupted_gap_pct > 3 else disrupted_gap_pct * 0.5, 2),
             "states_most_affected": ["Gujarat", "Odisha", "Kerala", "Andhra Pradesh"],
             "estimated_load_shedding_hours_per_day": round(disrupted_gap_pct * 0.3 if disrupted_gap_pct > 15 else disrupted_gap_pct * 0.15 if disrupted_gap_pct > 8 else 0.5 if disrupted_gap_pct > 3 else 0.0, 1),
             "explanation": f"Critical crude supply shortfall of {disrupted_gap_pct:.1f}% forces emergency redirection of naphtha feeds from power generation to refiners." if disrupted_gap_pct > 15 else f"High supply disruption at {location} leads to domestic fuel oil deficits and localized power grid stress." if disrupted_gap_pct > 8 else "Moderate fuel oil reserve draws prevent widespread load shedding, but industrial margins remain strained." if disrupted_gap_pct > 3 else "Power sector operations remain normal with sufficient backup coal and gas generation."
         },
         
         "grade_compatibility_matrix": [
             {
                 "alternative_crude": "Bonny Light (Nigeria)",
                 "api_gravity": 33.9,
                 "sulfur_pct": 0.14,
                 "compatible_refineries": ["Jamnagar RIL", "Kochi BPCL", "Paradip IOCL"],
                 "incompatible_refineries": ["Vizag HPCL"],
                 "compatibility_notes": "Low sulfur sweet crude — requires desulfurizer bypass",
                 "spot_premium_usd_bbl": 1.80
             },
             {
                 "alternative_crude": "WTI Light Sweet (USA)",
                 "api_gravity": 39.6,
                 "sulfur_pct": 0.24,
                 "compatible_refineries": ["Jamnagar RIL", "Kochi BPCL", "Paradip IOCL", "Vizag HPCL", "Chennai CPCL"],
                 "incompatible_refineries": [],
                 "compatibility_notes": "Universal compatibility — premium pricing applies",
                 "spot_premium_usd_bbl": 3.20
             },
             {
                 "alternative_crude": "Murban (UAE)",
                 "api_gravity": 40.5,
                 "sulfur_pct": 0.77,
                 "compatible_refineries": ["Jamnagar RIL", "Jamnagar HPCL", "Kochi BPCL"],
                 "incompatible_refineries": ["Chennai CPCL", "Paradip IOCL"],
                 "compatibility_notes": "Medium sour — needs CDU configuration adjustment",
                 "spot_premium_usd_bbl": 0.90
             },
             {
                 "alternative_crude": "Johan Sverdrup (Norway)",
                 "api_gravity": 28.3,
                 "sulfur_pct": 0.90,
                 "compatible_refineries": ["Jamnagar RIL", "Paradip IOCL"],
                 "incompatible_refineries": ["Kochi BPCL", "Vizag HPCL", "Chennai CPCL"],
                 "compatibility_notes": "Heavy sour — only high-conversion refineries compatible",
                 "spot_premium_usd_bbl": -0.50
             }
         ],
        
        "explanation": f"The disruption of the {location} corridor affects {round(actual_supply_loss_kbd, 1)} kbd of Indian crude oil imports. "
                      f"Without intervention, this leads to an estimated refinery capacity drop of {round(disrupted_gap_pct, 1)}% "
                      f"and adds ${round(trade_deficit_disrupted, 2)} Billion to the trade deficit due to Brent crude spiking to ${round(disrupted_oil_price, 2)}. "
                      f"Under the AI-Optimized Response, drawing down the Strategic Petroleum Reserve by {round(spr_contribution_kbd, 1)} kbd and procurement reallocations "
                      f"of {round(alt_procure_contribution_kbd, 1)} kbd reduce the national supply shortfall to {round(optimized_gap_pct, 1)}%."
    }
