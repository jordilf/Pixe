import pixeWebSocket from './websocket.js';

class PixeCanvas {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.pixelSize = 10;
        this.selectedColor = '#000000';
        this.canPlace = true;
        this.countdown = 60;
        
        // Variables para zoom y pan
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Configuración del canvas
        this.canvas.width = 2000;
        this.canvas.height = 2000;
        
       // Inicializar canvas con fondo negro
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Colores disponibles
        this.colors = [
            '#FF4500', '#FFA800', '#FFD635', '#00A368', '#BE0039',
            '#FF99AA', '#00CC78', '#00756F', '#009EAA', '#493AC1',
            '#6A5CFF', '#94B3FF', '#811E9F', '#B44AC0', '#FF3881',
            '#000000', '#898D90', '#D4D7D9', '#FFFFFF'
        ];
        
        this.initColorPicker();
        this.initCanvas();
        this.initControls();
        this.startTimer();
        this.render();

        // Inicializar WebSocket
        this.initWebSocket();
    }

    initColorPicker() {
        const colorPicker = document.getElementById('colorPalette');
        
        this.colors.forEach(color => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = color;
            colorOption.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(opt => 
                    opt.classList.remove('selected'));
                colorOption.classList.add('selected');
                this.selectedColor = color;
            });
            colorPicker.appendChild(colorOption);
        });
    }

    initCanvas() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Click izquierdo
                const pos = this.getMousePos(e);
                if (this.canPlace) {
                    this.placePixel(pos.x, pos.y);
                }
            } else if (e.button === 1) { // Click medio (pan)
                this.isDragging = true;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const pos = this.getMousePos(e);
            document.getElementById('coordinates').textContent = 
                `X: ${Math.floor(pos.x/this.pixelSize)}, Y: ${Math.floor(pos.y/this.pixelSize)}`;

            if (this.isDragging) {
                const deltaX = e.clientX - this.lastX;
                const deltaY = e.clientY - this.lastY;
                this.offsetX += deltaX;
                this.offsetY += deltaY;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.render();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const pos = this.getMousePos(e);
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            
            this.scale *= delta;
            this.scale = Math.min(Math.max(0.5, this.scale), 50);
            
            this.render();
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;
        return {
            x: Math.floor(x / this.pixelSize) * this.pixelSize,
            y: Math.floor(y / this.pixelSize) * this.pixelSize
        };
    }

    initWebSocket() {
        pixeWebSocket.on('PIXEL_PLACED', (pixel) => {
            this.drawPixel(pixel.x, pixel.y, pixel.color);
        });

        pixeWebSocket.on('CANVAS_STATE', (pixels) => {
            pixels.forEach(pixel => {
                this.drawPixel(pixel.x, pixel.y, pixel.color);
            });
        });

        pixeWebSocket.on('ERROR', (error) => {
            alert(error.message);
        });
    }

    drawPixel(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.pixelSize, this.pixelSize);
    }

    placePixel(x, y) {
        if (!this.canPlace) return;
        
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Debes iniciar sesión para colocar píxeles');
            return;
        }

        pixeWebSocket.emit('PLACE_PIXEL', {
            x: Math.floor(x / this.pixelSize),
            y: Math.floor(y / this.pixelSize),
            color: this.selectedColor,
            token
        });

        this.canPlace = false;
        this.countdown = 60;
        this.updateTimer();
    }

    startTimer() {
        setInterval(() => {
            if (!this.canPlace) {
                this.countdown--;
                if (this.countdown <= 0) {
                    this.canPlace = true;
                }
                this.updateTimer();
            }
        }, 1000);
    }

    updateTimer() {
        const timer = document.getElementById('timer');
        const timerCountdown = timer.querySelector('.timer-countdown');
        if (this.canPlace) {
            timerCountdown.textContent = '¡Coloca un píxel!';
        } else {
            const minutes = Math.floor(this.countdown / 60);
            const seconds = this.countdown % 60;
            timerCountdown.textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    render() {
        const ctx = this.ctx;
        
        // Limpiar el canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Aplicar transformaciones
        ctx.setTransform(
            this.scale, 0,
            0, this.scale,
            this.offsetX,
            this.offsetY
        );
        
        // Dibujar la cuadrícula
        ctx.beginPath();
        for (let x = 0; x <= this.canvas.width; x += this.pixelSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
        }
        for (let y = 0; y <= this.canvas.height; y += this.pixelSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
        }
        ctx.strokeStyle = '#CCCCCC';
        ctx.stroke();
    }
}