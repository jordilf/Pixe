const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Verificar si el usuario ya existe
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }

        // Crear nuevo usuario
        const userId = await User.create({ username, password });
        res.status(201).json({ message: 'Usuario registrado exitosamente', userId });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Buscar usuario
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'tu_secreto_seguro',
            { expiresIn: '1h' }
        );

        res.json({ token, userId: user.id, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

module.exports = router;