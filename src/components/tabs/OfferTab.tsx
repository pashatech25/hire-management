import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { CardContent, CardHeader } from '../ui/Card'
import { FileText, DollarSign, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { OfferDetails } from '../../types'

export const OfferTab: React.FC = () => {
  const { offerDetails, setOfferDetails, flatServices, tiers, profile } = useAppStore()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(!offerDetails)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate total compensation
  const calculateTotalCompensation = () => {
    if (!offerDetails) return 0
    
    let total = 0
    
    // Add flat services
    if (offerDetails.flatServices && offerDetails.flatServices.length > 0) {
      total += offerDetails.flatServices.reduce((sum, service) => sum + (service.rate || 0), 0)
    }
    
    // Add tiered services (this would need more complex calculation based on actual usage)
    if (offerDetails.tieredServices && offerDetails.tieredServices.length > 0) {
      // For now, just add a base amount - in real implementation, this would be calculated based on actual square footage
      total += offerDetails.tieredServices.reduce((sum, service) => sum + (service.baseRate || 0), 0)
    }
    
    return total
  }

  const handleInputChange = (field: keyof OfferDetails, value: string | number | boolean) => {
    if (!offerDetails) return
    
    const updatedOffer = {
      ...offerDetails,
      [field]: value,
    }
    setOfferDetails(updatedOffer)
  }

  const handleCompensationChange = (field: keyof NonNullable<OfferDetails['compensation']>, value: string | number) => {
    if (!offerDetails) return
    
    const updatedOffer = {
      ...offerDetails,
      compensation: {
        baseSalary: 0,
        hourlyRate: 0,
        commission: 0,
        benefits: '',
        ...offerDetails.compensation,
        [field]: value,
      },
    }
    setOfferDetails(updatedOffer)
  }

  const handleServiceToggle = (serviceId: string, serviceType: 'flat' | 'tiered') => {
    if (!offerDetails) return
    
    const updatedOffer = { ...offerDetails }
    
    if (serviceType === 'flat') {
      const flatService = flatServices.find(s => s.id === serviceId)
      if (flatService) {
        const existingIndex = updatedOffer.flatServices?.findIndex(s => s.id === serviceId) ?? -1
        if (existingIndex >= 0) {
          // Remove service
          updatedOffer.flatServices = updatedOffer.flatServices?.filter(s => s.id !== serviceId) || []
        } else {
          // Add service
          updatedOffer.flatServices = [
            ...(updatedOffer.flatServices || []),
            { 
              id: flatService.id, 
              name: flatService.name, 
              rate: parseFloat(flatService.rate) || 0 
            }
          ]
        }
      }
    } else {
      // Handle tiered services by service type (photo, video, etc.)
      const existingIndex = updatedOffer.tieredServices?.findIndex(s => s.name.includes(serviceId)) ?? -1
      if (existingIndex >= 0) {
        // Remove service
        updatedOffer.tieredServices = updatedOffer.tieredServices?.filter(s => !s.name.includes(serviceId)) || []
      } else {
        // Add service type with all its tiers
        const serviceTiers = tiers // In real implementation, filter by service type
        const serviceName = `${serviceId} Services (${serviceTiers.length} tiers)`
        updatedOffer.tieredServices = [
          ...(updatedOffer.tieredServices || []),
          { 
            id: `service_${serviceId}_${Date.now()}`, 
            name: serviceName, 
            baseRate: 0 
          }
        ]
      }
    }
    
    setOfferDetails(updatedOffer)
  }

  const initializeOffer = () => {
    const newOffer: typeof offerDetails = {
      id: `offer_${Date.now()}`,
      profileId: 'temp_profile_id', // This would be set from the current profile
      position: '',
      startDate: null,
      endDate: '',
      workSchedule: '',
      probationMonths: '3',
      managerName: '',
      managerEmail: '',
      managerPhone: '',
      managerExt: '',
      contactExt: '',
      returnBy: null,
      ceoName: '',
      compensation: {
        baseSalary: 0,
        hourlyRate: 0,
        commission: 0,
        benefits: '',
      },
      responsibilities: '',
      requirements: '',
      terms: '',
      flatServices: [],
      tieredServices: [],
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setOfferDetails(newOffer)
    setIsEditing(true)
  }

  // Load offer details for the current profile
  useEffect(() => {
    const loadOfferDetails = async () => {
      if (!profile || profile.id.startsWith('profile_') || !user) return

      try {
        const { data, error } = await supabase
          .from('offer_details')
          .select('*')
          .eq('profile_id', profile.id)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading offer details:', error)
          return
        }

        if (data) {
          // Convert database format to frontend format
          const frontendOffer: OfferDetails = {
            id: data.id,
            profileId: data.profile_id,
            position: data.position,
            startDate: data.start_date,
            endDate: data.end_date,
            workSchedule: data.work_schedule,
            probationMonths: data.probation_months,
            managerName: data.manager_name,
            managerEmail: data.manager_email,
            managerPhone: data.manager_phone,
            managerExt: data.manager_ext,
            contactExt: data.contact_ext,
            returnBy: data.return_by,
            ceoName: data.ceo_name,
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
            status: 'draft' as const,
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

  // Save offer details to database
  const saveOfferDetails = async () => {
    if (!offerDetails || !profile || profile.id.startsWith('profile_') || !user) {
      alert('Please load a profile first.')
      return
    }

    setIsSaving(true)
    try {
      // Convert frontend format to database format
      const dbOffer = {
        profile_id: profile.id,
        position: offerDetails.position || '',
        start_date: offerDetails.startDate || null,
        end_date: offerDetails.endDate || null,
        work_schedule: offerDetails.workSchedule || '',
        probation_months: offerDetails.probationMonths || '',
        manager_name: offerDetails.managerName || '',
        manager_email: offerDetails.managerEmail || '',
        manager_phone: offerDetails.managerPhone || '',
        manager_ext: offerDetails.managerExt || '',
        contact_ext: offerDetails.contactExt || '',
        return_by: offerDetails.returnBy || null,
        ceo_name: offerDetails.ceoName || '',
        base_salary: offerDetails.compensation?.baseSalary || null,
        hourly_rate: offerDetails.compensation?.hourlyRate || null,
        commission: offerDetails.compensation?.commission || null,
        benefits: offerDetails.compensation?.benefits || '',
        responsibilities: offerDetails.responsibilities || '',
        requirements: offerDetails.requirements || '',
        terms: offerDetails.terms || '',
        flat_services: offerDetails.flatServices || [],
        tiered_services: offerDetails.tieredServices || [],
      }

      // Check if offer already exists
      const { data: existing } = await supabase
        .from('offer_details')
        .select('id')
        .eq('profile_id', profile.id)
        .single()

      if (existing) {
        // Update existing offer
        const { error } = await supabase
          .from('offer_details')
          .update(dbOffer)
          .eq('id', existing.id)

        if (error) throw error
        console.log('Updated offer details successfully')
      } else {
        // Create new offer
        const { data, error } = await supabase
          .from('offer_details')
          .insert([dbOffer])
          .select()
          .single()

        if (error) throw error
        
        // Update local state with the new ID
        setOfferDetails({
          ...offerDetails,
          id: data.id,
          profileId: data.profile_id,
        })
        console.log('Created offer details successfully')
      }

      setIsEditing(false)
      alert('Offer details saved successfully!')
    } catch (error) {
      console.error('Error saving offer details:', error)
      alert('Error saving offer details. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!offerDetails) {
    return (
      <div className="space-y-6">
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Offer Created</h3>
            <p className="text-gray-600 mb-6">
              Create an offer letter to define the terms of employment for this hiree.
            </p>
            <Button onClick={initializeOffer} className="bg-primary-600 hover:bg-primary-700">
              <FileText className="h-4 w-4 mr-2" />
              Create Offer Letter
            </Button>
          </div>
        </CardContent>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Offer Letter</h2>
            <p className="text-gray-600 text-sm">
              {offerDetails.status === 'draft' ? 'Draft' : 'Finalized'} • 
              Created {formatDate(offerDetails.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="text-primary-600 border-primary-200 hover:bg-primary-50"
              >
                Edit
              </Button>
            )}
            {isEditing && (
              <Button
                onClick={saveOfferDetails}
                disabled={isSaving}
                className="bg-success-600 hover:bg-success-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Basic Information */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Position Title"
            value={offerDetails.position || ''}
            onChange={(e) => handleInputChange('position', e.target.value)}
            placeholder="e.g., Senior Developer"
            disabled={!isEditing}
          />
          <Input
            label="Start Date"
            type="date"
            value={offerDetails.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            disabled={!isEditing}
          />
          <Input
            label="End Date (if applicable)"
            type="date"
            value={offerDetails.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            disabled={!isEditing}
          />
          <Input
            label="Work Schedule"
            value={offerDetails.workSchedule || ''}
            onChange={(e) => handleInputChange('workSchedule', e.target.value)}
            placeholder="e.g., Monday-Friday, 9 AM - 5 PM"
            disabled={!isEditing}
          />
          <Input
            label="Probation Period (months)"
            type="number"
            value={offerDetails.probationMonths || ''}
            onChange={(e) => handleInputChange('probationMonths', e.target.value)}
            placeholder="e.g., 3"
            disabled={!isEditing}
          />
        </div>
        
        {/* Report To Section */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-700 mb-4">Report To</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Manager Name"
              value={offerDetails.managerName || ''}
              onChange={(e) => handleInputChange('managerName', e.target.value)}
              placeholder="Manager's full name"
              disabled={!isEditing}
            />
            <Input
              label="Manager Email"
              type="email"
              value={offerDetails.managerEmail || ''}
              onChange={(e) => handleInputChange('managerEmail', e.target.value)}
              placeholder="manager@company.com"
              disabled={!isEditing}
            />
            <Input
              label="Manager Phone"
              type="tel"
              value={offerDetails.managerPhone || ''}
              onChange={(e) => handleInputChange('managerPhone', e.target.value)}
              placeholder="(555) 123-4567"
              disabled={!isEditing}
            />
            <Input
              label="Manager Extension"
              value={offerDetails.managerExt || ''}
              onChange={(e) => handleInputChange('managerExt', e.target.value)}
              placeholder="Ext. 123"
              disabled={!isEditing}
            />
          </div>
        </div>
      </CardContent>

      {/* Compensation */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Compensation
          </h3>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Base Salary (annual) - Optional"
            type="number"
            value={offerDetails.compensation?.baseSalary || ''}
            onChange={(e) => handleCompensationChange('baseSalary', parseFloat(e.target.value) || 0)}
            placeholder="Leave blank if not applicable"
            disabled={!isEditing}
          />
          <Input
            label="Hourly Rate - Optional"
            type="number"
            value={offerDetails.compensation?.hourlyRate || ''}
            onChange={(e) => handleCompensationChange('hourlyRate', parseFloat(e.target.value) || 0)}
            placeholder="Leave blank if not applicable"
            disabled={!isEditing}
          />
          <Input
            label="Commission (%) - Optional"
            type="number"
            value={offerDetails.compensation?.commission || ''}
            onChange={(e) => handleCompensationChange('commission', parseFloat(e.target.value) || 0)}
            placeholder="Leave blank if not applicable"
            disabled={!isEditing}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="Benefits & Perks"
            value={offerDetails.compensation?.benefits || ''}
            onChange={(e) => handleCompensationChange('benefits', e.target.value)}
            placeholder="Health insurance, 401k, vacation days, etc."
            rows={3}
            disabled={!isEditing}
          />
        </div>
      </CardContent>

      {/* Services Selection */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Services Included</h3>
          <p className="text-sm text-gray-600">Select which services are included in this offer</p>
        </CardHeader>
        
        {/* All Services Combined */}
        <div className="space-y-4">
          {/* Flat Services */}
          {flatServices.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Flat Rate Services</h4>
              <div className="space-y-2">
                {flatServices.map((service) => {
                  const isSelected = offerDetails.flatServices?.some(s => s.id === service.id) || false
                  return (
                    <label key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleServiceToggle(service.id, 'flat')}
                        disabled={!isEditing}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{service.name}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(parseFloat(service.rate) || 0)}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tiered Services - Group by service type */}
          {tiers.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Tiered Services</h4>
              <div className="space-y-2">
                {['photo', 'video', 'iguide', 'matterport'].map((serviceType) => {
                  const serviceTiers = tiers // For now, we'll show all tiers as available for all service types
                  // In a real implementation, this would be filtered by actual service type
                  
                  if (serviceTiers.length === 0) return null
                  
                  const isSelected = offerDetails.tieredServices?.some(s => s.name.includes(serviceType)) || false
                  
                  return (
                    <label key={serviceType} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleServiceToggle(serviceType, 'tiered')}
                        disabled={!isEditing}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 capitalize">{serviceType} Services</div>
                        <div className="text-sm text-gray-600">
                          {serviceTiers.length} tier{serviceTiers.length > 1 ? 's' : ''} available
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Job Details */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Job Details</h3>
        </CardHeader>
        <div className="space-y-4">
          <Textarea
            label="Job Responsibilities"
            value={offerDetails.responsibilities}
            onChange={(e) => handleInputChange('responsibilities', e.target.value)}
            placeholder="Describe the main responsibilities and duties..."
            rows={4}
            disabled={!isEditing}
          />
          <Textarea
            label="Requirements & Qualifications"
            value={offerDetails.requirements}
            onChange={(e) => handleInputChange('requirements', e.target.value)}
            placeholder="List required skills, experience, and qualifications..."
            rows={4}
            disabled={!isEditing}
          />
          <Textarea
            label="Terms & Conditions"
            value={offerDetails.terms}
            onChange={(e) => handleInputChange('terms', e.target.value)}
            placeholder="Additional terms, conditions, and policies..."
            rows={4}
            disabled={!isEditing}
          />
        </div>
      </CardContent>

      {/* Summary */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Offer Summary</h3>
        </CardHeader>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700 mb-2">Position</div>
              <div className="text-gray-900">{offerDetails.position || 'Not specified'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">Start Date</div>
              <div className="text-gray-900">{offerDetails.startDate ? formatDate(offerDetails.startDate) : 'Not specified'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">Total Compensation</div>
              <div className="text-gray-900 font-semibold">{formatCurrency(calculateTotalCompensation())}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">Services Included</div>
              <div className="text-gray-900">
                {(offerDetails.flatServices?.length || 0) + (offerDetails.tieredServices?.length || 0)} services
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Data Storage Information */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Data Storage</h3>
        </CardHeader>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-1">Where is this data saved?</h4>
              <p className="text-blue-700">
                <strong>Currently:</strong> All offer data is stored in the browser's memory (Zustand store) and will be lost when you refresh the page.
              </p>
              <p className="text-blue-700 mt-2">
                <strong>Next Steps:</strong> To persist this data, you need to:
              </p>
              <ul className="text-blue-700 mt-2 list-disc list-inside space-y-1">
                <li>Set up your Supabase database using the provided schema</li>
                <li>Configure your environment variables (.env.local)</li>
                <li>Data will then be automatically saved to Supabase when you click "Save"</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
