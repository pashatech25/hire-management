import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { CardContent, CardHeader } from '../ui/Card'
import { FileText, Plus, Trash2, Edit3, Save, X, Copy } from 'lucide-react'
import type { Template, DocumentType } from '../../types'

export const TemplatesTab: React.FC = () => {
  const { templates, setTemplates } = useAppStore()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    documentType: 'waiver',
    clauses: [],
    addendum: '',
  })
  const [newClause, setNewClause] = useState('')

  const documentTypes: { value: DocumentType; label: string; description: string }[] = [
    { value: 'waiver', label: 'Waiver', description: 'Liability waiver and release forms' },
    { value: 'noncompete', label: 'Non-Compete', description: 'Non-compete and confidentiality agreements' },
    { value: 'gear', label: 'Gear Agreement', description: 'Equipment and gear responsibility agreements' },
    { value: 'pay', label: 'Payment Terms', description: 'Payment schedules and compensation details' },
    { value: 'offer', label: 'Offer Letter', description: 'Employment offer and acceptance terms' },
  ]

  const handleCreateTemplate = () => {
    if (!newTemplate.documentType) return

    const template: Template = {
      id: `template_${Date.now()}`,
      profileId: 'temp_profile_id', // This would be set from the current profile
      documentType: newTemplate.documentType,
      clauses: newTemplate.clauses || [],
      addendum: newTemplate.addendum || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setTemplates([...templates, template])
    setNewTemplate({ documentType: 'waiver', clauses: [], addendum: '' })
    setIsCreating(false)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingId(template.id)
    setNewTemplate(template)
  }

  const handleUpdateTemplate = () => {
    if (!editingId) return

    const updatedTemplates = templates.map(template =>
      template.id === editingId
        ? {
            ...template,
            ...newTemplate,
            updatedAt: new Date().toISOString(),
          }
        : template
    )

    setTemplates(updatedTemplates)
    setEditingId(null)
    setNewTemplate({ documentType: 'waiver', clauses: [], addendum: '' })
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(template => template.id !== id))
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

  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: `template_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTemplates([...templates, duplicatedTemplate])
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
              Create and manage customizable clauses for different document types
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-primary-600 hover:bg-primary-700"
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
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? 'Create Template' : 'Update Template'}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Created</h3>
            <p className="text-gray-600 mb-6">
              Create your first template to get started with customizable document clauses.
            </p>
            <Button onClick={() => setIsCreating(true)} className="bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-1">Template Data Storage</h4>
              <p className="text-blue-700">
                <strong>Currently:</strong> All template data is stored in browser memory and will be lost on refresh.
              </p>
              <p className="text-blue-700 mt-2">
                <strong>Persistence:</strong> Set up Supabase database to automatically save templates when created or updated.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
