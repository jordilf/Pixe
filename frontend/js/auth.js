export default class Auth {
    static async login(username, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            return true;
        } else {
            throw new Error(data.error);
        }
    }

    static async register(username, password) {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            return true;
        } else {
            throw new Error(data.error);
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
    }

    static isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    static getCurrentUser() {
        return {
            userId: localStorage.getItem('userId'),
            username: localStorage.getItem('username')
        };
    }
} 