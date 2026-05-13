const db = require('../config/db');

exports.getAllSuppliers = async (req, res) => {
    try {
        const [suppliers] = await db.execute('SELECT * FROM suppliers');
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const { name, contact_email, contact_phone } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        await db.execute(
            'INSERT INTO suppliers (name, contact_email, contact_phone) VALUES (?, ?, ?)',
            [name, contact_email || null, contact_phone || null]
        );
        res.status(201).json({ message: 'Supplier created successfully' });
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
