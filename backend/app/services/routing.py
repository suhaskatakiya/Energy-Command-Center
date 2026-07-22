import networkx as nx
import json
from sqlalchemy.orm import Session
from ..models import Route
from .risk_scoring import calculate_corridor_risk

def build_shipping_graph(db: Session, closed_chokepoints: list = None) -> nx.Graph:
    """
    Builds a NetworkX graph of the shipping network.
    Edges contain properties: distance, transit_days, base_risk, and active_risk.
    If a chokepoint is closed, its edges are heavily penalized or severed.
    """
    G = nx.Graph()
    if not closed_chokepoints:
        closed_chokepoints = []

    # Map of corridors and their current risk levels
    corridors = ["Hormuz", "Red Sea", "None"]
    risk_map = {}
    for corr in corridors:
        risk_map[corr] = calculate_corridor_risk(corr, db)["risk_score"]

    # We define the network nodes:
    # Suppliers
    # Ports
    # Chokepoints / Waypoints
    # Refineries
    
    # Standard edges representing the maritime routes:
    # Source, Target, Distance (NM), Base Transit Days, Chokepoint Crossed, Route Name
    edges_data = [
        # Gulf Route (Saudi via Hormuz)
        ("Saudi Arabia", "Hormuz Strait", 350.0, 3, "Hormuz", "Saudi-Hormuz Segment"),
        ("Hormuz Strait", "Gulf of Oman", 150.0, 1, "Hormuz", "Hormuz-Oman Segment"),
        ("Gulf of Oman", "Jamnagar Port", 700.0, 8, "None", "Oman-Jamnagar Segment"),
        
        # Gulf Route (Iraq via Hormuz)
        ("Iraq", "Hormuz Strait", 550.0, 5, "Hormuz", "Iraq-Hormuz Segment"),
        
        # UAE (Abu Dhabi) via Hormuz
        ("UAE (Abu Dhabi)", "Hormuz Strait", 100.0, 1, "Hormuz", "UAE-Hormuz Segment"),
        
        # UAE Pipeline Bypass (Fujairah is outside Hormuz, so UAE Abu Dhabi can pipe oil to Fujairah)
        ("Saudi Arabia", "Red Sea (Suez)", 800.0, 4, "Red Sea", "Saudi E-W Pipeline Bypass"), # East-West pipeline to Yanbu
        ("UAE", "Gulf of Oman", 150.0, 1, "None", "UAE Fujairah Pipeline segment"), # Fujairah pipeline bypass
        ("UAE", "Hormuz Strait", 100.0, 1, "Hormuz", "UAE Hormuz segment"),
        
        # Red Sea Route (Russia via Suez)
        ("Russia", "Suez Canal", 4500.0, 18, "None", "Baltic-Suez Segment"),
        ("Suez Canal", "Red Sea (Suez)", 200.0, 1, "Red Sea", "Suez Transit"),
        ("Red Sea (Suez)", "Bab-el-Mandeb", 1000.0, 5, "Red Sea", "Red Sea Segment"),
        ("Bab-el-Mandeb", "Gulf of Aden", 150.0, 1, "Red Sea", "Bab-el-Mandeb segment"),
        ("Gulf of Aden", "Kochi Port", 2000.0, 8, "None", "Aden-Kochi Segment"),
        ("Gulf of Aden", "Jamnagar Port", 1800.0, 7, "None", "Aden-Jamnagar Segment"),
        ("Gulf of Aden", "Paradip Port", 2600.0, 11, "None", "Aden-Paradip Segment"),
        
        # Cape Route (Alternative for Russia/US/West Africa)
        ("Russia", "Cape of Good Hope", 6500.0, 22, "None", "Russia-Cape Segment"),
        ("United States", "Cape of Good Hope", 600.0, 2, "None", "US-Cape segment"), # US Houston is closer to Cape route
        ("Nigeria", "Cape of Good Hope", 2500.0, 8, "None", "Nigeria-Cape Segment"),
        ("Cape of Good Hope", "Indian Ocean Segment", 4000.0, 12, "None", "Cape-IO Segment"),
        ("Indian Ocean Segment", "Kochi Port", 1200.0, 4, "None", "IO-Kochi Segment"),
        ("Indian Ocean Segment", "Paradip Port", 1500.0, 5, "None", "IO-Paradip Segment"),
        ("Indian Ocean Segment", "Jamnagar Port", 1800.0, 6, "None", "IO-Jamnagar Segment"),
        
        # Domestic line
        ("India Domestic", "Jamnagar Port", 200.0, 1, "None", "Domestic-Jamnagar")
    ]

    for u, v, dist, days, chokepoint, name in edges_data:
        # Calculate active risk based on corridor risk score
        active_risk = risk_map.get(chokepoint, 5.0)
        
        # If chokepoint is explicitly closed (severity is critical/closed), set extreme penalty
        is_closed = chokepoint in closed_chokepoints
        penalty_multiplier = 50.0 if is_closed else 1.0
        
        # Standard cost components: distance * shipping base rate ($0.001 per NM per barrel)
        base_freight_cost = dist * 0.0008
        risk_cost = base_freight_cost * (active_risk / 100.0) * 2.0
        total_cost_per_barrel = base_freight_cost + risk_cost

        G.add_edge(
            u, v,
            name=name,
            distance=dist,
            transit_days=days * penalty_multiplier,
            chokepoint=chokepoint,
            risk_score=active_risk,
            cost_per_barrel=total_cost_per_barrel * penalty_multiplier,
            is_closed=is_closed
        )

    return G

def find_optimal_route(
    source: str,
    destination: str,
    db: Session,
    priority: str = "balanced", # lowest_cost, lowest_risk, fastest, balanced
    closed_chokepoints: list = None
) -> dict:
    """
    Finds the optimal path between a supplier and an Indian port.
    Returns path nodes, transit days, total cost per barrel, path risk score, and description.
    """
    # Map raw supplier name to node names in graph
    supplier_nodes = {
        "Saudi Arabia": "Saudi Arabia",
        "Iraq": "Iraq",
        "Russia": "Russia",
        "UAE": "UAE", # Maps to Fujairah/UAE node
        "Nigeria": "Nigeria",
        "United States": "United States",
        "India Domestic": "India Domestic"
    }

    port_nodes = {
        "Jamnagar Port": "Jamnagar Port",
        "Kochi Port": "Kochi Port",
        "Paradip Port": "Paradip Port",
        "Jamnagar": "Jamnagar Port",
        "Kochi": "Kochi Port",
        "Paradip": "Paradip Port"
    }

    src_node = supplier_nodes.get(source, source)
    dest_node = port_nodes.get(destination, "Jamnagar Port")

    G = build_shipping_graph(db, closed_chokepoints)

    # If the source node is UAE, check if we bypass Hormuz by starting directly at Gulf of Oman (Fujairah)
    # UAE can export via Fujairah (represented as UAE connected to Gulf of Oman with risk 'None')
    # or via Abu Dhabi (UAE Hormuz segment with risk 'Hormuz')
    if source == "UAE":
        if "Hormuz" in (closed_chokepoints or []):
            # Must use Fujairah pipeline bypass
            src_node = "UAE"
        else:
            # Standard shipping from Persian Gulf is slightly cheaper
            src_node = "UAE"

    # Define edge weight mapping based on user priority
    def weight_func(u, v, d):
        is_closed = d.get("is_closed", False)
        if is_closed:
            return 999999.0
            
        cost = d.get("cost_per_barrel", 1.0)
        risk = d.get("risk_score", 0.0)
        days = d.get("transit_days", 1.0)

        if priority == "lowest_cost":
            return cost
        elif priority == "lowest_risk":
            return risk + (cost * 0.1) # Risk with minor cost tie-breaker
        elif priority == "fastest":
            return days
        else: # balanced
            # Standardized combination
            return cost * 10.0 + risk * 2.0 + days * 5.0

    try:
        path = nx.shortest_path(G, source=src_node, target=dest_node, weight=weight_func)
        
        # Calculate path properties
        total_dist = 0.0
        total_days = 0.0
        total_cost = 0.0
        max_risk = 0.0
        crossed = set()

        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            edge_data = G[u][v]
            total_dist += edge_data["distance"]
            total_days += edge_data["transit_days"]
            total_cost += edge_data["cost_per_barrel"]
            max_risk = max(max_risk, edge_data["risk_score"])
            if edge_data["chokepoint"] != "None":
                crossed.add(edge_data["chokepoint"])

        # Fetch coordinates mapping for visual route rendering
        # Retrieve path coordinates from standard seed route for Leaflet
        # We query the DB for a route connecting Source to Port to align coordinates
        db_route = db.query(Route).filter(Route.source == source).first()
        waypoints = []
        if db_route:
            waypoints = json.loads(db_route.waypoints)
            # If chokepoint is closed, modify waypoints to simulate the detour
            if source == "Russia" and "Red Sea" in (closed_chokepoints or []):
                # Detour coordinates around Cape of Good Hope
                waypoints = [
                    [60.3639, 28.6186],  # Primorsk
                    [50.0, -15.0],       # North Atlantic
                    [20.0, -20.0],
                    [-10.0, -10.0],
                    [-34.35, 18.5],      # Cape of Good Hope
                    [-30.0, 45.0],       # Indian Ocean
                    [0.0, 70.0],
                    [9.9312, 76.2673]    # Kochi Port
                ]
            elif source == "Saudi Arabia" and "Hormuz" in (closed_chokepoints or []):
                # Detour coordinates using pipeline to Red Sea then down to India
                waypoints = [
                    [26.6368, 50.1706],  # Ras Tanura
                    [24.0, 38.0],        # Yanbu Port (Red Sea Coast via pipeline)
                    [15.0, 41.5],        # Red Sea
                    [12.8, 43.2],        # Bab-el-Mandeb
                    [11.8, 51.0],        # Gulf of Aden
                    [22.4707, 70.0577]   # Jamnagar
                ]
            elif source == "UAE" and "Hormuz" in (closed_chokepoints or []):
                # UAE uses pipeline bypass to Fujairah
                waypoints = [
                    [25.1164, 56.3601],  # Fujairah Port
                    [24.0, 59.0],
                    [22.4707, 70.0577]   # Jamnagar
                ]

        return {
            "source": source,
            "destination": destination,
            "path": path,
            "total_distance_nm": total_dist,
            "transit_time_days": round(total_days, 1),
            "cost_per_barrel": round(total_cost, 2),
            "route_risk": round(max_risk, 1),
            "chokepoints_crossed": list(crossed),
            "waypoints": waypoints,
            "success": True,
            "routing_priority": priority
        }
    except Exception as e:
        return {
            "source": source,
            "destination": destination,
            "success": False,
            "error": f"No valid shipping path found: {str(e)}",
            "waypoints": []
        }
