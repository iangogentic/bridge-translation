/**
 * Clerk Webhook Handler
 *
 * Syncs user data from Clerk to local database.
 *
 * Handled Events:
 * - user.created: Create new user in database
 * - user.updated: Update existing user data
 * - user.deleted: Mark user as banned (soft delete)
 *
 * Webhook URL: https://yourdomain.com/api/webhooks/clerk
 *
 * Configuration:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Create endpoint with above URL
 * 3. Subscribe to: user.created, user.updated, user.deleted
 * 4. Copy webhook signing secret to CLERK_WEBHOOK_SECRET env var
 */

import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Clerk webhook event types we handle
type ClerkUserEvent = Extract<WebhookEvent, { type: 'user.created' | 'user.updated' | 'user.deleted' }>;

export async function POST(req: Request) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get Svix headers for signature verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If no signature headers, reject the request
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers');
    return new Response('Missing webhook headers', { status: 400 });
  }

  // Get the body
  const payload = await req.text();

  // Create Svix webhook instance for verification
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook signature
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle the webhook event
  try {
    const eventType = evt.type;

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt as Extract<WebhookEvent, { type: 'user.created' }>);
        break;

      case 'user.updated':
        await handleUserUpdated(evt as Extract<WebhookEvent, { type: 'user.updated' }>);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt as Extract<WebhookEvent, { type: 'user.deleted' }>);
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent Clerk from retrying (we've logged the error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle user.created event
 * Creates a new user in the database with default freemium settings
 */
async function handleUserCreated(event: WebhookEvent) {
  if (event.type !== 'user.created') return;
  const { id, email_addresses, first_name, last_name, image_url } = event.data;

  // Get primary email
  const primaryEmail = email_addresses.find(e => e.id === event.data.primary_email_address_id);
  if (!primaryEmail) {
    throw new Error(`No primary email found for user ${id}`);
  }

  // Build full name
  const name = [first_name, last_name].filter(Boolean).join(' ') || primaryEmail.email_address;

  console.log(`Creating user: ${id} (${primaryEmail.email_address})`);

  try {
    // Insert new user with default freemium settings
    await db.insert(userTable).values({
      id, // Clerk user ID
      email: primaryEmail.email_address,
      emailVerified: true, // Clerk handles email verification
      name,
      image: image_url || null,
      role: 'customer', // Default role
      banned: false,
      subscriptionPlan: 'free', // Freemium default
      subscriptionStatus: 'active',
      translationLimit: 5, // Free tier: 5 translations
      translationCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✓ User created successfully: ${id}`);
  } catch (error) {
    // Handle duplicate email gracefully (user might exist from old system)
    if (error instanceof Error && error.message.includes('unique')) {
      console.warn(`User with email ${primaryEmail.email_address} already exists, updating instead`);

      // Update existing user with Clerk ID if they don't have one
      await db.update(userTable)
        .set({
          id, // Set Clerk user ID
          name,
          image: image_url || null,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(userTable.email, primaryEmail.email_address));

      console.log(`✓ Existing user updated with Clerk ID: ${id}`);
    } else {
      throw error;
    }
  }
}

/**
 * Handle user.updated event
 * Updates user name, email, and image (preserves subscription data)
 */
async function handleUserUpdated(event: WebhookEvent) {
  if (event.type !== 'user.updated') return;
  const { id, email_addresses, first_name, last_name, image_url } = event.data;

  console.log(`Updating user: ${id}`);

  // Get primary email
  const primaryEmail = email_addresses.find(e => e.id === event.data.primary_email_address_id);
  if (!primaryEmail) {
    throw new Error(`No primary email found for user ${id}`);
  }

  // Build full name
  const name = [first_name, last_name].filter(Boolean).join(' ') || primaryEmail.email_address;

  try {
    const result = await db.update(userTable)
      .set({
        email: primaryEmail.email_address,
        name,
        image: image_url || null,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, id));

    console.log(`✓ User updated successfully: ${id}`);
  } catch (error) {
    console.error(`Failed to update user ${id}:`, error);
    throw error;
  }
}

/**
 * Handle user.deleted event
 * Soft delete by setting banned = true (preserves data for audit/logs)
 */
async function handleUserDeleted(event: WebhookEvent) {
  if (event.type !== 'user.deleted') return;
  const userId = (event.data as { id?: string }).id;
  if (!userId) return;

  console.log(`Deleting user: ${userId}`);

  try {
    // Soft delete: set banned = true to preserve data
    await db.update(userTable)
      .set({
        banned: true,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, userId));

    console.log(`✓ User soft deleted (banned): ${userId}`);

    // Alternative: Hard delete (uncomment if preferred)
    // await db.delete(userTable).where(eq(userTable.id, userId));
    // console.log(`✓ User hard deleted: ${userId}`);
  } catch (error) {
    console.error(`Failed to delete user ${userId}:`, error);
    throw error;
  }
}
