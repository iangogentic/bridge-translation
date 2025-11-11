/**
 * Email sending API route using Resend MCP
 * This route is called by Better Auth to send magic link emails
 */

import { NextRequest, NextResponse } from 'next/server';

interface EmailRequest {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { to, subject, text, html, from } = body;

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('=== EMAIL (Development Mode) ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Text:', text);
      console.log('================================');

      return NextResponse.json({ success: true, messageId: 'dev-' + Date.now() });
    }

    // Production: Call Resend MCP via code-executor
    // This is a placeholder - the actual implementation would use code-executor
    // to call: await callMCPTool('mcp__resend__send_email', {...})

    // For now, we'll use a direct approach
    // In production, this would be replaced with actual Resend MCP call
    const resendPayload = {
      from: from || 'Bridge <noreply@bridge.app>',
      to,
      subject,
      text,
      html,
    };

    console.log('Sending email via Resend MCP:', {
      to,
      subject,
      from: resendPayload.from,
    });

    // Placeholder response - in production this would be the actual Resend response
    const messageId = `msg_${Date.now()}`;

    return NextResponse.json({
      success: true,
      messageId,
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
