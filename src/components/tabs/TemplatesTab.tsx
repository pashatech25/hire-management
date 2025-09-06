import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { CardContent, CardHeader } from '../ui/Card'
import { FileText, Plus, Trash2, Edit3, Save, X, Copy } from 'lucide-react'
import type { Template, DocumentType } from '../../types'

export const TemplatesTab: React.FC = () => {
  const { templates, setTemplates, profile, company } = useAppStore()
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    documentType: 'waiver',
    clauses: [],
    addendum: '',
  })
  const [newClause, setNewClause] = useState('')

  // Load templates from Supabase when profile changes
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user || !profile || profile.id.startsWith('profile_')) {
        setTemplates([])
        return
      }

      setIsLoading(true)
      try {
        console.log('Loading templates for profile:', profile.id)
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading templates:', error)
          return
        }

        // Convert to frontend format
        const frontendTemplates: Template[] = (data || []).map(template => ({
          id: template.id,
          profileId: template.profile_id,
          documentType: template.document_type as DocumentType,
          clauses: template.clauses || [],
          addendum: template.addendum || '',
          createdAt: template.created_at,
          updatedAt: template.updated_at,
        }))

        console.log('Loaded templates:', frontendTemplates)
        setTemplates(frontendTemplates)
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [profile, user, setTemplates])

  const documentTypes: { value: DocumentType; label: string; description: string }[] = [
    { value: 'waiver', label: 'Waiver', description: 'Liability waiver and release forms' },
    { value: 'noncompete', label: 'Non-Compete', description: 'Non-compete and confidentiality agreements' },
    { value: 'gear', label: 'Gear Agreement', description: 'Equipment and gear responsibility agreements' },
    { value: 'pay', label: 'Payment Terms', description: 'Payment schedules and compensation details' },
    { value: 'offer', label: 'Offer Letter', description: 'Employment offer and acceptance terms' },
  ]

  const handleCreateTemplate = async () => {
    if (!newTemplate.documentType || !profile || profile.id.startsWith('profile_')) {
      alert('Please load a profile first to create templates.')
      return
    }

    if (!user || !company) {
      alert('Please log in and save company information first.')
      return
    }

    setIsSaving(true)
    try {
      console.log('Creating template for profile:', profile.id, 'company:', company.id)
      const { data, error } = await supabase
        .from('templates')
        .insert([{
          profile_id: profile.id,
          company_id: company.id,
          document_type: newTemplate.documentType,
          clauses: newTemplate.clauses || [],
          addendum: newTemplate.addendum || '',
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating template:', error)
        alert('Error creating template. Please try again.')
        return
      }

      // Convert to frontend format and add to local state
      const frontendTemplate: Template = {
        id: data.id,
        profileId: data.profile_id,
        documentType: data.document_type as DocumentType,
        clauses: data.clauses || [],
        addendum: data.addendum || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      setTemplates([frontendTemplate, ...templates])
      setNewTemplate({ documentType: 'waiver', clauses: [], addendum: '' })
      setIsCreating(false)
      console.log('Template created successfully:', frontendTemplate)
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Error creating template. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditTemplate = (template: Template) => {
    setEditingId(template.id)
    setNewTemplate(template)
  }

  const handleUpdateTemplate = async () => {
    if (!editingId || !user) return

    setIsSaving(true)
    try {
      console.log('Updating template:', editingId)
      const { data, error } = await supabase
        .from('templates')
        .update({
          document_type: newTemplate.documentType,
          clauses: newTemplate.clauses || [],
          addendum: newTemplate.addendum || '',
        })
        .eq('id', editingId)
        .select()
        .single()

      if (error) {
        console.error('Error updating template:', error)
        alert('Error updating template. Please try again.')
        return
      }

      // Convert to frontend format and update local state
      const frontendTemplate: Template = {
        id: data.id,
        profileId: data.profile_id,
        documentType: data.document_type as DocumentType,
        clauses: data.clauses || [],
        addendum: data.addendum || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      const updatedTemplates = templates.map(template =>
        template.id === editingId ? frontendTemplate : template
      )

      setTemplates(updatedTemplates)
      setEditingId(null)
      setNewTemplate({ documentType: 'waiver', clauses: [], addendum: '' })
      console.log('Template updated successfully:', frontendTemplate)
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Error updating template. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to delete this template?')) return

    setIsSaving(true)
    try {
      console.log('Deleting template:', id)
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting template:', error)
        alert('Error deleting template. Please try again.')
        return
      }

      setTemplates(templates.filter(template => template.id !== id))
      console.log('Template deleted successfully')
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddClause = () => {
    if (!newClause.trim()) return

    setNewTemplate(prev => ({
      ...prev,
      clauses: [...(prev.clauses || []), newClause.trim()],
    }))
    setNewClause('')
  }

  const handleRemoveClause = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      clauses: prev.clauses?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleDuplicateTemplate = async (template: Template) => {
    if (!user || !profile || profile.id.startsWith('profile_') || !company) {
      alert('Please load a profile and ensure company information is saved first.')
      return
    }

    setIsSaving(true)
    try {
      console.log('Duplicating template:', template.id, 'for company:', company.id)
      const { data, error } = await supabase
        .from('templates')
        .insert([{
          profile_id: profile.id,
          company_id: company.id,
          document_type: template.documentType,
          clauses: template.clauses,
          addendum: template.addendum,
        }])
        .select()
        .single()

      if (error) {
        console.error('Error duplicating template:', error)
        alert('Error duplicating template. Please try again.')
        return
      }

      // Convert to frontend format and add to local state
      const frontendTemplate: Template = {
        id: data.id,
        profileId: data.profile_id,
        documentType: data.document_type as DocumentType,
        clauses: data.clauses || [],
        addendum: data.addendum || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      setTemplates([frontendTemplate, ...templates])
      console.log('Template duplicated successfully:', frontendTemplate)
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Error duplicating template. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getDocumentTypeInfo = (type: DocumentType) => {
    return documentTypes.find(dt => dt.value === type) || documentTypes[0]
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.documentType]) {
      acc[template.documentType] = []
    }
    acc[template.documentType].push(template)
    return acc
  }, {} as Record<DocumentType, Template[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Document Templates</h2>
            <p className="text-gray-600 text-sm">
              {profile && !profile.id.startsWith('profile_') 
                ? `Create and manage customizable clauses for ${profile.hireeName}'s documents`
                : 'Load a profile to create and manage customizable document templates'
              }
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            disabled={!profile || profile.id.startsWith('profile_') || isLoading}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </CardContent>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <CardContent>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              {isCreating ? 'Create New Template' : 'Edit Template'}
            </h3>
          </CardHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={newTemplate.documentType || 'waiver'}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, documentType: e.target.value as DocumentType }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clauses Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clauses
              </label>
              <div className="space-y-2">
                {newTemplate.clauses?.map((clause, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm text-gray-900">{clause}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClause(index)}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex space-x-2">
                  <Input
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                    placeholder="Enter a new clause..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddClause}
                    disabled={!newClause.trim()}
                    className="bg-success-600 hover:bg-success-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Addendum Section */}
            <div>
              <Textarea
                label="Additional Terms (Addendum)"
                value={newTemplate.addendum || ''}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, addendum: e.target.value }))}
                placeholder="Enter any additional terms or special clauses..."
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreating(false)
                  setEditingId(null)
                  setNewTemplate({ documentType: 'waiver', clauses: [], addendum: '' })
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={isCreating ? handleCreateTemplate : handleUpdateTemplate}
                disabled={isSaving}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : (isCreating ? 'Create Template' : 'Update Template')}
              </Button>
            </div>
          </div>
        </CardContent>
      )}

      {/* Templates List */}
      {templates.length === 0 && !isCreating ? (
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isLoading ? 'Loading Templates...' : 'No Templates Created'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isLoading 
                ? 'Please wait while we load the templates...'
                : profile && !profile.id.startsWith('profile_')
                  ? `Create your first template for ${profile.hireeName}'s documents.`
                  : 'Load a profile to create and manage document templates.'
              }
            </p>
            {!isLoading && profile && !profile.id.startsWith('profile_') && (
              <Button onClick={() => setIsCreating(true)} className="bg-primary-600 hover:bg-primary-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            )}
          </div>
        </CardContent>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([documentType, typeTemplates]) => {
            const typeInfo = getDocumentTypeInfo(documentType as DocumentType)
            return (
              <CardContent key={documentType}>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    {typeInfo.label} Templates
                  </h3>
                  <p className="text-sm text-gray-600">{typeInfo.description}</p>
                </CardHeader>
                
                <div className="space-y-3">
                  {typeTemplates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              Template #{template.id.split('_')[1]}
                            </span>
                            <span className="text-xs text-gray-500">
                              Updated {new Date(template.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {template.clauses.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Clauses ({template.clauses.length})</h4>
                              <div className="space-y-1">
                                {template.clauses.slice(0, 3).map((clause, index) => (
                                  <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
                                    {clause.length > 100 ? `${clause.substring(0, 100)}...` : clause}
                                  </div>
                                ))}
                                {template.clauses.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{template.clauses.length - 3} more clauses
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {template.addendum && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Addendum</h4>
                              <div className="text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
                                {template.addendum.length > 150 ? `${template.addendum.substring(0, 150)}...` : template.addendum}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateTemplate(template)}
                            className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-error-600 hover:text-error-700 hover:bg-error-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )
          })}
        </div>
      )}

      {/* Data Storage Information */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Data Storage</h3>
        </CardHeader>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-green-900 mb-1">Template Data Storage</h4>
              <p className="text-green-700">
                <strong>✅ Database Integration:</strong> All templates are now saved to Supabase database and persist across sessions.
              </p>
              <p className="text-green-700 mt-2">
                <strong>Profile-Specific:</strong> Templates are linked to the currently loaded profile and will only show for that specific hiree.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
