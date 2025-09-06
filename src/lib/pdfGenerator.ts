import puppeteer, { type Browser } from 'puppeteer'
import type { DocumentType } from '../types'

export interface PDFOptions {
  format?: 'A4' | 'Letter'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  printBackground?: boolean
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
}

export class PDFGenerator {
  private static instance: PDFGenerator
  private browser: Browser | null = null

  private constructor() {}

  public static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator()
    }
    return PDFGenerator.instance
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      })
    }
    return this.browser
  }

  public async generatePDF(
    htmlContent: string,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      // Set content and wait for it to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        margin: {
          top: options.margin?.top || '18mm',
          right: options.margin?.right || '18mm',
          bottom: options.margin?.bottom || '18mm',
          left: options.margin?.left || '18mm',
        },
        printBackground: options.printBackground || true,
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
      })

      return Buffer.from(pdfBuffer)
    } finally {
      await page.close()
    }
  }

  public async generateDocumentPDF(
    documentType: DocumentType,
    htmlContent: string,
    filename?: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    const defaultFilenames = {
      waiver: 'Training_Waiver_Liability_Release',
      noncompete: 'Non_Compete_Agreement',
      gear: 'Equipment_Gear_Supply_Obligations',
      pay: 'Compensation_Agreement',
      offer: 'Acceptance_Letter',
    }

    const buffer = await this.generatePDF(htmlContent, {
      format: 'A4',
      printBackground: true,
    })

    const finalFilename = filename || `${defaultFilenames[documentType]}_${Date.now()}.pdf`

    return { buffer, filename: finalFilename }
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

// Utility function to download PDF
export const downloadPDF = (buffer: Buffer, filename: string): void => {
  const blob = new Blob([buffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Utility function to open PDF in new tab
export const openPDFInNewTab = (buffer: Buffer): void => {
  const blob = new Blob([buffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Clean up after a delay to allow the PDF to load
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
