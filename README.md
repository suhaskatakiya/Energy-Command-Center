# ENERGYGUARD AI
### AI-Powered Energy Supply Chain Resilience and Crisis Response System

ENERGYGUARD AI is an advanced decision-support and crisis simulation system designed for energy ministries, logistics planners, and national security analysts. It monitors geopolitical news feeds, calculates corridor logistics risks, models the downstream macroeconomic impacts of disruptions, and uses AI agents alongside graph solvers to orchestrate optimized response blueprints (SPR releases, logistics rerouting, and supplier swaps).

---

## 1. Hackathon Demonstration Flow (3-Minute Script)

Follow this step-by-step workflow in the UI to demonstrate the core value proposition:

1. **Baseline State:** Open the **Executive Dashboard**. Note that the **National Energy Resilience Index** is in the green **OPTIMAL (90+)** zone. Shipping risks are low.
2. **Inject Geopolitical Incident:**
   - Go to the **Risk Intelligence** tab.
   - Select the template **Hormuz Drone Threat** (or paste custom news text) and click **Analyze Geopolitical Text**.
   - Review the AI extraction report (severity, probability, exposed supply %).
   - Click **Inject Event into Supply Chain**.
   - Look at the header: The **National Resilience Score** immediately transitions to **VULNERABLE** (orange) as chokepoint danger indexes escalate.
3. **Run Crisis Simulation:**
   - Click the **Scenario Simulator** tab (or the prompt shortcut on the dashboard).
   - Click **Run Disruption Simulation** (defaults to Hormuz closure, 60% severity, 30 days).
   - Review the calculated impacts: spot Brent oil spikes, shipping rates soar, refinery capacity drops, and macroeconomic drags (trade deficits, CPI inflation additions, and GDP basis point drags) are calculated.
4. **Logistics & Supplier Optimization:**
   - Click **Orchestrate Action Plan** to enter the **AI Decision Center** (or inspect components in the **Optimization Center**).
   - Notice the **Multi-Agent Discussion Feed** representing the collaboration between specialized agents (Logistics, SPR, and Procurement).
   - Review the **Before vs. After Comparison**:
     - **Before:** Supply Risk = Critical, Supply Gap = 24%, Refinery capacity = 76%, GDP drag = High.
     - **After:** Supply Risk = Stable, Supply Gap = 0.8%, Refinery capacity = 99.2%, Surcharges mitigated.
5. **Human Approval:**
   - Click **Approve Response Plan**.
   - Review: The system status updates to **APPROVED**, and the National Resilience indicators stabilize, showing a resolved crisis.

---

## 2. Folder Structure

```
d:\hackathon\ET AI 2.0\
  ├── backend/
  │   ├── app/
  │   │   ├── routes/          # API route handlers (metrics, simulation, optimization, agents)
  │   │   ├── services/        # Mathematical solvers & Multi-agent RAG engine
  │   │   ├── database.py      # SQLAlchemy SQLite connection manager
  │   │   ├── main.py          # FastAPI startup and CORS configurations
  │   │   ├── models.py        # SQLite Database models
  │   │   ├── schemas.py       # Pydantic validation schemas
  │   │   └── seed.py          # Seeder script inserting suppliers, routes, waypoints
  │   ├── requirements.txt     # Python libraries
  │   └── run.py               # Launcher script for FastAPI (port 8000)
  ├── frontend/
  │   ├── src/
  │   │   ├── components/      # Tab-routing views (Dashboard, Map, Simulator, Decision Orchestrator)
  │   │   ├── utils/api.ts     # Client library with automated offline-mock fallbacks
  │   │   ├── App.tsx          # Navigation shell and state synchronizer
  │   │   ├── index.css        # Tailwind and Leaflet CSS overrides
  │   │   ├── main.tsx         # React app mounting script
  │   │   └── types.ts         # TypeScript interface schemas
  │   ├── package.json         # Front-end dependencies
  │   └── vite.config.ts       # Vite config
  ├── .env.example             # Template file for environment configurations
  └── run_all.bat              # Batch launcher for Windows
```

---

## 3. Setup & Startup Instructions

Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### Automatic Startup (Recommended)
Double-click the **`run_all.bat`** script at the root directory. It will:
1. Initialize the SQLite database and run the seeder script automatically.
2. Launch the FastAPI backend on `http://localhost:8000`.
3. Launch the Vite React frontend on `http://localhost:5173`.

### Manual Startup

#### Step 1: Initialize and Run Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the database seed script:
   ```bash
   python -m app.seed
   ```
4. Start the FastAPI server:
   ```bash
   python run.py
   ```
   *Verify API status at `http://localhost:8000` or view interactive docs at `http://localhost:8000/docs`.*

#### Step 2: Run React Frontend
1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.
