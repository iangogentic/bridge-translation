import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function applySchema() {
  try {
    console.log('Applying database schema...');

    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "email_verified" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('✓ Created users table');

    await sql`
      CREATE TABLE IF NOT EXISTS "families" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255),
        "owner_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade
      );
    `;
    console.log('✓ Created families table');

    await sql`
      CREATE TABLE IF NOT EXISTS "family_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "family_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" varchar(50) DEFAULT 'helper' NOT NULL,
        "invited_at" timestamp DEFAULT now() NOT NULL,
        "accepted_at" timestamp,
        "revoked_at" timestamp,
        FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE cascade,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
      );
    `;
    console.log('✓ Created family_members table');

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_family_member" ON "family_members" ("family_id", "user_id");
    `;
    console.log('✓ Created unique_family_member index');

    await sql`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "owner_id" uuid NOT NULL,
        "family_id" uuid,
        "blob_url" text NOT NULL,
        "filename" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "file_size" integer NOT NULL,
        "page_count" integer,
        "uploaded_at" timestamp DEFAULT now() NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade,
        FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE set null
      );
    `;
    console.log('✓ Created documents table');

    await sql`
      CREATE TABLE IF NOT EXISTS "results" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "document_id" uuid NOT NULL UNIQUE,
        "translation_html" text NOT NULL,
        "summary_json" jsonb NOT NULL,
        "detected_language" varchar(10) NOT NULL,
        "target_language" varchar(10) DEFAULT 'en' NOT NULL,
        "domain" varchar(50),
        "confidence" integer,
        "processing_time_ms" integer,
        "created_at" timestamp DEFAULT now() NOT NULL,
        FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE cascade
      );
    `;
    console.log('✓ Created results table');

    await sql`
      CREATE TABLE IF NOT EXISTS "shares" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "document_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "token" varchar(64) NOT NULL UNIQUE,
        "expires_at" timestamp NOT NULL,
        "can_download" boolean DEFAULT true NOT NULL,
        "view_count" integer DEFAULT 0 NOT NULL,
        "last_viewed_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE cascade,
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE cascade
      );
    `;
    console.log('✓ Created shares table');

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "share_token_idx" ON "shares" ("token");
    `;
    console.log('✓ Created share_token_idx index');

    console.log('\n✅ Database schema applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applySchema();
