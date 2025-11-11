/**
 * Validate Setup Token API
 *
 * Checks if a magic link token is valid and not expired.
 * Returns user email if valid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verification, user } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find verification token
    const verificationRecord = await db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.value, token),
          gt(verification.expiresAt, new Date())
        )
      )
      .limit(1);

    if (verificationRecord.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Extract email from identifier (format: setup-email@example.com)
    const identifier = verificationRecord[0].identifier;
    const email = identifier.replace('setup-', '');

    // Get user details
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: email,
      name: userRecord[0].name,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Token validation failed' },
      { status: 500 }
    );
  }
}
