import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CardContent, CardHeader } from '../ui/Card'
import { Camera, Plus, Trash2, CheckCircle, DollarSign, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { OpenAIService } from '../../lib/openaiService'
import type { GearItem } from '../../types'

export const GearTab: React.FC = () => {
  const { gearItems, setGearItems, company, profile } = useAppStore()
  const { user } = useAuth()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [newGearItem, setNewGearItem] = useState('')
  const [isEstimating, setIsEstimating] = useState(false)
  
  // State for hiree overrides
  const [gearOverrides, setGearOverrides] = useState<Record<string, { required: boolean; customNotes: string }>>({})

  // Load existing overrides when profile changes
  useEffect(() => {
    const loadOverrides = async () => {
      if (!profile || profile.id.startsWith('profile_')) {
        setGearOverrides({})
        return
      }

      try {
        // Load overrides for company gear items only
        const { data: overrides } = await supabase
          .from('hiree_gear_items')
          .select('*')
          .eq('profile_id', profile.id)

        if (overrides) {
          const overrideMap: Record<string, { required: boolean; customNotes: string }> = {}
          overrides.forEach(override => {
            overrideMap[override.gear_item_id] = {
              required: override.is_required,
              customNotes: override.custom_notes || ''
            }
          })
          setGearOverrides(overrideMap)
        }

        // For custom gear items, we don't need to load overrides since they're already hiree-specific
        // The custom gear items are loaded directly in the main gear loading effect
      } catch (error) {
        console.error('Error loading gear overrides:', error)
      }
    }

    loadOverrides()
  }, [profile])

  // Load gear items when component mounts or profile changes
  useEffect(() => {
    const loadGearItems = async () => {
      if (!user || !company) return

      try {
        // Load company gear items with pricing
        const { data: companyGear, error: companyError } = await supabase
          .from('gear_items')
          .select('*')
          .eq('company_id', company.id)
          .order('created_at', { ascending: true })

        if (companyError) {
          console.error('Error loading company gear items:', companyError)
        }

        // Convert company gear to frontend format
        const frontendCompanyGear: GearItem[] = (companyGear || []).map((dbItem: any) => ({
          id: dbItem.id,
          profileId: dbItem.profile_id,
          name: dbItem.name,
          createdAt: dbItem.created_at,
          isCustom: false,
          estimatedPriceCAD: dbItem.estimated_price_cad || undefined,
          priceSource: dbItem.price_source || undefined,
          lastEstimatedAt: dbItem.last_estimated_at || undefined
        }))

        // If a profile is loaded, also load custom gear items for that profile
        let customGear: GearItem[] = []
        if (profile && !profile.id.startsWith('profile_')) {
          const { data: customGearData, error: customError } = await supabase
            .from('hiree_custom_gear_items')
            .select('*')
            .eq('profile_id', profile.id)
            .order('created_at', { ascending: true })

          if (customError) {
            console.error('Error loading custom gear items:', customError)
          } else {
            customGear = (customGearData || []).map((dbItem: any) => ({
              id: dbItem.id,
              profileId: dbItem.profile_id,
              name: dbItem.name,
              createdAt: dbItem.created_at,
              isRequired: dbItem.is_required,
              customNotes: dbItem.custom_notes || '',
              isCustom: true,
              estimatedPriceCAD: dbItem.estimated_price_cad || undefined,
              priceSource: dbItem.price_source || undefined,
              lastEstimatedAt: dbItem.last_estimated_at || undefined
            }))
          }
        }

        // Combine company gear and custom gear
        setGearItems([...frontendCompanyGear, ...customGear])
      } catch (error) {
        console.error('Error loading gear items:', error)
        setGearItems([])
      }
    }

    loadGearItems()
  }, [user, company, profile, setGearItems])

  const addGearItem = async () => {
    if (!newGearItem.trim()) {
      alert('Enter a gear item.')
      return
    }

    if (!user || !company) {
      alert('Please log in and save company information first.')
      return
    }

    try {
      // Check if a real profile is loaded (not temporary)
      if (profile && !profile.id.startsWith('profile_')) {
        // Real profile loaded - add gear as hiree-specific custom gear
        console.log('Adding custom gear for profile:', profile.id, profile.hireeName)

        // Add gear as hiree-specific custom gear
        const { data, error } = await supabase
          .from('hiree_custom_gear_items')
          .insert([{
            profile_id: profile.id,
            name: newGearItem.trim(),
            is_required: false,
            custom_notes: '',
            created_at: new Date().toISOString(),
          }])
          .select()
          .single()

        if (error) throw error

        // Add to local state for display
        const frontendGearItem: GearItem = {
          id: data.id,
          name: data.name,
          isRequired: data.is_required,
          customNotes: data.custom_notes,
          isCustom: true,
          profileId: data.profile_id,
          createdAt: data.created_at,
        }

        setGearItems([...gearItems, frontendGearItem])
        setNewGearItem('')
        console.log('Added CUSTOM gear item for profile:', frontendGearItem)
        return
      }

      // No profile loaded - add gear as company-owned
      console.log('Adding company gear (no profile loaded)')
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

      const gearData = {
        profile_id: profileId,
        company_id: company.id, // Now required after migration
        name: newGearItem.trim(),
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('gear_items')
        .insert([gearData])
        .select()
        .single()

      if (error) throw error

      // Convert back to frontend format
      const frontendGearItem: GearItem = {
        id: data.id,
        profileId: data.profile_id,
        name: data.name,
        createdAt: data.created_at,
      }

      setGearItems([...gearItems, frontendGearItem])
      setNewGearItem('')
      console.log('Added COMPANY gear item:', frontendGearItem)
      alert('Gear item added to company inventory!')
    } catch (error) {
      console.error('Error adding gear item:', error)
      alert('Error adding gear item. Please try again.')
    }
  }

  const updateGearItem = async (id: string, value: string) => {
    // Update local state first
    setGearItems(
      gearItems.map(item =>
        item.id === id ? { ...item, name: value } : item
      )
    )

    // Find the item to determine if it's custom gear
    const item = gearItems.find(item => item.id === id)
    if (!item) return

    try {
      if (item.isCustom) {
        // Update custom gear item
        const { error } = await supabase
          .from('hiree_custom_gear_items')
          .update({ name: value })
          .eq('id', id)
        
        if (error) throw error
      } else {
        // Update company gear item
        const { error } = await supabase
          .from('gear_items')
          .update({ name: value })
          .eq('id', id)
        
        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating gear item:', error)
      // Revert local state on error
      setGearItems(
        gearItems.map(item =>
          item.id === id ? { ...item, name: item.name } : item
        )
      )
    }
  }

  const handleGearRequired = async (gearId: string, required: boolean) => {
    // Find the gear item to determine if it's custom gear
    const gearItem = gearItems.find(item => item.id === gearId)
    if (!gearItem) return

    if (gearItem.isCustom) {
      // For custom gear, update local state directly
      const updatedItems = gearItems.map(item => 
        item.id === gearId ? { ...item, isRequired: required } : item
      )
      setGearItems(updatedItems)
    } else {
      // For company gear, update override state
      setGearOverrides(prev => ({
        ...prev,
        [gearId]: { ...prev[gearId], required }
      }))
    }
    
    // Save to database
    const customNotes = gearItem.isCustom ? (gearItem.customNotes || '') : (gearOverrides[gearId]?.customNotes || '')
    await saveGearOverrideToDatabase(gearId, required, customNotes)
  }

  const handleGearNotes = async (gearId: string, customNotes: string) => {
    // Find the gear item to determine if it's custom gear
    const gearItem = gearItems.find(item => item.id === gearId)
    if (!gearItem) return

    if (gearItem.isCustom) {
      // For custom gear, update local state directly
      const updatedItems = gearItems.map(item => 
        item.id === gearId ? { ...item, customNotes } : item
      )
      setGearItems(updatedItems)
    } else {
      // For company gear, update override state
      setGearOverrides(prev => ({
        ...prev,
        [gearId]: { ...prev[gearId], customNotes }
      }))
    }
    
    // Save to database
    const required = gearItem.isCustom ? (gearItem.isRequired ?? true) : (gearOverrides[gearId]?.required ?? true)
    await saveGearOverrideToDatabase(gearId, required, customNotes)
  }

  const saveGearOverrideToDatabase = async (gearId: string, required: boolean, customNotes: string) => {
    if (!user || !profile || profile.id.startsWith('profile_')) return

    try {
      // Find the gear item to determine if it's custom gear
      const gearItem = gearItems.find(item => item.id === gearId)
      if (!gearItem) {
        console.error('Gear item not found:', gearId)
        return
      }

      // Only save overrides for company gear items (not custom gear)
      if (gearItem.isCustom) {
        // For custom gear, update the custom gear item directly
        const { error } = await supabase
          .from('hiree_custom_gear_items')
          .update({
            is_required: required,
            custom_notes: customNotes || null
          })
          .eq('id', gearId)

        if (error) {
          console.error('Error updating custom gear item:', error)
          throw error
        }

        console.log('Custom gear item updated successfully')
        return
      }

      // For company gear items, save as override
      const overrideData = {
        profile_id: profile.id,
        gear_item_id: gearId,
        is_required: required,
        custom_notes: customNotes || null
      }

      // Use UPSERT to handle both insert and update in one operation
      const { error: upsertError } = await supabase
        .from('hiree_gear_items')
        .upsert(overrideData, {
          onConflict: 'profile_id,gear_item_id'
        })

      if (upsertError) {
        console.error('Upsert error:', upsertError)
        throw upsertError
      }

      console.log('Gear override saved successfully (upsert)')
    } catch (error) {
      console.error('Error saving gear override:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Error saving gear override: ${errorMessage}`)
    }
  }

  const deleteGearItem = async (id: string) => {
    try {
      // Find the item to determine if it's custom gear
      const item = gearItems.find(item => item.id === id)
      if (!item) return

      if (item.isCustom) {
        // Delete from hiree_custom_gear_items table
        const { error } = await supabase
          .from('hiree_custom_gear_items')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      } else {
        // Delete from gear_items table (company gear)
        const { error } = await supabase
          .from('gear_items')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      }

      // Update local state
      setGearItems(gearItems.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting gear item:', error)
      showError('Delete Failed', 'Error deleting gear item. Please try again.')
    }
  }

  const handleAutoEstimatePrices = async () => {
    if (!profile || profile.id.startsWith('profile_')) {
      showWarning('Profile Required', 'Please load a profile first to estimate gear prices.')
      return
    }

    if (!company) {
      showWarning('Company Required', 'Please save company information first.')
      return
    }

    if (gearItems.length === 0) {
      showInfo('No Gear Items', 'Add some gear items first before estimating prices.')
      return
    }

    setIsEstimating(true)
    try {
      // Separate company gear and custom gear
      const companyGear = gearItems.filter(item => !item.isCustom)
      const customGear = gearItems.filter(item => item.isCustom)

      let totalEstimated = 0
      let totalItems = 0
      let companyResult: { 
        items: Array<{ name: string; estimatedPriceCAD: number }>; 
        totalEstimatedCostCAD: number; 
        tokensUsed: number; 
        costUSD: number; 
      } | null = null
      let customResult: { 
        items: Array<{ name: string; estimatedPriceCAD: number }>; 
        totalEstimatedCostCAD: number; 
        tokensUsed: number; 
        costUSD: number; 
      } | null = null

      // Estimate company gear
      if (companyGear.length > 0) {
        const companyGearToEstimate = companyGear.map(item => ({
          id: item.id,
          name: item.name,
          isCustom: false,
          isRequired: true,
          customNotes: ''
        }))

        companyResult = await OpenAIService.estimateGearCosts({
          gearItems: companyGearToEstimate,
          profileId: profile.id,
          companyId: company.id,
          estimationType: 'company_gear'
        })

        // Update company gear items with estimated prices
        const updatedCompanyGear = companyGear.map(item => {
          const estimation = companyResult?.items.find((est: { name: string; estimatedPriceCAD: number }) => est.name.toLowerCase() === item.name.toLowerCase())
          return {
            ...item,
            estimatedPriceCAD: estimation?.estimatedPriceCAD || 0,
            priceSource: 'openai' as const,
            lastEstimatedAt: new Date().toISOString()
          }
        })

        // Save company gear to database
        for (const item of updatedCompanyGear) {
          const { error } = await supabase
            .from('gear_items')
            .update({
              estimated_price_cad: item.estimatedPriceCAD,
              price_source: item.priceSource,
              last_estimated_at: item.lastEstimatedAt
            })
            .eq('id', item.id)

          if (error) {
            console.error('Error updating gear item price:', error)
          }
        }

        totalEstimated += companyResult.totalEstimatedCostCAD
        totalItems += companyResult.items.length

        // Log the estimation
        await OpenAIService.logEstimation(
          profile.id,
          company.id,
          'company_gear',
          companyResult.items.length,
          companyResult.totalEstimatedCostCAD,
          companyResult.tokensUsed,
          companyResult.costUSD
        )
      }

      // Estimate custom gear
      if (customGear.length > 0) {
        const customGearToEstimate = customGear.map(item => ({
          id: item.id,
          name: item.name,
          isCustom: true,
          isRequired: item.isRequired || true,
          customNotes: item.customNotes || ''
        }))

        customResult = await OpenAIService.estimateGearCosts({
          gearItems: customGearToEstimate,
          profileId: profile.id,
          companyId: company.id,
          estimationType: 'hiree_custom_gear'
        })

        // Update custom gear items with estimated prices
        const updatedCustomGear = customGear.map(item => {
          const estimation = customResult?.items.find((est: { name: string; estimatedPriceCAD: number }) => est.name.toLowerCase() === item.name.toLowerCase())
          return {
            ...item,
            estimatedPriceCAD: estimation?.estimatedPriceCAD || 0,
            priceSource: 'openai' as const,
            lastEstimatedAt: new Date().toISOString()
          }
        })

        // Save custom gear to database
        for (const item of updatedCustomGear) {
          const { error } = await supabase
            .from('hiree_custom_gear_items')
            .update({
              estimated_price_cad: item.estimatedPriceCAD,
              price_source: item.priceSource,
              last_estimated_at: item.lastEstimatedAt
            })
            .eq('id', item.id)

          if (error) {
            console.error('Error updating custom gear item price:', error)
          }
        }

        totalEstimated += customResult.totalEstimatedCostCAD
        totalItems += customResult.items.length

        // Log the estimation
        await OpenAIService.logEstimation(
          profile.id,
          company.id,
          'hiree_custom_gear',
          customResult.items.length,
          customResult.totalEstimatedCostCAD,
          customResult.tokensUsed,
          customResult.costUSD
        )
      }

      // Update local state with all updated items
      let allUpdatedItems: GearItem[] = []

      // Add updated company gear
      if (companyGear.length > 0) {
        const updatedCompanyGear = companyGear.map(item => {
          const estimation = companyResult?.items.find((est: { name: string; estimatedPriceCAD: number }) => est.name.toLowerCase() === item.name.toLowerCase())
          return {
            ...item,
            estimatedPriceCAD: estimation?.estimatedPriceCAD || 0,
            priceSource: 'openai' as const,
            lastEstimatedAt: new Date().toISOString()
          }
        })
        allUpdatedItems = [...allUpdatedItems, ...updatedCompanyGear]
      }

      // Add updated custom gear
      if (customGear.length > 0) {
        const updatedCustomGear = customGear.map(item => {
          const estimation = customResult?.items.find((est: { name: string; estimatedPriceCAD: number }) => est.name.toLowerCase() === item.name.toLowerCase())
          return {
            ...item,
            estimatedPriceCAD: estimation?.estimatedPriceCAD || 0,
            priceSource: 'openai' as const,
            lastEstimatedAt: new Date().toISOString()
          }
        })
        allUpdatedItems = [...allUpdatedItems, ...updatedCustomGear]
      }

      setGearItems(allUpdatedItems)

      showSuccess(
        'Prices Estimated', 
        `Successfully estimated prices for ${totalItems} gear items. Total estimated cost: $${totalEstimated.toFixed(2)} CAD`
      )

    } catch (error) {
      console.error('Error estimating gear prices:', error)
      showError('Estimation Failed', `Failed to estimate gear prices: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsEstimating(false)
    }
  }

  return (
    <div className="p-6">
      <CardHeader className="px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Equipment & Gear Requirements
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Define the equipment and gear items required for new hires.
        </p>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        {/* Add New Gear Item */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Add gear item (e.g., Full-frame Sony body)"
            value={newGearItem}
            onChange={(e) => setNewGearItem(e.target.value)}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addGearItem()
              }
            }}
          />
          <Button onClick={addGearItem} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Gear
          </Button>
          {gearItems.length > 0 && (
            <Button 
              onClick={handleAutoEstimatePrices} 
              size="sm" 
              variant="outline"
              loading={isEstimating}
              disabled={isEstimating}
            >
              {isEstimating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 mr-1" />
              )}
              Auto Estimate Price
            </Button>
          )}
        </div>

        {/* Gear Items Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Item</th>
                <th>Estimated Price (CAD)</th>
                {profile && !profile.id.startsWith('profile_') && (
                  <>
                    <th>Required</th>
                    <th>Custom Notes</th>
                  </>
                )}
                <th className="w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gearItems.length === 0 ? (
                <tr>
                  <td colSpan={profile && !profile.id.startsWith('profile_') ? 5 : 3} className="text-center py-8 text-gray-500">
                    No gear items added yet
                  </td>
                </tr>
              ) : (
                gearItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) => updateGearItem(item.id, e.target.value)}
                          className="border-0 shadow-none p-0"
                          placeholder="Enter gear item name"
                        />
                        {item.isCustom && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {item.estimatedPriceCAD ? `$${item.estimatedPriceCAD.toFixed(2)}` : 'Not estimated'}
                        </span>
                        {item.priceSource === 'openai' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            AI
                          </span>
                        )}
                      </div>
                    </td>
                    {profile && !profile.id.startsWith('profile_') && (
                      <>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={item.isCustom ? (item.isRequired ?? true) : (gearOverrides[item.id]?.required ?? true)}
                            onChange={(e) => handleGearRequired(item.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </td>
                        <td>
                          <Input
                            placeholder="Custom notes"
                            className="border-0 shadow-none p-0 text-sm"
                            value={item.isCustom ? (item.customNotes || '') : (gearOverrides[item.id]?.customNotes || '')}
                            onChange={(e) => handleGearNotes(item.id, e.target.value)}
                          />
                        </td>
                      </>
                    )}
                    <td className="text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteGearItem(item.id)}
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

        {/* Save Status */}
        {gearItems.length > 0 && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              {gearItems.length} gear item{gearItems.length !== 1 ? 's' : ''} saved to database
            </span>
          </div>
        )}

        {/* Suggested Equipment List - Always visible */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggested Equipment List</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Click "Add Gear" to start building your equipment list, or consider these common items:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li>Full-frame mirrorless camera w/ 4K 60fps (Preferred: Sony)</li>
              <li>14mm full-frame lens</li>
              <li>Zoom lens 24–70mm (if primary is only 14mm)</li>
              <li>Godox AD200 flash</li>
              <li>Compatible flash trigger</li>
              <li>Tripod (min 69") + geared tripod head</li>
              <li>Professional camera bag</li>
              <li>Spare camera battery</li>
              <li>DJI Osmo Mobile (cellphone gimbal) or equivalent</li>
              <li>Smartphone w/ 4K 60fps recording</li>
              <li>DJI Ronin stabilizer</li>
              <li>DJI drone w/ 4K 60fps</li>
              <li>Valid Transport Canada drone pilot license</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
