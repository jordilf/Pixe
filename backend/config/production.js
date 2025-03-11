module.exports = {
    mysql: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'tu_contraseña',
        database: process.env.DB_NAME || 'pixe',
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'tu_secreto_seguro',
        expiresIn: '1h'
    },
    server: {
        port: process.env.PORT || 3000
    }
}; 