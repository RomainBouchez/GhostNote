"use client"

import { Download, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DownloadButtonProps {
    downloadStatus: "idle" | "downloading" | "downloaded" | "complete"
    progress: number
    onClick: () => void
    className?: string
}

export default function DownloadButton({ downloadStatus, progress, onClick, className }: DownloadButtonProps) {
    return (
        <Button
            onClick={onClick}
            className={cn(
                "rounded-xl w-40 relative overflow-hidden select-none transition-all duration-300",
                downloadStatus === "downloading" && "bg-primary/50 hover:bg-primary/50 cursor-not-allowed",
                downloadStatus !== "idle" && "pointer-events-none",
                className,
            )}
        >
            {downloadStatus === "idle" && (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </>
            )}
            {downloadStatus === "downloading" && (
                <div className="z-[5] flex items-center justify-center font-medium">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {progress}%
                </div>
            )}
            {downloadStatus === "downloaded" && (
                <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span className="font-medium">Downloaded</span>
                </>
            )}
            {downloadStatus === "complete" && <span className="text-primary-foreground font-medium">Download</span>}
            {downloadStatus === "downloading" && (
                <div
                    className="absolute bottom-0 z-[3] h-full left-0 bg-primary/20 inset-0 transition-all duration-200 ease-in-out"
                    style={{ width: `${progress}%` }}
                />
            )}
        </Button>
    )
}
