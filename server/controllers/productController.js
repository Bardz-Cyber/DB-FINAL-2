const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.execute(`
            SELECT p.id, p.name, p.sku, p.description, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        `);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, sku, category_id, description } = req.body;
        if (!name || !sku) {
            return res.status(400).json({ error: 'Name and SKU are required' });
        }
        await db.execute(
            'INSERT INTO products (name, sku, category_id, description) VALUES (?, ?, ?, ?)',
            [name, sku, category_id || null, description || null]
        );
        res.status(201).json({ message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
