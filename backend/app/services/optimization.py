from sqlalchemy.orm import Session
from ..models import Supplier, SystemConfig
from .risk_scoring import calculate_supplier_risk_score
from .routing import find_optimal_route
import numpy as np

def run_procurement_optimization(
    supply_gap_kbd: float,
    db: Session,
    closed_chokepoints: list = None,
    priority: str = "balanced" # lowest_cost, lowest_risk, fastest, balanced
) -> dict:
    """
    Evaluates alternative suppliers, ranks them using Multi-Criteria Decision Analysis (MCDA),
    and suggests an allocation plan to bridge the supply gap.
    """
    suppliers = db.query(Supplier).filter(Supplier.name != "India Domestic", Supplier.is_active == True).all()
    config = db.query(SystemConfig).first()
    
    rankings = []
    
    # Evaluate each supplier
    for s in suppliers:
        # Calculate active route metrics using routing engine
        # Russian/Iraq routes might have detour parameters if Red Sea/Hormuz are closed
        route_info = find_optimal_route(
            source=s.name, 
            destination="Jamnagar Port", 
            db=db, 
            priority=priority, 
            closed_chokepoints=closed_chokepoints
        )
        
        # Calculate active supplier risk
        risk_info = calculate_supplier_risk_score(s, db, config)
        total_risk = risk_info["total_risk_score"]
        
        # Override supplier price & transit if detoured
        delivered_cost = s.base_price + route_info["cost_per_barrel"]
        transit_days = route_info["transit_time_days"]
        
        # Scoring criteria (normalized 0 to 100, where 100 is best)
        # Cost Score: cheaper is better. Benchmark: 60 USD (100 pts) to 110 USD (0 pts)
        cost_score = max(0.0, min(100.0, (110.0 - delivered_cost) / 50.0 * 100))
        
        # Risk Score: lower risk is better.
        risk_score = 100.0 - total_risk
        
        # Transit Time Score: faster is better. Benchmark: 1 day (100 pts) to 40 days (0 pts)
        transit_score = max(0.0, min(100.0, (40.0 - transit_days) / 39.0 * 100))
        
        # Compatibility: direct mapping (1.0 = 100 pts)
        compat_score = s.refinery_compatibility * 100.0
        
        # Capacity: higher is better. Benchmark: 0 (0 pts) to 2000 kbd (100 pts)
        capacity_score = max(0.0, min(100.0, (s.capacity_kbd / 2000.0) * 100))
        
        # Define MCDA Weights based on priority
        if priority == "lowest_cost":
            weights = {"cost": 0.50, "risk": 0.10, "transit": 0.10, "compat": 0.20, "capacity": 0.10}
        elif priority == "lowest_risk":
            weights = {"cost": 0.10, "risk": 0.50, "transit": 0.10, "compat": 0.20, "capacity": 0.10}
        elif priority == "fastest":
            weights = {"cost": 0.10, "risk": 0.10, "transit": 0.50, "compat": 0.20, "capacity": 0.10}
        else: # balanced
            weights = {"cost": 0.30, "risk": 0.25, "transit": 0.15, "compat": 0.20, "capacity": 0.10}
            
        final_score = (
            cost_score * weights["cost"] +
            risk_score * weights["risk"] +
            transit_score * weights["transit"] +
            compat_score * weights["compat"] +
            capacity_score * weights["capacity"]
        )
        
        final_score = round(final_score, 1)

        # Build qualitative explanations
        advantages = []
        risks_list = []
        
        if s.refinery_compatibility >= 0.95:
            advantages.append("Excellent refinery compatibility - no blending needed.")
        if delivered_cost < 78.0:
            advantages.append("Highly cost-effective delivered pricing.")
        if transit_days < 15:
            advantages.append("Short logistics lead time.")
            
        if total_risk > 60:
            risks_list.append("High geopolitical exposure near corridor/supplier.")
        if transit_days > 25:
            risks_list.append("Long shipping transit window, increasing supply vulnerability.")
        if s.refinery_compatibility < 0.90:
            risks_list.append("Requires blending with sweeter grades at Indian refineries.")
            
        if not advantages:
            advantages.append("Stable secondary supply source.")
        if not risks_list:
            risks_list.append("Minimal operational risks.")

        rankings.append({
            "supplier_name": s.name,
            "score": final_score,
            "delivered_cost_per_barrel": round(delivered_cost, 2),
            "transit_days": transit_days,
            "refinery_compatibility": s.refinery_compatibility,
            "available_capacity_kbd": s.capacity_kbd,
            "geopolitical_risk_score": total_risk,
            "advantages": advantages,
            "risks": risks_list,
            "route_taken": route_info["path"]
        })
        
    # Sort by score descending
    rankings.sort(key=lambda x: x["score"], reverse=True)
    
    # Calculate recommended procurement allocation to fill supply gap
    allocated_gap = 0.0
    allocation_plan = []
    
    for rank in rankings:
        if allocated_gap >= supply_gap_kbd:
            break
            
        needed = supply_gap_kbd - allocated_gap
        # We assume we can procure up to 40% of the supplier's available capacity for emergency allocation
        max_allocatable = rank["available_capacity_kbd"] * 0.4
        allocated_amount = min(needed, max_allocatable)
        
        if allocated_amount > 0:
            allocated_gap += allocated_amount
            allocation_plan.append({
                "supplier_name": rank["supplier_name"],
                "allocated_volume_kbd": round(allocated_amount, 1),
                "share_pct": round(allocated_amount / supply_gap_kbd * 100.0, 1),
                "delivered_cost_million_usd_daily": round(allocated_amount * 1000 * rank["delivered_cost_per_barrel"] / 1000000.0, 3),
                "days_to_arrival": rank["transit_days"]
            })
            
    # If gap is not fully filled
    unfilled_gap = max(0.0, supply_gap_kbd - allocated_gap)
    
    return {
        "supply_gap_kbd": supply_gap_kbd,
        "filled_volume_kbd": round(allocated_gap, 1),
        "unfilled_volume_kbd": round(unfilled_gap, 1),
        "rankings": rankings,
        "allocation_plan": allocation_plan,
        "success": True
    }

def optimize_spr_drawdown(
    total_supply_loss_kbd: float,
    duration_days: int,
    db: Session,
    current_spr_level_mb: float = 39.5, # India's current commercial+strategic SPR capacity ~ 39.5 Million Barrels (approx 9 days demand)
    min_reserve_threshold_pct: float = 20.0 # Maintain at least 20% emergency buffer
) -> dict:
    """
    Optimizes SPR drawdown over a timeline of disruption.
    Ensures draw rate is phased to prevent sudden exhaustion and accounts for alternative cargo arrival timelines.
    """
    # Max daily withdrawal rate constraint (e.g. 500 kbd total across Visakhapatnam, Mangalore, Padur)
    MAX_DAILY_DRAW_KBD = 600.0
    
    min_reserve_mb = current_spr_level_mb * (min_reserve_threshold_pct / 100.0)
    usable_reserve_mb = current_spr_level_mb - min_reserve_mb
    
    # We build a schedule by dividing the timeline into 4 phases:
    # Phase 1: Days 1-7 (Immediate Buffer - Moderate release as situation is evaluated)
    # Phase 2: Days 8-15 (Peak Shortage - Higher release as tankers are re-routed but haven't arrived)
    # Phase 3: Days 16-24 (Alternative Arrival - Ramp down SPR drawdown as alternative suppliers arrive)
    # Phase 4: Days 25+ (Stabilization & Replenishment preparation)
    
    schedule = []
    remaining_reserve_mb = current_spr_level_mb
    total_drawn_mb = 0.0
    
    for day in range(1, duration_days + 1):
        if remaining_reserve_mb <= min_reserve_mb:
            # SPR exhausted to safety threshold
            daily_draw = 0.0
            phase = "Critical Safety Threshold Reached"
        else:
            # Determine daily draw based on phase
            if day <= 7:
                # Buffer phase: draw 50% of the daily loss, up to maximum capacity
                daily_draw = min(total_supply_loss_kbd * 0.5, MAX_DAILY_DRAW_KBD)
                phase = "Immediate Buffer (Days 1-7)"
            elif day <= 15:
                # Shortage phase: draw up to 80% of daily loss as inventories dry up
                daily_draw = min(total_supply_loss_kbd * 0.8, MAX_DAILY_DRAW_KBD)
                phase = "Peak Disruption (Days 8-15)"
            elif day <= 23:
                # Transition phase: alternative oil begins to arrive. Drawdown ramps down
                daily_draw = min(total_supply_loss_kbd * 0.3, MAX_DAILY_DRAW_KBD)
                phase = "Alternative Arrival (Days 16-23)"
            else:
                # Stabilization phase
                daily_draw = min(total_supply_loss_kbd * 0.1, MAX_DAILY_DRAW_KBD)
                phase = "Stabilization & Recovery (Days 24+)"
                
        # Draw from reserve (convert kbd to mb/day: 1 kbd * 1 day = 1000 barrels = 0.001 million barrels)
        draw_mb = daily_draw * 0.001
        
        # Ensure we don't breach safety minimum
        if remaining_reserve_mb - draw_mb < min_reserve_mb:
            draw_mb = remaining_reserve_mb - min_reserve_mb
            daily_draw = draw_mb / 0.001
            
        remaining_reserve_mb -= draw_mb
        total_drawn_mb += draw_mb
        
        # Append weekly/phase snapshots for cleaner UI visualization (we can return daily but return summarized blocks or daily values)
        schedule.append({
            "day": day,
            "phase": phase,
            "drawdown_rate_kbd": round(daily_draw, 1),
            "drawn_volume_mb": round(draw_mb, 4),
            "remaining_reserve_mb": round(remaining_reserve_mb, 2),
            "reserve_capacity_pct": round(remaining_reserve_mb / current_spr_level_mb * 100.0, 1)
        })
        
    avg_drawdown_kbd = (total_drawn_mb / 0.001) / duration_days if duration_days > 0 else 0.0
    
    return {
        "initial_reserve_mb": current_spr_level_mb,
        "remaining_reserve_mb": round(remaining_reserve_mb, 2),
        "total_drawn_mb": round(total_drawn_mb, 2),
        "reserve_depletion_pct": round(total_drawn_mb / current_spr_level_mb * 100.0, 1),
        "safety_threshold_mb": round(min_reserve_mb, 2),
        "avg_drawdown_rate_kbd": round(avg_drawdown_kbd, 1),
        "schedule": schedule,
        "is_safe": remaining_reserve_mb > min_reserve_mb,
        "recommendation": "SPR release plan is sustainable." if remaining_reserve_mb > min_reserve_mb else "WARNING: SPR drawdown breaches safety buffer. Immediate alternative crude imports required!"
    }
