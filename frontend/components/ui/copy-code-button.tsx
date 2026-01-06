import { useState, useEffect } from "react";

interface CopyCodeProps {
    code: string;
}

export function CopyCode({ code }: CopyCodeProps) {
    const [copied, setCopied] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [progress, setProgress] = useState(0);
    const duration = 2000; // Reduced duration for better UX with links

    useEffect(() => {
        if (copied) {
            // Delay showing confirmation to allow blur-out animation
            const showTimer = setTimeout(() => {
                setShowConfirmation(true);
            }, 400);

            setProgress(0);
            const startTime = Date.now();

            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const newProgress = Math.min((elapsed / duration) * 100, 100);
                setProgress(newProgress);

                if (elapsed >= duration) {
                    clearInterval(interval);
                    setShowConfirmation(false);
                    setTimeout(() => {
                        setCopied(false);
                        setProgress(0);
                    }, 400);
                }
            }, 16);

            return () => {
                clearInterval(interval);
                clearTimeout(showTimer);
            };
        }
    }, [copied]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
        } catch (err) {
            // Fallback for when Clipboard API is blocked
            const textArea = document.createElement('textarea');
            textArea.value = code;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        setCopied(true);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="relative overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-[#1f1f1e] rounded-full px-2 py-2 w-full h-14 border border-gray-200">
                {/* Progress background */}
                <div
                    className="absolute left-0 top-0 bottom-0 bg-gray-200 dark:bg-[#2a2a29]"
                    style={{
                        width: `${progress}%`,
                        opacity: copied ? 1 : 0,
                        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                />

                {/* Original content - code and button */}
                <div
                    className="absolute inset-0 flex items-center justify-between pl-6 pr-2"
                    style={{
                        opacity: copied ? 0 : 1,
                        filter: copied ? 'blur(12px)' : 'blur(0px)',
                        transform: copied ? 'scale(0.92)' : 'scale(1)',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: copied ? 'none' : 'auto',
                        zIndex: copied ? 0 : 20,
                    }}
                >
                    <span className="text-sm font-medium tracking-wide text-gray-500 dark:text-[#6b6b6a] select-all truncate mr-4">
                        {code}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="bg-white dark:bg-[#2a2a29] hover:bg-gray-50 dark:hover:bg-[#353534] text-gray-900 dark:text-[#e5e5e4] font-medium text-sm px-6 py-2 rounded-full shadow-sm dark:shadow-black/30 transition-all duration-300 hover:shadow-md dark:hover:shadow-black/50 active:scale-95 cursor-pointer select-none"
                    >
                        Copy
                    </button>
                </div>

                {/* Confirmation content - Code Copied! */}
                <div
                    className="relative flex items-center gap-3"
                    style={{
                        opacity: showConfirmation ? 1 : 0,
                        filter: showConfirmation ? 'blur(0px)' : 'blur(12px)',
                        transform: showConfirmation ? 'scale(1)' : 'scale(1.08)',
                        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                >
                    <div className="w-6 h-6 bg-gray-900 dark:bg-[#e5e5e4] rounded-full flex items-center justify-center">
                        <svg
                            className="w-3 h-3 text-white dark:text-[#141413]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                                style={{
                                    strokeDasharray: 24,
                                    strokeDashoffset: showConfirmation ? 0 : 24,
                                    transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
                                }}
                            />
                        </svg>
                    </div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-[#e5e5e4]">
                        Link Copied!
                    </span>
                </div>
            </div>
        </div>
    );
}
