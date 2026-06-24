# Compass — AI Investment Evaluation Assistant

An AI-powered assistant that helps companies evaluate new investment opportunities significantly faster. Built as a university final project, using Enlight Renewable Energy as the example company.

Compass acts like a junior financial analyst: it reads an unstructured project description, identifies missing information, asks intelligent follow-up questions, structures the assumptions, and generates a first-pass financial model with IRR, NPV, payback, and full cash flow.

## 🌐 Live demo

**[https://idrozolio.github.io/compass-investment-assistant/](https://idrozolio.github.io/compass-investment-assistant/)**

The demo runs entirely in your browser. On first use it will ask for your Anthropic API key — get one (with free credits) at [console.anthropic.com](https://console.anthropic.com/settings/keys). The key is stored only in your browser's `localStorage` and is sent only to Anthropic's API.

A typical end-to-end evaluation costs less than $0.10 in API usage.

## How it works

The user flow has five steps, three of which are AI-powered:

| Step | What happens | Powered by |
|------|--------------|-----------|
| 1. Intake | User pastes a project brief | — |
| 2. Understanding | Claude extracts project type, business model, revenue/cost/CAPEX drivers, flags unknowns | Claude API |
| 3. Questions | Claude generates 6–9 tailored follow-up questions with industry defaults | Claude API |
| 4. Assumptions | Claude builds the structured assumptions database (Revenue, OPEX, CAPEX, Financing, Tax) with rationale | Claude API |
| 5. Model | Deterministic JS computes the full P&L, cash flow, NPV, IRR, payback, peak funding | Plain JS |

**Why the split?** The financial math is deterministic and shouldn't be hallucinated. Claude does the analyst judgment work — understanding the deal, asking the right questions, extracting reasonable assumptions. The numbers themselves run through real code.

## Tech stack

- **Vite + React** — fast dev server, single-page app
- **Anthropic Claude API** (`claude-sonnet-4-5`) — for understanding, questioning, and assumption extraction
- **Deterministic JavaScript** — for the financial model itself (so calculations are reproducible and auditable)
- **GitHub Pages + Actions** — automatic deployment on every push to `main`

## Local development

```bash
git clone https://github.com/idrozolio/compass-investment-assistant.git
cd compass-investment-assistant
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and add your API key when prompted.

## Deployment

This repo auto-deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`. No manual build step needed.

To enable Pages in a fork:
1. Push to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select **GitHub Actions**
4. Push any commit — within ~1 minute the site is live

## Example projects to try

- 150 MW solar PV in West Texas with a 20-year PPA at $42/MWh
- Whisky distillery in the Galilee, 50,000 bottles/year, 4-year maturation
- Acquisition of a 60 MW operating wind farm in Croatia
- 200 MWh battery storage JV in Arizona

These are pre-loaded as one-click examples on the intake screen.

## Caveats

This is a prototype. The financial model uses simplified conventions:

- Equity-perspective IRR and NPV (not project IRR)
- Straight-line depreciation over the full horizon
- Straight-line debt amortization (annuity-style payments)
- Linear ramp-up of revenue over `ramp_up_years`
- No working capital, no terminal value, no salvage

Don't take any output to an investment committee. The point is to demonstrate the workflow.

## License

MIT
