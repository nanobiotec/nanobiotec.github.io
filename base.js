const randInt = (min, max) => {
    if (min > max) {
        throw new Error("randInt function: The minimum is bigger than the maximum");
    }
    if (!isFinite(min)) {
        throw new Error("randInt function: The minimum is not finite");
    }
    if (!isFinite(max)) {
        throw new Error("randInt function: The maximum is not finite");
    }

    return Math.floor((Math.random() * (max - min + 1)) + min);
};

const degRad = (deg) => deg * (Math.PI / 180);

const imageMap = {
    usa: "./img/usa.png"
};

const ballsRadius = 150;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

if (ctx) {
    class Ball {
        constructor(config) {
            this.radius = config.r;
            this.xPosition = config.x;
            this.yPosition = config.y;
            this.xVelocity = config.vx;
            this.yVelocity = config.vy;
            this.angle = config.b;
            this.angularVelocity = config.vb;

            // Agregar la imagen de la countryball
            this.image = new Image();
            const countries = Object.keys(imageMap);
            const randomCountry = countries[randInt(0, countries.length - 1)];
            this.image.src = imageMap[randomCountry];
            this.country = randomCountry;
        }

        updatePosition() {
            // Actualizar posición
            this.xPosition += this.xVelocity;
            this.yPosition += this.yVelocity;

            // Actualizar ángulo
            this.angle += this.angularVelocity;

            // Detectar colisiones con los bordes y revertir velocidad
            if (this.xPosition - this.radius <= 0) {
                this.xVelocity *= -1;
                this.xPosition = this.radius;
            }
            if (this.xPosition + this.radius >= canvas.width) {
                this.xVelocity *= -1;
                this.xPosition = canvas.width - this.radius;
            }
            if (this.yPosition - this.radius <= 0) {
                this.yVelocity *= -1;
                this.yPosition = this.radius;
            }
            if (this.yPosition + this.radius >= canvas.height) {
                this.yVelocity *= -1;
                this.yPosition = canvas.height - this.radius;
            }
        }

        draw() {
            if (this.image.complete) {
                ctx.save();

                // Configuración de la sombra
                ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctx.shadowBlur = 30;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Dibujar la imagen de la countryball
                ctx.translate(this.xPosition, this.yPosition);
                ctx.rotate(this.angle);
                ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);

                ctx.restore();
            }
        }
    }

    // Crear múltiples countryballs
    const balls = [];
    const numberOfBalls = 1;
    for (let i = 0; i < numberOfBalls; i++) {
        balls.push(
            new Ball({
                r: ballsRadius,
                x: randInt(ballsRadius, canvas.width - ballsRadius),
                y: randInt(ballsRadius, canvas.height - ballsRadius),
                vx: randInt(-3, 3) || 1,
                vy: randInt(-3, 3) || 1,
                b: 0,
                vb: degRad(randInt(-10, 10))
            })
        );
    }

    // Detectar y manejar colisiones entre bolas
    function detectCollisions() {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ball1 = balls[i];
                const ball2 = balls[j];

                // Calcular distancia entre los centros
                const dx = ball2.xPosition - ball1.xPosition;
                const dy = ball2.yPosition - ball1.yPosition;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Si hay colisión
                if (distance <= ball1.radius + ball2.radius) {
                    // Resolver colisión lineal
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    const vx1 = ball1.xVelocity * cos + ball1.yVelocity * sin;
                    const vy1 = ball1.yVelocity * cos - ball1.xVelocity * sin;

                    const vx2 = ball2.xVelocity * cos + ball2.yVelocity * sin;
                    const vy2 = ball2.yVelocity * cos - ball2.xVelocity * sin;

                    [ball1.xVelocity, ball2.xVelocity] = [vx2 * cos - vy1 * sin, vx1 * cos - vy2 * sin];
                    [ball1.yVelocity, ball2.yVelocity] = [vy1 * cos + vx2 * sin, vy2 * cos + vx1 * sin];

                    // Resolver colisión rotacional
                    const rotationalImpact = 0.05;
                    const angularExchange = (ball1.angularVelocity - ball2.angularVelocity) * rotationalImpact;

                    ball1.angularVelocity -= angularExchange;
                    ball2.angularVelocity += angularExchange;

                    // Ajustar posiciones para evitar superposición
                    const overlap = ball1.radius + ball2.radius - distance;
                    const adjustmentX = (dx / distance) * overlap / 2;
                    const adjustmentY = (dy / distance) * overlap / 2;

                    ball1.xPosition -= adjustmentX;
                    ball1.yPosition -= adjustmentY;
                    ball2.xPosition += adjustmentX;
                    ball2.yPosition += adjustmentY;
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Actualizar y dibujar todas las bolas
        balls.forEach((ball) => {
            ball.updatePosition();
            ball.draw();
        });

        // Detectar colisiones entre las bolas
        detectCollisions();

        requestAnimationFrame(animate);
    }

    animate();
} else {
    console.error("Canvas no soportado por el navegador");
}
