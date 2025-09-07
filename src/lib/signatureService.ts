// src/lib/signatureService.ts
import { supabase } from './supabase'
import { StorageService } from './storageService'
import type { DocumentSignatureLink } from '../types'

export class SignatureService {
  /**
   * Map frontend DocumentType to database document_type
   */
  private static mapDocumentType(documentType: string): 'compensation' | 'acceptance' | 'gear_obligations' | 'payment_schedule' | 'waiver' | 'noncompete' {
    const mapping: Record<string, 'compensation' | 'acceptance' | 'gear_obligations' | 'payment_schedule' | 'waiver' | 'noncompete'> = {
      'pay': 'compensation',
      'offer': 'acceptance', 
      'gear': 'gear_obligations',
      'waiver': 'waiver', // Each document type gets its own signature type
      'noncompete': 'noncompete' // Each document type gets its own signature type
    }
    
    return mapping[documentType] || 'compensation'
  }

  /**
   * Generate a unique signature token
   */
  private static generateSignatureToken(): string {
    return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36))
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 32)
  }

  /**
   * Create a signature link for a document
   */
  public static async createSignatureLink(
    profileId: string,
    companyId: string,
    documentType: string, // Accept any string, will be mapped
    documentData: any
  ): Promise<DocumentSignatureLink> {
    const signatureToken = this.generateSignatureToken()
    const mappedDocumentType = this.mapDocumentType(documentType)

    const { data, error } = await supabase
      .from('signatures')
      .insert({
        profile_id: profileId,
        company_id: companyId,
        document_type: mappedDocumentType,
        document_data: documentData,
        signature_token: signatureToken,
        is_signed: false,
        signature_type: 'hiree', // Default to hiree for public links
        signature_data: '' // Empty initially
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create signature link: ${error.message}`)
    }

    return this.mapDatabaseToSignatureLink(data)
  }

  /**
   * Get signature link by token (public access)
   */
  public static async getSignatureLinkByToken(token: string): Promise<DocumentSignatureLink | null> {
    const { data, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('signature_token', token)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get signature link: ${error.message}`)
    }

    return this.mapDatabaseToSignatureLink(data)
  }

  /**
   * Sign a document (tenant or hiree)
   */
  public static async signDocument(
    token: string,
    signatureData: string,
    initialData: string,
    signedBy: 'tenant' | 'hiree'
  ): Promise<DocumentSignatureLink> {
    // Update the signature link directly

    // Store signatures directly as base64 (bypass storage for now)
    const updateData: any = {
      is_signed: true,
      signed_at: new Date().toISOString(),
      signed_by: signedBy
    }

    if (signedBy === 'tenant') {
      updateData.tenant_signature_data = signatureData
      updateData.tenant_initial_data = initialData
    } else {
      updateData.hiree_signature_data = signatureData
      updateData.hiree_initial_data = initialData
    }

    const { data, error } = await supabase
      .from('signatures')
      .update(updateData)
      .eq('signature_token', token)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to sign document: ${error.message}`)
    }

    return this.mapDatabaseToSignatureLink(data)
  }

  /**
   * Get signature links for a profile (tenant access)
   */
  public static async getSignatureLinksForProfile(profileId: string): Promise<DocumentSignatureLink[]> {
    const { data, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('profile_id', profileId)
      .not('signature_token', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get signature links: ${error.message}`)
    }

    return data.map(item => this.mapDatabaseToSignatureLink(item))
  }

  /**
   * Reset a signature (tenant only)
   */
  public static async resetSignature(
    signatureId: string,
    resetReason?: string
  ): Promise<void> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get existing signature data to clean up storage
    const { data: existingSignature, error: fetchError } = await supabase
      .from('signatures')
      .select('tenant_signature_data, hiree_signature_data, tenant_initial_data, hiree_initial_data')
      .eq('id', signatureId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch existing signature data:', fetchError)
    }

    // Clean up storage files
    if (existingSignature) {
      const urlsToDelete = [
        existingSignature.tenant_signature_data,
        existingSignature.hiree_signature_data,
        existingSignature.tenant_initial_data,
        existingSignature.hiree_initial_data
      ].filter(Boolean) as string[]

      // Delete files from storage (don't wait for completion)
      urlsToDelete.forEach(url => {
        StorageService.deleteSignature(url).catch(console.error)
      })
    }

    // Reset the signature
    const { error: resetError } = await supabase
      .from('signatures')
      .update({
        is_signed: false,
        signed_at: null,
        signed_by: null,
        tenant_signature_data: null,
        hiree_signature_data: null,
        tenant_initial_data: null,
        hiree_initial_data: null
      })
      .eq('id', signatureId)

    if (resetError) {
      throw new Error(`Failed to reset signature: ${resetError.message}`)
    }

    // Log the reset
    const { error: logError } = await supabase
      .from('signature_reset_logs')
      .insert({
        signature_id: signatureId,
        reset_by: user.id,
        reset_reason: resetReason
      })

    if (logError) {
      console.error('Failed to log signature reset:', logError)
    }
  }

  /**
   * Generate signature URL for hiree
   */
  public static generateSignatureUrl(token: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/sign/${token}`
  }

  /**
   * Map database row to DocumentSignatureLink interface
   */
  private static mapDatabaseToSignatureLink(data: any): DocumentSignatureLink {
    return {
      id: data.id,
      profileId: data.profile_id,
      companyId: data.company_id,
      documentType: data.document_type,
      documentData: data.document_data,
      signatureToken: data.signature_token,
      isSigned: data.is_signed,
      signedAt: data.signed_at,
      signedBy: data.signed_by,
      tenantSignatureData: data.tenant_signature_data,
      hireeSignatureData: data.hiree_signature_data,
      tenantInitialData: data.tenant_initial_data,
      hireeInitialData: data.hiree_initial_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
