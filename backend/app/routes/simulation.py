from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from typing import List
from ..database import get_db
from ..models import Simulation
from ..schemas import SimulationResponse, SimulationCreate
from ..services.simulation import simulate_disruption

router = APIRouter(prefix="/simulate", tags=["Crisis Simulation"])

@router.post("", response_model=SimulationResponse)
def run_simulation(config: SimulationCreate, db: Session = Depends(get_db)):
    """
    Triggers a crisis simulation and stores the resulting metrics, pricing spikes,
    refinery utilization drops, and macroeconomic impacts in the database.
    """
    try:
        # Run simulation service model
        results_dict = simulate_disruption(
            location=config.disruption_location,
            severity_pct=config.severity_pct,
            duration_days=config.duration_days,
            base_oil_price=config.base_oil_price,
            base_shipping_cost=config.shipping_cost,
            db=db
        )
        
        # Save to DB
        db_sim = Simulation(
            name=config.name,
            disruption_location=config.disruption_location,
            severity_pct=config.severity_pct,
            duration_days=config.duration_days,
            demand_kbd=config.demand_kbd,
            base_oil_price=config.base_oil_price,
            shipping_cost=config.shipping_cost,
            results=json.dumps(results_dict)
        )
        db.add(db_sim)
        db.commit()
        db.refresh(db_sim)
        
        return db_sim
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.get("", response_model=List[SimulationResponse])
def list_simulations(db: Session = Depends(get_db)):
    """
    Returns a log list of all past crisis simulations run.
    """
    return db.query(Simulation).order_by(Simulation.created_at.desc()).all()

@router.get("/{sim_id}", response_model=SimulationResponse)
def get_simulation_details(sim_id: int, db: Session = Depends(get_db)):
    """
    Returns full metrics for a specific historical simulation run.
    """
    db_sim = db.query(Simulation).filter(Simulation.id == sim_id).first()
    if not db_sim:
        raise HTTPException(status_code=404, detail="Simulation run not found")
    return db_sim
