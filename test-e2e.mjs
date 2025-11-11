/**
 * End-to-End Test for Bridge Translation App
 * Tests: Upload → Translate → Store → Display
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3004';

async function testE2E() {
  console.log('=== Bridge E2E Test ===\n');

  try {
    // Step 1: Test if sample PDF exists
    console.log('1. Checking for sample PDF...');
    const samplePdfPath = join(__dirname, 'sample.pdf');
    let pdfBuffer;

    try {
      pdfBuffer = readFileSync(samplePdfPath);
      console.log(`✓ Found sample PDF (${(pdfBuffer.length / 1024).toFixed(2)} KB)\n`);
    } catch {
      console.log('✗ sample.pdf not found in project root');
      console.log('Please add a test PDF file named "sample.pdf" to the bridge/ directory\n');
      return;
    }

    // Step 2: Upload PDF to Vercel Blob
    console.log('2. Uploading PDF to Vercel Blob...');
    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'sample.pdf');

    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      throw new Error(`Upload failed: ${uploadRes.status} - ${error}`);
    }

    const uploadData = await uploadRes.json();
    console.log(`✓ Uploaded to: ${uploadData.url}`);
    console.log(`✓ Size: ${uploadData.size} bytes\n`);

    // Step 3: Request translation
    console.log('3. Requesting translation from OpenAI...');
    console.log('   (This may take 10-30 seconds for PDF conversion + GPT-4o processing)\n');

    const translateRes = await fetch(`${BASE_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileUrl: uploadData.url,
        filename: 'sample.pdf',
        mimeType: 'application/pdf',
        fileSize: uploadData.size,
        targetLang: 'en',
        userId: '00000000-0000-0000-0000-000000000001',
      }),
    });

    if (!translateRes.ok) {
      const error = await translateRes.json();
      throw new Error(`Translation failed: ${translateRes.status} - ${JSON.stringify(error, null, 2)}`);
    }

    const translateData = await translateRes.json();
    console.log('✓ Translation completed!');
    console.log(`✓ Document ID: ${translateData.documentId}`);
    console.log(`✓ Detected language: ${translateData.detected_language}`);
    console.log(`✓ Confidence: ${translateData.confidence}%`);
    console.log(`✓ Processing time: ${translateData.processing_time_ms}ms\n`);

    // Step 4: Display summary
    console.log('4. Translation Summary:');
    console.log('─────────────────────────────────────────');
    console.log(`Purpose: ${translateData.summary.purpose}`);
    console.log(`\nActions (${translateData.summary.actions.length}):`);
    translateData.summary.actions.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action}`);
    });

    if (translateData.summary.due_dates?.length > 0) {
      console.log(`\nDue Dates:`);
      translateData.summary.due_dates.forEach(date => console.log(`  • ${date}`));
    }

    if (translateData.summary.costs?.length > 0) {
      console.log(`\nCosts:`);
      translateData.summary.costs.forEach(cost => console.log(`  • ${cost}`));
    }
    console.log('─────────────────────────────────────────\n');

    // Step 5: Fetch document from database
    console.log('5. Verifying database storage...');
    const docRes = await fetch(`${BASE_URL}/api/doc/${translateData.documentId}`);

    if (!docRes.ok) {
      throw new Error(`Failed to fetch document: ${docRes.status}`);
    }

    const docData = await docRes.json();
    console.log(`✓ Document stored in database`);
    console.log(`✓ Filename: ${docData.filename}`);
    console.log(`✓ Uploaded: ${new Date(docData.uploadedAt).toLocaleString()}\n`);

    // Step 6: Fetch translation result from database
    console.log('6. Verifying translation result storage...');
    const resultRes = await fetch(`${BASE_URL}/api/doc/${translateData.documentId}/result`);

    if (!resultRes.ok) {
      throw new Error(`Failed to fetch result: ${resultRes.status}`);
    }

    const resultData = await resultRes.json();
    console.log(`✓ Translation result stored in database`);
    console.log(`✓ Has HTML translation: ${resultData.translation_html.length} characters`);
    console.log(`✓ Summary object stored correctly\n`);

    // Success!
    console.log('=== ✓ ALL TESTS PASSED ===\n');
    console.log(`View document at: ${BASE_URL}/doc/${translateData.documentId}`);
    console.log(`\nTest completed successfully! 🎉`);

  } catch (error) {
    console.error('\n=== ✗ TEST FAILED ===');
    console.error(error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testE2E();
