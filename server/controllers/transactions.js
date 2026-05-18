const db = require('../config/db');

// Get all transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const query = `
            SELECT t.id, t.product_id, t.type, t.quantity, t.created_at, p.name as product_name
            FROM transactions t
            JOIN products p ON t.product_id = p.id
            ORDER BY t.created_at DESC
        `;
        const [transactions] = await db.query(query);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
    const { product_id, type, quantity } = req.body;

    if (!product_id || !type || !quantity) {
        return res.status(400).json({ message: 'Product ID, type, and quantity are required' });
    }

    if (type !== 'IN' && type !== 'OUT') {
        return res.status(400).json({ message: 'Type must be IN or OUT' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Create the transaction record
        const insertQuery = 'INSERT INTO transactions (product_id, type, quantity) VALUES (?, ?, ?)';
        const [result] = await connection.query(insertQuery, [product_id, type, qty]);

        // 2. Update the product's quantity
        const modifier = type === 'IN' ? '+' : '-';
        // Note: For 'OUT' transactions, we ideally want to ensure there is enough stock.
        // We will just do a blind update here, but check if we go below 0 later if needed.
        const updateQuery = `UPDATE products SET quantity = quantity ${modifier} ? WHERE id = ?`;
        await connection.query(updateQuery, [qty, product_id]);

        await connection.commit();

        res.status(201).json({
            id: result.insertId,
            product_id,
            type,
            quantity: qty,
            message: 'Transaction created successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Error creating transaction' });
    } finally {
        connection.release();
    }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { product_id, type, quantity } = req.body;

    if (!product_id || !type || !quantity) {
        return res.status(400).json({ message: 'Product ID, type, and quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get the original transaction
        const [oldTransRows] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (oldTransRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const oldTrans = oldTransRows[0];

        // 2. Reverse the effect of the old transaction on the product quantity
        const reverseModifier = oldTrans.type === 'IN' ? '-' : '+';
        await connection.query(
            `UPDATE products SET quantity = quantity ${reverseModifier} ? WHERE id = ?`,
            [oldTrans.quantity, oldTrans.product_id]
        );

        // 3. Update the transaction record
        await connection.query(
            'UPDATE transactions SET product_id = ?, type = ?, quantity = ? WHERE id = ?',
            [product_id, type, qty, id]
        );

        // 4. Apply the new effect on the product quantity
        const newModifier = type === 'IN' ? '+' : '-';
        await connection.query(
            `UPDATE products SET quantity = quantity ${newModifier} ? WHERE id = ?`,
            [qty, product_id]
        );

        await connection.commit();
        res.json({ message: 'Transaction updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Error updating transaction' });
    } finally {
        connection.release();
    }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get the transaction
        const [oldTransRows] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (oldTransRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const oldTrans = oldTransRows[0];

        // 2. Reverse the effect of the transaction on the product quantity
        const reverseModifier = oldTrans.type === 'IN' ? '-' : '+';
        await connection.query(
            `UPDATE products SET quantity = quantity ${reverseModifier} ? WHERE id = ?`,
            [oldTrans.quantity, oldTrans.product_id]
        );

        // 3. Delete the transaction record
        await connection.query('DELETE FROM transactions WHERE id = ?', [id]);

        await connection.commit();
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Error deleting transaction' });
    } finally {
        connection.release();
    }
};
