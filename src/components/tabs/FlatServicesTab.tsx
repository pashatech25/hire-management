import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CardContent, CardHeader } from '../ui/Card'
import { DollarSign, Plus, Trash2, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { download, parseCSV, csvEscape } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { FlatService } from '../../types'

export const FlatServicesTab: React.FC = () => {
  const { flatServices, setFlatServices, company, profile } = useAppStore()
  const { user } = useAuth()
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceRate, setNewServiceRate] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // State for hiree overrides
  const [serviceOverrides, setServiceOverrides] = useState<Record<string, { rate: string; enabled: boolean }>>({})

  // Load existing overrides when profile changes
  useEffect(() => {
    const loadOverrides = async () => {
      if (!profile || profile.id.startsWith('profile_')) {
        setServiceOverrides({})
        return
      }

      try {
        const { data: overrides } = await supabase
          .from('hiree_flat_services')
          .select('*')
          .eq('profile_id', profile.id)

        if (overrides) {
          console.log('Loaded overrides:', overrides)
          const overrideMap: Record<string, { rate: string; enabled: boolean }> = {}
          overrides.forEach(override => {
            console.log('Override object:', override)
            // Use the correct column names from your existing schema
            const serviceId = override.flat_service_id
            const rate = override.custom_rate
            const enabled = override.is_enabled
            
            if (serviceId) {
              overrideMap[serviceId] = {
                rate: rate?.toString() || '',
                enabled: enabled ?? true
              }
            }
          })
          setServiceOverrides(overrideMap)
        }
      } catch (error) {
        console.error('Error loading overrides:', error)
      }
    }

    loadOverrides()
  }, [profile])

  // Load tenant's flat services when component mounts
  useEffect(() => {
    const loadFlatServices = async () => {
      if (!user || !company) return

      setIsSaving(true)
      try {
        // Load services for this company
        const { data, error } = await supabase
          .from('flat_services')
          .select('*')
          .eq('company_id', company.id)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error loading flat services:', error)
          // If company_id doesn't exist, just show empty state
          setFlatServices([])
          return
        }

        // Convert database format to frontend format
        const frontendServices: FlatService[] = (data || []).map((dbService: any) => ({
          id: dbService.id,
          profileId: dbService.profile_id,
          name: dbService.name,
          rate: dbService.rate,
          createdAt: dbService.created_at,
        }))

        setFlatServices(frontendServices)
      } catch (error) {
        console.error('Error loading flat services:', error)
        setFlatServices([])
      } finally {
        setIsSaving(false)
      }
    }

    loadFlatServices()
  }, [user, company, setFlatServices])

  const addService = async () => {
    if (!newServiceName.trim()) {
      alert('Enter a service name.')
      return
    }

    if (!user || !company) {
      alert('Please log in and save company information first.')
      return
    }

    setIsSaving(true)
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

      const serviceData = {
        profile_id: profileId,
        company_id: company.id, // Now required after migration
        name: newServiceName.trim(),
        rate: newServiceRate.trim(),
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('flat_services')
        .insert([serviceData])
        .select()
        .single()

      if (error) throw error

      // Convert back to frontend format
      const frontendService: FlatService = {
        id: data.id,
        profileId: data.profile_id,
        name: data.name,
        rate: data.rate,
        createdAt: data.created_at,
      }

      setFlatServices([...flatServices, frontendService])
      setNewServiceName('')
      setNewServiceRate('')
    } catch (error) {
      console.error('Error adding service:', error)
      alert('Error adding service. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateService = async (id: string, field: 'name' | 'rate', value: string) => {
    if (!user) return

    try {
      const updateData = { [field]: value }
      const { error } = await supabase
        .from('flat_services')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // Update local state
      setFlatServices(
        flatServices.map(service =>
          service.id === id ? { ...service, [field]: value } : service
        )
      )
    } catch (error) {
      console.error('Error updating service:', error)
      alert('Error updating service. Please try again.')
    }
  }

  const handleOverrideRate = async (serviceId: string, rate: string) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], rate }
    }))
    
    // Save to database
    const enabled = serviceOverrides[serviceId]?.enabled ?? true
    await saveOverrideToDatabase(serviceId, rate, enabled)
  }

  const handleOverrideEnabled = async (serviceId: string, enabled: boolean) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], enabled }
    }))
    
    // Save to database
    const rate = serviceOverrides[serviceId]?.rate || ''
    await saveOverrideToDatabase(serviceId, rate, enabled)
  }

  const saveOverrideToDatabase = async (serviceId: string, rate: string, enabled: boolean) => {
    if (!user || !profile || profile.id.startsWith('profile_')) return

    try {
      // Use the correct column names from your existing schema
      const overrideData = {
        profile_id: profile.id,
        flat_service_id: serviceId, // Use flat_service_id
        custom_rate: rate ? parseFloat(rate) : null,
        is_enabled: enabled // Use is_enabled
      }

      // Check if override already exists - use a more flexible approach
      const { data: existing } = await supabase
        .from('hiree_flat_services')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('flat_service_id', serviceId)
        .maybeSingle()

      if (existing) {
        // Update existing override
        const { error: updateError } = await supabase
          .from('hiree_flat_services')
          .update(overrideData)
          .eq('id', existing.id)
        
        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
      } else {
        // Create new override
        const { error: insertError } = await supabase
          .from('hiree_flat_services')
          .insert([overrideData])
        
        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }
      }
    } catch (error) {
      console.error('Error saving override:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Error saving override: ${errorMessage}`)
    }
  }

  const deleteService = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('flat_services')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setFlatServices(flatServices.filter(service => service.id !== id))
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Error deleting service. Please try again.')
    }
  }

  const exportCSV = () => {
    const rows = [
      ['service', 'rate'],
      ...flatServices.map(service => [service.name, service.rate])
    ]
    const csvContent = rows.map(row => row.map(csvEscape).join(',')).join('\n')
    download('flat_rates.csv', csvContent)
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      const header = (rows[0] || []).map(h => h.toLowerCase().trim())
      const serviceIndex = header.indexOf('service')
      const rateIndex = header.indexOf('rate')

      if (serviceIndex === -1 || rateIndex === -1) {
        alert('CSV must have headers: service, rate')
        return
      }

      const importedServices: FlatService[] = rows
        .slice(1)
        .filter(row => row.length > 0)
        .map((row, index) => ({
          id: `imported-${Date.now()}-${index}`,
          profileId: 'temp',
          name: row[serviceIndex] || '',
          rate: row[rateIndex] || '',
          createdAt: new Date().toISOString(),
        }))

      setFlatServices([...flatServices, ...importedServices])
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

  return (
    <div className="p-6">
      <CardHeader className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Services — Flat Rate
          </h2>
          {flatServices.length > 0 && (
            <div className="flex items-center text-sm text-success-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              {flatServices.length} services saved
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        {/* Add New Service */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Service name (e.g., Social Media Reel)"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Rate (e.g., 120)"
            value={newServiceRate}
            onChange={(e) => setNewServiceRate(e.target.value)}
            className="w-32"
          />
          <Button onClick={addService} loading={isSaving} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Services Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-[35%]">Service</th>
                <th className="w-[20%]">Rate ($)</th>
                {profile && !profile.id.startsWith('profile_') && (
                  <>
                    <th className="w-[20%]">Override Rate</th>
                    <th className="w-[10%]">Enabled</th>
                  </>
                )}
                <th className="w-[15%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flatServices.length === 0 ? (
                <tr>
                  <td colSpan={profile && !profile.id.startsWith('profile_') ? 5 : 3} className="text-center py-8 text-gray-500">
                    No services added yet
                  </td>
                </tr>
              ) : (
                flatServices.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <Input
                        value={service.name}
                        onChange={(e) => updateService(service.id, 'name', e.target.value)}
                        className="border-0 shadow-none p-0"
                      />
                    </td>
                    <td>
                      <Input
                        value={service.rate}
                        onChange={(e) => updateService(service.id, 'rate', e.target.value)}
                        placeholder="e.g., 120"
                        className="border-0 shadow-none p-0"
                      />
                    </td>
                    {profile && !profile.id.startsWith('profile_') && (
                      <>
                        <td>
                          <Input
                            placeholder="Override rate"
                            className="border-0 shadow-none p-0 text-sm"
                            value={serviceOverrides[service.id]?.rate || ''}
                            onChange={(e) => handleOverrideRate(service.id, e.target.value)}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={serviceOverrides[service.id]?.enabled ?? true}
                            onChange={(e) => handleOverrideEnabled(service.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </td>
                      </>
                    )}
                    <td className="text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteService(service.id)}
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

        {/* Import/Export Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
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
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">CSV Format:</p>
              <p>Your CSV file should have headers: <code className="bg-blue-100 px-1 rounded">service, rate</code></p>
              <p className="mt-1">Example: <code className="bg-blue-100 px-1 rounded">Social Media Reel,120</code></p>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
