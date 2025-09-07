interface GearItem {
  id: string
  name: string
  isCustom?: boolean
  isRequired?: boolean
  customNotes?: string
}

interface GearEstimationResult {
  items: Array<{
    name: string
    estimatedPriceCAD: number
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
  }>
  totalEstimatedCostCAD: number
  tokensUsed: number
  costUSD: number
}

interface EstimationRequest {
  gearItems: GearItem[]
  profileId: string
  companyId: string
  estimationType: 'company_gear' | 'hiree_custom_gear' | 'all_gear'
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export class OpenAIService {
  public static async estimateGearCosts(request: EstimationRequest): Promise<GearEstimationResult> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const { gearItems, estimationType } = request

    if (gearItems.length === 0) {
      return {
        items: [],
        totalEstimatedCostCAD: 0,
        tokensUsed: 0,
        costUSD: 0
      }
    }

    // Prepare gear items for estimation
    const gearList = gearItems.map(item => ({
      name: item.name,
      notes: item.customNotes || '',
      isRequired: item.isRequired || false
    }))

    const prompt = this.buildEstimationPrompt(gearList, estimationType)

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using the more cost-effective model
          messages: [
            {
              role: 'system',
              content: 'You are a professional equipment cost estimator for photography and videography businesses. Provide accurate Canadian market pricing for professional gear.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Very low temperature for consistent pricing
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      // Parse the JSON response
      const estimationData = this.parseEstimationResponse(content)
      
      // Calculate costs
      const totalCost = estimationData.items.reduce((sum, item) => sum + item.estimatedPriceCAD, 0)
      
      return {
        items: estimationData.items,
        totalEstimatedCostCAD: totalCost,
        tokensUsed: data.usage?.total_tokens || 0,
        costUSD: this.calculateOpenAICost(data.usage?.total_tokens || 0)
      }

    } catch (error) {
      console.error('OpenAI estimation error:', error)
      throw new Error(`Failed to estimate gear costs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static buildEstimationPrompt(gearItems: Array<{name: string, notes: string, isRequired: boolean}>, estimationType: string): string {
    const gearList = gearItems.map((item, index) => 
      `${index + 1}. ${item.name}${item.notes ? ` (Notes: ${item.notes})` : ''}${item.isRequired ? ' [REQUIRED]' : ' [OPTIONAL]'}`
    ).join('\n')

    return `Please estimate the Canadian market prices (in CAD) for the following professional photography/videography equipment:

${gearList}

Requirements:
1. Provide prices in Canadian Dollars (CAD)
2. Base estimates on current Canadian market prices (2024)
3. Consider both new and used market prices (use average)
4. Focus on professional-grade equipment
5. Include reasoning for each estimate
6. Rate confidence level (high/medium/low) for each estimate
7. For items with notes, consider the specific requirements mentioned

Please respond with a JSON object in this exact format:
{
  "items": [
    {
      "name": "Equipment Name",
      "estimatedPriceCAD": 1234.56,
      "confidence": "high|medium|low",
      "reasoning": "Brief explanation of pricing logic"
    }
  ]
}

Estimation type: ${estimationType}
Current date: ${new Date().toISOString().split('T')[0]}`
  }

  private static parseEstimationResponse(content: string): {items: Array<{name: string, estimatedPriceCAD: number, confidence: 'high' | 'medium' | 'low', reasoning: string}>} {
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error('Invalid response format: missing items array')
      }

      // Validate and clean the data
      const items = parsed.items.map((item: any) => ({
        name: String(item.name || 'Unknown'),
        estimatedPriceCAD: Math.max(0, parseFloat(item.estimatedPriceCAD) || 0),
        confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'medium',
        reasoning: String(item.reasoning || 'No reasoning provided')
      }))

      return { items }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
      throw new Error(`Failed to parse estimation response: ${error instanceof Error ? error.message : 'Invalid JSON format'}`)
    }
  }

  private static calculateOpenAICost(tokens: number): number {
    // GPT-4o-mini pricing: $0.00015 per 1K input tokens, $0.0006 per 1K output tokens
    // Using average of input/output for estimation
    const costPerToken = 0.000375 / 1000 // Average of input and output costs
    return tokens * costPerToken
  }

  public static async logEstimation(
    profileId: string,
    companyId: string,
    estimationType: string,
    itemsEstimated: number,
    totalCost: number,
    tokensUsed: number,
    costUSD: number
  ): Promise<void> {
    try {
      const { supabase } = await import('./supabase')
      
      const { error } = await supabase
        .from('gear_estimation_logs')
        .insert({
          profile_id: profileId,
          company_id: companyId,
          estimation_type: estimationType,
          items_estimated: itemsEstimated,
          total_estimated_cost_cad: totalCost,
          openai_tokens_used: tokensUsed,
          openai_cost_usd: costUSD
        })

      if (error) {
        console.error('Error logging estimation:', error)
        // Don't throw error as this is just logging
      }
    } catch (error) {
      console.error('Error logging estimation:', error)
      // Don't throw error as this is just logging
    }
  }
}
