const db = require('../config/db');

exports.createOrder = async (req, res) => {
    const { items } = req.body; // Don't trust total_amount from client
    const user_id = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let calculated_total_amount = 0;
        const verifiedItems = [];

        // Fetch actual prices from the database
        for (const item of items) {
            const qty = parseInt(item.quantity, 10);
            if (isNaN(qty) || qty <= 0) {
                 await connection.rollback();
                 return res.status(400).json({ error: `Quantity must be a positive number for product ID ${item.product_id}` });
            }

            const [productRows] = await connection.execute('SELECT price, quantity FROM products WHERE id = ?', [item.product_id]);

            if (productRows.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: `Product with ID ${item.product_id} not found` });
            }

            const product = productRows[0];

            if (qty > product.quantity) {
                 await connection.rollback();
                 return res.status(400).json({ error: `Not enough stock for product ID ${item.product_id}` });
            }

            const price = parseFloat(product.price);
            calculated_total_amount += (price * qty);

            verifiedItems.push({
                product_id: item.product_id,
                quantity: qty,
                price: price
            });
        }

        // 1. Create the order
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
            [user_id, calculated_total_amount, 'Pending Payment']
        );
        const orderId = orderResult.insertId;

        // 2. Create order items using verified server-side prices
        for (const item of verifiedItems) {
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};

exports.getStudentOrders = async (req, res) => {
    const user_id = req.user.id;
    try {
        const [orders] = await db.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id]);

        // Fetch items for each order
        for (const order of orders) {
             const [items] = await db.execute(`
                 SELECT oi.*, p.name as product_name, p.image
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?
             `, [order.id]);
             order.items = items;
        }

        res.json(orders);
    } catch (error) {
        console.error('Error fetching student orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const [orders] = await db.execute(`
            SELECT o.*, u.first_name, u.last_name, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);

        // Fetch items for each order
        for (const order of orders) {
             const [items] = await db.execute(`
                 SELECT oi.*, p.name as product_name
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ?
             `, [order.id]);
             order.items = items;
        }

        res.json(orders);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Pending Payment', 'Approved', 'Cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Get current order status
        const [orderRows] = await connection.execute('SELECT status FROM orders WHERE id = ?', [id]);
        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        const currentStatus = orderRows[0].status;

        // If approving a previously pending order, deduct stock and record transaction
        if (currentStatus === 'Pending Payment' && status === 'Approved') {
            const [items] = await connection.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);

            // First check if all items have sufficient stock
            for (const item of items) {
                const [productRows] = await connection.execute('SELECT quantity FROM products WHERE id = ?', [item.product_id]);
                if (productRows.length === 0 || productRows[0].quantity < item.quantity) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Not enough stock to approve order for product ID ${item.product_id}` });
                }
            }

            for (const item of items) {
                // Deduct stock
                await connection.execute('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.product_id]);

                // Record transaction
                await connection.execute(
                    'INSERT INTO transactions (product_id, type, quantity) VALUES (?, ?, ?)',
                    [item.product_id, 'OUT', item.quantity]
                );
            }
        }

        // If cancelling an already approved order (refund stock)
        if (currentStatus === 'Approved' && status === 'Cancelled') {
             const [items] = await connection.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
             for (const item of items) {
                // Refund stock
                await connection.execute('UPDATE products SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.product_id]);

                // Record transaction
                await connection.execute(
                    'INSERT INTO transactions (product_id, type, quantity) VALUES (?, ?, ?)',
                    [item.product_id, 'IN', item.quantity]
                );
            }
        }

        // Update status
        await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

        await connection.commit();
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};
