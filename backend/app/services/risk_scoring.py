from sqlalchemy.orm import Session
from ..models import Event, Supplier, SystemConfig
import numpy as np

def calculate_corridor_risk(corridor: str, db: Session, config: SystemConfig = None) -> dict:
    """
    Calculates a 0-100 risk score for a specific maritime corridor (e.g., 'Hormuz', 'Red Sea').
    Returns the total score and the breakdown of sub-factors.
    """
    if not config:
        config = db.query(SystemConfig).first()
        if not config:
            # Fallback default weights
            config = SystemConfig(
                weight_geopolitical=0.25,
                weight_maritime=0.20,
                weight_sanctions=0.15,
                weight_shipping=0.15,
                weight_price_volatility=0.15,
                weight_alternative_availability=0.10
            )

    # Base baseline risks if no events
    baselines = {
        "Hormuz": 15.0,
        "Red Sea": 22.0,
        "Malacca": 12.0,
        "None": 5.0
    }
    base = baselines.get(corridor, 10.0)

    # Initialize risk sub-factors (0 to 100 scale)
    geopolitical = base
    maritime = base
    sanctions = base
    shipping = base
    price_volatility = base
    alternative_avail = base

    # Fetch active events affecting this corridor
    events = db.query(Event).filter(Event.affected_corridor == corridor).all()

    # Calculate risk multipliers from events
    if events:
        max_prob = max([e.disruption_probability for e in events])
        max_supply_pct = max([e.affected_supply_pct for e in events])

        for event in events:
            sev_multiplier = 1.0
            if event.severity == "MEDIUM":
                sev_multiplier = 1.5
            elif event.severity == "HIGH":
                sev_multiplier = 2.2
            elif event.severity == "CRITICAL":
                sev_multiplier = 3.5

            event_impact = event.disruption_probability * 35 * sev_multiplier * event.confidence
            
            # Map event types to specific risk dimensions
            title_lower = event.title.lower()
            summary_lower = event.summary.lower()
            
            if "sanction" in title_lower or "sanction" in summary_lower:
                sanctions = min(100.0, sanctions + event_impact)
                geopolitical = min(100.0, geopolitical + event_impact * 0.5)
            elif "attack" in title_lower or "military" in title_lower or "security" in title_lower or "drone" in title_lower:
                maritime = min(100.0, maritime + event_impact)
                geopolitical = min(100.0, geopolitical + event_impact * 0.8)
                shipping = min(100.0, shipping + event_impact * 0.6)
            elif "congestion" in title_lower or "delay" in title_lower or "port" in title_lower:
                shipping = min(100.0, shipping + event_impact)
                alternative_avail = min(100.0, alternative_avail + event_impact * 0.4)
            else:
                # General geopolitical event
                geopolitical = min(100.0, geopolitical + event_impact)
                maritime = min(100.0, maritime + event_impact * 0.4)
        
        # Calculate feedback loops (e.g. price volatility rises with high corridor risks and supply losses)
        volatility_boost = (max_prob * 40.0) + (max_supply_pct * 1.5)
        price_volatility = min(100.0, price_volatility + volatility_boost)
        
        # Alternative availability risk rises if severity is high
        alt_boost = (max_prob * 25.0)
        alternative_avail = min(100.0, alternative_avail + alt_boost)
    else:
        # Check general global oil market volatility if there is a general price volatility event
        global_events = db.query(Event).filter(Event.affected_corridor == "None").all()
        if global_events:
            price_volatility = min(100.0, price_volatility + 15.0)

    # Weighted calculation
    total_score = (
        geopolitical * config.weight_geopolitical +
        maritime * config.weight_maritime +
        sanctions * config.weight_sanctions +
        shipping * config.weight_shipping +
        price_volatility * config.weight_price_volatility +
        alternative_avail * config.weight_alternative_availability
    )

    # Ensure bounds
    total_score = round(max(0.0, min(100.0, total_score)), 1)
    
    # Classify Risk Level
    if total_score <= 20:
        level = "Very Low"
    elif total_score <= 40:
        level = "Low"
    elif total_score <= 60:
        level = "Medium"
    elif total_score <= 80:
        level = "High"
    else:
        level = "Critical"

    return {
        "corridor": corridor,
        "risk_score": total_score,
        "risk_level": level,
        "breakdown": {
            "Geopolitical Risk": round(geopolitical, 1),
            "Maritime Risk": round(maritime, 1),
            "Sanctions Risk": round(sanctions, 1),
            "Shipping Risk": round(shipping, 1),
            "Price Volatility": round(price_volatility, 1),
            "Alternative Availability": round(alternative_avail, 1)
        }
    }

def calculate_supplier_risk_score(supplier: Supplier, db: Session, config: SystemConfig = None) -> dict:
    """
    Calculates overall risk score for a specific supplier by incorporating supplier's own base geopolitical risk
    and the risk score of the corridor their shipping route crosses.
    """
    # Find which corridor the supplier's route crosses
    # We map supplier countries to their main corridors:
    # Iraq, Saudi Arabia -> Hormuz
    # Russia -> Red Sea
    # UAE -> None (since UAE Fujairah is outside Hormuz, utilizing the pipeline bypass)
    # Nigeria, US -> None (go via Cape of Good Hope, which has low chokepoint risk)
    # India Domestic -> None (Direct Offshore pipeline)
    
    corridor_map = {
        "Iraq": "Hormuz",
        "Saudi Arabia": "Hormuz",
        "Russia": "Red Sea",
        "UAE": "None",
        "Nigeria": "None",
        "United States": "None",
        "India Domestic": "None"
    }
    
    corridor = corridor_map.get(supplier.name, "None")
    corridor_data = calculate_corridor_risk(corridor, db, config)
    corridor_risk = corridor_data["risk_score"]
    
    # Supplier risk = 40% Supplier Geopolitical + 60% Corridor Risk
    supplier_risk = (supplier.geopolitical_risk * 0.4) + (corridor_risk * 0.6)
    supplier_risk = round(max(0.0, min(100.0, supplier_risk)), 1)
    
    if supplier_risk <= 20:
        level = "Very Low"
    elif supplier_risk <= 40:
        level = "Low"
    elif supplier_risk <= 60:
        level = "Medium"
    elif supplier_risk <= 80:
        level = "High"
    else:
        level = "Critical"
        
    return {
        "supplier_name": supplier.name,
        "corridor": corridor,
        "corridor_risk": corridor_risk,
        "base_geopolitical_risk": supplier.geopolitical_risk,
        "total_risk_score": supplier_risk,
        "risk_level": level,
        "breakdown": {
            "Corridor Risk Component": round(corridor_risk * 0.6, 1),
            "Country Risk Component": round(supplier.geopolitical_risk * 0.4, 1)
        }
    }
