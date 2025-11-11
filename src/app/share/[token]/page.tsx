/**
 * Public Share Link Viewer
 * Time-boxed access to translated documents
 */

'use client';

import { use, useEffect, useState } from 'react';

interface ShareData {
  documentId: string;
  filename: string;
  translation_html: string;
  summary: {
    purpose: string;
    actions: string[];
    due_dates?: string[];
    costs?: string[];
  };
  expiresAt: string;
  canDownload: boolean;
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'translation' | 'summary'>('translation');

  useEffect(() => {
    async function fetchShare() {
      try {
        // This would be an actual API endpoint
        // For MVP, we'll show a placeholder
        setError('Share viewing not yet implemented');
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load share');
        setLoading(false);
      }
    }

    fetchShare();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared document...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">Coming Soon</h2>
            <p className="text-yellow-700">Public share link viewing will be available in the next update.</p>
            <p className="text-sm text-yellow-600 mt-4">Token: {token}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-4">{data.filename}</h1>
          <p className="text-sm text-gray-600 mb-6">
            This link expires {new Date(data.expiresAt).toLocaleString()}
          </p>

          {activeTab === 'translation' && (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: data.translation_html }}
            />
          )}

          {activeTab === 'summary' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Summary</h2>
              <p className="mb-4">{data.summary.purpose}</p>
              {data.summary.actions.length > 0 && (
                <ul className="list-disc pl-5">
                  {data.summary.actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
