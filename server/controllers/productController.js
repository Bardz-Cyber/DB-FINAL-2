const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.execute(`
            SELECT id, name, sku, description, quantity, image, category
            FROM products
        `);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, sku, category, description, quantity } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        if (!name || !sku) {
            return res.status(400).json({ error: 'Name and SKU are required' });
        }
        await db.execute(
            'INSERT INTO products (name, sku, category, description, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
            [name, sku, category || null, description || null, quantity || 0, image]
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
        const { name, sku, category, description, quantity } = req.body;

        if (!name || !sku) {
            return res.status(400).json({ error: 'Name and SKU are required' });
        }

        // If a new image was uploaded, update it. Otherwise leave the existing image.
        if (req.file) {
             const image = `/uploads/${req.file.filename}`;
             await db.execute(
                'UPDATE products SET name = ?, sku = ?, category = ?, description = ?, quantity = ?, image = ? WHERE id = ?',
                [name, sku, category || null, description || null, quantity || 0, image, id]
            );
        } else {
             await db.execute(
                'UPDATE products SET name = ?, sku = ?, category = ?, description = ?, quantity = ? WHERE id = ?',
                [name, sku, category || null, description || null, quantity || 0, id]
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
