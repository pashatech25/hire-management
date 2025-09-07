/**
 * Simple PDF Generator using browser's built-in print functionality
 * This creates high-quality PDFs without server dependencies
 */

export interface PDFOptions {
  filename?: string
  format?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margin?: string
}

export class SimplePDFGenerator {
  /**
   * Generate PDF using browser's print functionality with professional styling
   */
  public static async generatePDF(
    htmlContent: string, 
    options: PDFOptions = {}
  ): Promise<{ blob: Blob; filename: string }> {
    const {
      filename = 'document.pdf',
      format = 'A4',
      orientation = 'portrait',
      margin = '0.5in'
    } = options

    return new Promise((resolve, reject) => {
      try {
        // Create a new window for PDF generation
        const printWindow = window.open('', '_blank', 'width=1200,height=800')
        
        if (!printWindow) {
          reject(new Error('Failed to open print window. Please allow popups for this site.'))
          return
        }

        // Create professional PDF styling
        const styledHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${filename}</title>
              <style>
                * {
                  box-sizing: border-box;
                }
                
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 20px;
                  background: white;
                  font-size: 14px;
                }
                
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  @page {
                    margin: ${margin};
                    size: ${format} ${orientation};
                  }
                  
                  .no-print {
                    display: none !important;
                  }
                }
                
                h1, h2, h3, h4, h5, h6 {
                  color: #1f2937;
                  margin-top: 0;
                  margin-bottom: 0.5em;
                  page-break-after: avoid;
                }
                
                h1 { 
                  font-size: 24px; 
                  font-weight: 700; 
                  border-bottom: 2px solid #e5e7eb;
                  padding-bottom: 10px;
                  margin-bottom: 20px;
                }
                
                h2 { 
                  font-size: 20px; 
                  font-weight: 600; 
                  margin-top: 30px;
                  margin-bottom: 15px;
                }
                
                h3 { 
                  font-size: 18px; 
                  font-weight: 600; 
                  margin-top: 25px;
                  margin-bottom: 10px;
                }
                
                h4 { 
                  font-size: 16px; 
                  font-weight: 600; 
                  margin-top: 20px;
                  margin-bottom: 8px;
                }
                
                p {
                  margin: 8px 0;
                  text-align: justify;
                }
                
                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 15px 0;
                  font-size: 13px;
                  page-break-inside: avoid;
                }
                
                th, td {
                  border: 1px solid #d1d5db;
                  padding: 10px;
                  text-align: left;
                  vertical-align: top;
                }
                
                th {
                  background-color: #f9fafb;
                  font-weight: 600;
                  color: #374151;
                }
                
                ul, ol {
                  margin: 8px 0;
                  padding-left: 20px;
                }
                
                li {
                  margin: 4px 0;
                }
                
                strong {
                  font-weight: 600;
                }
                
                .info-box {
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 16px;
                  margin: 16px 0;
                }
                
                .signature-block {
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 16px;
                  margin: 20px 0;
                  page-break-inside: avoid;
                }
                
                .addendum-block {
                  background: #fef3c7;
                  border: 1px solid #f59e0b;
                  border-radius: 8px;
                  padding: 16px;
                  margin: 20px 0;
                }
                
                .footer-block {
                  border-top: 1px solid #e2e8f0;
                  padding-top: 20px;
                  margin-top: 30px;
                  color: #6b7280;
                  font-size: 12px;
                  text-align: center;
                }
                
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                
                .print-button {
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  z-index: 1000;
                }
                
                .print-button:hover {
                  background: #2563eb;
                }
                
                .print-button:active {
                  background: #1d4ed8;
                }
                
                .page-break {
                  page-break-before: always;
                }
                
                .no-break {
                  page-break-inside: avoid;
                }
              </style>
            </head>
            <body>
              <button class="print-button no-print" onclick="window.print()">
                📄 Print / Save as PDF
              </button>
              
              ${htmlContent}
              
              <script>
                // Auto-focus and show instructions
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    window.focus();
                    
                    // Update button text
                    const button = document.querySelector('.print-button');
                    if (button) {
                      button.textContent = '📄 Click to Print / Save as PDF';
                      button.style.background = '#10b981';
                    }
                  }, 500);
                });
                
                // Handle print dialog close
                window.addEventListener('afterprint', function() {
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                });
              </script>
            </body>
          </html>
        `

        // Write content to the new window
        printWindow.document.write(styledHtml)
        printWindow.document.close()
        printWindow.focus()

        // For this implementation, we'll return a promise that resolves immediately
        // The actual PDF generation happens when the user clicks the print button
        // and selects "Save as PDF" in the print dialog
        resolve({
          blob: new Blob(['PDF generation initiated'], { type: 'text/plain' }),
          filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`
        })

      } catch (error) {
        reject(error)
      }
    })
  }
  
  /**
   * Download PDF blob as file (placeholder for this implementation)
   */
  public static downloadPDF(_blob: Blob, _filename: string): void {
    // For this implementation, the download happens through the print dialog
    console.log('PDF generation initiated. Please use the print dialog to save as PDF.')
  }
  
  /**
   * Open PDF in new tab (placeholder for this implementation)
   */
  public static openPDFInNewTab(_blob: Blob): void {
    // For this implementation, the PDF opens in a new tab automatically
    console.log('PDF opened in new tab for printing.')
  }
}
