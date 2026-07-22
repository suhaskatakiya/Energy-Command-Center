from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from .database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    affected_corridor = Column(String, nullable=False) # e.g. Hormuz, Red Sea, Malacca, None
    severity = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    disruption_probability = Column(Float, default=0.0) # 0.0 to 1.0
    affected_supply_pct = Column(Float, default=0.0) # 0.0 to 100.0
    confidence = Column(Float, default=1.0) # 0.0 to 1.0
    verification_status = Column(String, nullable=False) # CONFIRMED, REPORTED, UNVERIFIED, FORECAST, HISTORICAL
    source = Column(String, default="Simulated")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    crude_grade = Column(String, nullable=False) # e.g. Arab Light, Urals, Brent, Murban
    base_price = Column(Float, nullable=False) # USD/barrel
    shipping_cost = Column(Float, nullable=False) # USD/barrel
    transit_time_days = Column(Integer, nullable=False)
    tanker_availability = Column(String, nullable=False) # LOW, MEDIUM, HIGH
    capacity_kbd = Column(Float, nullable=False) # Thousand Barrels per Day
    refinery_compatibility = Column(Float, nullable=False) # 0.0 to 1.0 scale
    geopolitical_risk = Column(Float, nullable=False) # 0 to 100
    is_active = Column(Boolean, default=True)

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    waypoints = Column(Text, nullable=False) # JSON-serialized list of lists of coords: [[lat, lng], [lat, lng], ...]
    distance_nm = Column(Float, nullable=False)
    base_transit_days = Column(Integer, nullable=False)
    chokepoints_crossed = Column(String, nullable=False) # Comma-separated (e.g. "Hormuz", "Red Sea")
    risk_score = Column(Float, default=0.0) # 0 to 100

class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    weight_geopolitical = Column(Float, default=0.25)
    weight_maritime = Column(Float, default=0.20)
    weight_sanctions = Column(Float, default=0.15)
    weight_shipping = Column(Float, default=0.15)
    weight_price_volatility = Column(Float, default=0.15)
    weight_alternative_availability = Column(Float, default=0.10)

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    disruption_location = Column(String, nullable=False) # e.g. Hormuz, Red Sea
    severity_pct = Column(Float, nullable=False) # 0.0 to 100.0
    duration_days = Column(Integer, nullable=False)
    demand_kbd = Column(Float, default=5000.0) # India demand in kbd (default 5 million barrels/day)
    base_oil_price = Column(Float, default=80.0)
    shipping_cost = Column(Float, default=3.0)
    status = Column(String, default="COMPLETED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    results = Column(Text, nullable=True) # JSON dump of the simulated metrics and impacts

class DecisionPlan(Base):
    __tablename__ = "decision_plans"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False)
    recommended_actions = Column(Text, nullable=False) # JSON-serialized list of actions
    priority = Column(String, default="MEDIUM") # HIGH, MEDIUM, LOW
    expected_impact = Column(Text, nullable=False)
    total_cost = Column(Float, nullable=False)
    risk_level = Column(String, default="LOW")
    confidence = Column(Float, default=0.8)
    reasoning = Column(Text, nullable=False)
    alternative_strategies = Column(Text, nullable=True) # JSON-serialized alternate routes/suppliers
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    approved_at = Column(DateTime(timezone=True), nullable=True)
    modified_actions = Column(Text, nullable=True) # JSON-serialized modified action items
