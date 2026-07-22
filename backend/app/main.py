from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .seed import seed_db
from .routes import data, simulation, optimize, agent

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Energy Supply Chain Resilience and Crisis Response System API",
    version="1.0.0"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon MVP, allow all origins. Can be restricted to frontend host.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(data.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(optimize.router, prefix="/api")
app.include_router(agent.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    """
    Runs on startup to initialize database tables and seed defaults.
    """
    print("Starting up EnergyGuard AI API server...")
    # Initialize and seed database
    try:
        seed_db()
    except Exception as e:
        print(f"Error during database startup seeding: {e}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": "EnergyGuard AI",
        "docs_url": "/docs"
    }
