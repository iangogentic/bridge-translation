/**
 * File upload API route using Vercel Blob
 * Handles PDF/JPG/PNG document uploads
 * Returns blob URL for subsequent processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${nanoid()}.${ext}`;

    // Upload to Vercel Blob
    // In production, this requires BLOB_READ_WRITE_TOKEN env var
    if (process.env.NODE_ENV === 'development' && !process.env.BLOB_READ_WRITE_TOKEN) {
      // Development mode without Blob - return mock data
      console.log('=== MOCK UPLOAD (Dev Mode) ===');
      console.log('File:', file.name);
      console.log('Size:', file.size);
      console.log('Type:', file.type);
      console.log('==============================');

      return NextResponse.json({
        url: `https://blob.vercel-storage.com/mock/${filename}`,
        pathname: filename,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
    }

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
