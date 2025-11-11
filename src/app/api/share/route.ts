/**
 * Share link API
 * POST /api/share - Create time-boxed share link
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shares, documents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface ShareRequest {
  docId: string;
  ttl?: number; // Time to live in hours (default: 48)
  canDownload?: boolean;
  userId: string; // From auth session
}

export async function POST(request: NextRequest) {
  try {
    const body: ShareRequest = await request.json();
    const { docId, ttl = 48, canDownload = true, userId } = body;

    // Validate required fields
    if (!docId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify document exists and user owns it
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, docId))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate secure token
    const token = nanoid(32);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttl);

    // Create share record
    const [share] = await db
      .insert(shares)
      .values({
        documentId: docId,
        createdBy: userId,
        token,
        expiresAt,
        canDownload,
      })
      .returning();

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({
      id: share.id,
      token: share.token,
      url: shareUrl,
      expiresAt: share.expiresAt,
      canDownload: share.canDownload,
      createdAt: share.createdAt,
    });

  } catch (error) {
    console.error('Share creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}
