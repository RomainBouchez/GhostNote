# Ghost Note 👻

**A Zero-Knowledge, Read-Once Ephemeral Note & File Sharing Application.**

Ghost Note allows you to share sensitive information and files securely. The data is encrypted in your browser before it ever reaches our servers. Once the recipient reads the note, it is permanently deleted from the database.

## 🌟 Features

*   **Zero-Knowledge Encryption**: Logic is handled entirely client-side. The server never sees the key.
*   **Self-Destructing Notes**: Messages are deleted from the database immediately upon being retrieved ("Read-Once").
*   **File Sharing**: Securely share images and documents (up to 10MB). Files are encrypted locally just like text.
*   **Encrypted Downloads**: Files are decrypted in chunks locally and assembled for download without the server ever seeing the content.
*   **Expiration**: Unread notes are automatically purged after 24 hours.
*   **Modern UI**: Built with a premium, animated interface using Framer Motion and Tailwind CSS v4.

## 🔐 How it Works (Zero-Knowledge Architecture)

The security guarantee relies on **Client-Side Encryption** and a **"Read-Once"** policy.

1.  **Encryption (Sender)**:
    *   **Text & Files**: Files are converted to Base64. Both text and file data are combined into a JSON payload.
    *   **Local Encryption**: The browser generates a random key and encrypts the payload using **AES-256** (via `CryptoJS`).
    *   **Transmission**: Only the *encrypted* blob (ciphertext) is sent to the server. The key **never** leaves your device.

2.  **Storage (Server)**:
    *   The server (Node.js + NeonDB) receives and stores the encrypted data.
    *   It returns a unique Note ID.
    *   **The Link**: The generated link follows this format: `https://ghostnote.io/v/<ID>#<KEY>`.
    *   The `<KEY>` is in the URL hash fragment, which is **never sent to the server** during HTTP requests.

3.  **Decryption (Recipient)**:
    *   **Retrieval**: When the recipient opens the link, the browser extracts the `<KEY>` from the URL hash and requests the data using the `<ID>`.
    *   **Destruction**: The server returns the encrypted data and **IMMEDIATELY DELETES** it from the database (Read-Once).
    *   **Local Decryption**: The browser decrypts the message locally using the key from the URL hash.

## 🛠 Tech Stack

*   **Frontend**: Next.js 16 (React 19), Tailwind CSS v4, Framer Motion, Radix UI, Lucide React.
*   **Backend**: Node.js, Express, Helmet, CORS.
*   **Database**: NeonDB (Serverless PostgreSQL).
*   **Encryption**: CryptoJS (AES-256).

## 🚀 Getting Started

### Prerequisites
*   Node.js installed.
*   A PostgreSQL database (or NeonDB account).

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd ghost-note
    ```

2.  **Setup Backend**:
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Edit .env with your DATABASE_URL
    npm run api:init-db  # Creates the notes table in your DB
    npm run dev
    ```

3.  **Setup Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access the App**:
    Open `http://localhost:3000` in your browser.

## 🛡 Security Notes

*   **Trust**: Since the server code is open source, you can verify that we (the server) cannot decrypt your data without the key.
*   **Loss Risk**: If you lose the link (or the key fraction), the note is lost forever. There is no recovery mechanism.
*   **Browser Security**: Security depends on the user's browser environment being uncompromised.
