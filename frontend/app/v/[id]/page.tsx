'use client';

import { useEffect, useState } from 'react';
import { decryptNote } from '@/utils/crypto';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Copy, Check, FileIcon, ImageIcon, Download } from 'lucide-react';
import { CopyCode } from '@/components/ui/copy-code-button';
import DownloadButton from '@/components/ui/button-download';

export default function ViewNote() {
    const params = useParams();
    const id = params?.id as string;
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // New top-level hooks
    const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "downloaded" | "complete">("idle");
    const [progress, setProgress] = useState(0);

    const handleDownload = (file: { name: string; type: string; data: string }) => {
        if (!file || downloadStatus !== 'idle') return;

        setDownloadStatus("downloading");
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prevProgress) => {
                if (prevProgress >= 100) {
                    clearInterval(interval);

                    // Trigger actual download
                    const link = document.createElement('a');
                    link.href = file!.data;
                    link.download = file!.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setDownloadStatus("downloaded");
                    return 100;
                }
                return prevProgress + 10;
            });
        }, 100);

        setTimeout(() => {
            setDownloadStatus("complete");
            setTimeout(() => {
                setDownloadStatus("idle");
                setProgress(0);
            }, 1000);
        }, 2500);
    };

    useEffect(() => {
        const fetchNote = async () => {
            const hash = window.location.hash;
            const key = hash.replace('#', '');

            if (!id || !key) {
                setError('Invalid link. Missing ID or Key.');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`http://localhost:4000/api/notes/${id}`);

                if (res.status === 404) {
                    setError('Note not found. It may have been read already or expired.');
                    setLoading(false);
                    return;
                }

                if (!res.ok) {
                    throw new Error('Failed to fetch note');
                }

                const data = await res.json();
                const decrypted = decryptNote(data.content, key, data.iv);
                setContent(decrypted);
            } catch (err) {
                console.error(err);
                setError('Failed to decrypt note. The key might be invalid.');
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [id]);

    // Parse content for rendering
    let text = "";
    let file: { name: string; type: string; data: string } | null = null;

    if (content) {
        try {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object') {
                text = parsed.text || "";
                file = parsed.file || null;
            } else {
                text = content;
            }
        } catch {
            text = content;
        }
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4">
            <motion.main
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-lg bg-gray-50/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
                <motion.div layout className="mb-6 border-b border-gray-200 pb-6">
                    <h1 className="text-3xl font-bold text-center text-black tracking-tight">
                        Ghost Note
                    </h1>
                    <p className="text-gray-400 text-center mt-2 text-sm font-medium">
                        {loading ? 'Decrypting secure message...' :
                            error ? 'Message unavailable' :
                                'Message decrypted successfully'}
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-12 space-y-4"
                        >
                            <Loader2 className="w-10 h-10 text-black animate-spin" />
                            <p className="text-sm font-mono text-gray-400 animate-pulse">
                                DECRYPTING_DATA_PACKETS...
                            </p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8 space-y-6"
                        >
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-gray-900">Gone Forever</h2>
                                <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
                                    {error}
                                </p>
                            </div>
                            <a href="/" className="inline-block px-8 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95">
                                Create New Note
                            </a>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            {/* Text Section */}
                            {text && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(text);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="absolute top-3 right-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors"
                                        title="Copy content"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <p className="text-gray-800 whitespace-pre-wrap font-sans text-lg leading-relaxed select-none blur-none pr-8">
                                        {text}
                                    </p>
                                </div>
                            )}

                            {/* File Section */}
                            {file && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex items-center gap-4 flex-1 w-full">
                                        <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                            {/* @ts-ignore */}
                                            {file.type.startsWith('image/') ? (
                                                /* @ts-ignore */
                                                <img src={file.data} alt="Attached content" className="w-12 h-12 object-cover rounded-md" />
                                            ) : (
                                                <FileIcon className="w-8 h-8 text-orange-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {/* @ts-ignore */}
                                            <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                                            {/* @ts-ignore */}
                                            <p className="text-xs text-gray-500 uppercase">{file.type.split('/')[1] || 'FILE'}</p>
                                        </div>
                                    </div>
                                    <DownloadButton
                                        downloadStatus={downloadStatus}
                                        progress={progress}
                                        // @ts-ignore
                                        onClick={() => handleDownload(file)}
                                        className="w-full sm:w-auto"
                                    />
                                </div>
                            )}

                            {/* Image Preview Large */}
                            {/* @ts-ignore */}
                            {file && file.type.startsWith('image/') && (
                                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                    {/* @ts-ignore */}
                                    <img src={file.data} alt="Full preview" className="w-full h-auto" />
                                </div>
                            )}

                            <div className="text-center space-y-4 pt-4 border-t border-gray-200/60">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    Note destroyed from server
                                </p>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="text-gray-400 hover:text-black text-sm font-medium transition-colors"
                                >
                                    Create another note →
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.main>
        </div>
    );
}
