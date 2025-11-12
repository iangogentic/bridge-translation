/**
 * Translation API route
 * Orchestrates document translation and summarization
 * Stores results in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, results } from '@/db/schema';
import { translateDocument, calculateConfidence } from '@/lib/openai';
import { eq } from 'drizzle-orm';

interface TranslateRequest {
  fileUrl: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  targetLang?: string;
  domain?: 'school' | 'healthcare' | 'legal' | 'government';
  userId: string; // From auth session
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: TranslateRequest = await request.json();
    const {
      fileUrl,
      filename,
      mimeType,
      fileSize,
      targetLang = 'en',
      domain,
      userId,
    } = body;

    // Validate required fields
    if (!fileUrl || !filename || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create document record
    const [document] = await db
      .insert(documents)
      .values({
        ownerId: userId,
        blobUrl: fileUrl,
        filename,
        mimeType,
        fileSize,
        pageCount: null, // Could be extracted from PDF metadata
      })
      .returning();

    // Development mode: Return mock translation if no OpenAI key
    if (process.env.NODE_ENV === 'development' && !process.env.OPENAI_API_KEY) {
      console.log('=== MOCK TRANSLATION (Dev Mode) ===');
      console.log('Document ID:', document.id);
      console.log('File:', filename);
      console.log('===================================');

      const mockResult = {
        translation_html: `
          <h1>Sample Translated Document</h1>
          <p>This is a mock translation for development purposes.</p>
          <p>The document "${filename}" has been uploaded successfully.</p>
          <h2>Important Information</h2>
          <ul>
            <li>This is a development environment</li>
            <li>Set OPENAI_API_KEY to enable real translations</li>
            <li>Database and schema are working correctly</li>
          </ul>
        `,
        summary: {
          purpose: 'This is a mock translation result for development testing',
          actions: [
            'Set up OPENAI_API_KEY environment variable',
            'Configure Neon database connection',
            'Test with real documents',
          ],
          due_dates: ['No real dates - this is a mock'],
          costs: ['No costs - development mode'],
        },
        detected_language: 'en',
      };

      const [result] = await db
        .insert(results)
        .values({
          documentId: document.id,
          translationHtml: mockResult.translation_html,
          summaryJson: mockResult.summary,
          detectedLanguage: mockResult.detected_language,
          targetLanguage: targetLang,
          domain,
          confidence: 95,
          processingTimeMs: Date.now() - startTime,
        })
        .returning();

      return NextResponse.json({
        documentId: document.id,
        resultId: result.id,
        translation_html: result.translationHtml,
        summary: result.summaryJson,
        detected_language: result.detectedLanguage,
        processing_time_ms: result.processingTimeMs,
        confidence: result.confidence,
      });
    }

    // Call OpenAI for translation
    const translationResult = await translateDocument({
      fileUrl,
      targetLanguage: targetLang,
      domain,
      mimeType,
    });

    // Calculate confidence
    const confidence = calculateConfidence(translationResult);

    // Store result in database
    const [result] = await db
      .insert(results)
      .values({
        documentId: document.id,
        translationHtml: translationResult.translation_html,
        summaryJson: translationResult.summary,
        detectedLanguage: translationResult.detected_language,
        targetLanguage: targetLang,
        domain,
        confidence,
        processingTimeMs: Date.now() - startTime,
      })
      .returning();

    return NextResponse.json({
      documentId: document.id,
      resultId: result.id,
      translation_html: result.translationHtml,
      summary: result.summaryJson,
      detected_language: result.detectedLanguage,
      processing_time_ms: result.processingTimeMs,
      confidence: result.confidence,
    });

  } catch (error) {
    console.error('Translation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Translation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
