/**
 * Family invite API
 * POST /api/family/invite - Invite a helper to family
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { families, familyMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface InviteRequest {
  email: string;
  userId: string; // Owner ID from auth
}

export async function POST(request: NextRequest) {
  try {
    const body: InviteRequest = await request.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create user's family
    let [family] = await db
      .select()
      .from(families)
      .where(eq(families.ownerId, userId))
      .limit(1);

    if (!family) {
      [family] = await db
        .insert(families)
        .values({ ownerId: userId })
        .returning();
    }

    // Create invite (in production, would send email to the user)
    const [member] = await db
      .insert(familyMembers)
      .values({
        familyId: family.id,
        userId: 'pending-user-id', // Would be resolved after user signs up
        role: 'helper',
      })
      .returning();

    // Send invite email via Resend MCP
    console.log(`Sending invite to ${email} for family ${family.id}`);

    return NextResponse.json({
      id: member.id,
      familyId: family.id,
      invitedEmail: email,
      invitedAt: member.invitedAt,
    });

  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Failed to send invite' },
      { status: 500 }
    );
  }
}
