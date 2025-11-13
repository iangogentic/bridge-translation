/**
 * Bridge Home Page
 * Upload interface for document translation
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('en');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
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
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            validateAndSetFile(capturedFile);
            handleStopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Check if user is logged in
    if (!session) {
      router.push('/login');
      return;
    }

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
          targetLang: targetLang,
          userId: session.user.id, // Use actual logged-in user ID
        }),
      });

      if (!translateRes.ok) {
        const errorData = await translateRes.json();
        console.error('Translation API error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Translation failed');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Header */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-base">B</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Bridge</span>
            </Link>
            <div className="flex items-center gap-3">
              {session ? (
                <>
                  <Link href="/dashboard" className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-white/50 rounded-lg">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-white/50 rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-white/50 rounded-lg">
                    Login
                  </Link>
                  <Link href="/signup" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header with Gradient Text */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/60 backdrop-blur-md border border-white/40 rounded-full mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="text-2xl">🌐</span>
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Now supporting 100+ languages
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="text-gray-900">Official documents, </span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                made simple
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              AI-powered translation assistant that helps immigrant families understand and complete paperwork with confidence.
            </p>
          </div>

          {/* Upload Card with Glassmorphism */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/40 hover:shadow-3xl transition-all duration-500">
            {!showCamera ? (
              <>
                <div className="mb-6">
                  <label className="block text-lg font-bold text-gray-900 mb-2">
                    Upload or capture a document
                  </label>
                  <p className="text-sm text-gray-600 mb-5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    PDF, JPG, or PNG • Maximum 10MB
                  </p>

                  {/* Two-column layout for file and camera options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* File Upload */}
                    <div>
                      <label htmlFor="file-upload" className="block text-sm font-semibold text-gray-700 mb-3">
                        📁 Choose File
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-900
                          file:mr-4 file:py-3 file:px-4
                          file:rounded-lg file:border-0
                          file:text-xs file:font-bold
                          file:bg-gradient-to-r file:from-blue-600 file:to-blue-700
                          file:text-white
                          hover:file:from-blue-700 hover:file:to-blue-800
                          file:cursor-pointer file:transition-all file:duration-300
                          file:shadow-lg hover:file:shadow-xl
                          cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Camera Capture */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        📸 Take Picture
                      </label>
                      <button
                        onClick={handleStartCamera}
                        disabled={uploading || file !== null}
                        className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700
                          text-white text-xs font-bold rounded-lg
                          hover:from-green-700 hover:to-green-800
                          focus:outline-none focus:ring-2 focus:ring-green-500
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Open Camera
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Camera View */
              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-900 mb-4">
                  📷 Capture Document
                </label>
                <div className="relative bg-black rounded-xl overflow-hidden shadow-lg mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 md:h-96 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCapturePhoto}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600
                      text-white font-bold rounded-lg
                      hover:from-yellow-600 hover:to-orange-700
                      focus:outline-none focus:ring-2 focus:ring-orange-500
                      transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    ✓ Capture
                  </button>
                  <button
                    onClick={handleStopCamera}
                    className="flex-1 py-3 px-4 bg-gray-400 hover:bg-gray-500
                      text-white font-bold rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-gray-400
                      transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            )}

            {file && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 shadow-inner animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Language Selection */}
            <div className="mb-6">
              <label
                htmlFor="language-select"
                className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Target language
              </label>
              <p className="text-xs text-gray-600 mb-4">
                Choose your preferred language for translation
              </p>
              <select
                id="language-select"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                disabled={uploading}
                className="block w-full px-5 py-4 bg-white/90 border-2 border-gray-200
                  rounded-xl text-base font-medium text-gray-900 focus:outline-none focus:ring-4
                  focus:ring-purple-200 focus:border-purple-400 disabled:opacity-50
                  disabled:cursor-not-allowed cursor-pointer hover:border-purple-300
                  transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="vi">Vietnamese</option>
                <option value="zh">Chinese Simplified</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
                <option value="ko">Korean</option>
                <option value="ja">Japanese</option>
                <option value="pt">Portuguese</option>
                <option value="de">German</option>
              </select>
            </div>

            {error && (
              <div className="mb-8 p-5 bg-red-50/90 backdrop-blur-sm border-2 border-red-200 rounded-2xl animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-red-900">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold
                rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4
                focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300 text-base shadow-lg hover:shadow-xl hover:scale-105
                relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing your document...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Translate Document
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </button>

            {/* Privacy Note */}
            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200/50 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Your Privacy Matters</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Your documents are processed securely and are not stored permanently.
                    Files are automatically deleted after 48 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium">HIPAA compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">End-to-end encrypted</span>
              </div>
            </div>
          </div>

          {/* Features with Enhanced Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group text-center p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base">Lightning Fast</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Get translation results in under 2 seconds with our optimized AI pipeline</p>
            </div>

            <div className="group text-center p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base">Highly Accurate</h3>
              <p className="text-sm text-gray-600 leading-relaxed">GPT-4 powered translation ensures context-aware, natural-sounding results</p>
            </div>

            <div className="group text-center p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base">Bank-Level Security</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Your documents are protected with end-to-end encryption and auto-deletion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
