import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

// Test with a sample PDF
const testPdfUrl = 'https://d5toskurr7ck98ir.public.blob.vercel-storage.com/U-5txMdq20PvHEGWH5Icu.pdf';

async function testPdfExtraction() {
  try {
    console.log('Fetching PDF...');
    const response = await fetch(testPdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log(`PDF size: ${uint8Array.length} bytes`);
    console.log('Loading PDF...');

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    console.log(`PDF has ${pdf.numPages} pages`);

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Extracting page ${pageNum}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    console.log('\n=== EXTRACTED TEXT ===');
    console.log(fullText);
    console.log('\n=== END ===');
    console.log(`\nTotal characters extracted: ${fullText.length}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testPdfExtraction();
