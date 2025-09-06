import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { CardContent, CardHeader } from '../ui/Card'
import { Database, Download, Upload, Trash2, User, Building2, DollarSign, Camera, FileText, Edit3 } from 'lucide-react'
import { formatDate } from '../../lib/utils'

export const DataTab: React.FC = () => {
  const { 
    company, 
    profile, 
    flatServices, 
    tiers, 
    tieredRates, 
    gearItems, 
    offerDetails, 
    templates, 
    signatures,
    resetState 
  } = useAppStore()
  
  const [isExporting, setIsExporting] = useState(false)
  const [importData, setImportData] = useState('')

  const exportAllData = () => {
    setIsExporting(true)
    
    const allData = {
      company,
      profile,
      flatServices,
      tiers,
      tieredRates,
      gearItems,
      offerDetails,
      templates,
      signatures,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }

    const dataStr = JSON.stringify(allData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `onboarding-data-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    setIsExporting(false)
  }

  const handleImportData = () => {
    try {
      const parsedData = JSON.parse(importData)
      
      // Validate the data structure
      if (!parsedData.version) {
        alert('Invalid data format. Please check the file.')
        return
      }

      // Update the store with imported data
      if (parsedData.company) useAppStore.getState().setCompany(parsedData.company)
      if (parsedData.profile) useAppStore.getState().setProfile(parsedData.profile)
      if (parsedData.flatServices) useAppStore.getState().setFlatServices(parsedData.flatServices)
      if (parsedData.tiers) useAppStore.getState().setTiers(parsedData.tiers)
      if (parsedData.tieredRates) useAppStore.getState().setTieredRates(parsedData.tieredRates)
      if (parsedData.gearItems) useAppStore.getState().setGearItems(parsedData.gearItems)
      if (parsedData.offerDetails) useAppStore.getState().setOfferDetails(parsedData.offerDetails)
      if (parsedData.templates) useAppStore.getState().setTemplates(parsedData.templates)
      if (parsedData.signatures) useAppStore.getState().setSignatures(parsedData.signatures)

      alert('Data imported successfully!')
      setImportData('')
    } catch (error) {
      alert('Error importing data. Please check the file format.')
      console.error('Import error:', error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportData(content)
    }
    reader.readAsText(file)
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      resetState()
      alert('All data has been cleared.')
    }
  }

  const getDataSummary = () => {
    return {
      company: company ? 1 : 0,
      profile: profile ? 1 : 0,
      flatServices: flatServices.length,
      tiers: tiers.length,
      tieredRates: tieredRates.length,
      gearItems: gearItems.length,
      offerDetails: offerDetails ? 1 : 0,
      templates: templates.length,
      signatures: signatures.length,
    }
  }

  const summary = getDataSummary()
  const totalItems = Object.values(summary).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
            <p className="text-gray-600 text-sm">
              Manage, export, and import all your onboarding data
            </p>
          </div>
        </div>
      </CardContent>

      {/* Data Summary */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Data Summary
          </h3>
        </CardHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{summary.company}</div>
            <div className="text-sm text-blue-700">Company</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">{summary.profile}</div>
            <div className="text-sm text-green-700">Profile</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">{summary.flatServices}</div>
            <div className="text-sm text-purple-700">Flat Services</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">{summary.tiers}</div>
            <div className="text-sm text-orange-700">Tiered Services</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <Camera className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-900">{summary.gearItems}</div>
            <div className="text-sm text-red-700">Gear Items</div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <FileText className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-indigo-900">{summary.offerDetails}</div>
            <div className="text-sm text-indigo-700">Offer Details</div>
          </div>
          
          <div className="bg-pink-50 rounded-lg p-4 text-center">
            <FileText className="h-8 w-8 text-pink-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-pink-900">{summary.templates}</div>
            <div className="text-sm text-pink-700">Templates</div>
          </div>
          
          <div className="bg-teal-50 rounded-lg p-4 text-center">
            <Edit3 className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-teal-900">{summary.signatures}</div>
            <div className="text-sm text-teal-700">Signatures</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{totalItems}</div>
          <div className="text-sm text-gray-600">Total Data Items</div>
        </div>
      </CardContent>

      {/* Export/Import Actions */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Data Operations</h3>
        </CardHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700">Export Data</h4>
            <p className="text-sm text-gray-600">
              Download all your data as a JSON file for backup or migration purposes.
            </p>
            <Button
              onClick={exportAllData}
              loading={isExporting}
              className="w-full bg-primary-600 hover:bg-primary-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
          </div>

          {/* Import */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700">Import Data</h4>
            <p className="text-sm text-gray-600">
              Upload a previously exported JSON file to restore your data.
            </p>
            <div className="space-y-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <Button
                onClick={handleImportData}
                disabled={!importData}
                className="w-full bg-success-600 hover:bg-success-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Data Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Data */}
        {company && (
          <CardContent>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Company Information
              </h3>
            </CardHeader>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {company.name}</div>
              <div><span className="font-medium">Jurisdiction:</span> {company.jurisdiction}</div>
              <div><span className="font-medium">Created:</span> {formatDate(company.createdAt)}</div>
              {company.logoUrl && (
                <div><span className="font-medium">Logo:</span> ✓ Uploaded</div>
              )}
            </div>
          </CardContent>
        )}

        {/* Profile Data */}
        {profile && (
          <CardContent>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </h3>
            </CardHeader>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {profile.name}</div>
              <div><span className="font-medium">Hiree:</span> {profile.hireeName}</div>
              <div><span className="font-medium">Email:</span> {profile.hireeEmail}</div>
              <div><span className="font-medium">Created:</span> {formatDate(profile.createdAt)}</div>
            </div>
          </CardContent>
        )}

        {/* Services Summary */}
        {(summary.flatServices > 0 || summary.tiers > 0) && (
          <CardContent>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Services
              </h3>
            </CardHeader>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Flat Services:</span> {summary.flatServices}</div>
              <div><span className="font-medium">Tiered Services:</span> {summary.tiers}</div>
              <div><span className="font-medium">Tiered Rates:</span> {summary.tieredRates}</div>
            </div>
          </CardContent>
        )}

        {/* Other Data */}
        {(summary.gearItems > 0 || summary.templates > 0 || summary.signatures > 0) && (
          <CardContent>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Additional Data
              </h3>
            </CardHeader>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Gear Items:</span> {summary.gearItems}</div>
              <div><span className="font-medium">Templates:</span> {summary.templates}</div>
              <div><span className="font-medium">Signatures:</span> {summary.signatures}</div>
              <div><span className="font-medium">Offer Details:</span> {summary.offerDetails ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        )}
      </div>

      {/* Danger Zone */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 text-error-600">Danger Zone</h3>
        </CardHeader>
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-error-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-error-900 mb-1">Clear All Data</h4>
              <p className="text-error-700 text-sm mb-3">
                This will permanently delete all your data including company info, profiles, services, templates, and signatures. This action cannot be undone.
              </p>
              <Button
                onClick={clearAllData}
                className="bg-error-600 hover:bg-error-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
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
              <h4 className="font-medium text-blue-900 mb-1">Current Data Storage</h4>
              <p className="text-blue-700">
                <strong>Location:</strong> All data is currently stored in browser memory (Zustand store)
              </p>
              <p className="text-blue-700 mt-2">
                <strong>Persistence:</strong> Data will be lost when you refresh the page or close the browser
              </p>
              <p className="text-blue-700 mt-2">
                <strong>Recommendation:</strong> Export your data regularly and set up Supabase for automatic persistence
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
