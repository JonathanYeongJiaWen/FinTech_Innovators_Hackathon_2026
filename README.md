# Myney: Composable Wealth Wellness Hub

**Team Name:** XiaoJongBao  
**Video Pitch:** [Insert YouTube Link Here]

## About The Project
Myney solves the fragmentation of modern wealth by unifying traditional assets, real estate, and digital holdings into a single, mathematically rigorous dashboard.

## How It Solves the Problem
Instead of relying on static risk questionnaires, our platform applies institutional quantitative finance models to assess a user's true financial health. 

Our Python backend uses the Markowitz Mean-Variance framework and Tikhonov regularization to calculate risk-adjusted metrics like the Sharpe Ratio. It actively suggests exact, personalized portfolio rebalancing actions (Buy/Sell orders) to optimize returns. 

Crucially, Myney features an AI-driven "Macro Stress-Tester." Users can simulate market shocks (e.g., a "Tech Crash"). Our engine bridges deterministic math with Generative AI, using Gemini to perform real-time NLP sentiment analysis on market headlines. It applies dynamic volatility multipliers and explains the portfolio impact in plain English. Myney translates complex quant-level analytics into an intuitive interface, empowering retail clients with institutional-grade financial resilience.

## Technologies Used
* **Backend:** Python (FastAPI), SciPy (SLSQP Optimizer), NumPy, Pandas
* **Frontend:** Next.js, React, Tailwind CSS (v4), Shadcn UI, Recharts
* **AI Integration:** Google Gemini API (NLP Sentiment & Generative Insights)
* **Design:** v0.dev, Figma

---

## Getting Started
Follow these steps to run the Myney application locally. You will need two terminal windows open—one for the Python math engine and one for the Next.js frontend.

### Prerequisites
* Python 3.9+
* Node.js (v18+)
* A Google Gemini API Key

## Live Demo
* **Frontend Application:** [Insert Vercel/Cloudflare Link Here]
* **Backend API Docs (Swagger):** [Insert Render/Azure Link Here]/docs

---

## Local Development
If you prefer to run the application locally to inspect the architecture, follow these steps. 

### Prerequisites
* Python 3.9+
* Node.js (v18+)
* A Google Gemini API Key

### 1. Start the Backend (FastAPI Engine)
Open your first terminal and navigate to your backend folder:

```bash
# Install the required quantitative and server libraries
pip install fastapi uvicorn scipy numpy pandas pydantic google-generativeai

# Start the Uvicorn server
python -m uvicorn main:app --reload

### 2. Start the Frontend (Next.js UI)
Open your second terminal and navigate to the frontend folder:

cd frontend

# Install the Next.js dependencies
npm install

# Start the development server
npm run dev

The Myney dashboard will be live at http://localhost:3000.
