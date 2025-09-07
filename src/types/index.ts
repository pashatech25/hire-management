// Database Types
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          jurisdiction: string
          logo_url: string | null
          created_at: string
          updated_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          jurisdiction: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          jurisdiction?: string
          logo_url?: string | null
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          company_id: string
          hiree_name: string
          hiree_dob: string | null
          hiree_address: string
          hiree_email: string
          hiree_date: string
          created_at: string
          updated_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          company_id: string
          hiree_name: string
          hiree_dob?: string | null
          hiree_address: string
          hiree_email: string
          hiree_date: string
          created_at?: string
          updated_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          hiree_name?: string
          hiree_dob?: string | null
          hiree_address?: string
          hiree_email?: string
          hiree_date?: string
          updated_at?: string
        }
      }
      flat_services: {
        Row: {
          id: string
          profile_id: string
          name: string
          rate: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          rate: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          rate?: string
        }
      }
      tiers: {
        Row: {
          id: string
          profile_id: string
          min_sqft: number
          max_sqft: number
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          min_sqft: number
          max_sqft: number
          created_at?: string
        }
        Update: {
          id?: string
          min_sqft?: number
          max_sqft?: number
        }
      }
      tiered_rates: {
        Row: {
          id: string
          profile_id: string
          tier_id: string
          service_type: 'photo' | 'video' | 'iguide' | 'matterport'
          rate: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          tier_id: string
          service_type: 'photo' | 'video' | 'iguide' | 'matterport'
          rate: string
          created_at?: string
        }
        Update: {
          id?: string
          rate?: string
        }
      }
      gear_items: {
        Row: {
          id: string
          profile_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      offer_details: {
        Row: {
          id: string
          profile_id: string
          position: string
          start_date: string | null
          probation_months: string
          manager_name: string
          manager_email: string
          manager_phone: string
          manager_ext: string
          contact_ext: string
          return_by: string | null
          ceo_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          position: string
          start_date?: string | null
          probation_months: string
          manager_name: string
          manager_email: string
          manager_phone: string
          manager_ext: string
          contact_ext: string
          return_by?: string | null
          ceo_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          position?: string
          start_date?: string | null
          probation_months?: string
          manager_name?: string
          manager_email?: string
          manager_phone?: string
          manager_ext?: string
          contact_ext?: string
          return_by?: string | null
          ceo_name?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          profile_id: string
          document_type: 'waiver' | 'noncompete' | 'gear' | 'pay' | 'offer'
          clauses: string[]
          addendum: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          document_type: 'waiver' | 'noncompete' | 'gear' | 'pay' | 'offer'
          clauses: string[]
          addendum: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clauses?: string[]
          addendum?: string
          updated_at?: string
        }
      }
      signatures: {
        Row: {
          id: string
          profile_id: string
          signature_type: 'hiree' | 'company'
          signature_data: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          signature_type: 'hiree' | 'company'
          signature_data: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          signature_data?: string
          updated_at?: string
        }
      }
      hiree_access: {
        Row: {
          id: string
          profile_id: string
          access_token: string
          expires_at: string
          is_used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          access_token: string
          expires_at: string
          is_used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          is_used?: boolean
        }
      }
    }
  }
}

// Application Types
export interface Company {
  id: string
  name: string
  jurisdiction: string
  logoUrl: string | null
  createdAt: string
  updatedAt: string
  ownerId: string
  // Company services and gear for hiree overrides
  flatServices?: FlatService[]
  tieredRates?: TieredRate[]
  gearItems?: GearItem[]
}

export interface Profile {
  id: string
  name: string
  companyId: string
  hireeName: string
  hireeDob: string | null
  hireeAddress: string
  hireeEmail: string
  hireeDate: string
  createdAt: string
  updatedAt: string
  ownerId: string
}

export interface FlatService {
  id: string
  profileId: string
  name: string
  rate: string
  createdAt: string
}

export interface Tier {
  id: string
  profileId: string
  minSqft: number
  maxSqft: number
  createdAt: string
}

export interface TieredRate {
  id: string
  profileId: string
  tierId: string
  serviceType: 'photo' | 'video' | 'iguide' | 'matterport'
  rate: string
  createdAt: string
}

export interface GearItem {
  id: string
  profileId: string
  name: string
  createdAt: string
  isCustom?: boolean
  isRequired?: boolean
  customNotes?: string
  estimatedPriceCAD?: number
  priceSource?: 'manual' | 'openai' | 'user_override'
  lastEstimatedAt?: string
}

export interface OfferDetails {
  id: string
  profileId: string
  position?: string
  startDate?: string | null
  endDate?: string
  workSchedule?: string
  probationMonths?: string
  managerName?: string
  managerEmail?: string
  managerPhone?: string
  managerExt?: string
  contactExt?: string
  returnBy?: string | null
  ceoName?: string
  compensation?: {
    baseSalary: number
    hourlyRate: number
    commission: number
    benefits: string
  }
  responsibilities?: string
  requirements?: string
  terms?: string
  flatServices?: Array<{
    id: string
    name: string
    rate: number
  }>
  tieredServices?: Array<{
    id: string
    name: string
    baseRate: number
  }>
  status?: 'draft' | 'finalized' | 'sent' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  profileId: string
  documentType: 'waiver' | 'noncompete' | 'gear' | 'pay' | 'offer'
  clauses: string[]
  addendum: string
  createdAt: string
  updatedAt: string
}

export interface Signature {
  id: string
  profileId: string
  signatureType: 'hiree' | 'company'
  signatureData: string
  createdAt: string
  updatedAt: string
}

export interface DocumentSignatureLink {
  id: string
  profileId: string
  companyId: string
  documentType: 'compensation' | 'acceptance' | 'gear_obligations' | 'payment_schedule' | 'waiver' | 'noncompete'
  documentData: any
  signatureToken: string
  isSigned: boolean
  signedAt?: string
  signedBy?: 'tenant' | 'hiree'
  tenantSignatureData?: string
  hireeSignatureData?: string
  tenantInitialData?: string
  hireeInitialData?: string
  createdAt: string
  updatedAt: string
}

export interface SignatureResetLog {
  id: string
  signatureLinkId: string
  resetBy: string
  resetReason?: string
  resetAt: string
}

export interface HireeAccess {
  id: string
  profileId: string
  accessToken: string
  expiresAt: string
  isUsed: boolean
  createdAt: string
}

// State Types
// Hiree Customization Types
export interface HireeFlatService {
  id: string
  profileId: string
  flatServiceId: string
  customRate?: string | null // Override price, null = use company default
  isEnabled: boolean // Check/uncheck for this hiree
  createdAt: string
  updatedAt: string
}

export interface HireeTieredRate {
  id: string
  profileId: string
  tieredRateId: string
  customRate?: string | null // Override price, null = use company default
  isEnabled: boolean // Check/uncheck for this hiree
  createdAt: string
  updatedAt: string
}

export interface HireeGearItem {
  id: string
  profileId: string
  gearItemId: string
  isRequired: boolean // Check/uncheck for this hiree
  customNotes?: string | null // Hiree-specific notes
  createdAt: string
  updatedAt: string
}

export interface HireeCustomGearItem {
  id: string
  profileId: string
  name: string
  isRequired: boolean
  customNotes?: string | null
  createdAt: string
  updatedAt: string
}

export interface HireeCustomFlatService {
  id: string
  profileId: string
  name: string
  rate: string
  createdAt: string
  updatedAt: string
}

// Combined types for UI display
export interface FlatServiceWithCustomization extends FlatService {
  customization?: HireeFlatService
  isEnabled: boolean
  displayRate: string // Shows custom rate or default rate
}

export interface TieredRateWithCustomization extends TieredRate {
  customization?: HireeTieredRate
  isEnabled: boolean
  displayRate: string // Shows custom rate or default rate
}

export interface GearItemWithCustomization extends GearItem {
  customization?: HireeGearItem
  isRequired: boolean
  customNotes?: string
}export interface AppState {
  // UI State
  activeTab: string
  isLoading: boolean
  error: string | null
  
  // Data State
  company: Company | null
  profile: Profile | null
  flatServices: FlatService[]
  tiers: Tier[]
  tieredRates: TieredRate[]
  gearItems: GearItem[]
  offerDetails: OfferDetails | null
  templates: Template[]
  signatures: Signature[]
  
  // Actions
  setActiveTab: (tab: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCompany: (company: Company | null) => void
  setProfile: (profile: Profile | null) => void
  setFlatServices: (services: FlatService[]) => void
  setTiers: (tiers: Tier[]) => void
  setTieredRates: (rates: TieredRate[]) => void
  setGearItems: (items: GearItem[]) => void
  setOfferDetails: (details: OfferDetails | null) => void
  setTemplates: (templates: Template[]) => void
  setSignatures: (signatures: Signature[]) => void
  resetState: () => void
}

// Document Types
export type DocumentType = 'waiver' | 'noncompete' | 'gear' | 'pay' | 'offer'

export interface DocumentPreview {
  type: DocumentType
  title: string
  content: string
}
