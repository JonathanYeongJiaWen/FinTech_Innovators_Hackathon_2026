import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: Could not find GEMINI_API_KEY in .env file!")
else:
    print(f"SUCCESS: API Key loaded (Starts with: {api_key[:5]})")

app = FastAPI(title="Myney API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------
from routes.wallet_routes import router as wallet_router
from routes.wellness_routes import router as wellness_router
from routes.stress_test_routes import router as stress_test_router
from routes.asset_routes import router as asset_router
from routes.optimizer_routes import router as optimizer_router
from routes.advisor_routes import router as advisor_router

app.include_router(wallet_router)
app.include_router(wellness_router)
app.include_router(stress_test_router)
app.include_router(asset_router)
app.include_router(optimizer_router)
app.include_router(advisor_router)
