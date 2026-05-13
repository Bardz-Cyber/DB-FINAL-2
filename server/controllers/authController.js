const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { admin_id, password } = req.body;

        if (!admin_id || !password) {
            return res.status(400).json({ error: 'Admin ID and password are required' });
        }

        // Find user by admin_id
        const [users] = await db.execute('SELECT * FROM users WHERE admin_id = ?', [admin_id]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid admin ID or password' });
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid admin ID or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, admin_id: user.admin_id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                admin_id: user.admin_id
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
