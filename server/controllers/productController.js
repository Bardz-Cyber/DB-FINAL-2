const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.execute(`
            SELECT p.id, p.name, p.sku, p.description, p.image, c.name as category_name
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
        const { name, sku, category_id, description, image } = req.body;
        if (!name || !sku) {
            return res.status(400).json({ error: 'Name and SKU are required' });
        }
        await db.execute(
            'INSERT INTO products (name, sku, category_id, description, image) VALUES (?, ?, ?, ?, ?)',
            [name, sku, category_id || null, description || null, image || null]
        );
        res.status(201).json({ message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sku, category_id, description, image } = req.body;

        if (!name || !sku) {
            return res.status(400).json({ error: 'Name and SKU are required' });
        }

        // If an image was passed, update it. Otherwise leave the existing image.
        if (image !== undefined) {
             await db.execute(
                'UPDATE products SET name = ?, sku = ?, category_id = ?, description = ?, image = ? WHERE id = ?',
                [name, sku, category_id || null, description || null, image, id]
            );
        } else {
             await db.execute(
                'UPDATE products SET name = ?, sku = ?, category_id = ?, description = ? WHERE id = ?',
                [name, sku, category_id || null, description || null, id]
            );
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
