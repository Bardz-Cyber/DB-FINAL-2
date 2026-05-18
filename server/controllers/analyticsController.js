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

        // Sales Over Time (Last 7 Days)
        const [salesOverTime] = await db.execute(`
            SELECT DATE(created_at) as date, SUM(total_amount) as total
            FROM orders
            WHERE status = 'Approved' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
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
                salesOverTime
            },
            recentOrders
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
