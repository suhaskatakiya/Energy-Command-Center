import json
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import Supplier, Route, SystemConfig, Event

IMPORT_DEPENDENCY_PCT     = 88.0       # % of crude from imports
HORMUZ_EXPOSURE_PCT       = 42.5       # midpoint of 40-45% PS range
SPR_DAYS_COVER            = 9.5        # days of national consumption
SPR_TOTAL_CAPACITY_MMT    = 5.33       # million metric tonnes
SPR_SITES = [
  { "name": "Visakhapatnam", "capacity_mmt": 1.33 },
  { "name": "Mangaluru",     "capacity_mmt": 1.50 },
  { "name": "Padur",         "capacity_mmt": 2.50 }
]
MCKINSEY_UNAUTOMATED_DELAY_DAYS = 47  # extra days without AI
BRENT_SHOCK_PCT_2025        = 8.0     # % spike in 2025 US-Iran standoff

REFINERY_CAPACITIES = [
  { "name": "Jamnagar RIL",   "capacity_mbpd": 1.24,
    "operator": "Reliance",   "port": "Jamnagar",
    "accepted_api_min": 20,   "accepted_api_max": 45 },
  { "name": "Jamnagar HPCL",  "capacity_mbpd": 0.18,
    "operator": "HPCL-Mittal","port": "Jamnagar",
    "accepted_api_min": 22,   "accepted_api_max": 40 },
  { "name": "Paradip IOCL",   "capacity_mbpd": 0.30,
    "operator": "IOCL",       "port": "Paradip",
    "accepted_api_min": 25,   "accepted_api_max": 42 },
  { "name": "Kochi BPCL",     "capacity_mbpd": 0.31,
    "operator": "BPCL",       "port": "Kochi",
    "accepted_api_min": 28,   "accepted_api_max": 44 },
  { "name": "Vizag HPCL",     "capacity_mbpd": 0.17,
    "operator": "HPCL",       "port": "Vizag",
    "accepted_api_min": 24,   "accepted_api_max": 41 },
  { "name": "Chennai CPCL",   "capacity_mbpd": 0.21,
    "operator": "CPCL",       "port": "Chennai",
    "accepted_api_min": 26,   "accepted_api_max": 43 }
]

def seed_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if database is already seeded
        if db.query(Supplier).first():
            print("Database already seeded.")
            print(f"VERIFICATION: Constants loaded: IMPORT_DEPENDENCY={IMPORT_DEPENDENCY_PCT}%, HORMUZ_EXPOSURE={HORMUZ_EXPOSURE_PCT}%, SPR_DAYS={SPR_DAYS_COVER}")
            return

        print("Seeding database...")
        print(f"VERIFICATION: Seeding constants: IMPORT_DEPENDENCY={IMPORT_DEPENDENCY_PCT}%, HORMUZ_EXPOSURE={HORMUZ_EXPOSURE_PCT}%, SPR_DAYS={SPR_DAYS_COVER}")

        # 1. Seed System Configuration
        config = SystemConfig(
            id=1,
            weight_geopolitical=0.25,
            weight_maritime=0.20,
            weight_sanctions=0.15,
            weight_shipping=0.15,
            weight_price_volatility=0.15,
            weight_alternative_availability=0.10
        )
        db.add(config)

        # 2. Seed Suppliers
        suppliers = [
            Supplier(
                name="Iraq",
                latitude=30.5081,
                longitude=47.7835,
                crude_grade="Basra Medium",
                base_price=78.50,
                shipping_cost=2.80,
                transit_time_days=14,
                tanker_availability="HIGH",
                capacity_kbd=1200.0, # India buys about 1.2M barrels/day from Iraq
                refinery_compatibility=0.95,
                geopolitical_risk=45.0,
                is_active=True
            ),
            Supplier(
                name="Saudi Arabia",
                latitude=26.6368,
                longitude=50.1706,
                crude_grade="Arab Light",
                base_price=81.20,
                shipping_cost=2.60,
                transit_time_days=12,
                tanker_availability="HIGH",
                capacity_kbd=850.0,
                refinery_compatibility=0.98,
                geopolitical_risk=35.0,
                is_active=True
            ),
            Supplier(
                name="Russia",
                latitude=60.3639,
                longitude=28.6186,
                crude_grade="Urals",
                base_price=68.00, # Discounted price
                shipping_cost=6.50, # High shipping cost due to distance
                transit_time_days=28,
                tanker_availability="MEDIUM",
                capacity_kbd=1600.0, # Currently India's largest supplier
                refinery_compatibility=0.88, # Requires blending at some refineries
                geopolitical_risk=65.0,
                is_active=True
            ),
            Supplier(
                name="UAE",
                latitude=25.1164,
                longitude=56.3601, # Fujairah (East Coast, outside Hormuz)
                crude_grade="Murban",
                base_price=82.50,
                shipping_cost=2.10,
                transit_time_days=10,
                tanker_availability="HIGH",
                capacity_kbd=400.0,
                refinery_compatibility=0.97,
                geopolitical_risk=20.0,
                is_active=True
            ),
            Supplier(
                name="Nigeria",
                latitude=4.4372,
                longitude=7.1685,
                crude_grade="Bonny Light",
                base_price=84.00,
                shipping_cost=4.80,
                transit_time_days=22,
                tanker_availability="MEDIUM",
                capacity_kbd=250.0,
                refinery_compatibility=0.92,
                geopolitical_risk=40.0,
                is_active=True
            ),
            Supplier(
                name="United States",
                latitude=29.7604,
                longitude=-95.3698,
                crude_grade="WTI",
                base_price=76.20,
                shipping_cost=7.50,
                transit_time_days=35,
                tanker_availability="HIGH",
                capacity_kbd=300.0,
                refinery_compatibility=0.85, # Sweeter/lighter than usual Indian refinery setups
                geopolitical_risk=10.0,
                is_active=True
            ),
            Supplier(
                name="India Domestic",
                latitude=19.4167,
                longitude=71.3333, # Mumbai High
                crude_grade="Mumbai High",
                base_price=75.00,
                shipping_cost=0.50,
                transit_time_days=1,
                tanker_availability="HIGH",
                capacity_kbd=600.0, # Domestic production
                refinery_compatibility=1.00,
                geopolitical_risk=5.0,
                is_active=True
            )
        ]
        db.add_all(suppliers)

        # 3. Seed Routes
        # Note: Waypoints are arrays of [lat, lng] representing the route visually on a map.
        routes = [
            Route(
                name="Persian Gulf Route (Hormuz)",
                source="Saudi Arabia",
                destination="Jamnagar Port",
                waypoints=json.dumps([
                    [26.6368, 50.1706], # Ras Tanura
                    [26.0, 52.0],
                    [26.3, 56.4],       # Strait of Hormuz
                    [25.0, 57.5],       # Gulf of Oman
                    [22.0, 63.0],       # Arabian Sea
                    [22.4707, 70.0577]  # Jamnagar Port
                ]),
                distance_nm=1200.0,
                base_transit_days=12,
                chokepoints_crossed="Hormuz",
                risk_score=15.0
            ),
            Route(
                name="Persian Gulf Route (Hormuz) - Iraq",
                source="Iraq",
                destination="Jamnagar Port",
                waypoints=json.dumps([
                    [30.5081, 47.7835], # Basra
                    [29.0, 49.0],
                    [26.0, 52.0],
                    [26.3, 56.4],       # Strait of Hormuz
                    [25.0, 57.5],       # Gulf of Oman
                    [22.0, 63.0],       # Arabian Sea
                    [22.4707, 70.0577]  # Jamnagar Port
                ]),
                distance_nm=1400.0,
                base_transit_days=14,
                chokepoints_crossed="Hormuz",
                risk_score=18.0
            ),
            Route(
                name="Red Sea Route (Suez)",
                source="Russia",
                destination="Kochi Port",
                waypoints=json.dumps([
                    [60.3639, 28.6186], # Baltic Sea (Primorsk)
                    [57.0, 10.0],       # North Sea
                    [48.0, -5.0],       # Atlantic Ocean
                    [36.0, -6.0],       # Strait of Gibraltar
                    [35.0, 18.0],       # Mediterranean Sea
                    [30.0, 32.5],       # Suez Canal
                    [20.0, 39.0],       # Red Sea
                    [12.8, 43.2],       # Bab-el-Mandeb
                    [11.8, 51.0],       # Gulf of Aden
                    [9.9312, 76.2673]   # Kochi Port
                ]),
                distance_nm=6500.0,
                base_transit_days=28,
                chokepoints_crossed="Red Sea",
                risk_score=25.0
            ),
            Route(
                name="Fujairah Bypass Route",
                source="UAE",
                destination="Jamnagar Port",
                waypoints=json.dumps([
                    [25.1164, 56.3601], # Fujairah (outside Hormuz)
                    [24.0, 59.0],
                    [22.0, 65.0],       # Arabian Sea
                    [22.4707, 70.0577]  # Jamnagar Port
                ]),
                distance_nm=950.0,
                base_transit_days=10,
                chokepoints_crossed="None",
                risk_score=8.0
            ),
            Route(
                name="West Africa Cape Route",
                source="Nigeria",
                destination="Paradip Port",
                waypoints=json.dumps([
                    [4.4372, 7.1685],   # Bonny Island
                    [-5.0, 0.0],        # South Atlantic
                    [-34.35, 18.5],     # Cape of Good Hope
                    [-30.0, 40.0],      # South Indian Ocean
                    [-10.0, 65.0],      # Indian Ocean
                    [5.0, 80.0],
                    [20.2606, 86.6664]  # Paradip Port
                ]),
                distance_nm=7200.0,
                base_transit_days=22,
                chokepoints_crossed="None",
                risk_score=10.0
            ),
            Route(
                name="Transatlantic / Cape Route",
                source="United States",
                destination="Paradip Port",
                waypoints=json.dumps([
                    [29.7604, -95.3698],# Houston
                    [25.0, -80.0],      # Gulf of Mexico
                    [10.0, -40.0],      # Atlantic Ocean
                    [-34.35, 18.5],     # Cape of Good Hope
                    [-30.0, 45.0],      # South Indian Ocean
                    [0.0, 75.0],        # Indian Ocean
                    [20.2606, 86.6664]  # Paradip Port
                ]),
                distance_nm=11500.0,
                base_transit_days=35,
                chokepoints_crossed="None",
                risk_score=12.0
            ),
            Route(
                name="Domestic Offshore Line",
                source="India Domestic",
                destination="Jamnagar Port",
                waypoints=json.dumps([
                    [19.4167, 71.3333], # Mumbai High
                    [20.5, 71.5],
                    [22.4707, 70.0577]  # Jamnagar Port
                ]),
                distance_nm=200.0,
                base_transit_days=1,
                chokepoints_crossed="None",
                risk_score=2.0
            )
        ]
        db.add_all(routes)

        # 4. Seed baseline events (Historical/Reported but Low Impact)
        events = [
            Event(
                title="Suez Canal Maintenance Operations",
                summary="Routine dredging operations in the Suez Canal are causing brief transit delays of up to 4 hours. No significant impact on commercial shipping volumes is reported.",
                location="Suez Canal",
                latitude=30.0,
                longitude=32.5,
                affected_corridor="Red Sea",
                severity="LOW",
                disruption_probability=0.05,
                affected_supply_pct=0.0,
                confidence=0.95,
                verification_status="CONFIRMED",
                source="Suez Canal Authority"
            ),
            Event(
                title="Routine Maritime Security Drills",
                summary="Joint naval task forces are conducting routine security drills in the Gulf of Oman and near the Strait of Hormuz to ensure free passage of trade ships. High naval presence acts as a stabilizer.",
                location="Gulf of Oman",
                latitude=25.0,
                longitude=57.5,
                affected_corridor="Hormuz",
                severity="LOW",
                disruption_probability=0.02,
                affected_supply_pct=0.0,
                confidence=0.90,
                verification_status="CONFIRMED",
                source="Combined Maritime Forces"
            )
        ]
        db.add_all(events)

        db.commit()
        print("Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
