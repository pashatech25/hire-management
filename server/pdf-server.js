const express = require('express')
const puppeteer = require('puppeteer')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))

let browser = null

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    })
  }
  return browser
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { htmlContent, options = {} } = req.body
    
    if (!htmlContent) {
      return res.status(400).json({ error: 'HTML content is required' })
    }

    const browser = await getBrowser()
    const page = await browser.newPage()
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 })
    
    // Add professional PDF styling
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
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
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              @page {
                margin: 0.5in;
                size: A4;
              }
            }
            
            h1, h2, h3, h4, h5, h6 {
              color: #1f2937;
              margin-top: 0;
              margin-bottom: 0.5em;
            }
            
            h1 { font-size: 24px; font-weight: 700; }
            h2 { font-size: 20px; font-weight: 600; }
            h3 { font-size: 18px; font-weight: 600; }
            h4 { font-size: 16px; font-weight: 600; }
            
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 15px 0;
              font-size: 14px;
            }
            
            th, td {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
              vertical-align: top;
            }
            
            th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
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
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `
    
    // Set content with styled HTML
    await page.setContent(styledHtml, { waitUntil: 'networkidle0' })
    
    // Generate PDF with professional options
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Solution Gate Media</div>',
      footerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    })
    
    await page.close()
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${options.filename || 'document.pdf'}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    
    res.send(pdfBuffer)
    
  } catch (error) {
    console.error('PDF generation error:', error)
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message })
  }
})

app.listen(port, () => {
  console.log(`PDF server running at http://localhost:${port}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close()
  }
  process.exit(0)
})
