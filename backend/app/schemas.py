from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# System Configuration Schemas
class SystemConfigBase(BaseModel):
    weight_geopolitical: float
    weight_maritime: float
    weight_sanctions: float
    weight_shipping: float
    weight_price_volatility: float
    weight_alternative_availability: float

class SystemConfigResponse(SystemConfigBase):
    id: int

    class Config:
        from_attributes = True

# Geopolitical Event Schemas
class EventBase(BaseModel):
    title: str
    summary: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    affected_corridor: str
    severity: str
    disruption_probability: float
    affected_supply_pct: float
    confidence: float
    verification_status: str
    source: str = "Simulated"

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Raw News text analyzer input schema
class RawNewsInput(BaseModel):
    news_text: str

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    crude_grade: str
    base_price: float
    shipping_cost: float
    transit_time_days: int
    tanker_availability: str
    capacity_kbd: float
    refinery_compatibility: float
    geopolitical_risk: float
    is_active: bool

class SupplierUpdate(BaseModel):
    base_price: Optional[float] = None
    shipping_cost: Optional[float] = None
    transit_time_days: Optional[int] = None
    tanker_availability: Optional[str] = None
    capacity_kbd: Optional[float] = None
    refinery_compatibility: Optional[float] = None
    geopolitical_risk: Optional[float] = None
    is_active: Optional[bool] = None

class SupplierResponse(SupplierBase):
    id: int

    class Config:
        from_attributes = True

# Shipping Route Schemas
class RouteBase(BaseModel):
    name: str
    source: str
    destination: str
    waypoints: str # JSON-serialized list of coords
    distance_nm: float
    base_transit_days: int
    chokepoints_crossed: str
    risk_score: float

class RouteResponse(RouteBase):
    id: int

    class Config:
        from_attributes = True

# Simulation Schemas
class SimulationCreate(BaseModel):
    name: str
    disruption_location: str # e.g. Hormuz, Red Sea
    severity_pct: float # 0 to 100
    duration_days: int
    demand_kbd: Optional[float] = 5000.0
    base_oil_price: Optional[float] = 80.0
    shipping_cost: Optional[float] = 3.0

class SimulationResponse(BaseModel):
    id: int
    name: str
    disruption_location: str
    severity_pct: float
    duration_days: int
    demand_kbd: float
    base_oil_price: float
    shipping_cost: float
    status: str
    created_at: datetime
    results: Optional[str] = None # JSON string

    class Config:
        from_attributes = True

# Decision Action Plan Schemas
class DecisionPlanApprove(BaseModel):
    status: str # APPROVED, REJECTED
    modified_actions: Optional[str] = None # JSON-serialized list of actions if edited by human

class DecisionPlanResponse(BaseModel):
    id: int
    simulation_id: int
    recommended_actions: str # JSON string
    priority: str
    expected_impact: str
    total_cost: float
    risk_level: str
    confidence: float
    reasoning: str
    alternative_strategies: Optional[str] = None # JSON string
    status: str
    approved_at: Optional[datetime] = None
    modified_actions: Optional[str] = None

    class Config:
        from_attributes = True
