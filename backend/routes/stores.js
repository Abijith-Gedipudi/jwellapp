const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all stores
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, pin, is_active FROM stores');
        // Convert TinyInt (0/1) to boolean for frontend compatibility
        const stores = rows.map(r => ({ ...r, is_active: !!r.is_active, active: !!r.is_active }));
        res.json(stores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new store
router.post('/', async (req, res) => {
    const { name, pin } = req.body;
    const id = 's' + Date.now();
    try {
        await db.execute('INSERT INTO stores (id, name, pin, is_active) VALUES (?, ?, ?, ?)', [id, name, pin, true]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle store active status
router.put('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('UPDATE stores SET is_active = NOT is_active WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update store PIN
router.put('/:id/pin', async (req, res) => {
    const { id } = req.params;
    const { pin } = req.body;
    try {
        await db.execute('UPDATE stores SET pin = ? WHERE id = ?', [pin, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
