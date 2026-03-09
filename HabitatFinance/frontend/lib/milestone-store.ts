import { create } from "zustand"

export interface ScenarioResult {
  label: string
  type: string
  status: string
  impact_amount: number
  target_amount: number
  liquid_assets_available: number
  recommendation: string
}

interface MilestoneState {
  scenarios: ScenarioResult[]
  addScenarios: (items: ScenarioResult[]) => void
  removeScenario: (index: number) => void
  clearScenarios: () => void
}

export const useMilestoneStore = create<MilestoneState>((set) => ({
  scenarios: [],
  addScenarios: (items) =>
    set((state) => ({ scenarios: [...state.scenarios, ...items] })),
  removeScenario: (index) =>
    set((state) => ({
      scenarios: state.scenarios.filter((_, i) => i !== index),
    })),
  clearScenarios: () => set({ scenarios: [] }),
}))
