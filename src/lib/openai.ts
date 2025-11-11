/**
 * OpenAI GPT-4o integration for document translation and summarization
 * Uses structured output to ensure consistent response format
 */

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set - OpenAI features will not work');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
});

// Type definitions for the structured output
export interface TranslationResult {
  translation_html: string;
  summary: {
    purpose: string;
    actions: string[];
    due_dates?: string[];
    costs?: string[];
  };
  detected_language: string;
}

// JSON Schema for structured output (strict mode)
export const translationSchema = {
  type: 'object',
  properties: {
    translation_html: {
      type: 'string',
      description: 'The translated document content in HTML format, preserving structure (headings, lists, tables)',
    },
    summary: {
      type: 'object',
      properties: {
        purpose: {
          type: 'string',
          description: 'The main purpose of the document in plain language',
        },
        actions: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of actions the recipient needs to take',
        },
        due_dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Important dates and deadlines mentioned',
        },
        costs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any costs, fees, or financial obligations',
        },
      },
      required: ['purpose', 'actions'],
      additionalProperties: false,
    },
    detected_language: {
      type: 'string',
      description: 'ISO 639-1 language code of the source document (e.g., "vi", "es", "zh")',
    },
  },
  required: ['translation_html', 'summary', 'detected_language'],
  additionalProperties: false,
} as const;

// System prompt for the translation agent
export const TRANSLATION_SYSTEM_PROMPT = `You are a domain-aware translator specialized in official documents for immigrant families.

Your task is to:
1. Detect the source language
2. Translate the document to English, preserving structure in HTML
3. Create a plain-language summary with key actions, dates, and costs

Guidelines:
- Preserve document structure using semantic HTML (h1-h6, ul, ol, table, p)
- Keep dates, amounts, names, and addresses EXACTLY as written
- Expand acronyms on first mention (e.g., "IEP (Individualized Education Program)")
- Use plain language in summaries - avoid jargon
- For school docs: highlight enrollment, meetings, permissions
- For healthcare: highlight appointments, insurance, medications
- For legal: highlight deadlines, rights, obligations
- For government: highlight applications, requirements, benefits

Output format: Return ONLY valid JSON matching the schema.`;

/**
 * Translate and summarize a document using GPT-4o
 */
export async function translateDocument(params: {
  fileUrl: string;
  targetLanguage?: string;
  domain?: 'school' | 'healthcare' | 'legal' | 'government';
}): Promise<TranslationResult> {
  const { fileUrl, targetLanguage = 'en', domain } = params;

  // Build user message with context
  let userPrompt = `Target language: ${targetLanguage}`;
  if (domain) {
    userPrompt += `\nDocument domain: ${domain}`;
  }
  userPrompt += '\n\nPlease translate this document and provide a summary.';

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: { url: fileUrl },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'BridgeTranslation',
          schema: translationSchema,
          strict: true,
        },
      },
      temperature: 0.3, // Lower temperature for more consistent outputs
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result: TranslationResult = JSON.parse(content);

    // Validate the result has required fields
    if (!result.translation_html || !result.summary || !result.detected_language) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return result;

  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw new Error('Failed to translate document: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Get the confidence score from OpenAI response
 * This is a placeholder - actual implementation would analyze the response
 */
export function calculateConfidence(result: TranslationResult): number {
  // Simple heuristic: longer, more detailed responses = higher confidence
  const hasActions = result.summary.actions.length > 0;
  const hasDates = (result.summary.due_dates?.length ?? 0) > 0;
  const hasCosts = (result.summary.costs?.length ?? 0) > 0;
  const hasPurpose = result.summary.purpose.length > 20;

  let confidence = 70; // base confidence
  if (hasActions) confidence += 10;
  if (hasDates) confidence += 10;
  if (hasCosts) confidence += 5;
  if (hasPurpose) confidence += 5;

  return Math.min(confidence, 100);
}
