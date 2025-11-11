/**
 * Document Viewer Page
 * Displays Original | Translated | Summary tabs
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DocumentData {
  id: string;
  filename: string;
  uploadedAt: string;
}

interface ResultData {
  translation_html: string;
  summary: {
    purpose: string;
    actions: string[];
    due_dates?: string[];
    costs?: string[];
  };
  detected_language: string;
  confidence?: number;
}

type Tab = 'translation' | 'summary';

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('translation');
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch document metadata
        const docRes = await fetch(`/api/doc/${id}`);
        if (!docRes.ok) throw new Error('Document not found');
        const docData = await docRes.json();
        setDocument(docData);

        // Fetch translation result
        const resultRes = await fetch(`/api/doc/${id}/result`);
        if (!resultRes.ok) throw new Error('Result not found');
        const resultData = await resultRes.json();
        setResult(resultData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleExport = async (format: 'pdf' | 'json' | 'txt') => {
    try {
      const res = await fetch(`/api/doc/${id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) throw new Error('Export failed');

      if (format === 'txt') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translation-${id}.txt`;
        a.click();
      } else {
        const data = await res.json();
        console.log('Export result:', data);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleCreateShare = async () => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: id,
          userId: 'dev-user-id',
          ttl: 48,
        }),
      });

      if (!res.ok) throw new Error('Failed to create share link');

      const data = await res.json();
      alert(`Share link: ${data.url}\nExpires: ${new Date(data.expiresAt).toLocaleString()}`);
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error || 'Document not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-2"
              >
                ← Back to Upload
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{document.filename}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Uploaded {new Date(document.uploadedAt).toLocaleString()}
                {result.confidence && ` • Confidence: ${result.confidence}%`}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateShare}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Share
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('translation')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'translation'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Translated
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Summary
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'translation' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: result.translation_html }}
            />
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Summary
            </h2>

            {/* Purpose */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What is this document about?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {result.summary.purpose}
              </p>
            </div>

            {/* Actions */}
            {result.summary.actions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What do I need to do?
                </h3>
                <ul className="space-y-2">
                  {result.summary.actions.map((action, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Due Dates */}
            {result.summary.due_dates && result.summary.due_dates.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Important Dates
                </h3>
                <ul className="space-y-2">
                  {result.summary.due_dates.map((date, i) => (
                    <li key={i} className="flex items-center">
                      <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">{date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Costs */}
            {result.summary.costs && result.summary.costs.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Costs & Fees
                </h3>
                <ul className="space-y-2">
                  {result.summary.costs.map((cost, i) => (
                    <li key={i} className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{cost}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Detected language:</strong> {result.detected_language.toUpperCase()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
