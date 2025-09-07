import jsPDF from 'jspdf'

export interface PDFOptions {
  filename?: string
  format?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number
}

export class JSPDFGenerator {
  /**
   * Generate PDF from HTML content using jsPDF with proper template layout
   */
  public static async generatePDF(
    htmlContent: string, 
    options: PDFOptions = {}
  ): Promise<{ blob: Blob; filename: string }> {
    const {
      filename = 'document.pdf',
      format = 'A4',
      orientation = 'portrait',
      margin = 20
    } = options

    // Create PDF with proper template
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })

    // Set up professional styling
    const pageWidth = format === 'A4' ? 210 : 216
    const pageHeight = format === 'A4' ? 297 : 279
    const contentWidth = pageWidth - (margin * 2)
    const contentStartY = margin + 20 // Space for header

    // Parse HTML content and create proper PDF layout
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    let currentY = contentStartY
    const lineHeight = 6

    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
      pdf.setFontSize(fontSize)
      if (isBold) {
        pdf.setFont('helvetica', 'bold')
      } else {
        pdf.setFont('helvetica', 'normal')
      }
      
      // Set text color
      const rgb = this.hexToRgb(color)
      if (rgb) {
        pdf.setTextColor(rgb.r, rgb.g, rgb.b)
      }
      
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + (lines.length * lineHeight)
    }

    // Helper function to add a line
    const addLine = (x1: number, y1: number, x2: number, y2: number, color: string = '#000000') => {
      const rgb = this.hexToRgb(color)
      if (rgb) {
        pdf.setDrawColor(rgb.r, rgb.g, rgb.b)
      }
      pdf.line(x1, y1, x2, y2)
    }

    // Helper function to add a rectangle
    const addRect = (x: number, y: number, width: number, height: number, fillColor?: string, strokeColor?: string) => {
      if (fillColor) {
        const rgb = this.hexToRgb(fillColor)
        if (rgb) {
          pdf.setFillColor(rgb.r, rgb.g, rgb.b)
        }
        pdf.rect(x, y, width, height, 'F')
      }
      if (strokeColor) {
        const rgb = this.hexToRgb(strokeColor)
        if (rgb) {
          pdf.setDrawColor(rgb.r, rgb.g, rgb.b)
        }
        pdf.rect(x, y, width, height)
      }
    }


    // Add header
    addRect(0, 0, pageWidth, 15, '#3b82f6')
    
    pdf.setTextColor(255, 255, 255) // White text
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Solution Gate Media', margin, 10)
    
    // Reset text color
    pdf.setTextColor(0, 0, 0)

    // Process the document content with better HTML parsing
    const processElement = (element: Element, y: number): number => {
      let currentY = y

      // Handle different element types
      if (element.tagName === 'DIV') {
        const div = element as HTMLDivElement
        const style = div.getAttribute('style') || ''
        
        // Check for specific div types
        if (style.includes('text-align:center') && style.includes('margin-bottom:20px')) {
          // Logo block or title
          currentY += 10
          currentY = addText(div.textContent || '', margin, currentY, contentWidth, 18, true)
          currentY += 5
        } else if (style.includes('background:#f8fafc')) {
          // Info box (hiree info, compensation, etc.)
          currentY += 8
          addRect(margin, currentY - 8, contentWidth, 25, '#f8fafc', '#e2e8f0')
          
          // Process children
          const children = Array.from(div.children)
          for (const child of children) {
            currentY = processElement(child, currentY)
          }
          currentY += 5
        } else if (style.includes('background:#fef3c7')) {
          // Addendum block
          currentY += 8
          addRect(margin, currentY - 8, contentWidth, 20, '#fef3c7', '#f59e0b')
          currentY = addText(div.textContent || '', margin + 5, currentY, contentWidth - 10, 11, false, '#92400e')
          currentY += 5
        } else if (style.includes('border:1px solid #e2e8f0') && style.includes('margin:20px 0')) {
          // Signature block
          currentY += 10
          addRect(margin, currentY - 8, contentWidth, 30, undefined, '#e2e8f0')
          
          // Process signature content
          const children = Array.from(div.children)
          for (const child of children) {
            currentY = processElement(child, currentY)
          }
          currentY += 5
        } else if (style.includes('margin-top:30px') && style.includes('border-top:1px solid #e2e8f0')) {
          // Footer block
          currentY += 15
          addLine(margin, currentY, pageWidth - margin, currentY, '#e2e8f0')
          currentY += 5
          currentY = addText(div.textContent || '', margin, currentY, contentWidth, 10, false, '#6b7280')
        } else {
          // Regular div - process children
          const children = Array.from(div.children)
          for (const child of children) {
            currentY = processElement(child, currentY)
          }
        }
      } else if (element.tagName === 'H1') {
        currentY += 10
        addLine(margin, currentY - 5, pageWidth - margin, currentY - 5)
        currentY = addText(element.textContent || '', margin, currentY, contentWidth, 18, true)
        addLine(margin, currentY + 2, pageWidth - margin, currentY + 2)
        currentY += 10
      } else if (element.tagName === 'H2') {
        currentY += 8
        currentY = addText(element.textContent || '', margin, currentY, contentWidth, 16, true)
        currentY += 5
      } else if (element.tagName === 'H3') {
        currentY += 6
        currentY = addText(element.textContent || '', margin, currentY, contentWidth, 14, true)
        currentY += 3
      } else if (element.tagName === 'P') {
        currentY += 4
        currentY = addText(element.textContent || '', margin, currentY, contentWidth, 12, false)
        currentY += 2
      } else if (element.tagName === 'TABLE') {
        currentY += 8
        
        // Draw table with proper formatting
        const table = element as HTMLTableElement
        const rows = table.querySelectorAll('tr')
        const cellHeight = 8
        
        // Calculate column widths based on content
        const colWidths: number[] = []
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td, th')
          cells.forEach((cell, index) => {
            const textLength = cell.textContent?.length || 0
            const width = Math.max(30, Math.min(60, textLength * 2))
            if (!colWidths[index] || width > colWidths[index]) {
              colWidths[index] = width
            }
          })
        })
        
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td, th')
          let x = margin
          
          cells.forEach((cell, cellIndex) => {
            const isHeader = cell.tagName === 'TH'
            const cellWidth = colWidths[cellIndex] || 50
            
            // Draw cell border
            addRect(x, currentY - cellHeight, cellWidth, cellHeight, undefined, '#d1d5db')
            
            // Add cell content
            if (isHeader) {
              addRect(x, currentY - cellHeight, cellWidth, cellHeight, '#f9fafb')
              addText(cell.textContent || '', x + 2, currentY - 2, cellWidth - 4, 10, true)
            } else {
              addText(cell.textContent || '', x + 2, currentY - 2, cellWidth - 4, 10, false)
            }
            
            x += cellWidth
          })
          
          currentY += cellHeight
        })
        
        currentY += 5
      } else if (element.tagName === 'UL' || element.tagName === 'OL') {
        const listItems = element.querySelectorAll('li')
        listItems.forEach(item => {
          currentY += 4
          const bullet = element.tagName === 'UL' ? '• ' : '1. '
          currentY = addText(bullet + (item.textContent || ''), margin + 10, currentY, contentWidth - 10, 12, false)
        })
        currentY += 5
      } else if (element.tagName === 'IMG') {
        // Handle images (signatures, logos)
        const img = element as HTMLImageElement
        if (img.src && !img.src.includes('data:image/svg')) {
          // For now, just add a placeholder for images
          currentY += 10
          addText('[Image: ' + (img.alt || 'Image') + ']', margin, currentY, contentWidth, 10, false, '#666666')
          currentY += 5
        }
      } else if (element.tagName === 'STRONG') {
        currentY = addText(element.textContent || '', margin, currentY, contentWidth, 12, true)
      } else if (element.textContent && element.textContent.trim()) {
        // Handle any other text content
        currentY = addText(element.textContent, margin, currentY, contentWidth, 12, false)
      }

      // Check for page break
      if (currentY > pageHeight - margin - 20) {
        pdf.addPage()
        currentY = contentStartY
      }

      return currentY
    }

    // Process all top-level elements
    const body = doc.body
    const elements = Array.from(body.children)
    
    for (const element of elements) {
      currentY = processElement(element, currentY)
    }

    // Add footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 5)
      pdf.text('Generated by Solution Gate Media', margin, pageHeight - 5)
    }

    // Generate blob
    const pdfBlob = pdf.output('blob')
    
    return {
      blob: pdfBlob,
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`
    }
  }

  // Helper method for hex to RGB conversion
  private static hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
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
