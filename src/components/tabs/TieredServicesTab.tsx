import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CardContent, CardHeader } from '../ui/Card'
import { Layers, Plus, Trash2, Download, Upload, AlertCircle } from 'lucide-react'
import { download, parseCSV, csvEscape, tiersAreValid, tierLabel } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { Tier, TieredRate } from '../../types'

export const TieredServicesTab: React.FC = () => {
  const { tiers, setTiers, tieredRates, setTieredRates, company, profile } = useAppStore()
  const { user } = useAuth()
  const [newTierMin, setNewTierMin] = useState('')
  const [newTierMax, setNewTierMax] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // State for hiree overrides
  const [rateOverrides, setRateOverrides] = useState<Record<string, { rate: string; enabled: boolean }>>({})

  // Load existing overrides when profile changes
  useEffect(() => {
    const loadOverrides = async () => {
      if (!profile || profile.id.startsWith('profile_')) {
        setRateOverrides({})
        return
      }

      try {
        const { data: overrides } = await supabase
          .from('hiree_tiered_rates')
          .select('*')
          .eq('profile_id', profile.id)

        if (overrides) {
          console.log('Loaded tiered overrides:', overrides)
          const overrideMap: Record<string, { rate: string; enabled: boolean }> = {}
          
          // Get the tiered rates to map tiered_rate_id back to tier_id + service_type
          const { data: tieredRates } = await supabase
            .from('tiered_rates')
            .select('id, tier_id, service_type')
            .in('id', overrides.map(o => o.tiered_rate_id))
          
          if (tieredRates) {
            overrides.forEach(override => {
              const tieredRate = tieredRates.find(tr => tr.id === override.tiered_rate_id)
              if (tieredRate) {
                const key = `${tieredRate.tier_id}-${tieredRate.service_type}`
                overrideMap[key] = {
                  rate: override.custom_rate?.toString() || '',
                  enabled: override.is_enabled ?? true
                }
              }
            })
          }
          
          setRateOverrides(overrideMap)
        }
      } catch (error) {
        console.error('Error loading tiered overrides:', error)
      }
    }

    loadOverrides()
  }, [profile])

  // Load tenant's tiered services when component mounts
  useEffect(() => {
    const loadTieredServices = async () => {
      if (!user || !company) return

      try {
        // Load tiers and rates for this company
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
          setTiers([])
          setTieredRates([])
          return
        }

        // Convert database format to frontend format
        const frontendTiers: Tier[] = (tiersData || []).map((dbTier: any) => ({
          id: dbTier.id,
          profileId: dbTier.profile_id,
          minSqft: dbTier.min_sqft,
          maxSqft: dbTier.max_sqft,
          createdAt: dbTier.created_at,
        }))

        const frontendRates: TieredRate[] = (ratesData || []).map((dbRate: any) => ({
          id: dbRate.id,
          tierId: dbRate.tier_id,
          profileId: dbRate.profile_id,
          serviceType: dbRate.service_type || 'photo', // Default to photo if not specified
          rate: dbRate.rate,
          createdAt: dbRate.created_at,
        }))

        setTiers(frontendTiers)
        setTieredRates(frontendRates)
      } catch (error) {
        console.error('Error loading tiered services:', error)
        setTiers([])
        setTieredRates([])
      }
    }

    loadTieredServices()
  }, [user, company, setTiers, setTieredRates])

  const addTier = async () => {
    const min = parseInt(newTierMin, 10)
    const max = parseInt(newTierMax, 10)

    // Auto-fill min if empty
    let finalMin = min
    if (isNaN(min) && tiers.length > 0) {
      const lastTier = [...tiers].sort((a, b) => a.maxSqft - b.maxSqft).slice(-1)[0]
      finalMin = lastTier.maxSqft + 1
    }

    if (isNaN(finalMin) || isNaN(max)) {
      alert('Enter Min and Max (or leave Min blank to auto-fill).')
      return
    }

    if (max < finalMin) {
      alert('Max must be ≥ Min.')
      return
    }

    const testTiers = [...tiers, { minSqft: finalMin, maxSqft: max }]
    if (!tiersAreValid(testTiers)) {
      alert('Tier overlaps detected. Adjust Min/Max.')
      return
    }

    if (!user || !company) {
      alert('Please log in and save company information first.')
      return
    }

    try {
      // Services are company-owned, not profile-owned
      // We still need a profile_id for the foreign key constraint, but it's not meaningful
      // Use a placeholder or the first profile if available
      let profileId = profile?.id
      
      if (!profileId || profileId.startsWith('profile_')) {
        // Find any existing profile for this company to use as placeholder
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('company_id', company.id)
          .limit(1)
          .single()
          
        if (existingProfile) {
          profileId = existingProfile.id
        } else {
          // Only create a temp profile if absolutely none exist
          const tempProfileData = {
            name: 'Company Services Profile',
            company_id: company.id,
            hiree_name: 'Company Services',
            hiree_dob: '1990-01-01',
            hiree_address: 'Company Address',
            hiree_email: 'services@company.com',
            hiree_date: new Date().toISOString().split('T')[0],
            owner_id: user.id,
            created_at: new Date().toISOString(),
          }
          
          const { data: tempProfile, error: tempError } = await supabase
            .from('profiles')
            .insert([tempProfileData])
            .select()
            .single()
            
          if (tempError) throw tempError
          profileId = tempProfile.id
        }
      }

      const tierData = {
        profile_id: profileId,
        company_id: company.id, // Now required after migration
        min_sqft: finalMin,
        max_sqft: max,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('tiers')
        .insert([tierData])
        .select()
        .single()

      if (error) throw error

      // Convert back to frontend format
      const frontendTier: Tier = {
        id: data.id,
        profileId: data.profile_id,
        minSqft: data.min_sqft,
        maxSqft: data.max_sqft,
        createdAt: data.created_at,
      }

      const updatedTiers = [...tiers, frontendTier].sort((a, b) => a.minSqft - b.minSqft)
      setTiers(updatedTiers)

      // Add empty rates for the new tier
      const serviceTypes: ('photo' | 'video' | 'iguide' | 'matterport')[] = ['photo', 'video', 'iguide', 'matterport']
      const newRates: TieredRate[] = serviceTypes.map(type => ({
        id: `temp-rate-${Date.now()}-${type}`,
        profileId: profileId || 'temp',
        tierId: frontendTier.id,
        serviceType: type,
        rate: '',
        createdAt: new Date().toISOString(),
      }))

      setTieredRates([...tieredRates, ...newRates])

      setNewTierMin((max + 1).toString())
      setNewTierMax('')
    } catch (error) {
      console.error('Error adding tier:', error)
      alert('Error adding tier. Please try again.')
    }
  }

  const updateTier = (id: string, field: 'minSqft' | 'maxSqft', value: number) => {
    const updatedTiers = tiers.map(tier =>
      tier.id === id ? { ...tier, [field]: value } : tier
    ).sort((a, b) => a.minSqft - b.minSqft)

    setTiers(updatedTiers)
  }

  const deleteTier = (id: string) => {
    setTiers(tiers.filter(tier => tier.id !== id))
    setTieredRates(tieredRates.filter(rate => rate.tierId !== id))
  }

  const updateRate = (tierId: string, serviceType: 'photo' | 'video' | 'iguide' | 'matterport', value: string) => {
    setTieredRates(
      tieredRates.map(rate =>
        rate.tierId === tierId && rate.serviceType === serviceType
          ? { ...rate, rate: value }
          : rate
      )
    )
  }

  const handleOverrideRate = async (tierId: string, serviceType: string, rate: string) => {
    const key = `${tierId}-${serviceType}`
    setRateOverrides(prev => ({
      ...prev,
      [key]: { ...prev[key], rate }
    }))
    
    // Save to database
    const enabled = rateOverrides[key]?.enabled ?? true
    await saveTieredOverrideToDatabase(tierId, serviceType, rate, enabled)
  }

  const handleOverrideEnabled = async (tierId: string, serviceType: string, enabled: boolean) => {
    const key = `${tierId}-${serviceType}`
    setRateOverrides(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled }
    }))
    
    // Save to database
    const rate = rateOverrides[key]?.rate || ''
    await saveTieredOverrideToDatabase(tierId, serviceType, rate, enabled)
  }

  const saveTieredOverrideToDatabase = async (tierId: string, serviceType: string, rate: string, enabled: boolean) => {
    if (!user || !profile || profile.id.startsWith('profile_')) return

    try {
      // Let's first check what the tiered_rates table structure looks like
      const { data: allRates, error: allRatesError } = await supabase
        .from('tiered_rates')
        .select('*')
        .limit(1)

      if (allRatesError) {
        console.error('Error checking tiered_rates structure:', allRatesError)
        return
      }

      console.log('Tiered rates table structure:', allRates)
      console.log('Attempting to save override for tier:', tierId, 'service:', serviceType, 'rate:', rate, 'enabled:', enabled)

      // First, let's check what columns exist in hiree_tiered_rates table
      const { data: hireeRatesStructure, error: hireeError } = await supabase
        .from('hiree_tiered_rates')
        .select('*')
        .limit(1)

      console.log('Hiree tiered rates table structure:', hireeRatesStructure)
      console.log('Hiree tiered rates error:', hireeError)

      // Find the tiered_rate_id from the tiered_rates table
      // The tiered_rates table should have tier_id and service_type columns
      const { data: tieredRates, error: tieredRatesError } = await supabase
        .from('tiered_rates')
        .select('id, tier_id, service_type')
        .eq('tier_id', tierId)
        .eq('service_type', serviceType)
        .limit(1)

      if (tieredRatesError) {
        console.error('Error finding tiered rate:', tieredRatesError)
        return
      }

      if (!tieredRates || tieredRates.length === 0) {
        console.error('No tiered rate found for tier:', tierId, 'service:', serviceType)
        alert('Tiered rate not found. Please save the tiered rates first.')
        return
      }

      const tieredRate = tieredRates[0]

      console.log('Found tiered rate:', tieredRate)

      // Use the correct column names from the schema
      const overrideData = {
        profile_id: profile.id,
        tiered_rate_id: tieredRate.id,
        custom_rate: rate ? parseFloat(rate) : null,
        is_enabled: enabled
      }

      // Use UPSERT to handle both insert and update in one operation
      // This avoids the 409 conflict error by using Supabase's upsert functionality
      const { error: upsertError } = await supabase
        .from('hiree_tiered_rates')
        .upsert(overrideData, {
          onConflict: 'profile_id,tiered_rate_id'
        })

      if (upsertError) {
        console.error('Upsert error:', upsertError)
        throw upsertError
      }

      console.log('Tiered override saved successfully (upsert)')
    } catch (error) {
      console.error('Error saving tiered override:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Error saving tiered override: ${errorMessage}`)
    }
  }

  const saveAllRates = async () => {
    if (!user || !company) {
      alert('Please log in and save company information first.')
      return
    }

    try {
      // Services are company-owned, not profile-owned
      // We still need a profile_id for the foreign key constraint, but it's not meaningful
      // Use a placeholder or the first profile if available
      let profileId = profile?.id
      
      if (!profileId || profileId.startsWith('profile_')) {
        // Find any existing profile for this company to use as placeholder
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('company_id', company.id)
          .limit(1)
          .single()
          
        if (existingProfile) {
          profileId = existingProfile.id
        } else {
          // Only create a temp profile if absolutely none exist
          const tempProfileData = {
            name: 'Company Services Profile',
            company_id: company.id,
            hiree_name: 'Company Services',
            hiree_dob: '1990-01-01',
            hiree_address: 'Company Address',
            hiree_email: 'services@company.com',
            hiree_date: new Date().toISOString().split('T')[0],
            owner_id: user.id,
            created_at: new Date().toISOString(),
          }
          
          const { data: tempProfile, error: tempError } = await supabase
            .from('profiles')
            .insert([tempProfileData])
            .select()
            .single()
            
          if (tempError) throw tempError
          profileId = tempProfile.id
        }
      }

      // Save all rates to Supabase
      const ratesToSave = tieredRates
        .filter(rate => rate.rate.trim() !== '') // Only save rates with values
        .map(rate => ({
          tier_id: rate.tierId,
          profile_id: profileId,
          company_id: company.id,
          service_type: rate.serviceType,
          rate: rate.rate,
          created_at: new Date().toISOString(),
        }))

      if (ratesToSave.length === 0) {
        alert('No rates to save. Please enter some rates first.')
        return
      }

      const { error } = await supabase
        .from('tiered_rates')
        .insert(ratesToSave)

      if (error) throw error

      alert(`Successfully saved ${ratesToSave.length} rates!`)
    } catch (error) {
      console.error('Error saving rates:', error)
      alert('Error saving rates. Please try again.')
    }
  }

  const exportTiersCSV = () => {
    const rows = [
      ['min_sqft', 'max_sqft'],
      ...tiers.map(tier => [tier.minSqft.toString(), tier.maxSqft.toString()])
    ]
    const csvContent = rows.map(row => row.map(csvEscape).join(',')).join('\n')
    download('tiers.csv', csvContent)
  }

  const exportRatesCSV = () => {
    const rows = [
      ['tier_min', 'tier_max', 'service_type', 'rate'],
      ...tieredRates.map(rate => {
        const tier = tiers.find(t => t.id === rate.tierId)
        return [
          tier?.minSqft.toString() || '',
          tier?.maxSqft.toString() || '',
          rate.serviceType,
          rate.rate
        ]
      })
    ]
    const csvContent = rows.map(row => row.map(csvEscape).join(',')).join('\n')
    download('tiered_rates.csv', csvContent)
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      const header = (rows[0] || []).map(h => h.toLowerCase().trim())
      const minIndex = header.indexOf('min_sqft')
      const maxIndex = header.indexOf('max_sqft')

      if (minIndex === -1 || maxIndex === -1) {
        alert('CSV must have headers: min_sqft, max_sqft')
        return
      }

      const importedTiers: Tier[] = rows
        .slice(1)
        .filter(row => row.length > 0)
        .map((row, index) => ({
          id: `imported-${Date.now()}-${index}`,
          profileId: 'temp',
          minSqft: parseInt(row[minIndex]) || 0,
          maxSqft: parseInt(row[maxIndex]) || 0,
          createdAt: new Date().toISOString(),
        }))

      setTiers([...tiers, ...importedTiers])
    } catch (error) {
      console.error('Error importing CSV:', error)
      alert('Error importing CSV file')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getTierRates = (tierId: string) => {
    return tieredRates.filter(rate => rate.tierId === tierId)
  }

  const isTierValid = (tier: Tier) => {
    const testTiers = tiers.filter(t => t.id !== tier.id)
    return tiersAreValid([...testTiers, tier])
  }

  return (
    <div className="p-6">
      <CardHeader className="px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Services — Sq.ft Tiers
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Add tier with Min/Max. Next Min auto-fills to (last Max + 1). No overlaps allowed.
        </p>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        {/* Add New Tier */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              placeholder="Min"
              value={newTierMin}
              onChange={(e) => setNewTierMin(e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-gray-500">sq.ft</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              placeholder="Max"
              value={newTierMax}
              onChange={(e) => setNewTierMax(e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-gray-500">sq.ft</span>
          </div>
          <Button onClick={addTier} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Tier
          </Button>
        </div>

        {/* Tiers Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-[35%]">Min (sq.ft)</th>
                <th className="w-[35%]">Max (sq.ft)</th>
                <th className="w-[30%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">
                    No tiers added yet
                  </td>
                </tr>
              ) : (
                tiers.map((tier) => (
                  <tr key={tier.id}>
                    <td>
                      <Input
                        type="number"
                        min="0"
                        value={tier.minSqft}
                        onChange={(e) => updateTier(tier.id, 'minSqft', parseInt(e.target.value) || 0)}
                        className={`border-0 shadow-none p-0 ${!isTierValid(tier) ? 'error' : ''}`}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        min="0"
                        value={tier.maxSqft}
                        onChange={(e) => updateTier(tier.id, 'maxSqft', parseInt(e.target.value) || 0)}
                        className={`border-0 shadow-none p-0 ${!isTierValid(tier) ? 'error' : ''}`}
                      />
                    </td>
                    <td className="text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteTier(tier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tiered Rates Tables */}
        {tiers.length > 0 && (
          <div className="space-y-6">
            {(['photo', 'video', 'iguide', 'matterport'] as const).map((serviceType) => (
              <div key={serviceType}>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 capitalize">
                  Tiered Rates — {serviceType === 'iguide' ? 'iGuide' : serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Tier</th>
                        <th>Rate ($)</th>
                        {profile && !profile.id.startsWith('profile_') && (
                          <>
                            <th>Override Rate</th>
                            <th>Enabled</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((tier, index) => {
                        const rate = getTierRates(tier.id).find(r => r.serviceType === serviceType)
                        return (
                          <tr key={`${tier.id}-${serviceType}`}>
                            <td className="font-medium">
                              {tierLabel(tier, index, tiers[index - 1])}
                            </td>
                            <td>
                              <Input
                                value={rate?.rate || ''}
                                onChange={(e) => updateRate(tier.id, serviceType, e.target.value)}
                                placeholder="$ e.g., 35"
                                className="border-0 shadow-none p-0"
                              />
                            </td>
                            {profile && !profile.id.startsWith('profile_') && (
                              <>
                                <td>
                                  <Input
                                    placeholder="Override rate"
                                    className="border-0 shadow-none p-0 text-sm"
                                    value={rateOverrides[`${tier.id}-${serviceType}`]?.rate || ''}
                                    onChange={(e) => handleOverrideRate(tier.id, serviceType, e.target.value)}
                                  />
                                </td>
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    checked={rateOverrides[`${tier.id}-${serviceType}`]?.enabled ?? true}
                                    onChange={(e) => handleOverrideEnabled(tier.id, serviceType, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                  />
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Status and Button */}
        {tiers.length > 0 && (
          <div className="flex justify-between items-center mb-6 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                {tiers.length} tier{tiers.length !== 1 ? 's' : ''} saved to database
              </span>
            </div>
            <Button 
              onClick={saveAllRates}
              size="sm"
              variant="outline"
            >
              <Layers className="h-4 w-4 mr-1" />
              Save All Rates
            </Button>
          </div>
        )}

        {/* Import/Export Actions */}
        <div className="flex gap-3 flex-wrap mt-6">
          <Button variant="secondary" size="sm" onClick={exportTiersCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export Tiers CSV
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-1" />
            {isImporting ? 'Importing...' : 'Import Tiers CSV'}
          </Button>

          <Button variant="secondary" size="sm" onClick={exportRatesCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export Tiered Rates CSV
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Tier Validation:</p>
              <p>• No overlapping ranges allowed</p>
              <p>• Min must be less than Max</p>
              <p>• Tiers are automatically sorted by Min value</p>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
