// src/pages/SignaturePage.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { SignatureService } from '../lib/signatureService'
import type { DocumentSignatureLink } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const SignaturePage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [signatureLink, setSignatureLink] = useState<DocumentSignatureLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [signatureData, setSignatureData] = useState<string>('')
  const [initialData, setInitialData] = useState<string>('')
  
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const initialCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (token) {
      loadSignatureLink()
    }
  }, [token])

  const loadSignatureLink = async () => {
    try {
      setLoading(true)
      console.log('Loading signature link for token:', token)
      const link = await SignatureService.getSignatureLinkByToken(token!)
      console.log('Signature link result:', link)
      if (!link) {
        setError('Signature link not found or expired')
        return
      }
      setSignatureLink(link)
    } catch (err) {
      console.error('Error loading signature link:', err)
      setError(err instanceof Error ? err.message : 'Failed to load signature link')
    } finally {
      setLoading(false)
    }
  }

  const startDrawing = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    ctx.beginPath()
  }

  const draw = (canvasRef: React.RefObject<HTMLCanvasElement | null>, event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const stopDrawing = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL()
    if (canvasRef === signatureCanvasRef) {
      setSignatureData(dataURL)
    } else {
      setInitialData(dataURL)
    }
  }

  const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    if (canvasRef === signatureCanvasRef) {
      setSignatureData('')
    } else {
      setInitialData('')
    }
  }

  const handleSign = async () => {
    if (!signatureLink || !signatureData || !initialData) {
      setError('Please provide both signature and initials')
      return
    }

    try {
      setSigning(true)
      await SignatureService.signDocument(
        signatureLink.signatureToken,
        signatureData,
        initialData,
        'hiree'
      )
      
      // Reload the signature link to get updated data
      await loadSignatureLink()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign document')
    } finally {
      setSigning(false)
    }
  }

  const buildDocumentPreview = () => {
    if (!signatureLink) return ''

    const { documentType, documentData } = signatureLink
    
    // Use the actual document content from documentData
    if (documentData && documentData.content) {
      return documentData.content
    }
    
    // Fallback to simplified preview if no content
    switch (documentType) {
      case 'compensation':
        return `
          <h2>Compensation Document</h2>
          <p>This document outlines the compensation structure for your position.</p>
          <p>Please review and sign below.</p>
        `
      case 'acceptance':
        return `
          <h2>Acceptance Letter</h2>
          <p>This document confirms your acceptance of the job offer.</p>
          <p>Please review and sign below.</p>
        `
      case 'gear_obligations':
        return `
          <h2>Gear Obligations</h2>
          <p>This document outlines the equipment requirements for your position.</p>
          <p>Please review and sign below.</p>
        `
      case 'payment_schedule':
        return `
          <h2>Payment Schedule</h2>
          <p>This document outlines the payment schedule for your work.</p>
          <p>Please review and sign below.</p>
        `
      default:
        return '<p>Document preview not available.</p>'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!signatureLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-6">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h1>
            <p className="text-gray-600">The signature link is invalid or has expired.</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Signature</h1>
          <p className="text-gray-600">Please review and sign the document below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Preview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Document Preview</h2>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: buildDocumentPreview() }}
            />
          </Card>

          {/* Signature Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Digital Signature</h2>
            
            {signatureLink.isSigned ? (
              <div className="text-center py-8">
                <div className="text-green-600 text-6xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Signed</h3>
                <p className="text-gray-600">
                  This document was signed on {new Date(signatureLink.signedAt!).toLocaleDateString()}
                </p>
                {signatureLink.hireeSignatureData && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Your Signature:</p>
                    <img 
                      src={signatureLink.hireeSignatureData} 
                      alt="Signature" 
                      className="border border-gray-300 rounded max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Signature Canvas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={signatureCanvasRef}
                      width={400}
                      height={150}
                      className="border border-gray-200 rounded cursor-crosshair"
                      onMouseDown={() => startDrawing(signatureCanvasRef)}
                      onMouseMove={(e) => draw(signatureCanvasRef, e)}
                      onMouseUp={() => stopDrawing(signatureCanvasRef)}
                      onMouseLeave={() => stopDrawing(signatureCanvasRef)}
                    />
                    <div className="mt-2 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearCanvas(signatureCanvasRef)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Initials Canvas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initials *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={initialCanvasRef}
                      width={200}
                      height={100}
                      className="border border-gray-200 rounded cursor-crosshair"
                      onMouseDown={() => startDrawing(initialCanvasRef)}
                      onMouseMove={(e) => draw(initialCanvasRef, e)}
                      onMouseUp={() => stopDrawing(initialCanvasRef)}
                      onMouseLeave={() => stopDrawing(initialCanvasRef)}
                    />
                    <div className="mt-2 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearCanvas(initialCanvasRef)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Sign Button */}
                <Button
                  onClick={handleSign}
                  disabled={signing || !signatureData || !initialData}
                  className="w-full"
                >
                  {signing ? 'Signing...' : 'Sign Document'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SignaturePage
