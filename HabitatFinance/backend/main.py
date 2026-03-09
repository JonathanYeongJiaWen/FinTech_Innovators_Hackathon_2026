# FEATURE 2: Financial Wellness Engine
# FEATURE 4: Macro Stress-Tester

import json
import os
from functools import lru_cache
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
from abc import ABC, abstractmethod
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from fastapi import FastAPI, HTTPException
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: Could not find GEMINI_API_KEY in .env file!")
else:
    print(f"✅ SUCCESS: API Key loaded (Starts with: {api_key[:5]})")

app = FastAPI(title="Habitat Finance API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "mock_database.json"
RISK_FREE_RATE = 0.03
SHARPE_MAX = 1.5


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class RiskMetrics(BaseModel):
    expectedReturn: float
    volatility: float
    sharpeRatio: float


class LiquidityProfile(BaseModel):
    highLiquidityUSD: float
    lowLiquidityUSD: float
    liquidityWarningFlag: bool


class BehavioralResilienceResponse(BaseModel):
    stabilityRatio: float
    panicRisk: str
    description: str


class SynergyResponse(BaseModel):
    correlationCoefficient: float
    equitiesWeight: float
    digitalAssetsWeight: float
    interpretation: str


class WellnessResponse(BaseModel):
    portfolioId: str
    totalNetWorthUSD: float
    wellnessScore: float
    riskMetrics: RiskMetrics
    liquidityProfile: LiquidityProfile
    behavioralResilience: BehavioralResilienceResponse
    digitalTraditionalSynergy: SynergyResponse


# ---------------------------------------------------------------------------
# Feature 4 models
# ---------------------------------------------------------------------------

VALID_SCENARIOS = {"TECH_CRASH", "FED_RATE_HIKE"}

SCENARIO_NAMES: dict[str, str] = {
    "TECH_CRASH": "Technology Sector Crash",
    "FED_RATE_HIKE": "Federal Reserve Rate Hike",
}


class ScenarioRequest(BaseModel):
    scenario_id: str
    severity_multiplier: float = 1.0


class ScenarioResponse(BaseModel):
    scenarioName: str
    originalNetWorthUSD: float
    projectedNetWorthUSD: float
    netChangeUSD: float
    originalWellnessScore: float
    projectedWellnessScore: float
    aiAnalysis: str

# ---------------------------------------------------------------------------
# Wallet Entity + Adapters + Services
# ---------------------------------------------------------------------------

@dataclass
class WealthWalletItem:
    source: str
    asset_id: str
    asset_name: str
    asset_class: str
    quantity: float
    current_market_value_usd: float
    liquidity_tier: str
    historical_volatility: Optional[float]
    currency: str


class BaseAdapter(ABC):
    @abstractmethod
    def fetch_assets(self, user_id: str):
        pass


class TradFiAdapter(BaseAdapter):
    def fetch_assets(self, user_id: str):
        return [
            {
                "type": "bank",
                "account_id": "bank-001",
                "name": "DBS Savings",
                "balance": 12000.50,
                "currency": "USD"
            },
            {
                "type": "stock",
                "ticker": "AAPL",
                "name": "Apple Inc",
                "units": 10,
                "price_per_unit": 190.0,
                "currency": "USD"
            }
        ]


class Web3Adapter(BaseAdapter):
    def fetch_assets(self, user_id: str):
        return [
            {
                "token_address": "0x123",
                "symbol": "USDC",
                "name": "USD Coin",
                "balance": 5000,
                "usd_price": 1.0,
                "chain": "Ethereum"
            }
        ]


class PrivateAssetAdapter(BaseAdapter):
    def fetch_assets(self, user_id: str):
        return [
            {
                "asset_ref": "prop-001",
                "name": "Condo Unit",
                "category": "real_estate",
                "estimated_value_usd": 800000,
                "ownership_fraction": 1.0
            }
        ]


class NormalizationService:
    def normalize_tradfi(self, raw):
        items = []

        for asset in raw:
            if asset["type"] == "bank":
                items.append(
                    WealthWalletItem(
                        source="TradFi",
                        asset_id=asset["account_id"],
                        asset_name=asset["name"],
                        asset_class="Cash",
                        quantity=1,
                        current_market_value_usd=asset["balance"],
                        liquidity_tier="High",
                        historical_volatility=0.0,
                        currency=asset["currency"]
                    )
                )

            elif asset["type"] == "stock":
                total_value = asset["units"] * asset["price_per_unit"]
                items.append(
                    WealthWalletItem(
                        source="TradFi",
                        asset_id=asset["ticker"],
                        asset_name=asset["name"],
                        asset_class="Equities",
                        quantity=asset["units"],
                        current_market_value_usd=total_value,
                        liquidity_tier="High",
                        historical_volatility=0.25,
                        currency=asset["currency"]
                    )
                )

        return items

    def normalize_web3(self, raw):
        items = []

        for asset in raw:
            items.append(
                WealthWalletItem(
                    source="Web3",
                    asset_id=asset["token_address"],
                    asset_name=asset["name"],
                    asset_class="Digital_Assets",
                    quantity=asset["balance"],
                    current_market_value_usd=asset["balance"] * asset["usd_price"],
                    liquidity_tier="Medium",
                    historical_volatility=0.45,
                    currency="USD"
                )
            )

        return items

    def normalize_private(self, raw):
        items = []

        for asset in raw:
            items.append(
                WealthWalletItem(
                    source="PrivateAsset",
                    asset_id=asset["asset_ref"],
                    asset_name=asset["name"],
                    asset_class="Private_Equity",
                    quantity=asset["ownership_fraction"],
                    current_market_value_usd=asset["estimated_value_usd"] * asset["ownership_fraction"],
                    liquidity_tier="Low",
                    historical_volatility=0.30,
                    currency="USD"
                )
            )

        return items

class IngestionService:
    def __init__(self):
        self.tradfi_adapter = TradFiAdapter()
        self.web3_adapter = Web3Adapter()
        self.private_asset_adapter = PrivateAssetAdapter()

    def fetch_all_sources(self, user_id: str):
        return {
            "tradfi": self.tradfi_adapter.fetch_assets(user_id),
            "web3": self.web3_adapter.fetch_assets(user_id),
            "private": self.private_asset_adapter.fetch_assets(user_id)
        }


class WalletService:
    def __init__(self):
        self.ingestion_service = IngestionService()
        self.normalization_service = NormalizationService()

    def _infer_expected_return_and_beta(self, asset_class: str) -> tuple[float, float]:
        if asset_class == "Cash":
            return 0.02, 0.0
        elif asset_class == "Equities":
            return 0.10, 1.1
        elif asset_class == "Digital_Assets":
            return 0.14, 1.3
        elif asset_class == "Private_Equity":
            return 0.12, 0.8
        else:
            return 0.05, 1.0

    def get_unified_wallet(self, user_id: str):
        raw_data = self.ingestion_service.fetch_all_sources(user_id)

        tradfi_items = self.normalization_service.normalize_tradfi(raw_data["tradfi"])
        web3_items = self.normalization_service.normalize_web3(raw_data["web3"])
        private_items = self.normalization_service.normalize_private(raw_data["private"])

        all_items = tradfi_items + web3_items + private_items
        total_value = sum(item.current_market_value_usd for item in all_items)

        return {
            "user_id": user_id,
            "total_value_usd": total_value,
            "items": [item.__dict__ for item in all_items]
        }

    def build_wellness_records(self, user_id: str) -> list[dict]:
        raw_data = self.ingestion_service.fetch_all_sources(user_id)

        tradfi_items = self.normalization_service.normalize_tradfi(raw_data["tradfi"])
        web3_items = self.normalization_service.normalize_web3(raw_data["web3"])
        private_items = self.normalization_service.normalize_private(raw_data["private"])

        all_items = tradfi_items + web3_items + private_items

        records = []
        for item in all_items:
            expected_return, beta = self._infer_expected_return_and_beta(item.asset_class)

            records.append(
                {
                    "name": item.asset_name,
                    "assetClass": item.asset_class,
                    "sector": "Unknown", #might become a problem ltr
                    "currentValueUSD": item.current_market_value_usd,
                    "liquidityTier": item.liquidity_tier,
                    "expectedReturn": expected_return,
                    "historicalVolatility": item.historical_volatility or 0.0,
                    "beta": beta,
                }
            )

        return records


wallet_service = WalletService()

# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Helper Functions for Advanced Metrics
# ---------------------------------------------------------------------------

def calculate_behavioral_resilience(data: dict) -> BehavioralResilienceResponse:
    """
    Calculate Behavioral Resilience Index (Stability Ratio).
    
    Formula: Compares user's trade volume against market volatility.
    If market dropped >3% but user held position, ratio should be >0.80.
    
    Stability Ratio = 1.0 - (panic_factor * volatility_factor)
    """
    market_data = data.get("marketData", {})
    trade_history = data.get("tradeHistory", {})
    
    # Get market volatility (use tech index as it's more relevant for typical portfolio)
    tech_volatility = market_data.get("techIndexVolatility30d", 0.20)
    tech_return = market_data.get("techIndexReturn30d", 0.0)
    
    # Get trade behavior
    total_trades = trade_history.get("totalTradesLast30d", 0)
    panic_sells = trade_history.get("panicSellsLast30d", 0)
    held_during_drop = trade_history.get("heldDuringDrop", True)
    largest_drawdown = abs(trade_history.get("largestDrawdownWithoutSell", 0.0))
    
    # Calculate panic factor (0.0 = no panic, 1.0 = high panic)
    if total_trades == 0:
        panic_factor = 0.0  # No trades = good discipline
    else:
        panic_factor = panic_sells / total_trades
    
    # If market dropped >3% and user held position, boost stability
    market_stress_bonus = 0.0
    if tech_return < -0.03 and held_during_drop:
        market_stress_bonus = 0.15
    
    # Calculate stability ratio
    volatility_factor = min(tech_volatility, 0.5)  # Cap at 0.5
    stability_ratio = 1.0 - (panic_factor * volatility_factor) + market_stress_bonus
    
    # Clamp to [0.0, 1.0]
    stability_ratio = max(0.0, min(1.0, stability_ratio))
    
    # Determine panic risk level
    if stability_ratio >= 0.80:
        panic_risk = "Low"
        description = f"You haven't made any emotional trades during the recent {abs(tech_return)*100:.1f}% tech dip. Resilience is improving your Wellness Score."
    elif stability_ratio >= 0.60:
        panic_risk = "Medium"
        description = "Your trading behavior shows moderate emotional discipline. Consider reviewing your investment strategy during market volatility."
    else:
        panic_risk = "High"
        description = "Trading patterns suggest emotional responses to market movements. Consider implementing automatic rebalancing strategies."
    
    return BehavioralResilienceResponse(
        stabilityRatio=round(stability_ratio, 2),
        panicRisk=panic_risk,
        description=description
    )


def calculate_digital_traditional_synergy(df: pd.DataFrame, data: dict) -> SynergyResponse:
    """
    Calculate Pearson Correlation between Equities and Digital Assets.
    
    Uses daily returns to compute correlation coefficient (r).
    """
    daily_returns = data.get("dailyReturns", {})
    equities_returns = daily_returns.get("equities", [])
    digital_returns = daily_returns.get("digitalAssets", [])
    
    # Calculate Pearson correlation if both arrays exist and have same length
    if len(equities_returns) > 0 and len(digital_returns) > 0 and len(equities_returns) == len(digital_returns):
        correlation_matrix = np.corrcoef(equities_returns, digital_returns)
        correlation = float(correlation_matrix[0, 1])
    else:
        correlation = 0.0
    
    # Calculate weights
    total_value = df["currentValueUSD"].sum()
    equities_value = df[df["assetClass"] == "Equities"]["currentValueUSD"].sum()
    digital_value = df[df["assetClass"] == "Digital_Assets"]["currentValueUSD"].sum()
    
    equities_weight = float(equities_value / total_value) if total_value > 0 else 0.0
    digital_weight = float(digital_value / total_value) if total_value > 0 else 0.0
    
    # Interpret correlation
    if abs(correlation) < 0.3:
        interpretation = "Diversified"
    elif correlation > 0.7:
        interpretation = "Highly Correlated"
    elif correlation < -0.7:
        interpretation = "Inversely Correlated"
    else:
        interpretation = "Moderately Correlated"
    
    return SynergyResponse(
        correlationCoefficient=round(correlation, 2),
        equitiesWeight=round(equities_weight, 2),
        digitalAssetsWeight=round(digital_weight, 2),
        interpretation=interpretation
    )


def calculate_diversification_score(df: pd.DataFrame) -> float:
    """
    Calculate diversification score based on asset class distribution.
    Uses Herfindahl-Hirschman Index (HHI) inverse.
    
    Returns: Score from 0.0 to 1.0 (higher = more diversified)
    """
    total = df["currentValueUSD"].sum()
    if total == 0:
        return 0.0
    
    class_weights = df.groupby("assetClass")["currentValueUSD"].sum() / total
    hhi = (class_weights ** 2).sum()
    
    # Convert HHI to diversification score (1.0 = perfectly diversified, 0.0 = concentrated)
    # HHI ranges from 1/n to 1.0, where n is number of asset classes
    n_classes = len(class_weights)
    if n_classes <= 1:
        return 0.0
    
    min_hhi = 1.0 / n_classes
    diversification_score = (1.0 - hhi) / (1.0 - min_hhi)
    
    return max(0.0, min(1.0, diversification_score))


def calculate_liquidity_score(df: pd.DataFrame) -> float:
    """
    Calculate liquidity score based on the proportion of high-liquidity assets.
    
    Returns: Score from 0.0 to 1.0 (higher = more liquid)
    """
    total = df["currentValueUSD"].sum()
    if total == 0:
        return 0.0
    
    high_liquidity_value = df[df["liquidityTier"] == "High"]["currentValueUSD"].sum()
    liquidity_ratio = high_liquidity_value / total
    
    # Score: >75% high liquidity = 1.0, <25% = 0.0
    liquidity_score = max(0.0, min(1.0, (liquidity_ratio - 0.25) / 0.50 + 0.5))
    
    return liquidity_score


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/api/v1/wellness", 
    response_model=WellnessResponse, 
    tags=["Feature 2: Financial Wellness Engine"]
)
def get_financial_wellness() -> WellnessResponse:
    """
    Financial Wellness Engine.

    Loads portfolio data, computes the Sharpe Ratio, maps it to a 0-100
    wellness score using weighted average of:
    - 30% Diversification
    - 30% Liquidity
    - 20% Sharpe Ratio
    - 20% Behavioral Resilience
    
    Returns full liquidity breakdown, behavioral resilience, and synergy metrics.
    """
    # --- Load data ----------------------------------------------------------
    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")

    portfolio_id: str = data["portfolioId"]

    # --- Build DataFrame (flatten nested riskMetrics) -----------------------
    records = [
        {
            "currentValueUSD":     asset["currentValueUSD"],
            "assetClass":          asset["assetClass"],
            "liquidityTier":       asset["liquidityTier"],
            "expectedReturn":      asset["riskMetrics"]["expectedReturn"],
            "historicalVolatility": asset["riskMetrics"]["historicalVolatility"],
            "beta":                asset["riskMetrics"].get("beta", 1.0),
        }
        for asset in data["assets"]
    ]
    df = pd.DataFrame(records)

    # --- Data Processing ----------------------------------------------------
    total_value: float = float(df["currentValueUSD"].sum())

    # Safety guard: empty portfolio returns a zeroed response.
    if total_value == 0.0:
        return WellnessResponse(
            portfolioId=portfolio_id,
            totalNetWorthUSD=0.0,
            wellnessScore=0.0,
            riskMetrics=RiskMetrics(expectedReturn=0.0, volatility=0.0, sharpeRatio=0.0),
            liquidityProfile=LiquidityProfile(
                highLiquidityUSD=0.0, lowLiquidityUSD=0.0, liquidityWarningFlag=False
            ),
            behavioralResilience=BehavioralResilienceResponse(
                stabilityRatio=0.0, panicRisk="Unknown", description="No data available"
            ),
            digitalTraditionalSynergy=SynergyResponse(
                correlationCoefficient=0.0, equitiesWeight=0.0, 
                digitalAssetsWeight=0.0, interpretation="No data"
            ),
        )

    df["weight"] = df["currentValueUSD"] / total_value

    # --- Quantitative Math: Sharpe Ratio ------------------------------------
    portfolio_return: float = float(np.dot(df["weight"], df["expectedReturn"]))
    portfolio_volatility: float = float(np.dot(df["weight"], df["historicalVolatility"]))

    # Simple Concentration Risk Adjustment:
    # If any single asset class dominates >60% of the portfolio, apply a 15%
    # penalty to volatility before computing the Sharpe Ratio, reflecting
    # undiversified concentration risk.
    class_weights = df.groupby("assetClass")["weight"].sum()
    if float(class_weights.max()) > 0.60:
        portfolio_volatility *= 1.15

    # Safety guard: flat volatility means the Sharpe Ratio is undefined.
    if portfolio_volatility == 0.0:
        sharpe_ratio: float = 0.0
    else:
        sharpe_ratio = float((portfolio_return - RISK_FREE_RATE) / portfolio_volatility)

    # --- Calculate Component Scores for Unified Wellness --------------------
    # Normalize Sharpe to 0-1 scale
    sharpe_score = max(0.0, min(1.0, sharpe_ratio / SHARPE_MAX))
    
    # Diversification score (0-1)
    diversification_score = calculate_diversification_score(df)
    
    # Liquidity score (0-1)
    liquidity_score = calculate_liquidity_score(df)
    
    # Behavioral resilience score (0-1)
    behavioral_resilience = calculate_behavioral_resilience(data)
    resilience_score = behavioral_resilience.stabilityRatio
    
    # Unified Wellness Score: weighted average (0-100)
    # 30% Diversification, 30% Liquidity, 20% Sharpe Ratio, 20% Behavioral Resilience
    wellness_score: float = round(
        (0.30 * diversification_score + 
         0.30 * liquidity_score + 
         0.20 * sharpe_score + 
         0.20 * resilience_score) * 100.0,
        1
    )

    # --- Calculate Digital-Traditional Synergy ------------------------------
    synergy = calculate_digital_traditional_synergy(df, data)

    # --- Liquidity Profiling ------------------------------------------------
    liquidity_by_tier = df.groupby("liquidityTier")["currentValueUSD"].sum()
    high_liquidity_usd: float = float(liquidity_by_tier.get("High", 0.0))
    low_liquidity_usd: float  = float(liquidity_by_tier.get("Low",  0.0))
    liquidity_warning: bool   = (low_liquidity_usd / total_value) > 0.60

    # --- Build response -----------------------------------------------------
    return WellnessResponse(
        portfolioId=portfolio_id,
        totalNetWorthUSD=round(float(total_value), 2),
        wellnessScore=wellness_score,
        riskMetrics=RiskMetrics(
            expectedReturn=round(float(portfolio_return), 6),
            volatility=round(float(portfolio_volatility), 6),
            sharpeRatio=round(float(sharpe_ratio), 6),
        ),
        liquidityProfile=LiquidityProfile(
            highLiquidityUSD=round(float(high_liquidity_usd), 2),
            lowLiquidityUSD=round(float(low_liquidity_usd), 2),
            liquidityWarningFlag=bool(liquidity_warning),
        ),
        behavioralResilience=behavioral_resilience,
        digitalTraditionalSynergy=synergy,
    )


# ---------------------------------------------------------------------------
# Feature 2b: Milestone Liquidity Tracker
# ---------------------------------------------------------------------------

class MilestoneRequest(BaseModel):
    target_amount: float
    cpf_oa_balance: float
    monthly_burn_rate: float


class MilestoneTarget(BaseModel):
    target_name: str
    target_amount: float
    target_date: str


class FinancialSnapshot(BaseModel):
    cpf_oa_balance: float
    cash_reserves: float
    liquid_investments: dict[str, float]
    illiquid_investments: dict[str, float]
    monthly_burn_rate: float


class LiquidityAnalysis(BaseModel):
    cash_shortfall: float
    post_milestone_cash: float
    runway_months: float
    status: str
    recommended_action: str | None


class MilestoneLiquidityResponse(BaseModel):
    milestone: MilestoneTarget
    financial_snapshot: FinancialSnapshot
    analysis: LiquidityAnalysis


@app.post(
    "/api/v1/wellness/milestone-liquidity",
    response_model=MilestoneLiquidityResponse,
    tags=["Feature 2: Financial Wellness Engine"],
)
def calculate_milestone_liquidity(request: MilestoneRequest) -> MilestoneLiquidityResponse:
    """
    Milestone Liquidity Tracker.

    Accepts dynamic target_amount, cpf_oa_balance, and monthly_burn_rate
    from the client, then evaluates whether the user has sufficient liquid
    resources to fund an upcoming financial milestone without dangerously
    depleting their cash runway.
    """
    # --- Milestone target (name & date still default) -----------------------
    milestone = MilestoneTarget(
        target_name="HDB Flat Downpayment",
        target_amount=request.target_amount,
        target_date="2026-11-01",
    )

    # --- Financial data (cash & investments remain mock-fixed) --------------
    cash_reserves = 20_000.0
    liquid_investments = {"Equities": 100_000.0, "Bonds": 50_000.0}
    illiquid_investments = {"Private Equity": 200_000.0, "Crypto": 100_000.0}

    snapshot = FinancialSnapshot(
        cpf_oa_balance=request.cpf_oa_balance,
        cash_reserves=cash_reserves,
        liquid_investments=liquid_investments,
        illiquid_investments=illiquid_investments,
        monthly_burn_rate=request.monthly_burn_rate,
    )

    # --- Liquidity math -----------------------------------------------------
    cash_shortfall = request.target_amount - request.cpf_oa_balance
    post_milestone_cash = cash_reserves - cash_shortfall
    runway_months = (
        post_milestone_cash / request.monthly_burn_rate
        if request.monthly_burn_rate > 0
        else float("inf")
    )

    # --- Risk assessment ----------------------------------------------------
    if runway_months < 6.0:
        status = "High Liquidity Risk"
        target_buffer = 6.0 * request.monthly_burn_rate
        liquidation_needed = target_buffer - post_milestone_cash
        top_liquid_source = max(liquid_investments, key=liquid_investments.get)
        top_illiquid_source = max(illiquid_investments, key=illiquid_investments.get)
        recommended_action = (
            f"Liquidate ${liquidation_needed:,.0f} from {top_liquid_source} "
            f"to secure a 6-month post-purchase cash buffer and prevent "
            f"forced sales of illiquid {top_illiquid_source}."
        )
    else:
        status = "Healthy"
        recommended_action = None

    analysis = LiquidityAnalysis(
        cash_shortfall=round(cash_shortfall, 2),
        post_milestone_cash=round(post_milestone_cash, 2),
        runway_months=round(runway_months, 2),
        status=status,
        recommended_action=recommended_action,
    )

    return MilestoneLiquidityResponse(
        milestone=milestone,
        financial_snapshot=snapshot,
        analysis=analysis,
    )


# ---------------------------------------------------------------------------
# Feature 2c: Multi-Scenario Planner
# ---------------------------------------------------------------------------

PROPERTY_LABELS = {"HDB", "Condo", "Property", "House", "Flat"}


class ScenarioItem(BaseModel):
    label: str
    type: str  # "Goal" or "Shock"
    target_amount: float
    target_date: str | None = None


class ScenariosRequest(BaseModel):
    scenarios: list[ScenarioItem]
    cpf_oa_balance: float = 45_000.0
    cash_reserves: float = 20_000.0
    monthly_burn_rate: float = 4_000.0


class ScenarioResult(BaseModel):
    label: str
    type: str
    status: str
    impact_amount: float
    target_amount: float
    liquid_assets_available: float
    recommendation: str


class ScenariosResponse(BaseModel):
    results: list[ScenarioResult]


def _is_property_goal(label: str) -> bool:
    return any(kw.lower() in label.lower() for kw in PROPERTY_LABELS)


@app.post(
    "/api/v1/wellness/scenarios",
    response_model=ScenariosResponse,
    tags=["Feature 2: Financial Wellness Engine"],
)
async def evaluate_scenarios(request: ScenariosRequest) -> ScenariosResponse:
    """
    Multi-Scenario Planner.

    Accepts a list of life milestones and financial shocks, evaluates
    the liquidity impact of each, and returns a Gemini-powered
    recommendation per scenario.
    """
    results: list[ScenarioResult] = []

    for scenario in request.scenarios:
        # ----- Liquidity impact math ----------------------------------------
        if scenario.type == "Shock":
            # Emergency fund test: can cash_reserves absorb the shock?
            liquid_assets_available = request.cash_reserves
            impact_amount = liquid_assets_available - scenario.target_amount
            status = "Healthy" if impact_amount >= 0 else "At Risk"
        else:
            # Goal: subtract CPF OA contribution for property-related goals
            cpf_contribution = (
                request.cpf_oa_balance if _is_property_goal(scenario.label) else 0.0
            )
            liquid_assets_available = cpf_contribution + request.cash_reserves
            shortfall = scenario.target_amount - liquid_assets_available
            impact_amount = -shortfall  # positive = surplus, negative = deficit
            status = "Healthy" if shortfall <= 0 else "At Risk"

        # ----- Gemini recommendation ----------------------------------------
        prompt = (
            "You are a licensed Singaporean financial planner. "
            f"A client faces this scenario: '{scenario.label}' "
            f"(type: {scenario.type}, amount: ${scenario.target_amount:,.0f}). "
            f"Their current cash reserves are ${request.cash_reserves:,.0f}, "
            f"CPF OA balance is ${request.cpf_oa_balance:,.0f}, "
            f"and monthly burn rate is ${request.monthly_burn_rate:,.0f}. "
            f"The computed impact is ${abs(impact_amount):,.0f} "
            f"{'surplus' if impact_amount >= 0 else 'shortfall'}. "
            "Analyze this scenario. If there is a shortfall, suggest a specific "
            "monthly savings target or a reallocation move (e.g., 'Redirect "
            "$500/mo to T-Bills'). If it is a shock like Job Loss, suggest the "
            "optimal liquid buffer size. Reply in 2-3 sentences maximum."
        )
        try:
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash", contents=prompt
            )
            recommendation = response.text.strip()
        except Exception:
            recommendation = (
                "Unable to generate AI recommendation at this time. "
                "Please review your liquid reserves manually."
            )

        results.append(
            ScenarioResult(
                label=scenario.label,
                type=scenario.type,
                status=status,
                impact_amount=round(impact_amount, 2),
                target_amount=scenario.target_amount,
                liquid_assets_available=round(liquid_assets_available, 2),
                recommendation=recommendation,
            )
        )

    return ScenariosResponse(results=results)


# ---------------------------------------------------------------------------
# Feature 4: Macro Stress-Tester
# ---------------------------------------------------------------------------

# Asset classes considered highly liquid for the liquidity check.
LIQUID_ASSET_CLASSES = {"Cash", "Equities"}
# Asset classes / sectors that signal illiquid real-asset concentration.
ILLIQUID_REAL_ASSET_INDICATORS = {"Real Estate", "HDB", "Private_Equity"}


def _compute_wellness_score(df: pd.DataFrame, value_col: str) -> tuple[float, float]:
    """
    Advanced wellness scoring incorporating:
      1. Sharpe Ratio (base score)
      2. Concentration Risk Adjustment (volatility penalty)
      3. Beta Risk Penalty (high-beta or excessively low-beta portfolios)
      4. Liquidity Penalty (insufficient liquid holdings relative to
         illiquid real-asset exposure)

    Returns (sharpe_ratio, wellness_score) with score clamped to [0, 100].
    """
    total = float(df[value_col].sum())
    if total == 0.0:
        return 0.0, 0.0

    weight = df[value_col] / total

    # --- Sharpe Ratio -------------------------------------------------------
    port_return = float(np.dot(weight, df["expectedReturn"]))
    port_vol = float(np.dot(weight, df["historicalVolatility"]))

    # Concentration risk: penalise volatility when one asset class > 60%.
    class_weights = df.groupby("assetClass")[value_col].sum() / total
    if float(class_weights.max()) > 0.60:
        port_vol *= 1.15

    sharpe = float((port_return - RISK_FREE_RATE) / port_vol) if port_vol else 0.0
    wellness = min(max(sharpe / SHARPE_MAX * 100.0, 0.0), 100.0)

    # --- Beta Risk Penalty --------------------------------------------------
    if "beta" in df.columns:
        port_beta = float(np.dot(weight, df["beta"]))
        if port_beta > 1.2 or port_beta < 0.5:
            wellness *= 0.90  # 10 % penalty

    # --- Liquidity Penalty --------------------------------------------------
    liquid_mask = df["assetClass"].isin(LIQUID_ASSET_CLASSES)
    liquid_weight = float(weight[liquid_mask].sum())

    has_illiquid_real_assets = (
        df["assetClass"].isin(ILLIQUID_REAL_ASSET_INDICATORS).any()
        or df.get("sector", pd.Series(dtype=str)).isin(ILLIQUID_REAL_ASSET_INDICATORS).any()
    )
    if liquid_weight < 0.15 and has_illiquid_real_assets:
        wellness -= 15.0

    # --- Clamp to [0, 100] --------------------------------------------------
    wellness = round(min(max(wellness, 0.0), 100.0), 1)
    return sharpe, wellness


@app.post(
    "/api/v1/stress-test",
    response_model=ScenarioResponse,
    tags=["Feature 4: Macro Stress-Tester"],
)
async def run_stress_test(request: ScenarioRequest) -> ScenarioResponse:
    """
    Macro Stress-Tester.

    Applies a named macroeconomic shock to the portfolio using sector-specific
    vectorised multipliers, recalculates the Sharpe-based Wellness Score, and
    returns an AI-generated analysis powered by GPT-4o-mini.
    """
    if request.scenario_id not in VALID_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario_id '{request.scenario_id}'. "
                   f"Must be one of: {sorted(VALID_SCENARIOS)}.",
        )

    # --- Load data ----------------------------------------------------------
    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")

    # --- Build DataFrame ----------------------------------------------------
    records = [
        {
            "name":                asset["name"],
            "assetClass":          asset["assetClass"],
            "sector":              asset["sector"],
            "currentValueUSD":     asset["currentValueUSD"],
            "liquidityTier":       asset["liquidityTier"],
            "expectedReturn":      asset["riskMetrics"]["expectedReturn"],
            "historicalVolatility": asset["riskMetrics"]["historicalVolatility"],
            "beta":                asset["riskMetrics"].get("beta", 1.0),
        }
        for asset in data["assets"]
    ]
    df = pd.DataFrame(records)

    # --- Baseline wellness --------------------------------------------------
    original_total = float(df["currentValueUSD"].sum())
    _, original_wellness = _compute_wellness_score(df, "currentValueUSD")

    # --- Apply sector-specific shocks ---------------------------------------
    s = request.severity_multiplier
    shocked = df["currentValueUSD"].copy()

    if request.scenario_id == "TECH_CRASH":
        tech_equity_mask  = (df["sector"] == "Technology") & (df["assetClass"] == "Equities")
        other_equity_mask = (df["sector"] != "Technology") & (df["assetClass"] == "Equities")
        shocked[tech_equity_mask]  *= (1.0 - 0.30 * s)
        shocked[other_equity_mask] *= (1.0 - 0.10 * s)
        # Fixed_Income: multiplier 1.0 — no change

    elif request.scenario_id == "FED_RATE_HIKE":
        equity_mask = df["assetClass"] == "Equities"
        fi_mask     = df["assetClass"] == "Fixed_Income"
        shocked[equity_mask] *= (1.0 - 0.15 * s)
        shocked[fi_mask]     *= (1.0 - 0.05 * s)

    df["shockedValueUSD"] = shocked

    # --- Projected metrics --------------------------------------------------
    projected_total = float(df["shockedValueUSD"].sum())
    net_change_usd  = round(projected_total - original_total, 2)

    _, projected_wellness = _compute_wellness_score(df, "shockedValueUSD")

    # --- Worst-performing asset (by % decline) ------------------------------
    df["pct_change"] = (df["shockedValueUSD"] - df["currentValueUSD"]) / df["currentValueUSD"]
    worst_asset_name = str(df.loc[df["pct_change"].idxmin(), "name"])

    # --- Asynchronous Gemini analysis ---------------------------------------
    scenario_name = SCENARIO_NAMES[request.scenario_id]
    prompt = (
        "You are a professional Schroders wealth advisor providing concise, "
        "expert financial analysis to high-net-worth clients. "
        f"A client's portfolio has been subjected to the '{scenario_name}' "
        f"macroeconomic scenario with a severity multiplier of {s:.1f}. "
        f"Their total portfolio net worth changed by ${net_change_usd:,.2f} USD. "
        f"The worst-performing asset was '{worst_asset_name}'. "
        f"In exactly 2 sentences, explain why this portfolio changed under this "
        f"scenario and what it means for the client going forward."
    )

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash", contents=prompt
    )
    ai_analysis = response.text

    # --- Build response -----------------------------------------------------
    return ScenarioResponse(
        scenarioName=scenario_name,
        originalNetWorthUSD=round(original_total, 2),
        projectedNetWorthUSD=round(projected_total, 2),
        netChangeUSD=net_change_usd,
        originalWellnessScore=original_wellness,
        projectedWellnessScore=projected_wellness,
        aiAnalysis=ai_analysis,
    )


# ---------------------------------------------------------------------------
# Feature: Portfolio Assets
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Feature: Portfolio Optimizer models
# ---------------------------------------------------------------------------

class OptimizeRequest(BaseModel):
    asset_names: list[str]
    current_weights: list[float]
    expected_returns: list[float]
    covariance_matrix: list[list[float]]


class AssetRecommendation(BaseModel):
    asset: str
    currentWeight: float
    optimizedWeight: float
    action: str


class OptimizeResponse(BaseModel):
    optimizedWeights: dict[str, float]
    projectedSharpeRatio: float
    recommendations: list[AssetRecommendation]


class AssetResponse(BaseModel):
    assetId: str
    name: str
    assetClass: str
    sector: str
    currentValueUSD: float
    liquidityTier: str


@app.post(
    "/api/v1/optimize-portfolio",
    response_model=OptimizeResponse,
    tags=["Portfolio Optimizer"],
)
def optimize_portfolio(request: OptimizeRequest) -> OptimizeResponse:
    """
    Portfolio Optimizer.

    Accepts current asset weights, expected annualized returns, and a
    covariance matrix.  Uses scipy.optimize.minimize to find the weight
    allocation that maximises the Sharpe Ratio (minimises negative Sharpe)
    subject to fully-invested and long-only constraints.
    """
    n = len(request.asset_names)

    # --- Input validation ---------------------------------------------------
    if not (n == len(request.current_weights) == len(request.expected_returns)):
        raise HTTPException(
            status_code=400,
            detail="asset_names, current_weights, and expected_returns must have the same length.",
        )
    if len(request.covariance_matrix) != n or any(len(row) != n for row in request.covariance_matrix):
        raise HTTPException(
            status_code=400,
            detail=f"covariance_matrix must be an {n}x{n} matrix.",
        )
    if n == 0:
        raise HTTPException(status_code=400, detail="Portfolio must contain at least one asset.")

    mu = np.array(request.expected_returns)
    cov = np.array(request.covariance_matrix)

    # Verify covariance matrix is symmetric
    if not np.allclose(cov, cov.T):
        raise HTTPException(status_code=400, detail="Covariance matrix must be symmetric.")

    # Tikhonov regularisation: guarantee positive-definiteness so SLSQP
    # cannot exploit floating-point near-singularities.
    np.fill_diagonal(cov, cov.diagonal() + 1e-6)

    # --- Negative Sharpe objective ------------------------------------------
    def neg_sharpe(weights: np.ndarray) -> float:
        port_return = float(weights @ mu)
        port_vol = float(np.sqrt(max(0.0, weights @ cov @ weights)))
        return -((port_return - RISK_FREE_RATE) / (port_vol + 1e-8))

    # --- Constraints & bounds -----------------------------------------------
    constraints = ({"type": "eq", "fun": lambda w: np.sum(w) - 1.0})
    bounds = [(0.0, 1.0)] * n
    initial_weights = np.array(request.current_weights)

    # Fallback to equal-weight start if current weights don't sum to ~1
    if abs(initial_weights.sum() - 1.0) > 0.05:
        initial_weights = np.ones(n) / n

    # --- Optimise -----------------------------------------------------------
    result = minimize(
        neg_sharpe,
        initial_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
    )
    if result.success:
        opt_weights = result.x
        projected_sharpe = float(-result.fun)
    else:
        # Graceful fallback: return the original weights so the UI never crashes.
        opt_weights = np.array(request.current_weights)
        projected_sharpe = float(-neg_sharpe(opt_weights))

    # --- Build recommendations ----------------------------------------------
    recommendations: list[AssetRecommendation] = []
    for i, name in enumerate(request.asset_names):
        cur_w = request.current_weights[i]
        opt_w = round(float(opt_weights[i]), 6)
        if not result.success:
            action = "Hold"
        else:
            diff = opt_w - cur_w
            if diff > 0.005:
                action = f"Buy (+{diff:.2%})"
            elif diff < -0.005:
                action = f"Sell ({abs(diff):.2%})"
            else:
                action = "Hold"
        recommendations.append(
            AssetRecommendation(
                asset=name,
                currentWeight=round(cur_w, 6),
                optimizedWeight=opt_w,
                action=action,
            )
        )

    optimized_weights = {
        name: round(float(opt_weights[i]), 6)
        for i, name in enumerate(request.asset_names)
    }

    return OptimizeResponse(
        optimizedWeights=optimized_weights,
        projectedSharpeRatio=round(projected_sharpe, 6),
        recommendations=recommendations,
    )


@lru_cache(maxsize=1)
def load_portfolio_data() -> dict:
    """Read and cache the portfolio JSON file (single in-memory copy)."""
    try:
        with open(DATA_PATH, "r", encoding="utf-8-sig") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio data file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Portfolio data file contains invalid JSON.")


@app.get(
    "/api/v1/assets",
    response_model=list[AssetResponse],
    tags=["Portfolio Assets"],
)
def get_portfolio_assets() -> list[AssetResponse]:
    """Return the raw asset list from the portfolio data file."""
    data = load_portfolio_data()

    return [
        AssetResponse(
            assetId=asset["assetId"],
            name=asset["name"],
            assetClass=asset["assetClass"],
            sector=asset["sector"],
            currentValueUSD=asset["currentValueUSD"],
            liquidityTier=asset["liquidityTier"],
        )
        for asset in data["assets"]
    ]
@app.get("/wallet/{user_id}", tags=["Wallet"])
def get_wallet(user_id: str):
    return wallet_service.get_unified_wallet(user_id)

# ---------------------------------------------------------------------------
# Feature: Advisor View
# ---------------------------------------------------------------------------

class PortfolioSummary(BaseModel):
    asset_class_1: str
    asset_class_1_pct: float
    asset_class_2: str
    asset_class_2_pct: float


class ActiveScenario(BaseModel):
    label: str
    type: str          # "Goal" or "Shock"
    status: str         # "At Risk" or "Healthy"
    shortfall: float
    liquid_allocated: float


class ClientSummary(BaseModel):
    client_id: str
    name: str
    net_worth: float
    wellness_score: float
    portfolio_summary: PortfolioSummary
    active_scenarios: list[ActiveScenario]


class InsightRequest(BaseModel):
    portfolio_summary: PortfolioSummary
    wellness_score: float
    active_scenarios: list[ActiveScenario] = []


class InsightResponse(BaseModel):
    primary_risk: str
    recommended_action: str


MOCK_CLIENTS: list[dict] = [
    {
        "client_id": "CLI-001",
        "name": "Rachel Tan",
        "net_worth": 2_450_000.00,
        "wellness_score": 82.4,
        "portfolio_summary": {
            "asset_class_1": "Equities",
            "asset_class_1_pct": 55.0,
            "asset_class_2": "Fixed_Income",
            "asset_class_2_pct": 30.0,
        },
        "active_scenarios": [
            {"label": "Buying Condo (Private)", "type": "Goal", "status": "Healthy", "shortfall": 0, "liquid_allocated": 350_000},
            {"label": "Job Loss", "type": "Shock", "status": "Healthy", "shortfall": 0, "liquid_allocated": 120_000},
        ],
    },
    {
        "client_id": "CLI-002",
        "name": "David Ng",
        "net_worth": 870_000.00,
        "wellness_score": 38.7,
        "portfolio_summary": {
            "asset_class_1": "Equities",
            "asset_class_1_pct": 82.0,
            "asset_class_2": "Digital_Assets",
            "asset_class_2_pct": 14.0,
        },
        "active_scenarios": [
            {"label": "Buying Property (HDB)", "type": "Goal", "status": "At Risk", "shortfall": 20_000, "liquid_allocated": 80_000},
            {"label": "Job Loss", "type": "Shock", "status": "Healthy", "shortfall": 0, "liquid_allocated": 50_000},
        ],
    },
    {
        "client_id": "CLI-003",
        "name": "Aisha Binte Rahman",
        "net_worth": 5_120_000.00,
        "wellness_score": 74.1,
        "portfolio_summary": {
            "asset_class_1": "Real_Estate",
            "asset_class_1_pct": 40.0,
            "asset_class_2": "Fixed_Income",
            "asset_class_2_pct": 35.0,
        },
        "active_scenarios": [
            {"label": "Children's Education Fund", "type": "Goal", "status": "Healthy", "shortfall": 0, "liquid_allocated": 200_000},
        ],
    },
    {
        "client_id": "CLI-004",
        "name": "Marcus Lee",
        "net_worth": 1_680_000.00,
        "wellness_score": 65.9,
        "portfolio_summary": {
            "asset_class_1": "Equities",
            "asset_class_1_pct": 45.0,
            "asset_class_2": "Private_Equity",
            "asset_class_2_pct": 25.0,
        },
        "active_scenarios": [
            {"label": "Medical Emergency", "type": "Shock", "status": "At Risk", "shortfall": 15_000, "liquid_allocated": 35_000},
            {"label": "Buying Property (HDB)", "type": "Goal", "status": "Healthy", "shortfall": 0, "liquid_allocated": 110_000},
        ],
    },
]


@app.get(
    "/api/v1/advisor/clients",
    response_model=list[ClientSummary],
    tags=["Advisor View"],
)
def get_advisor_clients() -> list[ClientSummary]:
    """Return mock advisor book of 4 clients."""
    return [ClientSummary(**c) for c in MOCK_CLIENTS]


@app.post(
    "/api/v1/advisor/generate-insight",
    response_model=InsightResponse,
    tags=["Advisor View"],
)
async def generate_advisor_insight(request: InsightRequest) -> InsightResponse:
    """
    Generative AI endpoint.

    Sends client portfolio data to Google Gemini and returns a structured
    risk insight with a concrete rebalancing recommendation.
    """
    # Build scenario context for the prompt
    at_risk_scenarios = [s for s in request.active_scenarios if s.status == "At Risk"]
    scenario_text = ""
    if at_risk_scenarios:
        scenario_lines = []
        for s in at_risk_scenarios:
            scenario_lines.append(
                f"  - '{s.label}' ({s.type}): shortfall ${s.shortfall:,.0f}, "
                f"liquid allocated ${s.liquid_allocated:,.0f}"
            )
        scenario_text = (
            "\n\nThe client has the following 'At Risk' scenarios:\n"
            + "\n".join(scenario_lines)
        )

    prompt = (
        "You are an elite quantitative wealth advisor. "
        "A client has the following portfolio breakdown:\n"
        f"- {request.portfolio_summary.asset_class_1}: "
        f"{request.portfolio_summary.asset_class_1_pct}%\n"
        f"- {request.portfolio_summary.asset_class_2}: "
        f"{request.portfolio_summary.asset_class_2_pct}%\n"
        f"- Remaining: other asset classes\n"
        f"- Current Wellness Score: {request.wellness_score}/100"
        f"{scenario_text}\n\n"
        "Analyze the client's portfolio against their 'At Risk' scenarios. "
        "Generate a recommended_action specifically designed to fix the exact "
        "shortfall using their current liquid assets and portfolio weighting. "
        "For example: 'To fund the $20k HDB property shortfall, recommend "
        "shifting 10%% of their over-weighted Tech Equities into a high-yield "
        "liquid cash account.' "
        "If there are no at-risk scenarios, focus on the single biggest "
        "vulnerability and suggest a concrete rebalancing move.\n\n"
        "You MUST respond with ONLY a valid JSON object with exactly two "
        "string fields:\n"
        '  "primary_risk": a concise description of the biggest risk,\n'
        '  "recommended_action": a specific rebalancing instruction '
        "referencing percentages and target instruments.\n\n"
        "Do not include any text outside the JSON object."
    )

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash", contents=prompt
    )

    raw = response.text.strip()
    # Strip markdown code fences if Gemini wraps the JSON
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Gemini returned non-JSON response.",
        )

    if "primary_risk" not in parsed or "recommended_action" not in parsed:
        raise HTTPException(
            status_code=502,
            detail="Gemini response missing required fields.",
        )

    return InsightResponse(
        primary_risk=str(parsed["primary_risk"]),
        recommended_action=str(parsed["recommended_action"]),
    )
