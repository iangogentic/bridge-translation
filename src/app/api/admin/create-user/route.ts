/**
 * Admin API - Create Internal/Admin User
 *
 * Allows admins to manually create user accounts with specific roles.
 * Protected by API key authentication.
 *
 * Usage:
 * POST /api/admin/create-user
 * Headers: { "x-admin-api-key": "your-secret-key" }
 * Body: { email, firstName, lastName, password, role }
 */

import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Admin API key from environment (set in .env.local)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Verify API key
    const apiKey = req.headers.get('x-admin-api-key');

    if (!apiKey || apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { email, firstName, lastName, password, role } = body;

    // Support both old 'name' field and new 'firstName'/'lastName' fields
    const finalFirstName = firstName || body.name?.split(' ')[0] || '';
    const finalLastName = lastName || body.name?.split(' ').slice(1).join(' ') || '';

    // Validate input
    if (!email || !finalFirstName || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName (or name), password' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['customer', 'admin', 'internal'];
    const userRole = role || 'customer';

    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user already exists in our database
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user via Clerk
    let clerkUser;
    try {
      const client = await clerkClient();
      clerkUser = await client.users.createUser({
        emailAddress: [email],
        password: password,
        firstName: finalFirstName,
        lastName: finalLastName,
        publicMetadata: {
          role: userRole,
        },
      });
    } catch (clerkError: any) {
      // Handle Clerk-specific errors
      if (clerkError.errors?.[0]?.code === 'form_identifier_exists') {
        return NextResponse.json(
          { error: 'User with this email already exists in Clerk' },
          { status: 409 }
        );
      }
      throw clerkError;
    }

    // Create user record in our database
    const fullName = `${finalFirstName}${finalLastName ? ' ' + finalLastName : ''}`;
    await db.insert(user).values({
      id: clerkUser.id,
      clerkUserId: clerkUser.id,
      name: fullName,
      email: email,
      emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[Admin API] Created user ${email} with role: ${userRole}`);

    return NextResponse.json({
      success: true,
      user: {
        id: clerkUser.id,
        email: email,
        name: fullName,
        role: userRole,
      },
    });
  } catch (error: any) {
    console.error('[Admin API] Create user error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
