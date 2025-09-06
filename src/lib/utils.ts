import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const todayISO = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const money = (v: string | number | null | undefined): string => {
  return v ? `$${v}` : '______'
}

export const escapeHtml = (s: string | null | undefined): string => {
  if (!s) return ''
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] || c))
}

export const dataURLFromFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const docId = (): string => {
  return 'SGM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase()
}

export const download = (filename: string, text: string): void => {
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(text)
  a.download = filename
  a.click()
}

export const addMonths = (dateStr: string, months: number): string => {
  const [y, mo, d] = (dateStr || '').split('-').map(x => +x)
  if (!y || !mo || !d) return ''
  const dt = new Date(Date.UTC(y, mo - 1, d))
  dt.setUTCMonth(dt.getUTCMonth() + (+months || 0))
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export const toISODate = (maybeStr: string | null | undefined): string => {
  if (!maybeStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(maybeStr)) return maybeStr
  const d = new Date(maybeStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const formatLongDate = (iso: string | null | undefined): string => {
  if (!iso) return '________________'
  const [y, m, d] = iso.split('-').map(x => +x)
  if (!y || !m || !d) return '________________'
  const dt = new Date(y, m - 1, d)
  if (isNaN(dt.getTime())) return '________________'
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return dt.toLocaleDateString(undefined, opts)
}

// CSV utilities
export const csvEscape = (s: string = ''): string => {
  s = String(s)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export const parseCSV = (text: string): string[][] => {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.length > 0)
  const rows: string[][] = []
  
  for (const line of lines) {
    const out: string[] = []
    let cur = ''
    let inQ = false
    
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"'
          i++
        } else if (ch === '"') {
          inQ = false
        } else {
          cur += ch
        }
      } else {
        if (ch === ',') {
          out.push(cur)
          cur = ''
        } else if (ch === '"') {
          inQ = true
        } else {
          cur += ch
        }
      }
    }
    out.push(cur)
    rows.push(out)
  }
  
  return rows
}

// Tier validation
export const tiersAreValid = (tiers: { minSqft: number; maxSqft: number }[]): boolean => {
  const arr = [...tiers]
    .map(t => ({ min: +t.minSqft, max: +t.maxSqft }))
    .filter(t => !isNaN(t.min) && !isNaN(t.max))
  
  if (arr.some(t => t.max < t.min)) return false
  
  arr.sort((a, b) => a.min - b.min)
  
  for (let i = 1; i < arr.length; i++) {
    const a = arr[i - 1]
    const b = arr[i]
    if (b.min <= a.max) return false
  }
  
  return true
}

export const tierLabel = (tier: { minSqft: number; maxSqft: number }, index: number, previousTier?: { minSqft: number; maxSqft: number }): string => {
  const contiguous = index === 0 ? tier.minSqft === 1 : (previousTier && tier.minSqft === previousTier.maxSqft + 1)
  return contiguous && tier.minSqft === 1 
    ? `Up to ${tier.maxSqft.toLocaleString()} SQ.FT` 
    : `${tier.minSqft.toLocaleString()} – ${tier.maxSqft.toLocaleString()} SQ.FT`
}

// Currency formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Date formatting
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
