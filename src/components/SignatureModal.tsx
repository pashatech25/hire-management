// src/components/SignatureModal.tsx
import React, { useState, useRef } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { X } from 'lucide-react'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSign: (signatureData: string, initialData: string) => void
  title: string
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSign,
  title
}) => {
  const [signatureData, setSignatureData] = useState<string>('')
  const [initialData, setInitialData] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState(false)
  
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const initialCanvasRef = useRef<HTMLCanvasElement>(null)

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

  const handleSign = () => {
    if (!signatureData || !initialData) {
      alert('Please provide both signature and initials')
      return
    }

    onSign(signatureData, initialData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

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
                  className="border border-gray-200 rounded cursor-crosshair w-full"
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
                  className="border border-gray-200 rounded cursor-crosshair w-full"
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

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSign}
                disabled={!signatureData || !initialData}
              >
                Sign Document
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
