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

// Get all stores
router.get('/', async (req, res) => {
    try {
        const isAdmin = getUser(req)?.role === 'admin';
        const fields = isAdmin ? 'id, name, pin, is_active' : 'id, name, is_active';
        const [rows] = await db.execute(`SELECT ${fields} FROM stores`);
        // Convert TinyInt (0/1) to boolean for frontend compatibility
        const stores = rows.map(r => ({ ...r, is_active: !!r.is_active, active: !!r.is_active }));
        res.json(stores);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new store
router.post('/', async (req, res) => {
    if (!requireAdmin(req, res)) return;

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
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    try {
        await db.execute('UPDATE stores SET is_active = NOT is_active WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update store PIN
router.put('/:id', async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    const { pin } = req.body;
    try {
        await db.execute('UPDATE stores SET pin = ? WHERE id = ?', [pin, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/pin', async (req, res) => {
    if (!requireAdmin(req, res)) return;

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
