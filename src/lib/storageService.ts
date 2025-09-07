// src/lib/storageService.ts
import { supabase } from './supabase'

export class StorageService {
  /**
   * Upload signature image to Supabase storage
   */
  public static async uploadSignature(
    signatureData: string,
    profileId: string,
    signatureType: 'tenant' | 'hiree',
    signatureKind: 'signature' | 'initial'
  ): Promise<string> {
    try {
      // Convert base64 to blob
      const base64Data = signatureData.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${profileId}/${signatureType}_${signatureKind}_${timestamp}.png`

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('signatures')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: false
        })

      if (error) {
        throw new Error(`Failed to upload signature: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(filename)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading signature:', error)
      throw error
    }
  }

  /**
   * Delete signature image from Supabase storage
   */
  public static async deleteSignature(url: string): Promise<void> {
    try {
      // Extract filename from URL
      const urlParts = url.split('/')
      const filename = urlParts[urlParts.length - 1]
      const profileId = urlParts[urlParts.length - 2]

      const fullPath = `${profileId}/${filename}`

      const { error } = await supabase.storage
        .from('signatures')
        .remove([fullPath])

      if (error) {
        console.error('Error deleting signature:', error)
        // Don't throw error for cleanup operations
      }
    } catch (error) {
      console.error('Error deleting signature:', error)
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Upload company logo to Supabase storage
   */
  public static async uploadCompanyLogo(
    logoData: string,
    companyId: string
  ): Promise<string> {
    try {
      // Convert base64 to blob
      const base64Data = logoData.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `logos/${companyId}_${timestamp}.png`

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('company-assets')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: true // Allow overwriting existing logos
        })

      if (error) {
        throw new Error(`Failed to upload logo: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filename)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading logo:', error)
      throw error
    }
  }
}
