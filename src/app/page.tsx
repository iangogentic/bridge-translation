/**
 * Bridge Home Page
 * Upload interface for document translation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a PDF, JPG, or PNG file');
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadRes.json();

      // Step 2: Request translation
      const translateRes = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: uploadData.url,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          targetLang: 'en',
          userId: 'dev-user-id', // TODO: Replace with actual user ID from auth
        }),
      });

      if (!translateRes.ok) {
        throw new Error('Translation failed');
      }

      const translateData = await translateRes.json();

      // Redirect to document view
      router.push(`/doc/${translateData.documentId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Bridge
            </h1>
            <p className="text-xl text-gray-600">
              Official documents, made simple.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Understand what to do by when, in under a minute
            </p>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <label
                htmlFor="file-upload"
                className="block text-lg font-semibold text-gray-900 mb-2"
              >
                Upload a document
              </label>
              <p className="text-sm text-gray-600 mb-4">
                PDF, JPG, or PNG • Maximum 10MB
              </p>

              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-900
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  file:cursor-pointer
                  cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {file && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-4 px-6 bg-blue-600 text-white font-semibold
                rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4
                focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 text-lg"
            >
              {uploading ? 'Processing...' : 'Translate Document'}
            </button>

            {/* Privacy Note */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong className="font-semibold">Privacy:</strong> Your documents are processed securely and are not stored permanently.
                Files are automatically deleted after 48 hours.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Fast</h3>
              <p className="text-sm text-gray-600">Results in under 2 seconds</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Accurate</h3>
              <p className="text-sm text-gray-600">AI-powered translation</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure</h3>
              <p className="text-sm text-gray-600">End-to-end encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
