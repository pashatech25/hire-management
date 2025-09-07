/**
 * PDF Service - Client-side service for PDF generation
 * Communicates with the PDF server to generate actual PDF files
 */

import type { DocumentType } from '../types'

interface GeneratePDFOptions {
  documentType: DocumentType
  filename?: string
  format?: 'A4' | 'Letter'
  margin?: string
}

const PDF_SERVER_URL = import.meta.env.VITE_PDF_SERVER_URL || 'http://localhost:3001'

export class PDFService {
  /**
   * Generate PDF using the PDF server
   */
  public static async generatePDF(
    htmlContent: string, 
    options: GeneratePDFOptions
  ): Promise<{ blob: Blob; filename: string }> {
    try {
      const response = await fetch(`${PDF_SERVER_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          options: {
            filename: options.filename || `${options.documentType}_${Date.now()}.pdf`,
            format: options.format || 'A4',
            margin: options.margin || '0.5in'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 
                     options.filename || 
                     `${options.documentType}_${Date.now()}.pdf`

      return { blob, filename }
    } catch (error) {
      console.error('PDF generation error:', error)
      throw error
    }
  }

  /**
   * Download PDF blob as file
   */
  public static downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Open PDF in new tab
   */
  public static openPDFInNewTab(blob: Blob): void {
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
}
