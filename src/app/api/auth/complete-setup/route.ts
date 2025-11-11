/**
 * Complete Account Setup API
 *
 * Sets user's password and marks email as verified.
 * Consumes the one-time token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verification, user, account } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { hash } from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json();

    // Validate input
    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Token, name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Find and validate token
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
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Extract email
    const identifier = verificationRecord[0].identifier;
    const email = identifier.replace('setup-', '');

    // Find user
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userRecord[0].id;

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Update user with name and mark as verified
    await db
      .update(user)
      .set({
        name: name,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // Create or update account with password
    const existingAccount = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (existingAccount.length > 0) {
      // Update existing account
      await db
        .update(account)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(account.id, existingAccount[0].id));
    } else {
      // Create new account
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: email,
        providerId: 'credential',
        userId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Delete the used token (one-time use)
    await db
      .delete(verification)
      .where(eq(verification.id, verificationRecord[0].id));

    console.log(`✅ Account setup completed for ${email}`);

    return NextResponse.json({
      success: true,
      email: email,
      message: 'Account setup completed successfully',
    });
  } catch (error: any) {
    console.error('Account setup error:', error);
    return NextResponse.json(
      { error: 'Account setup failed' },
      { status: 500 }
    );
  }
}
