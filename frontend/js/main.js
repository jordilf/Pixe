import Auth from './auth.js';
import PixeCanvas from './canvas.js';

window.onload = () => {
    const pixeCanvas = new PixeCanvas();
    
    // Manejar la autenticación
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userInfo = document.getElementById('userInfo');

    const updateAuthUI = () => {
        if (Auth.isAuthenticated()) {
            const user = Auth.getCurrentUser();
            userInfo.innerHTML = `
                <span>Bienvenido, ${user.username}</span>
                <button id="logoutBtn" class="auth-btn">Cerrar Sesión</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                Auth.logout();
                updateAuthUI();
            });
        } else {
            userInfo.innerHTML = `
                <button id="loginBtn" class="auth-btn">Iniciar Sesión</button>
                <button id="registerBtn" class="auth-btn">Registrarse</button>
            `;
        }
    };

    updateAuthUI();
};