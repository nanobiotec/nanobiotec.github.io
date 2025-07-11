randInt = (min, max) => {
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

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ballRadius = 50;

const ballImage = new Image();
ballImage.src = "./img/balon2.png"; // Asegúrate de que la ruta sea correcta

// Fondo
const fondo = new Image();
fondo.src = './img/fondo.png'; // Asegúrate de que la ruta sea correcta

const colors = [
    "rgba(255, 0, 0, 0.8)",  // Rojo
    "rgba(0, 255, 0, 0.8)",  // Verde
    "rgba(0, 0, 255, 0.8)",  // Azul
    "rgba(255, 255, 0, 0.8)", // Amarillo
    "rgba(255, 165, 0, 0.8)", // Naranja
    "rgba(0, 255, 255, 0.8)"  // Cian
];

if (ctx) {
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.radius = randInt(2, 5);
            this.color = color;
            this.xVelocity = randInt(-2, 2);
            this.yVelocity = randInt(-2, 2);
            this.opacity = 1;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        update() {
            this.x += this.xVelocity;
            this.y += this.yVelocity;
            this.opacity -= 0.02; // Desaparecen gradualmente
        }

        isAlive() {
            return this.opacity > 0;
        }
    }

    class GameBall {
        constructor(config) {
            this.radius = config.r;
            this.xPosition = config.x;
            this.yPosition = config.y;
            this.xVelocity = config.xV;
            this.yVelocity = config.yV;
            this.angle = config.ang;
            this.angularVelocity = config.angV;
            this.image = config.img;
            this.friction = 0.95;
            this.angularFriction = 0.95;
            this.opacity = 0;  // Inicialmente invisible
            this.isVisible = false;  // Controla si el balón está visible
            this.isAppearing = true; // Controla si la animación de aparición está activa
            this.isDisappearing = false; // Controla si la animación de desaparición está activa
            this.particles = []; // Lista de partículas
        }

        // Animación de aparición
        animateAppearance() {
            const startTime = Date.now();
            const duration = 400;  // Duración en ms

            const animationInterval = () => {
                const elapsedTime = Date.now() - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                // Hacer la pelota más visible con el tiempo
                this.opacity = progress;
                this.radius = ballRadius * progress;

                // Generar partículas
                if (progress < 1) {
                    for (let i = 0; i < 5; i++) {
                        this.particles.push(new Particle(
                            this.xPosition + randInt(-this.radius, this.radius),
                            this.yPosition + randInt(-this.radius, this.radius),
                            colors[randInt(0, colors.length - 1)]
                        ));
                    }
                }

                if (progress < 1) {
                    requestAnimationFrame(animationInterval);
                } else {
                    this.isVisible = true;
                    this.isAppearing = false; // Fin de la animación
                }
            };

            requestAnimationFrame(animationInterval);
        }

        // Animación de desaparición
        animateDisappearance() {
            const startTime = Date.now();
            const duration = 400;  // Duración en ms

            const animationInterval = () => {
                const elapsedTime = Date.now() - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                // Hacer la pelota más invisible con el tiempo (reducción de opacidad)
                this.opacity = 1 - progress;
                this.radius = ballRadius * (1 - progress);

                // Generar partículas durante la desaparición
                if (progress < 1) {
                    for (let i = 0; i < 5; i++) {
                        this.particles.push(new Particle(
                            this.xPosition + randInt(-this.radius, this.radius),
                            this.yPosition + randInt(-this.radius, this.radius),
                            colors[randInt(0, colors.length - 1)]
                        ));
                    }
                }

                // Continuar la animación hasta que la pelota desaparezca
                if (progress < 1) {
                    requestAnimationFrame(animationInterval);
                } else {
                    this.isVisible = false; // Ahora la pelota es invisible
                    this.isDisappearing = false; // Fin de la animación de desaparición
                }
            };

            requestAnimationFrame(animationInterval);
        }

        // Mostrar la pelota
        draw() {
            if (this.isVisible || this.opacity > 0) {
                ctx.save();

                // Configuración de la sombra
                ctx.shadowColor = this.shadowColor || 'rgba(0, 0, 0, 0.4)'; // Color de la sombra
                ctx.shadowBlur = this.shadowBlur || 30; // Desenfoque de la sombra
                ctx.shadowOffsetX = 0; // Desplazamiento en X
                ctx.shadowOffsetY = 0; // Desplazamiento en Y

                // Configuración de la opacidad y transformación
                ctx.globalAlpha = this.opacity;
                ctx.translate(this.xPosition, this.yPosition);
                ctx.rotate(this.angle);

                // Dibujo de la pelota
                ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);

                ctx.restore();
            }

            // Dibujar partículas
            this.particles.forEach((particle) => particle.draw());
        }


        // Método para detectar colisiones con las countryballs y transferir la velocidad
        checkCollision(countryball) {
            // Calculamos la distancia entre el centro del balón y el centro de la countryball
            const dx = this.xPosition - countryball.x;
            const dy = this.yPosition - countryball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Comprobamos si la distancia es menor o igual a la suma de los radios de ambos
            if (distance <= this.radius + countryball.radius) {
                // Si colisionan, sumamos la velocidad de la countryball a la del balón
                this.xVelocity += countryball.xVelocity;
                this.yVelocity += countryball.yVelocity;

                // Opcional: Ajustar la posición del balón para evitar que se quede atrapado dentro de la countryball
                const overlap = this.radius + countryball.radius - distance;
                this.xPosition += (dx / distance) * overlap;
                this.yPosition += (dy / distance) * overlap;
            }
        }

        // Actualizar la posición y partículas
        updatePosition() {
            if (this.isAppearing) {
                // Actualizar partículas durante la aparición
                this.particles.forEach((particle) => particle.update());
                this.particles = this.particles.filter((particle) => particle.isAlive());
                return; // No actualizamos posición hasta que aparezca completamente
            }

            if (this.isDisappearing) {
                // Actualizar partículas durante la desaparición
                this.particles.forEach((particle) => particle.update());
                this.particles = this.particles.filter((particle) => particle.isAlive());
                return; // No actualizamos posición hasta que desaparezca completamente
            }

            // Actualizar posición
            this.xPosition += this.xVelocity;
            this.yPosition += this.yVelocity;

            // Aplicar fricción
            this.xVelocity *= this.friction;
            this.yVelocity *= this.friction;

            // Comprobamos colisiones con las countryballs
            for (let i = 0; i < countryballs.length; i++) {
                this.checkCollision(countryballs[i]);
            }

            // Limitar posición a los bordes del canvas
            if (this.xPosition - this.radius <= 0) {
                this.xVelocity *= -1;
                this.xPosition = this.radius;
            }
            if (this.xPosition + this.radius >= canvas.width) {
                this.xVelocity *= -1;
                this.xPosition = canvas.width - this.radius;
            }
            if (this.yPosition - this.radius <= 500) {
                this.yVelocity *= -1;
                this.yPosition = 500 + this.radius;
            }
            if (this.yPosition + this.radius >= canvas.height) {
                this.yVelocity *= -1;
                this.yPosition = canvas.height - this.radius;
            }

            // Calcular la magnitud de la velocidad
            const speed = Math.sqrt(this.xVelocity ** 2 + this.yVelocity ** 2);

            // Ajustar velocidad angular proporcionalmente (puedes ajustar el factor de escala)
            const angularFactor = 0.05; // Factor para controlar la relación velocidad/rotación
            this.angularVelocity = speed * angularFactor;

            // Actualizar ángulo
            this.angle += this.angularVelocity;

            // Actualizar partículas
            this.particles.forEach((particle) => particle.update());
            this.particles = this.particles.filter((particle) => particle.isAlive());
        }
    }


    class CountryBall {
        constructor(config) {
            this.radius = config.r;
            this.areaRadius = config.Ar;
            this.areaCenterX = config.Ax;
            this.areaCenterY = config.Ay;
            this.x = config.Ax; // Posición inicial en X
            this.y = config.Ay; // Posición inicial en Y
            this.xVelocity = randInt(-1, 1) * randInt(10, 40); // Velocidad aleatoria en X
            this.yVelocity = randInt(-1, 1) * randInt(10, 40); // Velocidad aleatoria en Y
            this.angle = config.ang || 0; // Ángulo de rotación
            this.angularVelocity = config.angV || (Math.random() * 0.05 - 0.025); // Velocidad angular aleatoria
            this.image = config.img; // Imagen de la countryball
        }

        // Método para detectar colisiones con otras countryballs
        checkCollision(otherBall) {
            const dx = this.x - otherBall.x;
            const dy = this.y - otherBall.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Si la distancia entre los centros es menor que la suma de los radios, hay colisión
            if (distance < this.radius + otherBall.radius) {
                // Calculamos la dirección en la que separarse
                const angle = Math.atan2(dy, dx);
                const overlap = (this.radius + otherBall.radius) - distance;

                // Calculamos las nuevas posiciones para separarse
                this.x += Math.cos(angle) * overlap / 2;
                this.y += Math.sin(angle) * overlap / 2;

                otherBall.x -= Math.cos(angle) * overlap / 2;
                otherBall.y -= Math.sin(angle) * overlap / 2;
            }
        }

        // Método para actualizar la posición de la countryball
        update() {
            // Actualizamos la velocidad aleatoriamente
            if (randInt(0, 2) === 1) {
                this.xVelocity = randInt(-30, 30);
                this.yVelocity = randInt(-30, 30);
            }

            // Actualizamos la posición
            this.x += this.xVelocity;
            this.y += this.yVelocity;

            // Comprobamos si la countryball está fuera del área circular
            const distanceFromCenter = Math.sqrt((this.x - this.areaCenterX) ** 2 + (this.y - this.areaCenterY) ** 2);
            if (distanceFromCenter > this.areaRadius - this.radius) {
                // Si se sale, ajustamos la posición para que quede dentro del área
                const angleToCenter = Math.atan2(this.y - this.areaCenterY, this.x - this.areaCenterX);
                this.x = this.areaCenterX + (this.areaRadius - this.radius) * Math.cos(angleToCenter);
                this.y = this.areaCenterY + (this.areaRadius - this.radius) * Math.sin(angleToCenter);
            }

            // Actualizamos la rotación con la velocidad angular
            this.angle += this.angularVelocity;
        }

        // Método para dibujar la imagen de la countryball en el canvas
        draw(ctx) {
            ctx.save();
            // Configuración de la sombra
            ctx.shadowColor = this.shadowColor || 'rgba(0, 0, 0, 0.4)'; // Color de la sombra
            ctx.shadowBlur = this.shadowBlur || 30; // Desenfoque de la sombra
            ctx.shadowOffsetX = 0; // Desplazamiento en X
            ctx.shadowOffsetY = 0; // Desplazamiento en Y
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
    }


    // Crear imágenes para los equipos
    const imgEquipo1 = new Image();
    imgEquipo1.src = './img/equipo1.png';

    const imgEquipo2 = new Image();
    imgEquipo2.src = './img/equipo2.png';

    // Configuración para las countryballs
    const countryBallsRadius = 100;
    const areaRadius = 200;
    const configCountryBalls = [
        // Equipo 1
        {
            r: countryBallsRadius, // radio de la countryball
            Ar: areaRadius, // radio del área circular
            Ax: areaRadius, // centro X del área (para el equipo 1)
            Ay: canvas.height - countryBallsRadius - 100, // centro Y del área (para el equipo 1)
            img: imgEquipo1
        },
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: canvas.width - areaRadius,
            Ay: canvas.height - countryBallsRadius - 100,
            img: imgEquipo1
        },
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: canvas.width / 2,
            Ay: canvas.height - countryBallsRadius - 100,
            img: imgEquipo1
        },
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: areaRadius + countryBallsRadius,
            Ay: canvas.height - countryBallsRadius - 400,
            img: imgEquipo1
        },
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: canvas.width - areaRadius - countryBallsRadius,
            Ay: canvas.height - countryBallsRadius - 400,
            img: imgEquipo1
        },

        // Equipo 2
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: areaRadius + countryBallsRadius, // centro X del área (para el equipo 1)
            Ay: 500 + countryBallsRadius + 100, // centro Y del área (para el equipo 1)
            img: imgEquipo2
        },
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: canvas.width - areaRadius - countryBallsRadius,
            Ay: 500 + countryBallsRadius + 100,
            img: imgEquipo2
        },
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: canvas.width / 2,
            Ay: 600 + countryBallsRadius + 100,
            img: imgEquipo2
        },
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: areaRadius + countryBallsRadius,
            Ay: 500 + countryBallsRadius + 400,
            img: imgEquipo2
        },
        {
            r: countryBallsRadius,
            Ar: areaRadius,
            Ax: canvas.width - areaRadius - countryBallsRadius,
            Ay: 500 + countryBallsRadius + 400,
            img: imgEquipo2
        }
    ];

    // Crear las countryballs a partir de la configuración
    let countryballs = configCountryBalls.map(config => new CountryBall(config));




    // Función para dibujar las porterías
    function drawPorterias() {
        const porteriaWidth = canvas.width * .5;
        const porteriaHeight = 30;

        // Portería azul (roja en el código)
        ctx.fillStyle = "blue";
        ctx.fillRect(canvas.width - (canvas.width * .75), canvas.height - porteriaHeight, porteriaWidth, porteriaHeight);

        // Portería roja (roja en el código)
        ctx.fillStyle = "red";
        ctx.fillRect(canvas.width - (canvas.width * .75), 500, porteriaWidth, porteriaHeight);
    }

    const centroCancha = {
        x: canvas.width / 2,
        y: (canvas.height / 2) + 250
    };

    // Variables de goles
    let golesEquipo1 = 0;
    let golesEquipo2 = 0;

    // Variables de estado de gol
    let golEquipo1 = false;
    let golEquipo2 = false;

    // Función para generar un nuevo balón al inicio
    function generarNuevoBalon() {
        let velocidadInicialBalon = randInt(0, 1);
        let velocidadInicial;

        // Apto solo al inicio en el primer balón (conserva el valor absoluto de los rangos aleatorios 8 y 15 en y)
        if (velocidadInicialBalon) {
            velocidadInicial = {
                vX: randInt(-5, 5),
                vY: randInt(8, 15)
            };
        } else {
            velocidadInicial = {
                vX: randInt(-5, 5),
                vY: randInt(-15, -8)
            };
        }

        const balon = new GameBall({
            r: ballRadius,
            x: centroCancha.x,
            y: centroCancha.y,
            xV: velocidadInicial.vX,
            yV: velocidadInicial.vY,
            ang: 0,
            angV: degRad(1),
            img: ballImage
        });

        balon.animateAppearance(); // Llamar a la animación de aparición para la nueva pelota

        return balon;
    }

    // Función para generar un nuevo balón si es golEquipo1
    function generarNuevoBalonEquipo1() {
        let velocidadInicialBalon = randInt(0, 1);
        let velocidadInicial;

        // Apto solo al inicio en el primer balón (conserva el valor absoluto de los rangos aleatorios 8 y 15 en y)
        if (velocidadInicialBalon) {
            velocidadInicial = {
                vX: randInt(-5, 5),
                vY: randInt(-15, -8)
            };
        } else {
            velocidadInicial = {
                vX: randInt(-5, 5),
                vY: randInt(-15, -8)
            };
        }

        const balon = new GameBall({
            r: ballRadius,
            x: centroCancha.x,
            y: centroCancha.y,
            xV: velocidadInicial.vX,
            yV: velocidadInicial.vY,
            ang: 0,
            angV: degRad(1),
            img: ballImage
        });

        balon.animateAppearance(); // Llamar a la animación de aparición para la nueva pelota

        return balon;
    }

    // Función para generar un nuevo balón si es golEquipo2
    function generarNuevoBalonEquipo2() {
        let velocidadInicialBalon = randInt(0, 1);
        let velocidadInicial;

        // Apto solo al inicio en el primer balón (conserva el valor absoluto de los rangos aleatorios 8 y 15 en y)
        if (velocidadInicialBalon) {
            velocidadInicial = {
                vX: randInt(-5, 5),
                vY: randInt(8, 15)
            };
        } else {
            velocidadInicial = {
                vX: randInt(-5, 5),
                vY: randInt(8, 15)
            };
        }

        const balon = new GameBall({
            r: ballRadius,
            x: centroCancha.x,
            y: centroCancha.y,
            xV: velocidadInicial.vX,
            yV: velocidadInicial.vY,
            ang: 0,
            angV: degRad(1),
            img: ballImage
        });

        balon.animateAppearance(); // Llamar a la animación de aparición para la nueva pelota

        return balon;
    }

    // Crear el primer balón
    let balon = generarNuevoBalon();

    // Esperar a que el fondo esté cargado antes de dibujar
    fondo.onload = () => {
        // Dibujar el fondo
        ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
        // Animar aparición de la bola al cargar el fondo
        balon.animateAppearance();
    };



    // Función para actualizar los goles
    function actualizarGoles() {
        // Verificar si la pelota ha cruzado la portería derecha (equipo 1)
        if (balon.yPosition + ballRadius <= 600 && (balon.xPosition >= canvas.width * .25 && balon.xPosition <= canvas.width * .75) && !golEquipo1) {
            golesEquipo1++;
            golEquipo1 = true;
            balon.isDisappearing = true; // Iniciar animación de desaparición
            setTimeout(() => {
                golEquipo1 = false;
                balon = generarNuevoBalonEquipo1();  // Generar nuevo balón después de la animación
                balon.animateAppearance(); // Animación de aparición del nuevo balón
            }, 600);  // Esperar 600 ms para generar el nuevo balón
        }

        // Verificar si la pelota ha cruzado la portería izquierda (equipo 2)
        if (balon.yPosition + ballRadius >= canvas.height && (balon.xPosition >= canvas.width * .25 && balon.xPosition <= canvas.width * .75) && !golEquipo2) {
            golesEquipo2++;
            golEquipo2 = true;
            balon.isDisappearing = true; // Iniciar animación de desaparición
            setTimeout(() => {
                golEquipo2 = false;
                balon = generarNuevoBalonEquipo2();  // Generar nuevo balón después de la animación
                balon.animateAppearance(); // Animación de aparición del nuevo balón
            }, 600);  // Esperar 600 ms para generar el nuevo balón
        }
    }

    // Función para generar nuevo balon si pasan mas de 500ms
    let tiempoInactivo = 0; // Variable para almacenar el tiempo que la pelota no se mueve
    const tiempoLimite = 500; // Tiempo en milisegundos (3 segundos)

    function pelotaNoSeMueve() {
        // Verificar si la velocidad de la pelota es 0
        const velocidad = Math.sqrt(balon.xVelocity ** 2 + balon.yVelocity ** 2);


        if (velocidad < 0.1) {
            tiempoInactivo += 16; // Aumentamos el tiempo inactivo en cada frame (aproximadamente 16 ms)

            // Si la pelota ha estado detenida por más de 3 segundos, generar una nueva pelota
            if (tiempoInactivo >= tiempoLimite) {
                balon.isDisappearing = true; // Iniciar animación de desaparición
                balon = generarNuevoBalon(); // Llamar a la función para generar una nueva pelota
                balon.animateAppearance();
                tiempoInactivo = 0; // Restablecer el tiempo inactivo
            }
        } else {
            tiempoInactivo = 0; // Resetear si la pelota se mueve
        }
    }

    // Función para dibujar los goles
    function dibujarGoles() {
        ctx.font = `200px "Trebuchet MS"`;
        ctx.fillStyle = "white";
        ctx.fillText(golesEquipo1, canvas.width / 3 + 10, 350);
        ctx.fillText(golesEquipo2, canvas.width - (canvas.width / 3) - 110, 350);
    }

    // Inicializar el tiempo restante (50 segundos)
    let tiempoRestante = 31;
    let intervaloCuentaRegresiva;
    let updateId; // Variable para almacenar el ID de la animación

    // Configuración para la fuente y el texto
    const estiloFuente = `100px "Trebuchet MS"`;
    const colorTexto = "white";
    const posicionTextoX = canvas.width / 2; // Ajusta la posición horizontal
    const posicionTextoY = 460; // Ajusta la posición vertical

    // Función para actualizar la cuenta regresiva
    function actualizarCuentaRegresiva() {
        if (tiempoRestante >= 0) {
            tiempoRestante--;
        } else {
            // Detener el intervalo cuando el contador llegue a 0
            clearInterval(intervaloCuentaRegresiva);
            balon.isDisappearing = true; // La pelota desaparece automáticamente cuando el tiempo llega a 0
            setTimeout(() => {
                balon = generarNuevoBalon(); // Generar un nuevo balón después de la desaparición
                balon.animateAppearance(); // Animación de aparición del nuevo balón
                tiempoRestante = 31; // Restablecer el tiempo
                intervaloCuentaRegresiva = setInterval(actualizarCuentaRegresiva, 1000); // Reiniciar el intervalo de cuenta regresiva
            }, 600);  // Esperar un poco antes de generar el nuevo balón
        }
    }

    // Función para dibujar el contador en el canvas
    function dibujarCuentaRegresiva() {
        ctx.font = estiloFuente;
        ctx.fillStyle = colorTexto;
        ctx.fillText(`${tiempoRestante - 1}`, posicionTextoX, posicionTextoY);
    }

    // Función de actualización general del juego
    function update() {
        if (tiempoRestante > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar canvas

            // Dibujar fondo y porterías
            ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);
            drawPorterias();

            // Actualizar y dibujar la pelota
            balon.updatePosition();
            balon.draw();

            // Verificar colisiones entre todas las countryballs
            for (let i = 0; i < countryballs.length; i++) {
                for (let j = i + 1; j < countryballs.length; j++) {
                    countryballs[i].checkCollision(countryballs[j]);
                }
            }

            // Actualizar y dibujar las countryballs
            for (let i = 0; i < countryballs.length; i++) {
                countryballs[i].update(); // Actualizar la posición de la countryball
                countryballs[i].draw(ctx); // Dibujar la countryball
            }

            // Actualizar goles y la pelota
            pelotaNoSeMueve();
            actualizarGoles();
            dibujarGoles();

            // Dibujar la cuenta regresiva
            dibujarCuentaRegresiva();

            // Continuar la actualización si el tiempo no ha llegado a 0
            updateId = requestAnimationFrame(update);
        }
    }


    // Iniciar la cuenta regresiva al comenzar el juego
    intervaloCuentaRegresiva = setInterval(actualizarCuentaRegresiva, 1000);

    // Iniciar el juego
    update(); // Iniciar el juego


}