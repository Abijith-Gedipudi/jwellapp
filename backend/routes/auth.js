const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'manepally-super-secret-key-2025';

// Admin Login
router.post('/admin/login', async (req, res) => {
    const { password } = req.body;
    try {
        const [rows] = await db.execute("SELECT setting_value FROM admin_settings WHERE setting_key = 'adminPass'");
        if (rows.length === 0) return res.status(500).json({ error: 'Admin config not found' });
        
        const adminPass = rows[0].setting_value;
        if (password === adminPass) {
            const token = jwt.sign({ role: 'admin', id: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ token, user: { role: 'admin', name: 'Admin', id: 'admin' } });
        } else {
            res.status(401).json({ error: 'Invalid admin password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRE Login (using store PIN)
router.post('/cre/login', async (req, res) => {
    const { storeId, pin } = req.body;
    try {
        const [rows] = await db.execute('SELECT id, name, pin, is_active FROM stores WHERE id = ?', [storeId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Store not found' });
        
        const store = rows[0];
        if (!store.is_active) return res.status(403).json({ error: 'Store is disabled' });

        if (pin === store.pin) {
            const token = jwt.sign({ role: 'cre', storeId: store.id }, JWT_SECRET, { expiresIn: '12h' });
            res.json({ 
                token, 
                user: { role: 'cre', name: 'CRE', id: `cre_${store.id}`, storeId: store.id, storeName: store.name } 
            });
        } else {
            res.status(401).json({ error: 'Invalid PIN' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin change password
router.post('/admin/password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const [rows] = await db.execute("SELECT setting_value FROM admin_settings WHERE setting_key = 'adminPass'");
        const adminPass = rows[0]?.setting_value;
        if (oldPassword !== adminPass) return res.status(401).json({ error: 'Current password incorrect' });
        
        await db.execute("UPDATE admin_settings SET setting_value = ? WHERE setting_key = 'adminPass'", [newPassword]);
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
