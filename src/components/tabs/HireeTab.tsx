import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { CardContent, CardHeader } from '../ui/Card'
import { User, Plus, Save, CheckCircle, X } from 'lucide-react'
import { todayISO, toISODate, formatLongDate } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types'

export const HireeTab: React.FC = () => {
  const { profile, setProfile, company, setCompany } = useAppStore()
  const { user } = useAuth()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [savedProfiles, setSavedProfiles] = useState<Profile[]>([])
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  

  const handleInputChange = (field: 'hireeName' | 'hireeAddress' | 'hireeEmail' | 'hireePhone', value: string) => {
    const updatedProfile = {
      ...profile,
      [field]: value,
    }
    setProfile(updatedProfile as any)
  }

  const handleDateChange = (field: 'hireeDob' | 'hireeDate', value: string) => {
    const isoDate = toISODate(value)
    const updatedProfile = {
      ...profile,
      [field]: isoDate,
    }
    setProfile(updatedProfile as any)
  }



  const createNewHiree = async () => {
    const newProfile: Profile = {
      id: `profile_${Date.now()}`,
      name: '',
      companyId: company?.id || 'temp_company_id',
      hireeName: '',
      hireeDob: null,
      hireeAddress: '',
      hireeEmail: '',
      hireePhone: null,
      hireeDate: todayISO(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: user?.id || 'temp_owner_id',
    }
    setProfile(newProfile)
    
    // Load company services and gear for overrides
    await loadCompanyServicesAndGear()
  }

  const saveHiree = async () => {
    if (!profile || !company) {
      showWarning('Company Required', 'Please fill in company information first')
      return
    }

    if (!user) {
      showError('Authentication Required', 'Please log in to save hiree data')
      return
    }

    setIsSaving(true)
    try {
      const profileData = {
        name: profile.name,
        company_id: company.id,
        hiree_name: profile.hireeName,
        hiree_dob: profile.hireeDob,
        hiree_address: profile.hireeAddress,
        hiree_email: profile.hireeEmail,
        hiree_phone: profile.hireePhone,
        hiree_date: profile.hireeDate,
        owner_id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (profile.id.startsWith('profile_')) {
        // New profile - insert
        const { data, error } = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single()

        if (error) throw error

        // Convert back to frontend format
        const frontendProfile: Profile = {
          id: data.id,
          name: data.name,
          companyId: data.company_id,
          hireeName: data.hiree_name,
          hireeDob: data.hiree_dob,
          hireeAddress: data.hiree_address,
          hireeEmail: data.hiree_email,
          hireePhone: data.hiree_phone,
          hireeDate: data.hiree_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          ownerId: data.owner_id,
        }

        setProfile(frontendProfile)
        
        
        showSuccess('Hiree Saved', 'Hiree saved successfully!')
      } else {
        // Existing profile - update
        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single()

        if (error) throw error

        // Convert back to frontend format
        const frontendProfile: Profile = {
          id: data.id,
          name: data.name,
          companyId: data.company_id,
          hireeName: data.hiree_name,
          hireeDob: data.hiree_dob,
          hireeAddress: data.hiree_address,
          hireeEmail: data.hiree_email,
          hireePhone: data.hiree_phone,
          hireeDate: data.hiree_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          ownerId: data.owner_id,
        }

        setProfile(frontendProfile)
        
        
        showSuccess('Hiree Updated', 'Hiree updated successfully!')
      }
    } catch (error) {
      console.error('Error saving hiree:', error)
      showError('Save Failed', 'Error saving hiree. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const loadSavedProfiles = async () => {
    if (!company) {
      showWarning('Company Required', 'Please save company information first before loading hirees.')
      return
    }

    setIsLoading(true)
    try {
      console.log('Loading profiles for company:', company.id)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Loaded profiles:', data)
      
      // Convert database format to frontend format
      const frontendProfiles: Profile[] = (data || []).map((dbProfile: any) => ({
        id: dbProfile.id,
        name: dbProfile.name,
        companyId: dbProfile.company_id,
        hireeName: dbProfile.hiree_name,
        hireeDob: dbProfile.hiree_dob,
        hireeAddress: dbProfile.hiree_address,
        hireeEmail: dbProfile.hiree_email,
        hireePhone: dbProfile.hiree_phone,
        hireeDate: dbProfile.hiree_date,
        createdAt: dbProfile.created_at,
        updatedAt: dbProfile.updated_at,
        ownerId: dbProfile.owner_id,
      }))
      
      setSavedProfiles(frontendProfiles)
      setShowLoadDialog(true)
      
      if (!data || data.length === 0) {
        showInfo('No Hirees Found', 'No saved hirees found for this company.')
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
      showError('Load Failed', `Error loading saved hirees: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompanyServicesAndGear = async () => {
    if (!company) return

    try {
      // Load flat services
      const { data: flatServices, error: flatError } = await supabase
        .from('flat_services')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true })

      if (flatError) throw flatError

      // Load tiered rates
      const { data: tieredRates, error: tieredError } = await supabase
        .from('tiered_rates')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true })

      if (tieredError) throw tieredError

      // Load gear items
      const { data: gearItems, error: gearError } = await supabase
        .from('gear_items')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true })

      if (gearError) throw gearError

      // Convert to frontend format
      const frontendFlatServices = (flatServices || []).map((service: any) => ({
        id: service.id,
        profileId: service.profile_id,
        name: service.name,
        rate: service.rate,
        createdAt: service.created_at,
      }))

      const frontendTieredRates = (tieredRates || []).map((rate: any) => ({
        id: rate.id,
        tierId: rate.tier_id,
        profileId: rate.profile_id,
        serviceType: rate.service_type,
        rate: rate.rate,
        createdAt: rate.created_at,
      }))

      const frontendGearItems = (gearItems || []).map((item: any) => ({
        id: item.id,
        profileId: item.profile_id,
        name: item.name,
        createdAt: item.created_at,
      }))

      // Update company with services and gear
      if (company) {
        setCompany({
          ...company,
          flatServices: frontendFlatServices,
          tieredRates: frontendTieredRates,
          gearItems: frontendGearItems
        })
      }

    } catch (error) {
      console.error('Error loading company services and gear:', error)
    }
  }

  const loadHiree = async (selectedProfile: Profile) => {
    setProfile(selectedProfile)
    setShowLoadDialog(false)
    
    // Load company services and gear for overrides
    await loadCompanyServicesAndGear()
    
    
    showSuccess('Hiree Loaded', 'Hiree loaded successfully! All sections are now enabled.')
  }


  const createSampleHiree = async () => {
    if (!company) {
      showWarning('Company Required', 'Please save company information first.')
      return
    }

    if (!user) {
      showError('Authentication Required', 'Please log in to create sample hiree')
      return
    }

    const sampleProfile: Profile = {
      id: `profile_${Date.now()}`,
      name: 'Sample Profile',
      companyId: company.id,
      hireeName: 'John Doe',
      hireeDob: '1990-01-15T00:00:00.000Z',
      hireeAddress: '123 Main St, City, State 12345',
      hireeEmail: 'john.doe@example.com',
      hireePhone: '(555) 123-4567',
      hireeDate: todayISO(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: user.id,
    }

    setIsSaving(true)
    try {
      const profileData = {
        name: sampleProfile.name,
        company_id: company.id,
        hiree_name: sampleProfile.hireeName,
        hiree_dob: sampleProfile.hireeDob,
        hiree_address: sampleProfile.hireeAddress,
        hiree_email: sampleProfile.hireeEmail,
        hiree_phone: sampleProfile.hireePhone,
        hiree_date: sampleProfile.hireeDate,
        owner_id: user.id,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()

      if (error) throw error

      showSuccess('Sample Hiree Created', 'Sample hiree created successfully! Click "Load Hiree" to see it.')
    } catch (error) {
      console.error('Error creating sample hiree:', error)
      showError('Creation Failed', 'Error creating sample hiree. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Hiree Management
            </h2>
            <p className="text-gray-600 text-sm">
              Create new hirees or load existing ones to enable all sections
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadSavedProfiles}
              loading={isLoading}
              variant="outline"
              className="text-primary-600 border-primary-200 hover:bg-primary-50"
            >
              <User className="h-4 w-4 mr-2" />
              Load Hiree
            </Button>
            <Button
              onClick={createNewHiree}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Hiree
            </Button>
            <Button
              onClick={createSampleHiree}
              loading={isSaving}
              variant="outline"
              className="text-success-600 border-success-200 hover:bg-success-50"
            >
              <User className="h-4 w-4 mr-2" />
              Create Sample
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Hiree Information Form */}
      {profile && (
        <CardContent>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Hiree Information</h3>
            {profile.id && !profile.id.startsWith('profile_') && (
              <div className="flex items-center text-sm text-success-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Saved to database
              </div>
            )}
          </CardHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hiree Name"
                value={profile.hireeName || ''}
                onChange={(e) => handleInputChange('hireeName', e.target.value)}
                placeholder="Enter hiree's full name"
                required
              />
              <Input
                label="Date of Birth"
                type="date"
                value={profile.hireeDob ? profile.hireeDob.split('T')[0] : ''}
                onChange={(e) => handleDateChange('hireeDob', e.target.value)}
              />
              <Input
                label="Address"
                value={profile.hireeAddress || ''}
                onChange={(e) => handleInputChange('hireeAddress', e.target.value)}
                placeholder="Enter hiree's address"
                required
              />
              <Input
                label="Email"
                type="email"
                value={profile.hireeEmail || ''}
                onChange={(e) => handleInputChange('hireeEmail', e.target.value)}
                placeholder="Enter hiree's email"
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={profile.hireePhone || ''}
                onChange={(e) => handleInputChange('hireePhone', e.target.value)}
                placeholder="Enter hiree's phone number"
              />
              <Input
                label="Hire Date"
                type="date"
                value={profile.hireeDate ? profile.hireeDate.split('T')[0] : todayISO().split('T')[0]}
                onChange={(e) => handleDateChange('hireeDate', e.target.value)}
                required
              />
            </div>

            
            <div className="flex justify-end">
              <Button
                onClick={saveHiree}
                loading={isSaving}
                className="bg-success-600 hover:bg-success-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {profile.id && !profile.id.startsWith('profile_') ? 'Update Hiree' : 'Save Hiree'}
              </Button>
            </div>
          </div>
        </CardContent>
      )}

      {/* Load Hiree Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Load Saved Hiree</h3>
                <p className="text-sm text-gray-600">Select a hiree to load their information</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {savedProfiles.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Saved Hirees</h4>
                <p className="text-gray-600 mb-6">
                  No hirees have been saved for this company yet. Create a new hiree to get started.
                </p>
                <Button
                  onClick={() => {
                    setShowLoadDialog(false)
                    createNewHiree()
                  }}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Hiree
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-4">
                  Found {savedProfiles.length} saved hiree{savedProfiles.length !== 1 ? 's' : ''}
                </div>
                {savedProfiles.map((savedProfile) => (
                  <div
                    key={savedProfile.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => loadHiree(savedProfile)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-lg">
                              {savedProfile.hireeName || 'Unnamed Hiree'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {savedProfile.hireeEmail || 'No email provided'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-13 space-y-1">
                          {savedProfile.hireeAddress && (
                            <div className="text-sm text-gray-500">
                              📍 {savedProfile.hireeAddress}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            Created {formatLongDate(savedProfile.createdAt)}
                            {savedProfile.updatedAt !== savedProfile.createdAt && (
                              <span> • Updated {formatLongDate(savedProfile.updatedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                        >
                          Load Hiree
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!profile && (
        <CardContent>
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Hiree Selected</h3>
            <p className="text-gray-600 mb-6">
              Create a new hiree or load an existing one to get started with the onboarding process.
            </p>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={loadSavedProfiles}
                loading={isLoading}
                variant="outline"
                className="text-primary-600 border-primary-200 hover:bg-primary-50"
              >
                <User className="h-4 w-4 mr-2" />
                Load Hiree
              </Button>
              <Button
                onClick={createNewHiree}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Hiree
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </div>
  )
}

