import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CardContent, CardHeader } from '../ui/Card'
import { PenTool, Save, Trash2, Download, Upload, User, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Signature } from '../../types'

export const SignaturesTab: React.FC = () => {
  const { signatures, setSignatures, profile, company } = useAppStore()
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureType, setSignatureType] = useState<'hiree' | 'company'>('hiree')
  const [signatureName, setSignatureName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize] = useState({ width: 400, height: 200 })

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    // Set drawing properties
    ctx.strokeStyle = '#1a73e8'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [canvasSize])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const saveSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!signatureName.trim()) {
      showError('Name Required', 'Please enter a name for this signature')
      return
    }

    if (!user) {
      showError('Authentication Required', 'Please log in to save signatures')
      return
    }

    setIsSaving(true)
    try {
      const dataURL = canvas.toDataURL('image/png')
      
      // Save directly to database (bypass storage for now)
      const { data, error } = await supabase
        .from('signatures')
        .insert({
          profile_id: profile?.id || null,
          company_id: company?.id || null,
          signature_type: signatureType,
          signature_data: dataURL, // Store base64 directly
          signature_name: signatureName.trim(),
          owner_id: user.id
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save signature: ${error.message}`)
      }

      // Update local state
      const newSignature: Signature = {
        id: data.id,
        profileId: data.profile_id || 'temp_profile',
        signatureType: data.signature_type,
        signatureData: dataURL, // Use base64 data
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      setSignatures([...signatures, newSignature])
      setSignatureName('')
      clearSignature()
      showSuccess('Signature Saved', 'Signature has been saved successfully')
    } catch (error) {
      console.error('Error saving signature:', error)
      showError('Save Failed', error instanceof Error ? error.message : 'Failed to save signature')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteSignature = async (id: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('signatures')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete signature: ${error.message}`)
      }

      // Update local state
      setSignatures(signatures.filter(sig => sig.id !== id))
      showSuccess('Signature Deleted', 'Signature has been deleted successfully')
    } catch (error) {
      console.error('Error deleting signature:', error)
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete signature')
    }
  }

  // Load signatures from database
  useEffect(() => {
    const loadSignatures = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('signatures')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading signatures:', error)
          return
        }

        const loadedSignatures: Signature[] = (data || []).map(item => ({
          id: item.id,
          profileId: item.profile_id || 'temp_profile',
          signatureType: item.signature_type,
          signatureData: item.signature_data,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }))

        setSignatures(loadedSignatures)
      } catch (error) {
        console.error('Error loading signatures:', error)
      }
    }

    loadSignatures()
  }, [user, setSignatures])

  const downloadSignature = (signature: Signature) => {
    const link = document.createElement('a')
    link.download = `signature_${signature.signatureType}_${signature.id}.png`
    link.href = signature.signatureData
    link.click()
  }

  const loadSignature = (signature: Signature) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = signature.signatureData
  }

  const groupedSignatures = signatures.reduce((acc, signature) => {
    if (!acc[signature.signatureType]) {
      acc[signature.signatureType] = []
    }
    acc[signature.signatureType].push(signature)
    return acc
  }, {} as Record<'hiree' | 'company', Signature[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Digital Signatures</h2>
            <p className="text-gray-600 text-sm">
              Capture and manage digital signatures for hirees and company representatives
            </p>
          </div>
        </div>
      </CardContent>

      {/* Signature Capture */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <PenTool className="h-5 w-5 mr-2" />
            Capture Signature
          </h3>
        </CardHeader>
        
        <div className="space-y-4">
          {/* Signature Type and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signature Type
              </label>
              <select
                value={signatureType}
                onChange={(e) => setSignatureType(e.target.value as 'hiree' | 'company')}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="hiree">Hiree Signature</option>
                <option value="company">Company Signature</option>
              </select>
            </div>
            <Input
              label="Signature Name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="e.g., John Doe, Company CEO"
              required
            />
          </div>

          {/* Canvas */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Draw Your Signature
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white">
              <canvas
                ref={canvasRef}
                className="border border-gray-200 rounded-lg cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ width: '100%', maxWidth: '400px', height: '200px' }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Use your mouse or touch to draw your signature above
            </p>
          </div>

          {/* Canvas Controls */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={clearSignature}
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            
            <div className="flex space-x-2">
              <Button
                onClick={saveSignature}
                disabled={!signatureName.trim() || isSaving}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Signature'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Saved Signatures */}
      {signatures.length > 0 && (
        <div className="space-y-6">
          {/* Hiree Signatures */}
          {groupedSignatures.hiree && groupedSignatures.hiree.length > 0 && (
            <CardContent>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Hiree Signatures
                </h3>
              </CardHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedSignatures.hiree.map((signature) => (
                  <div key={signature.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="aspect-video bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                      <img
                        src={signature.signatureData}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Created {new Date(signature.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadSignature(signature)}
                        className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadSignature(signature)}
                        className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSignature(signature.id)}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {/* Company Signatures */}
          {groupedSignatures.company && groupedSignatures.company.length > 0 && (
            <CardContent>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Company Signatures
                </h3>
              </CardHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedSignatures.company.map((signature) => (
                  <div key={signature.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="aspect-video bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                      <img
                        src={signature.signatureData}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Created {new Date(signature.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadSignature(signature)}
                        className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadSignature(signature)}
                        className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSignature(signature.id)}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </div>
      )}

      {/* Empty State */}
      {signatures.length === 0 && (
        <CardContent>
          <div className="text-center py-12">
            <PenTool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Signatures Captured</h3>
            <p className="text-gray-600 mb-6">
              Use the signature pad above to capture digital signatures for hirees and company representatives.
            </p>
          </div>
        </CardContent>
      )}

      {/* Data Storage Information */}
      <CardContent>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Data Storage</h3>
        </CardHeader>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-yellow-900 mb-1">Signature Data Storage</h4>
              <p className="text-yellow-700">
                <strong>Current:</strong> Signatures are stored directly in the database as base64 data.
              </p>
              <p className="text-yellow-700 mt-2">
                <strong>Note:</strong> This is a temporary solution. Storage policies need to be configured for optimal performance.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
