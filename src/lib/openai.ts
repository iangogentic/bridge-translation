/**
 * OpenAI GPT-4o integration for document translation and summarization
 * Uses PDF.js for PDF text extraction (serverless-compatible)
 * Uses Vision API for images
 */

import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';

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
      required: ['purpose', 'actions', 'due_dates', 'costs'],
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
 * Extract text from PDF using PDF.js (serverless-compatible)
 */
async function extractTextFromPDF(fileUrl: string): Promise<string> {
  console.log('Fetching PDF from URL:', fileUrl);

  // Fetch the PDF file
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  console.log('PDF size:', uint8Array.length, 'bytes');

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  console.log('PDF loaded, pages:', pdf.numPages);

  // Extract text from all pages
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }

  console.log('Extracted text length:', fullText.length, 'characters');
  return fullText.trim();
}

/**
 * Translate and summarize a document using GPT-4o
 * Uses PDF.js for PDF text extraction (serverless-compatible)
 * Uses Vision API for images
 */
export async function translateDocument(params: {
  fileUrl: string;
  targetLanguage?: string;
  domain?: 'school' | 'healthcare' | 'legal' | 'government';
  mimeType?: string;
}): Promise<TranslationResult> {
  const { fileUrl, targetLanguage = 'en', domain, mimeType } = params;

  // Build user message with context
  let userPrompt = `Target language: ${targetLanguage}`;
  if (domain) {
    userPrompt += `\nDocument domain: ${domain}`;
  }

  try {
    console.log('=== Translation Request Start ===');
    console.log('File URL:', fileUrl);
    console.log('MIME type:', mimeType);
    console.log('Target language:', targetLanguage);
    console.log('Domain:', domain);
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 10));

    let response: OpenAI.Chat.Completions.ChatCompletion;

    // Handle PDFs differently from images
    if (mimeType === 'application/pdf') {
      console.log('Processing PDF with text extraction...');

      // Extract text from PDF
      const documentText = await extractTextFromPDF(fileUrl);

      if (!documentText || documentText.length < 10) {
        throw new Error('Failed to extract text from PDF or PDF is empty');
      }

      userPrompt += '\n\nDocument text:\n' + documentText;

      // Use text completion for PDFs
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'BridgeTranslation',
            schema: translationSchema,
            strict: true,
          },
        },
        temperature: 0.3,
        max_tokens: 4000,
      });
    } else {
      // Use Vision API for images (png, jpeg, gif, webp)
      console.log('Processing image with Vision API...');

      userPrompt += '\n\nPlease translate this document image and provide a summary.';

      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: fileUrl,
                  detail: 'high',
                },
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
        temperature: 0.3,
        max_tokens: 4000,
      });
    }

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error('OpenAI response:', response);
      throw new Error('No response from OpenAI');
    }

    console.log('✅ Translation completed successfully');
    console.log('Response content length:', content.length);
    console.log('Response preview:', content.substring(0, 200));

    let result: TranslationResult;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse OpenAI response: ' + (parseError instanceof Error ? parseError.message : 'Invalid JSON'));
    }

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
