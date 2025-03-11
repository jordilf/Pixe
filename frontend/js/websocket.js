class PixeWebSocket {
    constructor() {
        this.socket = null;
        this.callbacks = {};
        this.connect();
    }

    connect() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = wsProtocol + window.location.host;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('Conectado al servidor');
            // Solicitar el estado actual del canvas al conectarse
            this.emit('GET_CANVAS_STATE', {});
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (this.callbacks[data.type]) {
                this.callbacks[data.type](data.payload);
            }
        };

        this.socket.onclose = () => {
            console.log('Desconectado del servidor');
            setTimeout(() => this.connect(), 1000);
        };
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    emit(type, payload) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        }
    }
}

const pixeWebSocket = new PixeWebSocket();

// Exportar la instancia para usarla en otros archivos
export default pixeWebSocket;