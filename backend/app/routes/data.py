from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Event, Supplier, Route, SystemConfig
from ..schemas import EventResponse, EventCreate, SupplierResponse, SupplierUpdate, SystemConfigResponse, SystemConfigBase, RouteResponse
from ..services.risk_scoring import calculate_corridor_risk, calculate_supplier_risk_score

router = APIRouter(prefix="/data", tags=["Data & Metrics"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Computes and returns the high-level metrics for the executive dashboard command center,
    including the National Energy Resilience Index and current alerts.
    """
    config = db.query(SystemConfig).first()
    
    # Calculate risks for all corridors
    hormuz_risk = calculate_corridor_risk("Hormuz", db, config)["risk_score"]
    redsea_risk = calculate_corridor_risk("Red Sea", db, config)["risk_score"]
    malacca_risk = calculate_corridor_risk("Malacca", db, config)["risk_score"]
    
    # Base resilience index starting at 100.
    # Deductions based on chokepoint risks and market conditions
    deductions = 0.0
    deductions += max(0.0, hormuz_risk * 0.45)  # Hormuz carries 40% of India's oil
    deductions += max(0.0, redsea_risk * 0.25)   # Red Sea carries 30%
    deductions += max(0.0, malacca_risk * 0.10)  # Malacca carries 10%
    
    # Check if there are active critical events
    active_events = db.query(Event).all()
    critical_alerts_count = sum(1 for e in active_events if e.severity in ["HIGH", "CRITICAL"])
    
    resilience_score = max(0.0, min(100.0, 100.0 - deductions))
    resilience_score = round(resilience_score, 1)
    
    # Determine risk level
    if resilience_score >= 80:
        resilience_status = "OPTIMAL"
        color = "green"
    elif resilience_score >= 60:
        resilience_status = "STABLE"
        color = "yellow"
    elif resilience_score >= 40:
        resilience_status = "VULNERABLE"
        color = "orange"
    else:
        resilience_status = "CRITICAL RISK"
        color = "red"
        
    # National supply metrics
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    total_capacity = sum([s.capacity_kbd for s in suppliers])
    
    # Current active supply (we assume base is full capacity except domestic which is 600 kbd)
    # Total India imports are around 4.4M b/d + 600k domestic = 5M b/d.
    current_supply_kbd = 0.0
    for s in suppliers:
        # If supplier is affected by a severe chokepoint event, reduce its current supply
        corridor = "Hormuz" if s.name in ["Iraq", "Saudi Arabia"] else "Red Sea" if s.name == "Russia" else "None"
        corridor_events = db.query(Event).filter(Event.affected_corridor == corridor, Event.severity.in_(["HIGH", "CRITICAL"])).all()
        
        loss_factor = 0.0
        if corridor_events:
            max_pct = max([e.affected_supply_pct for e in corridor_events])
            max_prob = max([e.disruption_probability for e in corridor_events])
            loss_factor = (max_pct / 100.0) * max_prob
            
        current_supply_kbd += s.capacity_kbd * (1.0 - loss_factor)
        
    current_supply_kbd = round(current_supply_kbd, 1)
    demand_kbd = 5000.0
    supply_gap_kbd = max(0.0, round(demand_kbd - current_supply_kbd, 1))
    supply_gap_pct = round((supply_gap_kbd / demand_kbd) * 100.0, 1)

    return {
        "energy_resilience_score": resilience_score,
        "energy_resilience_status": resilience_status,
        "resilience_color": color,
        "total_demand_kbd": demand_kbd,
        "active_supply_kbd": current_supply_kbd,
        "supply_gap_kbd": supply_gap_kbd,
        "supply_gap_pct": supply_gap_pct,
        "critical_alerts_count": critical_alerts_count,
        "chokepoint_risks": {
            "Strait of Hormuz": hormuz_risk,
            "Red Sea (Bab-el-Mandeb)": redsea_risk,
            "Strait of Malacca": malacca_risk
        }
    }

@router.get("/events", response_model=List[EventResponse])
def get_events(db: Session = Depends(get_db)):
    """
    Returns a list of all geopolitical events.
    """
    return db.query(Event).order_by(Event.created_at.desc()).all()

@router.post("/events", response_model=EventResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    """
    Creates a new geopolitical event (e.g. for the demo simulation flow).
    """
    db_event = Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/events/clear")
def clear_mock_events(db: Session = Depends(get_db)):
    """
    Clears all simulated high-severity events to reset the dashboard back to low risk.
    """
    db.query(Event).filter(Event.source == "Simulated").delete(synchronize_session=False)
    db.commit()
    return {"message": "Mock events cleared successfully."}

@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    """
    Returns all suppliers with updated risk scores reflecting active events.
    """
    config = db.query(SystemConfig).first()
    suppliers = db.query(Supplier).all()
    results = []
    
    for s in suppliers:
        risk_info = calculate_supplier_risk_score(s, db, config)
        # Update model properties temporarily or merge
        supplier_dict = s.__dict__.copy()
        supplier_dict["geopolitical_risk"] = risk_info["total_risk_score"]
        results.append(SupplierResponse(**supplier_dict))
        
    return results

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, updates: SupplierUpdate, db: Session = Depends(get_db)):
    """
    Updates configuration for a specific supplier.
    """
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    for key, val in updates.model_dump(exclude_unset=True).items():
        setattr(db_supplier, key, val)
        
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/routes", response_model=List[RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    """
    Returns shipping routes with updated risk scores.
    """
    routes = db.query(Route).all()
    results = []
    
    for r in routes:
        # Calculate route risk based on chokepoint crossed
        chokepoints = [c.strip() for c in r.chokepoints_crossed.split(",") if c.strip()]
        max_risk = 5.0
        for cp in chokepoints:
            cp_risk = calculate_corridor_risk(cp, db)["risk_score"]
            max_risk = max(max_risk, cp_risk)
            
        route_dict = r.__dict__.copy()
        route_dict["risk_score"] = max_risk
        results.append(RouteResponse(**route_dict))
        
    return results

@router.get("/config", response_model=SystemConfigResponse)
def get_config(db: Session = Depends(get_db)):
    """
    Returns current scoring weights.
    """
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.post("/config", response_model=SystemConfigResponse)
def update_config(config_updates: SystemConfigBase, db: Session = Depends(get_db)):
    """
    Updates scoring weights.
    """
    db_config = db.query(SystemConfig).first()
    if not db_config:
        db_config = SystemConfig(id=1)
        db.add(db_config)
        
    for key, val in config_updates.model_dump().items():
        setattr(db_config, key, val)
        
    db.commit()
    db.refresh(db_config)
    return db_config
