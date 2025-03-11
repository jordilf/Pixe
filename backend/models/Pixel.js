const pool = require('../server').pool;
const User = require('./User');

class Pixel {
    static async create({ x, y, color, userId }) {
        const [result] = await pool.execute(
            'INSERT INTO pixels (x, y, color, user_id) VALUES (?, ?, ?, ?)',
            [x, y, color, userId]
        );
        
        // Actualizar el último píxel colocado por el usuario
        await User.updateLastPixel(userId);
        
        return result.insertId;
    }

    static async getRecent(limit = 10) {
        const [rows] = await pool.execute(
            `SELECT p.*, u.username 
             FROM pixels p
             JOIN users u ON p.user_id = u.id
             ORDER BY p.created_at DESC 
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async getLastByUser(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM pixels WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        return rows[0];
    }

    static async getPixelAt(x, y) {
        const [rows] = await pool.execute(
            'SELECT * FROM pixels WHERE x = ? AND y = ? ORDER BY created_at DESC LIMIT 1',
            [x, y]
        );
        return rows[0];
    }

    static async getCanvasState() {
        const [rows] = await pool.execute(
            `SELECT x, y, color 
             FROM pixels 
             WHERE created_at = (
                 SELECT MAX(created_at) 
                 FROM pixels p2 
                 WHERE pixels.x = p2.x AND pixels.y = p2.y
             )`
        );
        return rows;
    }
}

module.exports = Pixel;