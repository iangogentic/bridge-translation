/**
 * Admin API - Create Internal/Admin User
 *
 * Allows admins to manually create user accounts with specific roles.
 * Protected by API key authentication.
 *
 * Usage:
 * POST /api/admin/create-user
 * Headers: { "x-admin-api-key": "your-secret-key" }
 * Body: { email, name, password, role }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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
    const { email, name, password, role } = body;

    // Validate input
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, password' },
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

    // Check if user already exists
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

    // Create user via Better Auth
    const result = await auth.api.createUser({
      body: {
        email,
        name,
        password,
      },
    });

    if (!result.user) {
      throw new Error('Failed to create user');
    }

    // Update with role
    await db
      .update(user)
      .set({
        role: userRole,
        updatedAt: new Date(),
      })
      .where(eq(user.id, result.user.id));

    console.log(`[Admin API] Created user ${email} with role: ${userRole}`);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
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
