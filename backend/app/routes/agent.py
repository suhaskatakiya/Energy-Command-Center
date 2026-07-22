from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import Simulation, DecisionPlan
from ..schemas import DecisionPlanResponse, DecisionPlanApprove, RawNewsInput
from ..services.agent_engine import analyze_raw_news, orchestrate_decision_plan
from ..services.optimization import run_procurement_optimization, optimize_spr_drawdown

router = APIRouter(prefix="/agent", tags=["AI Agent & Decision Center"])

class OrchestrationRequest(BaseModel):
    simulation_id: int
    priority: str = "balanced"

@router.post("/analyze-news")
def parse_news(req: RawNewsInput):
    """
    Parses raw news text to extract structured events using Gemini LLM or fallback.
    """
    return analyze_raw_news(req.news_text)

@router.post("/orchestrate", response_model=DecisionPlanResponse)
def orchestrate_plan(req: OrchestrationRequest, db: Session = Depends(get_db)):
    """
    Aggregates the simulation reports, routes, procurement schedules, and SPR drawdowns.
    Invokes the Multi-Agent Orchestrator (with RAG context) to build the natural language action plan.
    """
    # 1. Fetch simulation details
    sim = db.query(Simulation).filter(Simulation.id == req.simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation run not found")
        
    sim_data = json.loads(sim.results)
    
    # 2. Run solvers based on simulation parameters
    closed_chokepoints = [sim.disruption_location] if sim.disruption_location != "None" else []
    
    # Procurement solver
    opt_data = run_procurement_optimization(
        supply_gap_kbd=sim_data["supply_loss_kbd"],
        db=db,
        closed_chokepoints=closed_chokepoints,
        priority=req.priority
    )
    
    # SPR solver
    spr_data = optimize_spr_drawdown(
        total_supply_loss_kbd=sim_data["supply_loss_kbd"],
        duration_days=sim.duration_days,
        db=db
    )
    
    # 3. Call Decision Orchestrator
    plan_dict = orchestrate_decision_plan(
        sim_data=sim_data,
        opt_data=opt_data,
        spr_data=spr_data,
        db=db
    )
    
    # Check if a plan already exists for this simulation
    existing_plan = db.query(DecisionPlan).filter(DecisionPlan.simulation_id == req.simulation_id).first()
    if existing_plan:
        db.delete(existing_plan)
        db.commit()
        
    # Save plan to DB
    db_plan = DecisionPlan(
        simulation_id=req.simulation_id,
        recommended_actions=plan_dict["recommended_actions"],
        priority=plan_dict["priority"],
        expected_impact=plan_dict["expected_impact"],
        total_cost=plan_dict["total_cost"],
        risk_level=plan_dict["risk_level"],
        confidence=plan_dict["confidence"],
        reasoning=plan_dict["reasoning"],
        alternative_strategies=plan_dict["alternative_strategies"],
        status="PENDING"
    )
    
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    
    return db_plan

@router.get("/decision-plans/{sim_id}", response_model=DecisionPlanResponse)
def get_decision_plan(sim_id: int, db: Session = Depends(get_db)):
    """
    Returns the AI action plan associated with a specific simulation.
    """
    plan = db.query(DecisionPlan).filter(DecisionPlan.simulation_id == sim_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active decision plan for this simulation")
    return plan

@router.post("/decision-plans/{plan_id}/approve", response_model=DecisionPlanResponse)
def approve_decision_plan(plan_id: int, approval: DecisionPlanApprove, db: Session = Depends(get_db)):
    """
    Approves or rejects the recommendation plan (Human-in-the-Loop workflow).
    """
    plan = db.query(DecisionPlan).filter(DecisionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Decision plan not found")
        
    plan.status = approval.status
    plan.approved_at = datetime.utcnow() if approval.status == "APPROVED" else None
    
    if approval.modified_actions:
        plan.modified_actions = approval.modified_actions
        
    db.commit()
    db.refresh(plan)
    return plan
