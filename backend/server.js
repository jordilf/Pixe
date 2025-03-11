const express = require('express');
const mysql = require('mysql2/promise');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Pixel = require('./models/Pixel');
const User = require('./models/User');
const cluster = require('cluster');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
    server,
    clientTracking: true,
    perMessageDeflate: {
        zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        threshold: 1024,
        concurrencyLimit: 10
    }
});

// Configuración de la conexión MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'tu_contraseña', // Cambia esto por tu contraseña de MySQL
    database: 'pixe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificar conexión a MySQL
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado a MySQL');
        connection.release();
    } catch (err) {
        console.error('Error conectando a MySQL:', err);
    }
})();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Acceso no autorizado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_seguro');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pixels', require('./routes/pixels'));

// WebSocket
wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'PLACE_PIXEL':
                    const { x, y, color, token } = data.payload;
                    
                    // Verificar token
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_seguro');
                    const userId = decoded.userId;

                    // Verificar tiempo de espera usando last_pixel_placed
                    const [user] = await pool.execute(
                        'SELECT last_pixel_placed FROM users WHERE id = ?',
                        [userId]
                    );

                    if (user[0].last_pixel_placed && 
                        (Date.now() - new Date(user[0].last_pixel_placed)) < 60000) {
                        ws.send(JSON.stringify({
                            type: 'ERROR',
                            payload: { message: 'Debes esperar 1 minuto entre píxeles' }
                        }));
                        return;
                    }

                    // Insertar nuevo píxel
                    const pixelId = await Pixel.create({ x, y, color, userId });

                    // Obtener información completa del píxel
                    const pixel = await Pixel.getPixelAt(x, y);
                    const userInfo = await User.findById(userId);

                    // Broadcast a todos los clientes
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'PIXEL_PLACED',
                                payload: {
                                    x,
                                    y,
                                    color,
                                    userId,
                                    username: userInfo.username,
                                    timestamp: new Date().toISOString()
                                }
                            }));
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error);
            ws.send(JSON.stringify({
                type: 'ERROR',
                payload: { message: 'Error interno del servidor' }
            }));
        }
    });
});

// Configuración de producción
if (process.env.NODE_ENV === 'production') {
    // Servir archivos estáticos del frontend
    const path = require('path');
    app.use(express.static(path.join(__dirname, '../frontend')));
    
    // Manejar rutas del frontend
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Exportar pool para los modelos
module.exports.pool = pool;

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    const numCPUs = os.cpus().length;
    console.log(`Master process is running. Forking for ${numCPUs} CPUs...`);
    
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Forking a new one...`);
        cluster.fork();
    });
} else {
    // ... existing server code ...
}