"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "fr";

export interface StepCopy {
    index: string;
    label: string;
    title: string;
    body: string;
}

export interface Dictionary {
    hero: {
        title: string;
        taglineTop: string;
        taglineBottom: string;
        cta: string;
        scroll: string;
    };
    steps: StepCopy[];
    outro: {
        eyebrow: string;
        title: string;
        cta: string;
    };
    header: {
        cta: string;
        source: string;
    };
    footer: {
        tagline: string;
        howItWorks: string;
        create: string;
        source: string;
        rights: string;
    };
}

const en: Dictionary = {
    hero: {
        title: "Ghost Note",
        taglineTop: "Zero-Knowledge. Read-Once.",
        taglineBottom: "Share secrets that vanish forever.",
        cta: "Send a note",
        scroll: "Scroll to see how it works",
    },
    steps: [
        {
            index: "01",
            label: "In your browser",
            title: "Encrypted on your device",
            body: "Your note and files are sealed with AES-256 right in your browser. A fresh 256-bit key is generated locally — nothing readable ever leaves your device.",
        },
        {
            index: "02",
            label: "The key never travels",
            title: "The key lives in the link",
            body: "The decryption key is placed in the URL fragment — the part after the # that your browser never sends to any server. Only whoever holds the link can unlock the note.",
        },
        {
            index: "03",
            label: "On the server",
            title: "We only store ciphertext",
            body: "Our server receives and stores nothing but the encrypted blob and its IV. There is no key, no plaintext, no logs — we literally cannot read your note.",
        },
        {
            index: "04",
            label: "Read once",
            title: "Opened once, gone forever",
            body: "Opening the link decrypts the note locally and atomically deletes it from the database. Unread notes self-destruct after 24 hours. No copies, no recovery.",
        },
    ],
    outro: {
        eyebrow: "Ready when you are",
        title: "Send something that disappears.",
        cta: "Send a note",
    },
    header: {
        cta: "Send a note",
        source: "Source",
    },
    footer: {
        tagline: "Zero-knowledge notes that vanish after a single read.",
        howItWorks: "How it works",
        create: "Create a note",
        source: "Source code",
        rights: "No logs · No tracking · Open source",
    },
};

const fr: Dictionary = {
    hero: {
        title: "Ghost Note",
        taglineTop: "Zéro-connaissance. Lecture unique.",
        taglineBottom: "Partagez des secrets qui disparaissent à jamais.",
        cta: "Envoyer une note",
        scroll: "Faites défiler pour comprendre",
    },
    steps: [
        {
            index: "01",
            label: "Dans votre navigateur",
            title: "Chiffré sur votre appareil",
            body: "Votre note et vos fichiers sont scellés en AES-256 directement dans votre navigateur. Une clé 256 bits est générée localement — rien de lisible ne quitte jamais votre appareil.",
        },
        {
            index: "02",
            label: "La clé ne voyage pas",
            title: "La clé vit dans le lien",
            body: "La clé de déchiffrement est placée dans le fragment de l'URL — la partie après le # que votre navigateur n'envoie jamais au serveur. Seul le détenteur du lien peut ouvrir la note.",
        },
        {
            index: "03",
            label: "Sur le serveur",
            title: "Nous ne stockons que du chiffré",
            body: "Notre serveur ne reçoit et ne conserve que le bloc chiffré et son IV. Aucune clé, aucun texte en clair, aucun journal — nous ne pouvons littéralement pas lire votre note.",
        },
        {
            index: "04",
            label: "Lecture unique",
            title: "Lue une fois, perdue à jamais",
            body: "Ouvrir le lien déchiffre la note en local et la supprime atomiquement de la base. Les notes non lues s'autodétruisent après 24 heures. Aucune copie, aucune récupération.",
        },
    ],
    outro: {
        eyebrow: "Quand vous voulez",
        title: "Envoyez quelque chose qui disparaît.",
        cta: "Envoyer une note",
    },
    header: {
        cta: "Envoyer une note",
        source: "Source",
    },
    footer: {
        tagline: "Des notes zéro-connaissance qui disparaissent après une seule lecture.",
        howItWorks: "Comment ça marche",
        create: "Créer une note",
        source: "Code source",
        rights: "Aucun journal · Aucun tracking · Open source",
    },
};

const dictionaries: Record<Lang, Dictionary> = { en, fr };

interface LanguageContextValue {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "ghostnote-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>("en");

    useEffect(() => {
        const stored =
            typeof window !== "undefined"
                ? (window.localStorage.getItem(STORAGE_KEY) as Lang | null)
                : null;
        // Read the persisted choice after hydration to avoid an SSR mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (stored === "en" || stored === "fr") setLangState(stored);
    }, []);

    const setLang = (next: Lang) => {
        setLangState(next);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, next);
            document.documentElement.lang = next;
        }
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang(): LanguageContextValue {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
    return ctx;
}
