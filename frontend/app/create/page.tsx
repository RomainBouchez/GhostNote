'use client';

import { useState, useRef } from 'react';
import { encryptNote } from '@/utils/crypto';
import { CryptedLoadingButton } from '@/components/ui/crypted-loading-button';
import { CopyCode } from '@/components/ui/copy-code-button';
import { AnimatePresence, motion } from 'framer-motion';
import { Paperclip, X, FileIcon, ImageIcon } from 'lucide-react';

export default function CreateNote() {
    const [content, setContent] = useState('');
    const [file, setFile] = useState<{ name: string; type: string; data: string } | null>(null);
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Limit file size to ~10MB to avoid browser/network freeze
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File too large (max 10MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setFile({
                name: selectedFile.name,
                type: selectedFile.type,
                data: base64
            });
            setError('');
        };
        reader.readAsDataURL(selectedFile);
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreate = async () => {
        if (!content.trim() && !file) return;
        setLoading(true);
        setError('');

        try {
            // 1. Prepare Payload (JSON)
            const payload = JSON.stringify({
                text: content,
                file: file
            });

            // 2. Encrypt locally
            const { encryptedContent, iv, key } = encryptNote(payload);

            // 3. Send to backend
            const response = await fetch('http://localhost:4000/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encryptedContent, iv, salt: 'default' }),
            });

            if (!response.ok) {
                throw new Error('Failed to create note');
            }

            const { id } = await response.json();

            // 4. Generate Link with Key in Hash
            const shareLink = `${window.location.origin}/v/${id}#${key}`;

            // Wait for at least 2 seconds total to let animation play
            await new Promise(resolve => setTimeout(resolve, 2000));

            setLink(shareLink);
            setContent('');
            setFile(null);
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4">
            <motion.main
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-lg bg-gray-50/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
                <motion.div layout className="mb-6">
                    <h1 className="text-3xl font-bold text-center text-black">
                        Create Ghost Note
                    </h1>
                    <p className="text-gray-400 text-center mt-2">
                        Share a note that self-destructs after reading.
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!link ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            <div className="relative">
                                <textarea
                                    className="w-full h-40 p-4 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 resize-none placeholder-gray-400 border border-gray-300 transition-all font-mono text-sm"
                                    placeholder="Write your secret message here..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    disabled={loading}
                                />
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                                        title="Attach file"
                                        disabled={loading}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {file && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="p-2 bg-white rounded-md border border-gray-100">
                                        {file.type.startsWith('image/') ? (
                                            <ImageIcon className="w-5 h-5 text-blue-500" />
                                        ) : (
                                            <FileIcon className="w-5 h-5 text-orange-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.data.length * 0.75 / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        onClick={removeFile}
                                        className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}

                            <CryptedLoadingButton
                                onClick={handleCreate}
                                disabled={!content.trim() && !file}
                                className="w-full py-6 text-lg shadow-xl"

                            >
                                Create Note
                            </CryptedLoadingButton>
                            {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="space-y-8 py-4"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Note Created</h2>
                                <p className="text-gray-500 font-medium">
                                    The link below will vanish after being clicked.
                                </p>
                            </div>

                            <div className="py-2">
                                <CopyCode code={link} />
                            </div>

                            <button
                                onClick={() => setLink('')}
                                className="w-full py-3 text-gray-500 hover:text-black font-medium text-sm transition-colors border border-transparent hover:bg-gray-50 rounded-lg"
                            >
                                Create another note
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.main>
        </div>
    );
}
