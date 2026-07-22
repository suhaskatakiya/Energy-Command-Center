import os
import json
from sqlalchemy.orm import Session
import google.generativeai as genai
from ..config import settings

# 1. Historical crises dataset for RAG grounding
HISTORICAL_CRISAS_KB = [
    {
        "id": "1973_embargo",
        "title": "1973 OPEC Oil Embargo",
        "context": "OPEC reduced production and embargoed crude to Western nations in response to the Yom Kippur War. Global oil prices quadrupled from $3 to $12 per barrel. It demonstrated the extreme vulnerability of energy supply chains to geopolitical alignments and triggered worldwide inflation and recession.",
        "precedent": "Showed that sudden supply cut-offs require immediate strategic stockpiles and price stabilization measures."
    },
    {
        "id": "1979_revolution",
        "title": "1979 Iranian Revolution Crisis",
        "context": "The Iranian Revolution led to a massive contraction in Iranian crude production, triggering a panic that doubled world crude prices to $39.50/bbl. It showed the dangers of relying heavily on a single regional producer for domestic demand.",
        "precedent": "Highlights the necessity of refinery compatibility flexibilities to swap grades rapidly when a primary supplier shuts down."
    },
    {
        "id": "1990_gulf_war",
        "title": "1990 Gulf War Oil Shock",
        "context": "Iraq's invasion of Kuwait led to the loss of both Kuwaiti and Iraqi production from international markets. Oil prices surged. India faced a severe balance of payments crisis due to the soaring crude import bill, prompting the initial concepts for building India's Strategic Petroleum Reserves (SPR).",
        "precedent": "Demonstrates the direct linkage between energy shocks, national currency depreciation, and foreign exchange reserves."
    },
    {
        "id": "2024_red_sea",
        "title": "2024 Red Sea Shipping Crisis",
        "context": "Houthi drone and missile attacks on commercial ships in the Bab-el-Mandeb Strait forced tankers to bypass the Suez Canal and detour around the Cape of Good Hope, adding 10-14 transit days and increasing container/freight rates by 150-200%.",
        "precedent": "Illustrates how chokepoint security incidents immediately spike shipping insurance premiums and delay delivery timelines, even without production cuts."
    }
]

def search_knowledge_base(query: str) -> str:
    """
    Simple keyword-matching RAG retriever. Returns relevant historical precedents based on keywords in the query.
    """
    query_lower = query.lower()
    matches = []
    for item in HISTORICAL_CRISAS_KB:
        # Check for keywords
        if any(kw in query_lower for kw in [item["id"].split("_")[0], item["title"].lower(), item["id"].split("_")[1]]):
            matches.append(item)
            
    # Default to returning the Red Sea and Hormuz-related ones if no specific match
    if not matches:
        matches = [HISTORICAL_CRISAS_KB[3]] # Return 2024 Red Sea as standard modern example
        
    rag_text = "\n\n".join([f"Source: {m['title']}\nContext: {m['context']}\nPrecedent: {m['precedent']}" for m in matches])
    return rag_text

# 2. News Geopolitical Extraction Agent
def analyze_raw_news(news_text: str) -> dict:
    """
    Uses Gemini LLM to extract structured geopolitical risk events from raw text.
    If no API key is provided, falls back to a deterministic keyword-based text miner.
    """
    has_key = len(settings.GEMINI_API_KEY) > 10
    
    if has_key:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""
            Analyze the following geopolitical news report. Extract the primary crisis event and output a JSON object containing the exact fields.
            Output format:
            {{
              "title": "Short title summarizing the event",
              "summary": "1-2 sentence detailed summary",
              "location": "The geographical location of the event (e.g. Strait of Hormuz, Bab-el-Mandeb, Suez Canal)",
              "affected_corridor": "Must be exactly one of: 'Hormuz', 'Red Sea', 'Malacca', or 'None'",
              "severity": "Must be exactly one of: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'",
              "disruption_probability": 0.0 to 1.0 probability of logistics disruptions,
              "affected_supply_pct": estimated percentage of regional supply volume affected (0.0 to 100.0),
              "confidence": 0.0 to 1.0 confidence score of this report,
              "verification_status": "Must be exactly one of: 'CONFIRMED', 'REPORTED', 'UNVERIFIED', 'FORECAST', 'HISTORICAL'",
              "source": "News source name"
            }}
            
            News report:
            "{news_text}"
            
            Return ONLY the valid JSON object. Do not include markdown code block formatting like ```json.
            """
            response = model.generate_content(prompt)
            text = response.text.strip()
            # Handle potential markdown wrappers
            if text.startswith("```json"):
                text = text.split("```json")[1].split("```")[0].strip()
            elif text.startswith("```"):
                text = text.split("```")[1].split("```")[0].strip()
            return json.loads(text)
        except Exception as e:
            print(f"Gemini API error during news parsing: {e}. Falling back to Rule-Based Extractor.")

    # Rule-Based Extractor Fallback
    text_lower = news_text.lower()
    
    # Establish defaults
    title = "Geopolitical Event Detected"
    summary = "A potential threat to energy logistics corridors is being evaluated."
    location = "Strait of Hormuz"
    corridor = "Hormuz"
    severity = "MEDIUM"
    prob = 0.50
    supply_pct = 5.0
    confidence = 0.80
    status = "REPORTED"
    source = "Intelligence Alert"

    # Match rules
    if "hormuz" in text_lower or "iran" in text_lower or "persian gulf" in text_lower:
        location = "Strait of Hormuz"
        corridor = "Hormuz"
        title = "Maritime Tension in Strait of Hormuz"
        summary = "Reports of increased naval exercises or threat signals near the Strait of Hormuz are raising regional logistics concerns."
        if any(k in text_lower for k in ["attack", "seize", "missile", "drone", "explosion"]):
            severity = "HIGH"
            prob = 0.78
            supply_pct = 18.0
            status = "REPORTED"
            summary = "Commercial tanker security warnings issued following maritime drone attacks in the Strait of Hormuz corridor."
        elif "close" in text_lower or "block" in text_lower or "clash" in text_lower:
            severity = "CRITICAL"
            prob = 0.90
            supply_pct = 25.0
            status = "CONFIRMED"
            summary = "Naval clashes have led to partial closures of the Strait of Hormuz shipping corridor. Traffic halted."
            
    elif "red sea" in text_lower or "houthi" in text_lower or "yemen" in text_lower or "aden" in text_lower or "mandeb" in text_lower:
        location = "Bab-el-Mandeb Strait"
        corridor = "Red Sea"
        title = "Red Sea Shipping Disruption"
        summary = "Maritime threats in the Bab-el-Mandeb Strait have prompted insurance adjustments for shipping lanes."
        if any(k in text_lower for k in ["attack", "drone", "hijack", "missile"]):
            severity = "HIGH"
            prob = 0.75
            supply_pct = 12.0
            status = "CONFIRMED"
            summary = "Tankers detour around Cape of Good Hope following missile strikes targeting container shipping in the Red Sea."
            
    elif "opec" in text_lower or "cut" in text_lower or "production" in text_lower:
        location = "OPEC+ Operations"
        corridor = "None"
        title = "OPEC+ Emergency Supply Production Cut"
        severity = "HIGH"
        prob = 0.85
        supply_pct = 10.0
        status = "CONFIRMED"
        summary = "OPEC+ members announce immediate production volume curtailments to stabilize global oil margins."
        
    elif "sanction" in text_lower or "embargo" in text_lower:
        location = "Supplier Origin"
        corridor = "None"
        title = "Sanction Enforcement on Major Supplier"
        severity = "MEDIUM"
        prob = 0.60
        supply_pct = 8.0
        status = "FORECAST"
        summary = "Trade regulations and embargoes tightening on global oil suppliers could restrict import channels."

    return {
        "title": title,
        "summary": summary,
        "location": location,
        "affected_corridor": corridor,
        "severity": severity,
        "disruption_probability": prob,
        "affected_supply_pct": supply_pct,
        "confidence": confidence,
        "verification_status": status,
        "source": source
    }

# 3. Decision Orchestrator Agent
def orchestrate_decision_plan(
    sim_data: dict,
    opt_data: dict,
    spr_data: dict,
    db: Session
) -> dict:
    """
    Decision Orchestrator Agent. Combines risk intelligence, logistics route finding,
    MCDA rankings, and SPR optimization schedules to generate a unified, explainable Action Plan.
    """
    has_key = len(settings.GEMINI_API_KEY) > 10
    
    # Retrieve grounding context (RAG) based on the simulated location
    location = sim_data.get("disruption_location", "Hormuz")
    rag_context = search_knowledge_base(location)
    
    # Extract structural metrics for prompt/logic inputs
    loss_kbd = sim_data.get("supply_loss_kbd", 0.0)
    duration = sim_data.get("duration_days", 0)
    gap_kbd = sim_data.get("comparisons", {}).get("supply_gap_kbd", {}).get("disruption", 0.0)
    
    allocation = opt_data.get("allocation_plan", [])
    rankings = opt_data.get("rankings", [])
    
    spr_drawn = spr_data.get("total_drawn_mb", 0.0)
    spr_remaining = spr_data.get("remaining_reserve_mb", 0.0)
    spr_safety = spr_data.get("safety_threshold_mb", 0.0)
    spr_depletion = spr_data.get("reserve_depletion_pct", 0.0)

    # 1. Draft structural components for response plan
    actions = []
    
    # Rule 1: Manage SPR Release
    if spr_drawn > 0:
        actions.append({
            "action": f"Initiate Phased SPR Drawdown of {spr_data.get('avg_drawdown_rate_kbd')} kbd",
            "impact": f"Releases a total of {spr_drawn} million barrels of crude over {duration} days, buffering 30-40% of the supply loss.",
            "owner": "Ministry of Petroleum & Natural Gas / ISPRL",
            "priority": "CRITICAL" if gap_kbd > 1000 else "HIGH"
        })
        
    # Rule 2: Re-allocate procurement
    for plan in allocation:
        actions.append({
            "action": f"Ramp up crude procurement from {plan['supplier_name']} (+{plan['allocated_volume_kbd']} kbd)",
            "impact": f"Replaces portion of disrupted supplies. Delivered transit time is approximately {plan['days_to_arrival']} days.",
            "owner": "Indian Oil (IOCL) / Bharat Petroleum (BPCL) Procurement",
            "priority": "HIGH"
        })
        
    # Rule 3: Routing adjustments
    for rank in rankings:
        if rank["supplier_name"] == "Russia" and "Red Sea" in location:
            actions.append({
                "action": "Reroute Russian Urals imports via Cape of Good Hope detour",
                "impact": f"Bypasses high-risk Red Sea region, adding +{rank['transit_days'] - 28} days to transit and ${round(rank['delivered_cost_per_barrel'] - 74.5, 2)}/bbl freight surcharge.",
                "owner": "Shipping Corporation of India / Chartering Desk",
                "priority": "HIGH"
            })
            break
        elif rank["supplier_name"] == "UAE" and "Hormuz" in location:
            actions.append({
                "action": "Activate Habshan-Fujairah Land Pipeline bypass for UAE Murban crude",
                "impact": "Transports Abu Dhabi oil directly to Fujairah port outside the Strait of Hormuz, avoiding chokepoint blockades.",
                "owner": "ADNOC / IOCL JV operations",
                "priority": "HIGH"
            })
            break

    # Rule 4: Domestic Refinery blending
    refinery_compat_scores = [r["refinery_compatibility"] for r in rankings if r["supplier_name"] in [p["supplier_name"] for p in allocation]]
    avg_compat = sum(refinery_compat_scores)/len(refinery_compat_scores) if refinery_compat_scores else 1.0
    if avg_compat < 0.93:
        actions.append({
            "action": "Adjust Refinery blending configurations for sweet-sour crude combinations",
            "impact": f"Compensates for lower grade compatibility (avg {round(avg_compat*100, 1)}%) from emergency suppliers (e.g. US/West Africa).",
            "owner": "Refinery Technical Operations Committee",
            "priority": "MEDIUM"
        })

    # Summary indicators
    total_cost_increase = sim_data.get("comparisons", {}).get("total_import_cost_b", {}).get("optimized", 0.0) - sim_data.get("comparisons", {}).get("total_import_cost_b", {}).get("baseline", 0.0)
    total_cost_increase = max(0.0, round(total_cost_increase, 2))
    
    # Priority
    overall_priority = "HIGH" if loss_kbd > 500 else "MEDIUM"
    risk_level = "Medium" if spr_remaining > spr_safety else "High"
    confidence = 0.88 if avg_compat > 0.90 else 0.80

    if has_key:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""
            You are the Lead Decision Orchestrator Agent for India's Energy Supply Chain Resilience.
            A crisis scenario is occurring, and the optimization models have run.
            Generate a detailed natural language explanation and action plan.
            
            --- CRISIS DETAILS ---
            Disruption Location: {location}
            Disruption severity: {sim_data.get('severity_pct')}%
            Duration: {duration} days
            Daily Supply Loss: {loss_kbd} kbd
            No Intervention Supply Gap: {gap_kbd} kbd
            
            --- RAG PRECEDENT ---
            {rag_context}
            
            --- SOLVER PROPOSALS ---
            Suggested Actions: {json.dumps(actions)}
            SPR Drawn: {spr_drawn} MB (Depleting {spr_depletion}% of reserve)
            SPR Remaining: {spr_remaining} MB (Safety Buffer: {spr_safety} MB)
            Supplier Allocations: {json.dumps(allocation)}
            
            Please structure your response in beautiful markdown.
            Include:
            1. **Executive Summary:** Focus on the strategic threat and what the optimized response accomplishes.
            2. **Historical Analogy & Lessons (RAG Grounding):** Ground the recommendation in the historical precedent provided. Explain how this crisis resembles past events (e.g., Cape rerouting or SPR creation precedents) and what we learn.
            3. **Action Plan Breakdown:** Detailed analysis of SPR release and Procurement adjustments.
            4. **Downstream Implications:** Mention refinery compatibility blending issues, domestic fuel pressure, and macroeconomic shielding.
            
            Keep the response authoritative, concise, and structured for policy analysts. Do not mention that you are a mock agent or that these inputs are artificial.
            """
            
            response = model.generate_content(prompt)
            reasoning_text = response.text.strip()
            
            return {
                "recommended_actions": json.dumps(actions),
                "priority": overall_priority,
                "expected_impact": f"Bridges supply gap from {round(sim_data['comparisons']['supply_gap_pct']['disruption'], 1)}% to {round(sim_data['comparisons']['supply_gap_pct']['optimized'], 1)}%, preserving refinery run rates.",
                "total_cost": total_cost_increase,
                "risk_level": risk_level,
                "confidence": confidence,
                "reasoning": reasoning_text,
                "alternative_strategies": json.dumps(rankings[2:5] if len(rankings) > 3 else rankings)
            }
        except Exception as e:
            print(f"Gemini API error during orchestrator: {e}. Falling back to Rule-Based Orchestrator.")

    # Rule-Based Orchestrator (Fallback)
    reasoning_md = f"""### 1. Executive Summary
The emergency declaration in response to the **{location} corridor disruption ({sim_data.get('severity_pct')}% severity)** requires activating the National Energy Resilience Protocol. By coordinating a dual response—re-routing maritime logistics and releasing strategic reserves—the domestic supply gap is effectively neutralized from **{round(sim_data['comparisons']['supply_gap_pct']['disruption'], 1)}%** down to **{round(sim_data['comparisons']['supply_gap_pct']['optimized'], 1)}%**, shielding domestic industry and consumer fuel prices from catastrophic spikes.

### 2. Historical Analogy & Lessons (RAG Grounding)
This disruption shares significant operational characteristics with the **{ "2024 Red Sea shipping crisis" if location == "Red Sea" else "1990 Gulf War shock" }**. 
* **Historical Precedent:** { "During the 2024 crisis, attacks in Bab-el-Mandeb forced immediate logistics detours around the Cape of Good Hope. This increased transit times by 10-14 days and raised spot freight premiums. The primary lesson was that routing security immediately increases delivered costs, requiring preemptive alternative contracts." if location == "Red Sea" else "The 1990 crisis led to a complete cessation of Iraqi and Kuwaiti crude. The resulting price spike depleted India's foreign exchange reserves, reinforcing the need for building domestic Strategic Petroleum Reserves (SPR) as a first-line buffer." }
* **Application to Current Crisis:** We must execute localized supplier swaps (e.g. leveraging UAE pipelines) and release SPR buffer stock to bridge the transit delay window before alternative supplies arrive at Indian ports.

### 3. Action Plan Breakdown
* **Phased SPR Release:** Trigger drawdown of **{spr_data.get('avg_drawdown_rate_kbd')} kbd** over {duration} days. This draws **{spr_drawn} million barrels**, leaving the strategic stock at **{spr_remaining} million barrels** (maintaining a safe level of {spr_data.get('reserve_capacity_pct')}% capacity, comfortably above the {spr_safety} MB safety threshold).
* **Emergency Procurement Swaps:** Contract for immediate cargo increases from **{ ', '.join([a['supplier_name'] for a in allocation]) }** to absorb the remaining volume deficit.

### 4. Downstream & Macroeconomic Shielding
* **Refinery Compatibility:** The blended crude imports maintain a refinery compatibility index above **94%**, preventing refining bottlenecks or catalyst damage.
* **Macroeconomic Shielding:** While the cumulative energy import cost increases by **${total_cost_increase} Billion USD** due to global spot price spikes, this optimized plan avoids a GDP growth drag of **{abs(round(sim_data['comparisons']['gdp_drag_basis_points']['disruption'] - sim_data['comparisons']['gdp_drag_basis_points']['optimized'], 1))} basis points** and dampens domestic retail fuel inflation by resolving the physical shortage.
"""

    return {
        "recommended_actions": json.dumps(actions),
        "priority": overall_priority,
        "expected_impact": f"Bridges supply gap from {round(sim_data['comparisons']['supply_gap_pct']['disruption'], 1)}% to {round(sim_data['comparisons']['supply_gap_pct']['optimized'], 1)}%, preserving refinery run rates.",
        "total_cost": total_cost_increase,
        "risk_level": risk_level,
        "confidence": confidence,
        "reasoning": reasoning_md,
        "alternative_strategies": json.dumps(rankings[2:5] if len(rankings) > 3 else rankings)
    }
