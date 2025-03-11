const express = require('express');
const Pixel = require('../models/Pixel');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Colocar un píxel
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { x, y, color } = req.body;
        const userId = req.user.userId;

        // Verificar si el usuario puede colocar un píxel
        const lastPixel = await Pixel.getLastByUser(userId);
        if (lastPixel && (Date.now() - new Date(lastPixel.created_at)) < 60000) {
            return res.status(429).json({ error: 'Debes esperar 1 minuto entre píxeles' });
        }

        // Crear nuevo píxel
        const pixelId = await Pixel.create({ x, y, color, userId });
        res.status(201).json({ message: 'Píxel colocado exitosamente', pixelId });
    } catch (error) {
        res.status(500).json({ error: 'Error al colocar píxel' });
    }
});

// Obtener píxeles recientes
router.get('/recent', async (req, res) => {
    try {
        const pixels = await Pixel.getRecent();
        res.json(pixels);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener píxeles' });
    }
});

module.exports = router;