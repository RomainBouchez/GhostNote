import { ImageResponse } from "next/og";

export const alt = "Ghost Note — Zero-knowledge notes that vanish";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    position: "relative",
                }}
            >
                {/* Thin frame */}
                <div
                    style={{
                        position: "absolute",
                        inset: 32,
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 24,
                        display: "flex",
                    }}
                />

                {/* Ghost mark (drawn — no external font) */}
                <div
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: 28,
                        background: "#000000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 14,
                    }}
                >
                    <div style={{ width: 14, height: 14, borderRadius: 999, background: "#ffffff", display: "flex" }} />
                    <div style={{ width: 14, height: 14, borderRadius: 999, background: "#ffffff", display: "flex" }} />
                </div>

                <div
                    style={{
                        marginTop: 40,
                        fontSize: 92,
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                        color: "#000000",
                    }}
                >
                    Ghost Note
                </div>

                <div
                    style={{
                        marginTop: 20,
                        fontSize: 32,
                        color: "#8a8a8a",
                    }}
                >
                    Zero-Knowledge · Read-Once · Vanishes forever
                </div>

                <div
                    style={{
                        position: "absolute",
                        bottom: 64,
                        fontSize: 22,
                        letterSpacing: "0.24em",
                        color: "#bdbdbd",
                        textTransform: "uppercase",
                    }}
                >
                    Encrypted in your browser · AES-256
                </div>
            </div>
        ),
        { ...size },
    );
}
