import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { Button } from '../ui/Button'
import { CardContent, CardHeader } from '../ui/Card'
import { FileText, Eye, Download } from 'lucide-react'
// import { PDFGenerator, downloadPDF } from '../../lib/pdfGenerator'
import { formatCurrency, formatLongDate, escapeHtml } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { SimplePDFGenerator } from '../../lib/simplePDFGenerator'
import type { DocumentType, Tier, TieredRate } from '../../types'

export const DocumentsTab: React.FC = () => {
  const { 
    profile, 
    company, 
    flatServices,
    tiers, 
    setTiers,
    tieredRates, 
    setTieredRates,
    offerDetails, 
    setOfferDetails,
    templates, 
    signatures 
  } = useAppStore()
  const { user } = useAuth()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  // const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null)
  const [previewContent, setPreviewContent] = useState<string>('')
  const [profileGearItems, setProfileGearItems] = useState<Array<{ 
    id: string; 
    name: string; 
    isCustom: boolean; 
    isRequired: boolean; 
    customNotes: string;
    estimatedPriceCAD?: number;
    priceSource?: 'manual' | 'openai' | 'user_override';
    lastEstimatedAt?: string;
  }>>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [flatServiceOverrides, setFlatServiceOverrides] = useState<Record<string, { rate: number; enabled: boolean }>>({})
  const [tieredRateOverrides, setTieredRateOverrides] = useState<Record<string, { rate: number; enabled: boolean }>>({})

  // Load company services and hiree overrides when profile or company changes
  useEffect(() => {
    const loadData = async () => {
      if (!user || !company) {
        setProfileGearItems([])
        return
      }

      if (isLoadingData) {
        console.log('Already loading data, skipping...')
        return
      }

      setIsLoadingData(true)
      console.log('Starting data load for profile:', profile?.id, 'company:', company.id)

      try {
        // Load company tiered services if not already loaded
        if (tiers.length === 0 || tieredRates.length === 0) {
          const { data: tiersData, error: tiersError } = await supabase
            .from('tiers')
            .select('*')
            .eq('company_id', company.id)
            .order('created_at', { ascending: true })

          const { data: ratesData, error: ratesError } = await supabase
            .from('tiered_rates')
            .select('*')
            .eq('company_id', company.id)
            .order('created_at', { ascending: true })

          if (tiersError || ratesError) {
            console.error('Error loading tiered services:', tiersError || ratesError)
          } else {
            // Convert to frontend format
            const frontendTiers: Tier[] = (tiersData || []).map(tier => ({
              id: tier.id,
              profileId: tier.profile_id,
              minSqft: tier.min_sqft,
              maxSqft: tier.max_sqft,
              createdAt: tier.created_at,
            }))

            const frontendRates: TieredRate[] = (ratesData || []).map(rate => ({
              id: rate.id,
              profileId: rate.profile_id,
              tierId: rate.tier_id,
              serviceType: rate.service_type as 'photo' | 'video' | 'iguide' | 'matterport',
              rate: rate.rate,
              createdAt: rate.created_at,
            }))

            setTiers(frontendTiers)
            setTieredRates(frontendRates)
          }
        }

        // Load hiree overrides and gear items if profile is loaded
        if (profile && !profile.id.startsWith('profile_')) {
          console.log('Loading data for profile:', profile.id, profile.hireeName)

          // Load flat service overrides
          const { data: flatOverrides, error: flatError } = await supabase
            .from('hiree_flat_services')
            .select('flat_service_id, custom_rate, is_enabled')
            .eq('profile_id', profile.id)

          if (flatError) {
            console.error('Error loading flat service overrides:', flatError)
          } else if (flatOverrides) {
            const flatOverridesMap: Record<string, { rate: number; enabled: boolean }> = {}
            flatOverrides.forEach(override => {
              flatOverridesMap[override.flat_service_id] = {
                rate: override.custom_rate || 0,
                enabled: override.is_enabled
              }
            })
            setFlatServiceOverrides(flatOverridesMap)
          }

          // Load tiered rate overrides
          const { data: tieredOverrides, error: tieredError } = await supabase
            .from('hiree_tiered_rates')
            .select('tiered_rate_id, custom_rate, is_enabled')
            .eq('profile_id', profile.id)

          if (tieredError) {
            console.error('Error loading tiered rate overrides:', tieredError)
          } else if (tieredOverrides) {
            const tieredOverridesMap: Record<string, { rate: number; enabled: boolean }> = {}
            tieredOverrides.forEach(override => {
              tieredOverridesMap[override.tiered_rate_id] = {
                rate: override.custom_rate || 0,
                enabled: override.is_enabled
              }
            })
            setTieredRateOverrides(tieredOverridesMap)
          }

          // Load company's base gear items first with pricing
          console.log('Loading company gear items for company:', company.id)
          const { data: companyGearData, error: companyGearError } = await supabase
            .from('gear_items')
            .select('id, name, estimated_price_cad, price_source, last_estimated_at')
            .eq('company_id', company.id)

          if (companyGearError) {
            console.error('Error loading company gear items:', companyGearError)
          } else {
            console.log('Found company gear items:', companyGearData)
            
            // Start with company gear items as base
            const baseGear = companyGearData?.map(item => ({
              id: item.id,
              name: item.name,
              isCustom: false,
              isRequired: false, // Default to not required
              customNotes: '',
              estimatedPriceCAD: item.estimated_price_cad || undefined,
              priceSource: item.price_source || undefined,
              lastEstimatedAt: item.last_estimated_at || undefined
            })) || []
            
            console.log('Base company gear:', baseGear)
            setProfileGearItems(baseGear)
          }

          // Load gear overrides for this specific profile
          console.log('Loading gear overrides for profile:', profile.id)
          const { data: gearOverrides, error: gearError } = await supabase
            .from('hiree_gear_items')
            .select('gear_item_id, is_required, custom_notes')
            .eq('profile_id', profile.id)

          if (gearError) {
            console.error('Error loading gear overrides:', gearError)
          } else {
            console.log('Found gear overrides:', gearOverrides)
            if (gearOverrides && gearOverrides.length > 0) {
              // Update the base gear with override settings
              setProfileGearItems(prev => {
                return prev.map(gearItem => {
                  const override = gearOverrides.find(o => o.gear_item_id === gearItem.id)
                  if (override) {
                    return {
                      ...gearItem,
                      isRequired: override.is_required,
                      customNotes: override.custom_notes || ''
                    }
                  }
                  return gearItem
                })
              })
            }
          }

          // Also load custom gear items for this profile with pricing
          console.log('Loading custom gear items for profile:', profile.id)
          const { data: customGearData, error: customGearError } = await supabase
            .from('hiree_custom_gear_items')
            .select('id, name, is_required, custom_notes, estimated_price_cad, price_source, last_estimated_at')
            .eq('profile_id', profile.id)

          if (customGearError) {
            console.error('Error loading custom gear items:', customGearError)
          } else {
            console.log('Found custom gear items:', customGearData)
            if (customGearData && customGearData.length > 0) {
              const customGear = customGearData.map(item => ({
                id: item.id,
                name: item.name,
                isCustom: true,
                isRequired: item.is_required || false,
                customNotes: item.custom_notes || '',
                estimatedPriceCAD: item.estimated_price_cad || undefined,
                priceSource: item.price_source || undefined,
                lastEstimatedAt: item.last_estimated_at || undefined
              }))
              console.log('Adding custom gear items:', customGear)
              
              // Add custom gear to the existing profile gear items
              setProfileGearItems(prev => {
                console.log('Previous gear items before adding custom:', prev)
                // Filter out any existing custom gear to avoid duplicates
                const existingIds = prev.map(item => item.id)
                const newCustomGear = customGear.filter(item => !existingIds.includes(item.id))
                const combined = [...prev, ...newCustomGear]
                console.log('New custom gear to add:', newCustomGear)
                console.log('Final profile gear items after adding custom:', combined)
                return combined
              })
            }
          }
        } else {
          setProfileGearItems([])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoadingData(false)
        console.log('Finished loading data')
      }
    }

    loadData()
  }, [profile, company, user])

  // Load offer details when profile changes
  useEffect(() => {
    const loadOfferDetails = async () => {
      if (!profile || !user || profile.id.startsWith('profile_')) {
        setOfferDetails(null)
        return
      }

      try {
        console.log('Loading offer details for profile:', profile.id)
        const { data, error } = await supabase
          .from('offer_details')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle()

        if (error) {
          console.error('Error loading offer details:', error)
          setOfferDetails(null)
          return
        }

        console.log('Offer details loaded:', data ? 'Found data' : 'No data found')

        if (data) {
          // Convert database format to frontend format
          const frontendOffer = {
            id: data.id,
            profileId: data.profile_id,
            position: data.position || '',
            startDate: data.start_date || null,
            endDate: data.end_date || '',
            workSchedule: data.work_schedule || '',
            probationMonths: data.probation_months || '',
            managerName: data.manager_name || '',
            managerEmail: data.manager_email || '',
            managerPhone: data.manager_phone || '',
            managerExt: data.manager_ext || '',
            contactExt: data.contact_ext || '',
            returnBy: data.return_by || null,
            ceoName: data.ceo_name || '',
            compensation: {
              baseSalary: data.base_salary || 0,
              hourlyRate: data.hourly_rate || 0,
              commission: data.commission || 0,
              benefits: data.benefits || '',
            },
            responsibilities: data.responsibilities || '',
            requirements: data.requirements || '',
            terms: data.terms || '',
            flatServices: data.flat_services || [],
            tieredServices: data.tiered_services || [],
            status: data.status || 'draft' as const,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }
          setOfferDetails(frontendOffer)
        }
      } catch (error) {
        console.error('Error loading offer details:', error)
      }
    }

    loadOfferDetails()
  }, [profile, user, setOfferDetails])

  // Generate document ID
  const generateDocId = () => 'SGM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,7).toUpperCase()

  // Add months to date
  const addMonths = (dateStr: string, months: number): string => {
    const [y, mo, d] = dateStr.split("-").map(x => +x)
    if (!y || !mo || !d) return ""
    const dt = new Date(Date.UTC(y, mo-1, d))
    dt.setUTCMonth(dt.getUTCMonth() + months)
    const yy = dt.getUTCFullYear()
    const mm = String(dt.getUTCMonth()+1).padStart(2,"0")
    const dd = String(dt.getUTCDate()).padStart(2,"0")
    return `${yy}-${mm}-${dd}`
  }




  // Get hiree-specific pricing for flat services
  const getHireeFlatServicePrice = (serviceId: string): number => {
    // Check if there's an override for this service
    const override = flatServiceOverrides[serviceId]
    if (override && override.enabled && override.rate > 0) {
      return override.rate
    }
    
    // Fall back to company rate
    const service = flatServices?.find(s => s.id === serviceId)
    return typeof service?.rate === 'string' ? parseFloat(service.rate) || 0 : service?.rate || 0
  }

  // Get hiree-specific pricing for tiered services
  const getHireeTieredServicePrice = (tierId: string, serviceType: string): number => {
    // Find the tiered rate ID for this tier and service type
    const tieredRate = tieredRates?.find(r => r.tierId === tierId && r.serviceType === serviceType)
    if (!tieredRate) return 0
    
    // Check if there's an override for this tiered rate
    const override = tieredRateOverrides[tieredRate.id]
    if (override && override.enabled && override.rate > 0) {
      return override.rate
    }
    
    // Fall back to company rate
    return typeof tieredRate?.rate === 'string' ? parseFloat(tieredRate.rate) || 0 : tieredRate?.rate || 0
  }

  // Build document HTML
  const buildDocument = (docType: DocumentType): string => {
    if (!profile || !company) return ''

    const c = escapeHtml(company.name || "Solution Gate Media")
    const j = escapeHtml(company.jurisdiction || "Ontario, Canada")
    const id = generateDocId()

    // Logo block
    const logoBlock = () => {
      if (company.logoUrl) {
        return `<div style="text-align:center;margin-bottom:20px"><img src="${company.logoUrl}" alt="Company Logo" style="max-height:60px;object-fit:contain" /></div>`
      }
      return `<div style="text-align:center;margin-bottom:20px"><div style="font-size:24px;font-weight:700;color:#0f172a">${c}</div></div>`
    }

    // Hiree block
    const hireeBlock = () => `
      <div style="margin:12px 0;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
        <div style="font-weight:600;color:#0f172a;margin-bottom:4px">Hiree Information</div>
        <div style="color:#475569;font-size:14px">
          <div><strong>Name:</strong> ${escapeHtml(profile.hireeName || "________________")}</div>
          <div><strong>Email:</strong> ${escapeHtml(profile.hireeEmail || "________________")}</div>
          <div><strong>Phone:</strong> ${escapeHtml(profile.hireeEmail || "________________")}</div>
          <div><strong>Address:</strong> ${escapeHtml(profile.hireeAddress || "________________")}</div>
          <div><strong>Date of Birth:</strong> ${profile.hireeDob ? formatLongDate(profile.hireeDob) : "________________"}</div>
        </div>
      </div>
    `

    // Top title
    const topTitle = (title: string) => `
      <div style="margin-bottom:6px">
        <div style="font-size:22px;line-height:1.2;font-weight:700;color:#0f172a">${title}</div>
        <div style="color:#475569">${c}</div>
      </div>
    `

    // Signature block
    const signatureBlock = (label: string, signature: string) => `
      <div style="margin:20px 0;padding:12px;border:1px solid #e2e8f0;border-radius:8px">
        <div style="font-weight:600;color:#0f172a;margin-bottom:8px">${label}</div>
        <div style="height:60px;border:1px solid #d1d5db;border-radius:4px;background:#fff;display:flex;align-items:center;justify-content:center">
          ${signature ? `<img src="${signature}" alt="Signature" style="max-height:50px;max-width:200px;object-fit:contain" />` : '<div style="color:#9ca3af">Signature required</div>'}
        </div>
        <div style="margin-top:8px;color:#6b7280;font-size:12px">Date: ________________</div>
      </div>
    `

    // Footer block
    const footerBlock = (title: string, docId: string) => `
      <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;color:#6b7280;font-size:12px;text-align:center">
        <div>${title} — Document ID: ${docId}</div>
        <div>Generated on ${formatLongDate(new Date().toISOString().split('T')[0])}</div>
      </div>
    `

    // Addendum block
    const addendumBlock = (addendum: string) => {
      if (!addendum) return ''
      return `
        <div style="margin:20px 0;padding:12px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px">
          <div style="font-weight:600;color:#92400e;margin-bottom:8px">Additional Terms & Notes</div>
          <div style="color:#92400e;white-space:pre-line">${escapeHtml(addendum)}</div>
        </div>
      `
    }

    // Initials page
    const initialsPage = (title: string, docId: string, clauses: string[]) => {
      if (!clauses || clauses.length === 0) return ''
      return `
        <div style="page-break-before:always;margin-top:20px">
          <div style="text-align:center;margin-bottom:20px">
            <div style="font-size:18px;font-weight:700;color:#0f172a">${title} — Initials Page</div>
            <div style="color:#6b7280;font-size:12px">Document ID: ${docId}</div>
          </div>
          <div style="margin:20px 0">
            <div style="font-weight:600;color:#0f172a;margin-bottom:12px">Please initial each clause below:</div>
            ${clauses.map((clause) => `
              <div style="margin:12px 0;padding:8px;border:1px solid #e2e8f0;border-radius:4px;display:flex;align-items:flex-start;gap:12px">
                <div style="min-width:60px;height:20px;border-bottom:1px solid #000;flex-shrink:0"></div>
                <div style="flex:1;color:#374151;font-size:14px">${escapeHtml(clause)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }


    // Build specific documents
    switch (docType) {
      case 'waiver':
        return `
          ${logoBlock()}
          ${topTitle("Training Waiver & Liability Release")}
          ${hireeBlock()}
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">1. Assumption of Risk</h3>
          <p style="color:#1f2937">The Trainee acknowledges that participation in training and shadowing activities may involve risks, including but not limited to property damage, personal injury, equipment loss, and privacy concerns. The Trainee voluntarily assumes all such risks associated with training.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">2. Release of Liability</h3>
          <p style="color:#1f2937">The Trainee releases and holds harmless ${c}, its employees, contractors, clients, and affiliates from any claims, demands, damages, or liabilities arising from or related to training activities.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">3. Confidentiality & Non-Disclosure</h3>
          <p style="color:#1f2937">The Trainee agrees not to disclose or use any confidential information, business practices, client data, images, or techniques observed during training for any purpose outside of the training session.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">4. Image Rights</h3>
          <p style="color:#1f2937">Any photographs, videos, or media taken during training remain the sole property of ${c}. Trainees may not use, distribute, or claim ownership of such media.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">5. Governing Law</h3>
          <p style="color:#1f2937">This Agreement shall be governed by and construed in accordance with the laws of ${j}.</p>
          ${addendumBlock(templates.find(t => t.documentType === 'waiver')?.addendum || '')}
          ${signatureBlock("Trainee Signature", signatures.find(s => s.signatureType === 'hiree')?.signatureData || '')}
          ${signatureBlock("Company Representative Signature", signatures.find(s => s.signatureType === 'company')?.signatureData || '')}
          ${footerBlock("Training Waiver & Liability Release", id)}
          ${initialsPage("Training Waiver & Liability Release", id, templates.find(t => t.documentType === 'waiver')?.clauses || [])}
        `

      case 'noncompete':
        return `
          ${logoBlock()}
          ${topTitle("Non-Compete Agreement")}
          ${hireeBlock()}
          <p style="color:#1f2937">This Non-Compete Agreement is effective during employment and for a period of three (3) years following termination.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">1. Restriction on Competition</h3>
          <p style="color:#1f2937">Employee agrees not to engage in, directly or indirectly, any business or employment involving visual content services related to real estate, including but not limited to photography, videography, drone services, 3D tours, or any other services offered by ${c}, within ${j}.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">2. Confidential Information</h3>
          <p style="color:#1f2937">Employee acknowledges access to confidential business information, client data, strategies, and techniques, and agrees not to disclose, use, or exploit such information outside the scope of employment.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">3. Enforcement</h3>
          <p style="color:#1f2937">${c} may enforce this Agreement through legal action, including injunctive relief and damages available under the laws of ${j}.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">4. Severability</h3>
          <p style="color:#1f2937">If any provision is held invalid or unenforceable, the remainder shall continue in full force and effect.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">5. Governing Law</h3>
          <p style="color:#1f2937">This Agreement shall be governed by and construed in accordance with the laws of ${j}.</p>
          ${addendumBlock(templates.find(t => t.documentType === 'noncompete')?.addendum || '')}
          ${signatureBlock("Employee Signature", signatures.find(s => s.signatureType === 'hiree')?.signatureData || '')}
          ${signatureBlock("Company Representative Signature", signatures.find(s => s.signatureType === 'company')?.signatureData || '')}
          ${footerBlock("Non-Compete Agreement", id)}
          ${initialsPage("Non-Compete Agreement", id, templates.find(t => t.documentType === 'noncompete')?.clauses || [])}
        `

      case 'gear':
        const totalGearCost = profileGearItems.reduce((sum, item) => sum + (item.estimatedPriceCAD || 0), 0)
        return `
          ${logoBlock()}
          ${topTitle("Equipment, Gear & Supply Obligations")}
          ${hireeBlock()}
          <p style="color:#1f2937">All new hires are required to have the following equipment prior to their first day of work. Equipment must be in working condition and available for inspection. Proof of Transport Canada drone certification is mandatory. Rentals may be accepted temporarily with prior written approval.</p>
          <h3 style="margin:14px 0 8px;font-size:16px;color:#0f172a">Required Equipment</h3>
          <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px">
            <thead>
              <tr style="background-color:#f9fafb">
                <th style="border:1px solid #d1d5db;padding:8px;text-align:left;font-weight:600;color:#374151">Equipment Item</th>
                <th style="border:1px solid #d1d5db;padding:8px;text-align:right;font-weight:600;color:#374151;width:120px">Estimated Cost (CAD)</th>
              </tr>
            </thead>
            <tbody>
              ${profileGearItems.map(item => `
                <tr>
                  <td style="border:1px solid #d1d5db;padding:8px;color:#111827">${escapeHtml(item.name)}</td>
                  <td style="border:1px solid #d1d5db;padding:8px;text-align:right;color:#111827;font-weight:500">
                    ${item.estimatedPriceCAD ? `$${item.estimatedPriceCAD.toFixed(2)}` : 'Not estimated'}
                  </td>
                </tr>
              `).join('')}
              ${totalGearCost > 0 ? `
                <tr style="background-color:#f3f4f6;font-weight:600">
                  <td style="border:1px solid #d1d5db;padding:8px;color:#111827">Total Estimated Cost</td>
                  <td style="border:1px solid #d1d5db;padding:8px;text-align:right;color:#111827">$${totalGearCost.toFixed(2)}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          ${addendumBlock(templates.find(t => t.documentType === 'gear')?.addendum || '')}
          ${signatureBlock("Hiree Signature", signatures.find(s => s.signatureType === 'hiree')?.signatureData || '')}
          ${signatureBlock("Company Representative Signature", signatures.find(s => s.signatureType === 'company')?.signatureData || '')}
          ${footerBlock("Equipment, Gear & Supply Obligations", id)}
          ${initialsPage("Equipment, Gear & Supply Obligations", id, templates.find(t => t.documentType === 'gear')?.clauses || [])}
        `

      case 'pay':
        if (!offerDetails) {
          return `
            <div style="text-align:center;padding:60px 20px;color:#6b7280">
              <h3 style="font-size:18px;color:#374151;margin-bottom:8px">No Offer Details Found</h3>
              <p style="margin-bottom:20px">This profile doesn't have offer/acceptance details yet.</p>
              <p style="color:#9ca3af;font-size:14px">Please go to the Offer/Acceptance tab to create an offer letter for this hiree.</p>
            </div>
          `
        }

        const effFromISO = offerDetails?.startDate || ""
        const effUntilISO = offerDetails?.endDate || (offerDetails?.startDate && offerDetails?.probationMonths)
          ? addMonths(offerDetails.startDate!, parseInt(offerDetails.probationMonths!))
          : ""
        const effFrom = effFromISO ? formatLongDate(effFromISO) : "________________"
        const effUntil = effUntilISO ? formatLongDate(effUntilISO) : "________________"

        // Build compensation details from offer form
        const compensationDetails = () => {
          const comp = offerDetails?.compensation
          if (!comp) return ''
          
          let details = '<div style="margin:12px 0;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">'
          details += '<div style="font-weight:600;color:#0f172a;margin-bottom:8px">Compensation Details</div>'
          details += '<div style="color:#475569;font-size:14px">'
          
          if (comp.baseSalary && comp.baseSalary > 0) {
            details += `<div><strong>Base Salary:</strong> ${formatCurrency(comp.baseSalary)}</div>`
          }
          if (comp.hourlyRate && comp.hourlyRate > 0) {
            details += `<div><strong>Hourly Rate:</strong> ${formatCurrency(comp.hourlyRate)}/hour</div>`
          }
          if (comp.commission && comp.commission > 0) {
            details += `<div><strong>Commission:</strong> ${comp.commission}%</div>`
          }
          if (comp.benefits) {
            details += `<div><strong>Benefits & Perks:</strong> ${escapeHtml(comp.benefits)}</div>`
          }
          
          details += '</div></div>'
          return details
        }

        // Build tiered services table (only show selected services from offer form)
        const payTierTables = () => {
          const selectedFlatServices = offerDetails?.flatServices || []
          const selectedTieredServices = offerDetails?.tieredServices || []
          
          if (selectedFlatServices.length === 0 && selectedTieredServices.length === 0) {
            return '<p style="color:#6b7280;font-style:italic">No services selected in offer form.</p>'
          }
          
          let content = ''
          
          // Show selected tiered services with full tier details (only if tiered services were selected)
          if (selectedTieredServices.length > 0 && tiers && tiers.length > 0) {
            // Determine which service types were selected
            const selectedServiceTypes = new Set<string>()
            selectedTieredServices.forEach(service => {
              if (service.name.toLowerCase().includes('photo')) selectedServiceTypes.add('photo')
              if (service.name.toLowerCase().includes('video')) selectedServiceTypes.add('video')
              if (service.name.toLowerCase().includes('iguide')) selectedServiceTypes.add('iguide')
              if (service.name.toLowerCase().includes('matterport')) selectedServiceTypes.add('matterport')
            })

            // Only show the table if at least one service type was selected
            if (selectedServiceTypes.size > 0) {
              content += `
                <div style="margin:12px 0">
                  <h4 style="margin:8px 0;font-size:14px;color:#0f172a">Selected Tiered Services (Per Square Foot)</h4>
                  <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin:8px 0">
                    <thead>
                      <tr style="background:#f8fafc">
                        <th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">Tier</th>
                        <th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">Range</th>
                        ${selectedServiceTypes.has('photo') ? '<th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">Photo</th>' : ''}
                        ${selectedServiceTypes.has('video') ? '<th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">Video</th>' : ''}
                        ${selectedServiceTypes.has('iguide') ? '<th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">iGuide</th>' : ''}
                        ${selectedServiceTypes.has('matterport') ? '<th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">Matterport</th>' : ''}
                      </tr>
                    </thead>
                    <tbody>
                      ${tiers.map(tier => `
                        <tr>
                          <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">Tier ${tier.minSqft}-${tier.maxSqft}</td>
                          <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">${tier.minSqft} - ${tier.maxSqft} sq ft</td>
                          ${selectedServiceTypes.has('photo') ? `<td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">${formatCurrency(getHireeTieredServicePrice(tier.id, 'photo'))}</td>` : ''}
                          ${selectedServiceTypes.has('video') ? `<td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">${formatCurrency(getHireeTieredServicePrice(tier.id, 'video'))}</td>` : ''}
                          ${selectedServiceTypes.has('iguide') ? `<td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">${formatCurrency(getHireeTieredServicePrice(tier.id, 'iguide'))}</td>` : ''}
                          ${selectedServiceTypes.has('matterport') ? `<td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">${formatCurrency(getHireeTieredServicePrice(tier.id, 'matterport'))}</td>` : ''}
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `
            }
          }
          
          // Show selected flat services (only if flat services were selected)
          if (selectedFlatServices.length > 0) {
            content += `
              <div style="margin:12px 0">
                <h4 style="margin:8px 0;font-size:14px;color:#0f172a">Selected Flat Rate Services</h4>
                <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin:8px 0">
                  <thead>
                    <tr style="background:#f8fafc">
                      <th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">Service</th>
                      <th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedFlatServices.map(service => {
                      // Find the actual service in company services to get proper pricing
                      const companyService = flatServices?.find(s => s.name === service.name)
                      const serviceId = companyService?.id || service.id
                      const price = companyService ? getHireeFlatServicePrice(serviceId) : service.rate
                      return `
                        <tr>
                          <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">${escapeHtml(service.name)}</td>
                          <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#374151">${formatCurrency(price)}</td>
                        </tr>
                      `
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `
          }
          
          return content
        }

        return `
          ${logoBlock()}
          ${topTitle("Compensation Agreement")}
          ${hireeBlock()}
          <h3 style="margin:12px 0 8px;font-size:16px;color:#0f172a">1) Position & Dates</h3>
          <div style="margin:12px 0;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
            <div style="color:#475569;font-size:14px">
              <div><strong>Position:</strong> ${escapeHtml(offerDetails?.position || "________________")}</div>
              <div><strong>Start Date:</strong> ${effFrom}</div>
              ${effUntil ? `<div><strong>End Date:</strong> ${effUntil}</div>` : ''}
            </div>
          </div>
          ${compensationDetails()}
          <h3 style="margin:12px 0 8px;font-size:16px;color:#0f172a">2) Tiered & Flat Services</h3>
          ${payTierTables()}
          <h3 style="margin:16px 0 8px;font-size:16px;color:#0f172a">3) Payment & Terms</h3>
          <ol style="color:#1f2937;padding-left:18px;margin:6px 0">
            <li><strong>Effective Period:</strong> From <u>${effFrom}</u> until <u>${effUntil}</u> (probation window).</li>
            <li>Compensation is payable every two (2) weeks; statutory deductions may apply.</li>
            <li>Travel outside of the standard service region will be compensated when pre-approved.</li>
            <li>In case of errors, reshoots, or client complaints, compensation may be held until resolved by the original provider; if resolved by another team member, compensation may be transferred accordingly.</li>
            <li>All other terms of the Employment Agreement continue to apply; where there is a conflict, this Compensation Agreement prevails unless superseded in writing.</li>
          </ol>
          ${addendumBlock(templates.find(t => t.documentType === 'pay')?.addendum || '')}
          ${signatureBlock("Employer Signature", signatures.find(s => s.signatureType === 'company')?.signatureData || '')}
          ${signatureBlock("Employee Signature", signatures.find(s => s.signatureType === 'hiree')?.signatureData || '')}
          ${footerBlock("Compensation Agreement", id)}
          ${initialsPage("Compensation Agreement", id, templates.find(t => t.documentType === 'pay')?.clauses || [])}
        `

      case 'offer':
        if (!offerDetails) {
          return `
            <div style="text-align:center;padding:60px 20px;color:#6b7280">
              <h3 style="font-size:18px;color:#374151;margin-bottom:8px">No Offer Details Found</h3>
              <p style="margin-bottom:20px">This profile doesn't have offer/acceptance details yet.</p>
              <p style="color:#9ca3af;font-size:14px">Please go to the Offer/Acceptance tab to create an offer letter for this hiree.</p>
            </div>
          `
        }

        const o = offerDetails
        const hireeName = profile?.hireeName || "________________"
        const workSchedule = o?.workSchedule || "________________"
        const probationPeriod = o?.probationMonths || "1"
        const benefits = o?.compensation?.benefits || ""
        const reportToName = o?.managerName || "________"
        const reportToEmail = o?.managerEmail || "________"
        const reportToPhone = o?.managerPhone || "________"
        const reportToExt = o?.managerExt || "300"

        return `
          ${logoBlock()}
          ${topTitle(`Offer of Co-Working — ${escapeHtml(o?.position || "Photographer")}`)}
          <p style="color:#475569;margin:0 0 6px">Date: ${formatLongDate(new Date().toISOString().split('T')[0])}</p>
          <p style="color:#1f2937">Dear ${escapeHtml(hireeName)},</p>
          <p style="color:#1f2937">I am very pleased to offer you the position of ${escapeHtml(o?.position || "Photographer")} with ${c}. This position has a start date of ${o?.startDate ? formatLongDate(o.startDate) : "________________"} and includes a probationary period of ${escapeHtml(probationPeriod)} month(s), after which your performance will be reviewed.</p>
          <p style="color:#1f2937">Your work schedule will be: <strong>${escapeHtml(workSchedule)}</strong></p>
          <p style="color:#1f2937">You will report to <strong>${escapeHtml(reportToName)}</strong> (${escapeHtml(reportToEmail)} • ${escapeHtml(reportToPhone)} Ext ${escapeHtml(reportToExt)}).</p>
          ${benefits ? `<p style="color:#1f2937"><strong>Benefits & Perks:</strong> ${escapeHtml(benefits)}</p>` : ''}
          <p style="color:#1f2937">Please indicate your acceptance by signing below and returning this letter by ${o?.returnBy ? formatLongDate(o.returnBy) : "________________"}. For general questions, contact (647) 931-0909 Ext ${escapeHtml(o?.contactExt || "500")}.</p>
          ${addendumBlock(templates.find(t => t.documentType === 'offer')?.addendum || '')}
          <div style="margin-top:18px;font-weight:600">${escapeHtml(o?.ceoName || "Alipasha Amidi (CEO)")}</div>
          <div>Per: ____________ ____________ (SEAL)</div>
          <h3 style="margin-top:24px;font-size:16px;color:#0f172a">Acceptance</h3>
          <p style="color:#1f2937">I accept this offer of co-working terms as outlined above.</p>
          ${signatureBlock("Freelancer Signature", signatures.find(s => s.signatureType === 'hiree')?.signatureData || '')}
          ${footerBlock("Acceptance Letter", id)}
          ${initialsPage("Acceptance Letter", id, templates.find(t => t.documentType === 'offer')?.clauses || [])}
        `

      default:
        return ''
    }
  }

  // Preview document
  const handlePreview = (docType: DocumentType) => {
    const content = buildDocument(docType)
    setPreviewContent(content)
    setPreviewDoc(docType)
  }

  // Generate PDF (placeholder for now)
  const handleGeneratePDF = async () => {
    if (!profile || profile.id.startsWith('profile_')) {
      showWarning('Profile Required', 'Please load a profile first to generate documents.')
      return
    }

    if (!previewDoc) {
      showInfo('Preview Required', 'Please preview a document first before generating PDF.')
      return
    }

    try {
      const content = buildDocument(previewDoc)
      const { blob, filename } = await SimplePDFGenerator.generatePDF(content, {
        filename: `${previewDoc}_${profile.hireeName || 'document'}_${Date.now()}.pdf`,
        format: 'A4',
        orientation: 'portrait',
        margin: '0.5in'
      })
      
      SimplePDFGenerator.downloadPDF(blob, filename)
      showSuccess('PDF Generated', 'PDF generation initiated. Please use the print dialog to save as PDF.')
    } catch (error) {
      console.error('Error generating PDF:', error)
      showError('PDF Generation Failed', 'Failed to generate PDF. Please try again.')
    }
  }

  const documentTypes: Array<{ type: DocumentType; title: string; description: string }> = [
    { type: 'waiver', title: 'Training Waiver', description: 'Liability release and training agreement' },
    { type: 'noncompete', title: 'Non-Compete', description: 'Competition restriction agreement' },
    { type: 'gear', title: 'Gear Obligations', description: 'Equipment and supply requirements' },
    { type: 'pay', title: 'Compensation Agreement', description: 'Payment structure and terms' },
    { type: 'offer', title: 'Acceptance Letter', description: 'Job offer and acceptance' },
  ]

  if (!profile || profile.id.startsWith('profile_')) {
    return (
      <div className="p-6">
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Loaded</h3>
            <p className="text-gray-500 mb-6">
              Please load a profile to view and generate documents.
            </p>
          </div>
        </CardContent>
      </div>
    )
  }

  return (
    <div className="p-6">
      <CardHeader className="px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Generate and preview documents for {profile.hireeName || 'this hiree'}.
        </p>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {documentTypes.map((doc) => (
            <div key={doc.type} className="border border-gray-200 rounded-xl p-4 bg-white">
              <h4 className="font-medium text-gray-900 mb-2">{doc.title}</h4>
              <p className="text-sm text-gray-500 mb-4">{doc.description}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(doc.type)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={handleGeneratePDF}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Area */}
        {previewDoc && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Preview: {documentTypes.find(d => d.type === previewDoc)?.title}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewDoc(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6 bg-white">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
                style={{
                  fontFamily: '-apple-system, Segoe UI, Roboto, Helvetica, Arial',
                  lineHeight: '1.55',
                  color: '#111827'
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </div>
  )
}
