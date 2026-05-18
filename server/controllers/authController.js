const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.register = async (req, res) => {
    try {
        const { student_id, first_name, last_name, email, password, confirm_password } = req.body;

        if (!student_id || !first_name || !last_name || !email || !password || !confirm_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check if user already exists (by email or student_id)
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ? OR student_id = ?', [email, student_id]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User with this email or Student ID already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert new student user
        const query = `
            INSERT INTO users (student_id, first_name, last_name, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?, 'student')
        `;
        await db.execute(query, [student_id, first_name, last_name, email, password_hash]);

        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
