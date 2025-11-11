/**
 * Document export API
 * POST /api/doc/:id/export - Export translated document as PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { results } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ExportRequest {
  format?: 'pdf' | 'json' | 'txt';
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body: ExportRequest = await request.json();
    const { format = 'pdf' } = body;

    // Fetch result
    const [result] = await db
      .select()
      .from(results)
      .where(eq(results.documentId, id))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    // Handle different export formats
    switch (format) {
      case 'json':
        return NextResponse.json({
          translation: result.translationHtml,
          summary: result.summaryJson,
          metadata: {
            detected_language: result.detectedLanguage,
            target_language: result.targetLanguage,
            domain: result.domain,
            confidence: result.confidence,
          },
        });

      case 'txt':
        // Simple text export
        const textContent = `
TRANSLATION
===========
${result.translationHtml.replace(/<[^>]*>/g, '\n')}

SUMMARY
=======
Purpose: ${result.summaryJson.purpose}

Actions:
${result.summaryJson.actions.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}

${result.summaryJson.due_dates?.length ? `\nDue Dates:\n${result.summaryJson.due_dates.join('\n')}` : ''}
${result.summaryJson.costs?.length ? `\nCosts:\n${result.summaryJson.costs.join('\n')}` : ''}
        `.trim();

        return new NextResponse(textContent, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="translation-${id}.txt"`,
          },
        });

      case 'pdf':
        // PDF export using Playwright (headless Chromium)
        // For MVP, return placeholder
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            message: 'PDF export not yet implemented',
            format: 'pdf',
            documentId: id,
            // In production, this would return a PDF blob or URL
          });
        }

        // TODO: Implement PDF export with Playwright
        // const pdf = await generatePDF(result.translationHtml);
        // return new NextResponse(pdf, {
        //   headers: {
        //     'Content-Type': 'application/pdf',
        //     'Content-Disposition': `attachment; filename="translation-${id}.pdf"`,
        //   },
        // });

        return NextResponse.json(
          { error: 'PDF export not yet implemented' },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export document' },
      { status: 500 }
    );
  }
}
