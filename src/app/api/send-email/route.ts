/**
 * Email sending API route using Resend
 * This route is called by the Stripe webhook to send welcome emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Make Resend optional during build (use empty string if not set)
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

interface EmailRequest {
  to: string;
  subject: string;
  text?: string;
  html: string;
  from?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { to, subject, text, html, from } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html are required' },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    console.log('Sending email via Resend:', {
      to,
      subject,
      from: from || 'Bridge <onboarding@resend.dev>',
    });

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: from || 'Bridge <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text: text || undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully:', data?.id);

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
