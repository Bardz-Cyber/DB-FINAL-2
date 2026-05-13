const db = require('../config/db');

exports.getStock = async (req, res) => {
    try {
        const [stock] = await db.execute(`
            SELECT s.id, p.name as product_name, p.sku, s.quantity, s.last_updated
            FROM stock s
            JOIN products p ON s.product_id = p.id
        `);
        res.json(stock);
    } catch (error) {
        console.error('Error fetching stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateStock = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || quantity === undefined) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }

        // Check if stock entry exists
        const [existing] = await db.execute('SELECT * FROM stock WHERE product_id = ?', [product_id]);

        if (existing.length > 0) {
            await db.execute('UPDATE stock SET quantity = ? WHERE product_id = ?', [quantity, product_id]);
        } else {
            await db.execute('INSERT INTO stock (product_id, quantity) VALUES (?, ?)', [product_id, quantity]);
        }

        res.json({ message: 'Stock updated successfully' });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
