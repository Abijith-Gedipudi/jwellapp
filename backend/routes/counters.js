const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

function getUser(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'manepally-super-secret-key-2025');
    } catch {
        return null;
    }
}

function requireAdmin(req, res) {
    const user = getUser(req);
    if (user?.role === 'admin') return true;
    res.status(403).json({ error: 'Admin access required' });
    return false;
}

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
    if (!requireAdmin(req, res)) return;

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
    if (!requireAdmin(req, res)) return;

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
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    try {
        await db.execute('DELETE FROM counters WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
