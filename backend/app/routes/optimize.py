from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..services.optimization import run_procurement_optimization, optimize_spr_drawdown
from ..services.routing import find_optimal_route

router = APIRouter(prefix="/optimize", tags=["Logistics & Supply Optimization"])

class ProcurementRequest(BaseModel):
    supply_gap_kbd: float
    priority: str = "balanced"
    closed_chokepoints: Optional[List[str]] = None

class RoutingRequest(BaseModel):
    source: str
    destination: str
    priority: str = "balanced"
    closed_chokepoints: Optional[List[str]] = None

class SPRRequest(BaseModel):
    supply_loss_kbd: float
    duration_days: int
    current_spr_level_mb: Optional[float] = 39.5
    min_reserve_threshold_pct: Optional[float] = 20.0

@router.post("/procure")
def optimize_procurement(req: ProcurementRequest, db: Session = Depends(get_db)):
    """
    Ranks alternative supplier channels and allocates import volumes to cover the supply gap.
    """
    results = run_procurement_optimization(
        supply_gap_kbd=req.supply_gap_kbd,
        db=db,
        closed_chokepoints=req.closed_chokepoints or [],
        priority=req.priority
    )
    if not results["success"]:
        raise HTTPException(status_code=500, detail="Procurement optimization failed")
    return results

@router.post("/route")
def optimize_route(req: RoutingRequest, db: Session = Depends(get_db)):
    """
    Calculates the shortest shipping lane detours, transit durations, and cost surcharges.
    """
    results = find_optimal_route(
        source=req.source,
        destination=req.destination,
        db=db,
        priority=req.priority,
        closed_chokepoints=req.closed_chokepoints or []
    )
    if not results["success"]:
        raise HTTPException(status_code=400, detail=results.get("error", "Routing calculation failed"))
    return results

@router.post("/spr")
def optimize_spr(req: SPRRequest, db: Session = Depends(get_db)):
    """
    Schedules SPR drawdown limits over the disruption window to safeguard reserves.
    """
    return optimize_spr_drawdown(
        total_supply_loss_kbd=req.supply_loss_kbd,
        duration_days=req.duration_days,
        db=db,
        current_spr_level_mb=req.current_spr_level_mb,
        min_reserve_threshold_pct=req.min_reserve_threshold_pct
    )
