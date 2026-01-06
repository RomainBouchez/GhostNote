const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.createNote = async (req, res) => {
    try {
        const { encryptedContent, iv, salt } = req.body;

        if (!encryptedContent) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Default expiration: 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const id = uuidv4();

        const query = `
      INSERT INTO notes (id, content, iv, salt, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

        const values = [id, encryptedContent, iv, salt, expiresAt];
        const result = await db.query(query, values);

        res.status(201).json({
            id: result.rows[0].id,
            expiresAt
        });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getNote = async (req, res) => {
    try {
        const { id } = req.params;

        // Transaction to ensure read-once (Simulated with DELETE RETURNING)
        // We could use a transaction block, but DELETE RETURNING is atomic enough for this row.
        const query = `
      DELETE FROM notes
      WHERE id = $1 AND expires_at > NOW()
      RETURNING content, iv, salt, created_at
    `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            // It might be expired or already read or never existed
            return res.status(404).json({ error: 'Note not found or already destroyed' });
        }

        const note = result.rows[0];
        res.json({
            content: note.content,
            iv: note.iv,
            salt: note.salt,
            createdAt: note.created_at
        });
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
