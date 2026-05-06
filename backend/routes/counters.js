const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all counters
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, store_id, name, category, products, is_active FROM counters');
        const countersMap = {};
        rows.forEach(r => {
            if (!countersMap[r.store_id]) countersMap[r.store_id] = [];
            countersMap[r.store_id].push({ ...r, active: !!r.is_active });
        });
        res.json(countersMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a counter to a store
router.post('/:storeId', async (req, res) => {
    const { storeId } = req.params;
    const { name, category, products } = req.body;
    const id = 'c' + Date.now();
    try {
        await db.execute('INSERT INTO counters (id, store_id, name, category, products, is_active) VALUES (?, ?, ?, ?, ?, ?)', 
            [id, storeId, name, category, products || '', true]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle counter active status
router.put('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('UPDATE counters SET is_active = NOT is_active WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete counter
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM counters WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
