# 💳 Myney: The Wealth Wellness Hub

**Team Name:** XiaoJongBao  
**Video Pitch:** [5min Youtube Pitch](https://youtu.be/3TEzqit_2x0)

### Live Demo
* **Frontend Application:** [Myney](https://tinyurl.com/Myneyy)
* **Backend API Docs (Swagger):** [Myney Backend](https://myney.azurewebsites.net/docs)
---

## 📝 What is Myney ? 
Myney is an integrated **Wealth Wellness Hub** that eliminates financial fragmentation by unifying bank deposits, private equity, and digital assets into a singular, secure Wealth Wallet. While common trackers offer only static observations, Myney stands out by utilizing institutional-grade Mean-Variance Optimization (MVO) to mathematically ensure portfolio resilience.

Our platform introduces the unique **Behavioral Alpha Tracker**, which quantifies the "Discipline Dividend"—measuring the actual profit gained by holding firm through market noise. Additionally, our **Macro Stress-Tester** goes beyond news alerts to simulate systemic shocks, predicting real-world impacts on life milestones.

Built on a **fault-tolerant architecture** (FastAPI & Spring Boot) with a resilient failover layer, Myney bridges the gap between deterministic financial math and Generative AI. It empowers investors and advisors to move beyond data collection into active, algorithmic defense of their total financial health.

---

## 🛠️ Tech Stack
* **Frontend:** Next.js 16, Tailwind 4, Shadcn UI, Nivo/Recharts.
* **Quant & AI (Python):** FastAPI, SciPy, NumPy, Google Gemini API.
* **Core Services (Java):** Spring Boot 3.4, Java 17, Maven.
* **State & Logic:** Zustand 5, TypeScript 5, Zod.

## 📈 Quantitative Framework
* **Portfolio Optimization:** Markowitz Mean-Variance Framework & Sharpe Ratio.
* **Risk Modeling:** Tikhonov regularization for market shock simulations.
* **Behavioral Metrics:** Real-time correlation matrices & Stability Ratio (0–1.0).

## 🧠 Core Features
* **Multi-Asset Consolidation:** Unifies Private Equity, Commercial Real Estate, and Digital Assets into a single, mathematically rigorous "Wealth Wallet."
* **Behavioral DNA & Stability Tracking:** Quantifies emotional discipline with a live Stability Ratio (0–1.0) and interactive radar mapping of psychological resilience.
* **Behavioral Alpha Tracker:** A "Discipline Dividend" engine that visualizes the exact profit gained by holding firm through market noise vs. emotional panic-selling.
* **Macro Stress-Tester:** Simulates systemic shocks (e.g., Tech Crashes or Rate Hikes) to predict the impact on long-term net worth and life milestones.
* **MVO-Driven Optimization:** An algorithmic rebalancing engine using Mean-Variance Optimization to pull "stretched" portfolios into a balanced, resilient state.
* **Advisor Triage Hub:** A professional command center for managers to monitor client Wellness Scores and push personalized rebalancing proposals with one click.
  
## 📈 Market Potential & Scalability
* **Target Audience:** High-Net-Worth Individuals (HNIs) with fragmented portfolios and "Gen Z" retail investors entering the digital asset space.
* **B2B2C Opportunity:** White-label potential for wealth management firms to offer the Advisor Triage Hub to their clients, enhancing proactive engagement.
* **Scalability:** Built on a microservices-ready architecture (FastAPI + Spring Boot), allowing for easy integration with future Open Finance APIs like SGFinDex

## 🛡️ Feasibility & Compliance
* **Regulatory Alignment:** Designed in accordance with the MAS FEAT Principles (Fairness, Ethics, Accountability, and Transparency). Our "AI Analysis" module prioritizes explainability, ensuring that the Wealth Coach insights are grounded in mathematical data rather than black-box hallucinations.
* **Data Security:** Implements Zod-based schema validation and Java-side security protocols to ensure the integrity of the "Wealth Wallet".
---

## 💻 Local Development
Follow these steps to run the Myney application locally. You will need two terminal windows to run the full stack.

### Prerequisites
* Python 3.9+ & Java 17+
* Node.js (v18+)
* A Google Gemini API Key [(Get one here)](https://aistudio.google.com/u/1/)

### 1. Create and activate a virtual environment
Open your first terminal and navigate to your backend folder:

```bash
# Navigate to backend directory
In your file explorer, Right-Click the backend folder and select "Open in Integrated Terminal".

# Setup Virtual Environment
# Windows:
python -m venv venv && venv\Scripts\activate
# Mac/Linux:
python3 -m venv venv && source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
#Add: GEMINI_API_KEY=your_actual_key_here

# Start the server
python -m uvicorn main:app --reload
```

### 2. Frontend Setup (Next.js)
```bash
# Navigate to frontend directory
In your file explorer, Right-Click the frontend folder and select "Open in Integrated Terminal"

# Install dependencies
npm install

# Start the development server
npm run dev
```
The Myney dashboard will be live at http://localhost:3000.

