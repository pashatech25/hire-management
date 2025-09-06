import { create } from 'zustand'
import type { AppState, Company, Profile, FlatService, Tier, TieredRate, GearItem, OfferDetails, Template, Signature } from '../types'

const initialState = {
  // UI State
  activeTab: 'company',
  isLoading: false,
  error: null,
  
  // Data State
  company: null,
  profile: null,
  flatServices: [],
  tiers: [],
  tieredRates: [],
  gearItems: [],
  offerDetails: null,
  templates: [],
  signatures: [],
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  
  // UI Actions
  setActiveTab: (tab: string) => set({ activeTab: tab }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  
  // Data Actions
  setCompany: (company: Company | null) => set({ company }),
  setProfile: (profile: Profile | null) => set({ profile }),
  setFlatServices: (services: FlatService[]) => set({ flatServices: services }),
  setTiers: (tiers: Tier[]) => set({ tiers }),
  setTieredRates: (rates: TieredRate[]) => set({ tieredRates: rates }),
  setGearItems: (items: GearItem[]) => set({ gearItems: items }),
  setOfferDetails: (details: OfferDetails | null) => set({ offerDetails: details }),
  setTemplates: (templates: Template[]) => set({ templates }),
  setSignatures: (signatures: Signature[]) => set({ signatures }),
  
  // Reset State
  resetState: () => set(initialState),
}))
