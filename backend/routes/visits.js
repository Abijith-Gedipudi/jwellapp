const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all visits (entries)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT v.*, s.name as storeName, c.name as counterName, c.category as counterCat 
            FROM visits v 
            JOIN stores s ON v.store_id = s.id 
            LEFT JOIN counters c ON v.counter_id = c.id
            ORDER BY v.entry_time DESC
        `);
        // Map to expected frontend format
        const entries = rows.map(r => ({
            id: r.id,
            storeId: r.store_id,
            storeName: r.storeName,
            creName: r.cre_name,
            custName: r.customer_name,
            phone: r.customer_phone,
            custType: r.customer_phone ? 'Repeat' : 'New', // Simplified logic, could query DB for previous visits
            purpose: r.purpose,
            category: r.category,
            counterId: r.counter_id,
            counterName: r.counterName,
            counterCat: r.counterCat,
            outcome: r.outcome,
            timestamp: new Date(r.entry_time).getTime(),
            exitTimestamp: r.exit_time ? new Date(r.exit_time).getTime() : null,
            billNo: r.bill_number,
            reason: r.loss_reason,
            remarks: r.remarks
        }));
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check-in a new visit
router.post('/', async (req, res) => {
    const { storeId, creName, custName, phone, purpose, category, counterId, remarks } = req.body;
    try {
        const [result] = await db.execute(`
            INSERT INTO visits (store_id, cre_name, customer_name, customer_phone, purpose, category, counter_id, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [storeId, creName, custName || null, phone || null, purpose, category, counterId, remarks || null]);
        
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update outcome of a visit
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { outcome, reason, billNo } = req.body;
    try {
        await db.execute(`
            UPDATE visits 
            SET outcome = ?, exit_time = CURRENT_TIMESTAMP, loss_reason = ?, bill_number = ?
            WHERE id = ?
        `, [outcome, reason || null, billNo || null, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a visit
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM visits WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
