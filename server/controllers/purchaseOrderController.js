const db = require('../config/db');

exports.getAllPurchaseOrders = async (req, res) => {
    try {
        const [orders] = await db.execute(`
            SELECT po.id, po.status, po.created_at, s.name as supplier_name
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
        `);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createPurchaseOrder = async (req, res) => {
    try {
        const { supplier_id, status } = req.body;
        if (!supplier_id) {
            return res.status(400).json({ error: 'Supplier ID is required' });
        }
        await db.execute(
            'INSERT INTO purchase_orders (supplier_id, status) VALUES (?, ?)',
            [supplier_id, status || 'Pending']
        );
        res.status(201).json({ message: 'Purchase order created successfully' });
    } catch (error) {
        console.error('Error creating purchase order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
