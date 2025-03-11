const pool = require('../server').pool;
const bcrypt = require('bcrypt');

class User {
    static async create({ username, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        return result.insertId;
    }

    static async findByUsername(username) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, username, last_pixel_placed, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async updateLastPixel(userId) {
        await pool.execute(
            'UPDATE users SET last_pixel_placed = NOW() WHERE id = ?',
            [userId]
        );
    }
}

module.exports = User;