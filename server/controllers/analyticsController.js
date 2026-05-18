const db = require('../config/db');

exports.getAnalytics = async (req, res) => {
    try {
        // Total Sales (Sum of Approved Orders)
        const [totalSalesRow] = await db.execute("SELECT SUM(total_amount) as total FROM orders WHERE status = 'Approved'");
        const totalSales = totalSalesRow[0].total || 0;

        // Pending Orders Count
        const [pendingOrdersRow] = await db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending Payment'");
        const pendingOrders = pendingOrdersRow[0].count || 0;

        // Total Products Count
        const [totalProductsRow] = await db.execute("SELECT COUNT(*) as count FROM products");
        const totalProducts = totalProductsRow[0].count || 0;

        // Sales Breakdown by Category (Last 7 Days)
        const [salesByCategory] = await db.execute(`
            SELECT p.category, SUM(oi.price_at_purchase * oi.quantity) as total
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.status = 'Approved' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY p.category
            ORDER BY total DESC
        `);

        // Recent Orders
        const [recentOrders] = await db.execute(`
            SELECT o.id, o.total_amount, o.status, o.created_at, u.first_name, u.last_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        res.json({
            metrics: {
                totalSales,
                pendingOrders,
                totalProducts
            },
            charts: {
                salesByCategory
            },
            recentOrders
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
