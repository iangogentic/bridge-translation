/**
 * Debug Status Endpoint
 * Shows current system state and configuration
 */

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();

    const status: any = {
      timestamp: new Date().toISOString(),
      clerk: {
        userId: userId || 'NOT_AUTHENTICATED',
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT_SET',
        secretKey: process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT_SET',
        webhookSecret: process.env.CLERK_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
      },
      database: {
        connected: false,
        url: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
    };

    // Test database connection
    try {
      const users = await db.select().from(userTable).limit(1);
      status.database.connected = true;
      status.database.userCount = users.length;
    } catch (dbError) {
      status.database.connected = false;
      status.database.error = dbError instanceof Error ? dbError.message : 'Unknown error';
    }

    // If authenticated, show user details
    if (userId) {
      try {
        const user = await db.select().from(userTable).where(eq(userTable.id, userId));
        status.user = {
          inDatabase: user.length > 0,
          data: user[0] || null,
        };
      } catch (userError) {
        status.user = {
          inDatabase: false,
          error: userError instanceof Error ? userError.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json(status, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
