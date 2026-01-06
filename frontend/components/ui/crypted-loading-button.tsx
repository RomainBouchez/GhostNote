import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CryptedLoadingButtonProps {
    onClick?: () => void | Promise<void>;
    children?: React.ReactNode;
    className?: string;
    loadingDuration?: number; // Kept for interface compatibility but logic uses dynamic wait
    disabled?: boolean;
}

export const CryptedLoadingButton: React.FC<CryptedLoadingButtonProps> = ({
    onClick = async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
    },
    children = 'Submit',
    className = '',
    disabled = false,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [displayText, setDisplayText] = useState('');

    const cryptChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const targetText = 'ENCRYPTING...';

    const generateRandomChar = () => {
        return cryptChars[Math.floor(Math.random() * cryptChars.length)];
    };

    const animateCryptedText = () => {
        let frame = 0;
        const maxFrames = 30;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const interval = setInterval(() => {
            if (frame < maxFrames) {
                const progress = frame / maxFrames;
                const revealedChars = Math.floor(progress * targetText.length);

                let text = '';
                for (let i = 0; i < targetText.length; i++) {
                    if (i < revealedChars) {
                        text += targetText[i];
                    } else {
                        text += generateRandomChar();
                    }
                }
                setDisplayText(text);
                frame++;
            } else {
                setDisplayText(targetText);
                clearInterval(interval);
            }
        }, 50);

        return interval;
    };

    const handleClick = async () => {
        if (isLoading || disabled) return;

        setIsLoading(true);
        const interval = animateCryptedText();

        try {
            const minDurationPromise = new Promise(resolve => setTimeout(resolve, 1000));
            if (onClick) {
                await Promise.all([onClick(), minDurationPromise]);
            } else {
                await minDurationPromise;
            }
        } catch (error) {
            console.error('Error during button action:', error);
        } finally {
            clearInterval(interval);
            // Optional: keep saying "ENCRYPTED" or reset? 
            // User script resets:
            setTimeout(() => {
                setIsLoading(false);
                setDisplayText('');
            }, 500);
        }
    };

    return (
        <Button
            onClick={handleClick}
            disabled={isLoading || disabled}
            className={`relative min-w-[180px] transition-all duration-300 ${isLoading ? 'bg-primary/80' : ''
                } ${className}`}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="tracking-wider font-bold text-sm animate-pulse font-mono">
                        {displayText}
                    </span>
                </span>
            ) : (
                children
            )}
        </Button>
    );
};
