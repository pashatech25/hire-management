import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CardContent, CardHeader } from '../ui/Card'
import { Building2, Upload, Image as ImageIcon, Save, CheckCircle } from 'lucide-react'
import { dataURLFromFile } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { Company } from '../../types'

export const CompanyTab: React.FC = () => {
  const { company, setCompany } = useAppStore()
  const { user } = useAuth()
  const [, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing company data when component mounts
  useEffect(() => {
    const loadCompany = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading company:', error)
          return
        }

        if (data) {
          // Convert database format to frontend format
          const frontendCompany: Company = {
            id: data.id,
            name: data.name,
            jurisdiction: data.jurisdiction,
            logoUrl: data.logo_url,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            ownerId: data.owner_id,
          }
          setCompany(frontendCompany)
          if (data.logo_url) {
            setLogoPreview(data.logo_url)
          }
          
          // Load company services and gear for hiree overrides
          await loadCompanyServicesAndGear(frontendCompany.id)
        }
      } catch (error) {
        console.error('Error loading company:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompany()
  }, [user, setCompany])

  const loadCompanyServicesAndGear = async (companyId: string) => {
    try {
      // Load flat services
      const { data: flatServices, error: flatError } = await supabase
        .from('flat_services')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })

      if (flatError) throw flatError

      // Load tiered rates
      const { data: tieredRates, error: tieredError } = await supabase
        .from('tiered_rates')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })

      if (tieredError) throw tieredError

      // Load gear items
      const { data: gearItems, error: gearError } = await supabase
        .from('gear_items')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })

      if (gearError) throw gearError

      // Convert to frontend format and update company
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
      const currentCompany = company
      if (currentCompany) {
        setCompany({
          ...currentCompany,
          flatServices: frontendFlatServices,
          tieredRates: frontendTieredRates,
          gearItems: frontendGearItems
        })
      }

    } catch (error) {
      console.error('Error loading company services and gear:', error)
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      // Update company data
      const updatedCompany = {
        ...company,
        name: company?.name || 'Solution Gate Media',
        jurisdiction: company?.jurisdiction || 'Ontario, Canada',
        logoUrl: data.publicUrl,
      }

      setCompany(updatedCompany as any)
      setLogoPreview(data.publicUrl)
    } catch (error) {
      console.error('Error uploading logo:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const dataUrl = await dataURLFromFile(file)
      setLogoPreview(dataUrl)
      await handleLogoUpload(file)
    }
  }

  const handleInputChange = (field: 'name' | 'jurisdiction', value: string) => {
    const updatedCompany = {
      ...company,
      [field]: value,
    }
    setCompany(updatedCompany as any)
  }

  const saveCompany = async () => {
    if (!company?.name || !company?.jurisdiction) {
      alert('Please fill in company name and jurisdiction')
      return
    }

    if (!user) {
      alert('Please log in to save company data')
      return
    }

    setIsSaving(true)
    try {
      // First, check if company already exists for this user
      const { data: existingCompany, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      const companyData = {
        name: company.name,
        jurisdiction: company.jurisdiction,
        logo_url: company.logoUrl,
        owner_id: user.id,
        updated_at: new Date().toISOString(),
      }

      let data, error

      if (existingCompany && !fetchError) {
        // Company exists - UPDATE it
        const result = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existingCompany.id)
          .select()
          .single()
        
        data = result.data
        error = result.error
      } else {
        // Company doesn't exist - INSERT it
        const result = await supabase
          .from('companies')
          .insert([companyData])
          .select()
          .single()
        
        data = result.data
        error = result.error
      }

      if (error) throw error

      // Convert back to frontend format
      const frontendCompany: Company = {
        id: data.id,
        name: data.name,
        jurisdiction: data.jurisdiction,
        logoUrl: data.logo_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        ownerId: data.owner_id,
      }

      setCompany(frontendCompany)
      alert(existingCompany ? 'Company updated successfully!' : 'Company saved successfully!')
    } catch (error) {
      console.error('Error saving company:', error)
      alert('Error saving company. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6">
      <CardHeader className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </h2>
          {company?.id && !company.id.startsWith('company_') && (
            <div className="flex items-center text-sm text-success-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Saved to database
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Company Name"
            value={company?.name || 'Solution Gate Media'}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter company name"
          />
          
          <Input
            label="Jurisdiction"
            value={company?.jurisdiction || 'Ontario, Canada'}
            onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
            placeholder="Enter jurisdiction"
          />
        </div>

        <div className="mt-6">
          <label className="label">Company Logo</label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose Logo (PNG/JPG)'}
              </Button>
            </div>
            
            {logoPreview && (
              <div className="flex-shrink-0">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="logo-preview"
                />
              </div>
            )}
          </div>
          
          {!logoPreview && (
            <div className="mt-2 flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No logo selected</p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={saveCompany}
            loading={isSaving || isLoading}
            className="bg-success-600 hover:bg-success-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Loading...' : company?.id && !company.id.startsWith('company_') ? 'Update Company' : 'Save Company'}
          </Button>
        </div>
      </CardContent>
    </div>
  )
}
