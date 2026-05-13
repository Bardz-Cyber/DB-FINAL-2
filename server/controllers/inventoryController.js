const db = require('../config/db');

// Get all items
exports.getItems = async (req, res) => {
    try {
        const [items] = await db.execute('SELECT * FROM items ORDER BY created_at DESC');
        res.json(items);
    } catch (error) {
        console.error('Error in getItems:', error);
        res.status(500).json({ error: 'Server error fetching items' });
    }
};

// Create a new item
exports.createItem = async (req, res) => {
    try {
        const { name, sku, category, quantity } = req.body;

        if (!name || !sku || !category || quantity === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if SKU exists
        const [existing] = await db.execute('SELECT * FROM items WHERE sku = ?', [sku]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'SKU already exists' });
        }

        const [result] = await db.execute(
            'INSERT INTO items (name, sku, category, quantity) VALUES (?, ?, ?, ?)',
            [name, sku, category, quantity]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            sku,
            category,
            quantity
        });
    } catch (error) {
        console.error('Error in createItem:', error);
        res.status(500).json({ error: 'Server error creating item' });
    }
};

// Update an item
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sku, category, quantity } = req.body;

        if (!name || !sku || !category || quantity === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if SKU exists on another item
        const [existing] = await db.execute('SELECT * FROM items WHERE sku = ? AND id != ?', [sku, id]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'SKU already exists for another item' });
        }

        await db.execute(
            'UPDATE items SET name = ?, sku = ?, category = ?, quantity = ? WHERE id = ?',
            [name, sku, category, quantity, id]
        );

        res.json({ message: 'Item updated successfully' });
    } catch (error) {
        console.error('Error in updateItem:', error);
        res.status(500).json({ error: 'Server error updating item' });
    }
};

// Delete an item
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM items WHERE id = ?', [id]);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error in deleteItem:', error);
        res.status(500).json({ error: 'Server error deleting item' });
    }
};
