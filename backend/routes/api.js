const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// Create a new note
router.post('/notes', noteController.createNote);

// Check if note exists (optional, for UI pre-check) or retrieve & delete
// The requirement is "Read-Once", so GET triggers delete.
router.get('/notes/:id', noteController.getNote);

module.exports = router;
