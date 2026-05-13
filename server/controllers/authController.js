const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
    try {
        const { student_id, first_name, last_name, email, password } = req.body;

        if (!student_id || !first_name || !last_name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if student_id or email already exists
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE student_id = ? OR email = ?',
            [student_id, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Student ID or Email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        await db.execute(
            'INSERT INTO users (student_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
            [student_id, first_name, last_name, email, password_hash]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

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
            { id: user.id, email: user.email, student_id: user.student_id },
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
                student_id: user.student_id
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
