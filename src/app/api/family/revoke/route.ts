/**
 * Family revoke API
 * POST /api/family/revoke - Revoke helper access
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { familyMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RevokeRequest {
  memberId: string;
  userId: string; // Owner ID from auth
}

export async function POST(request: NextRequest) {
  try {
    const body: RevokeRequest = await request.json();
    const { memberId, userId } = body;

    if (!memberId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Revoke access
    const [member] = await db
      .update(familyMembers)
      .set({ revokedAt: new Date() })
      .where(eq(familyMembers.id, memberId))
      .returning();

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: member.id,
      revokedAt: member.revokedAt,
    });

  } catch (error) {
    console.error('Revoke error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke access' },
      { status: 500 }
    );
  }
}
