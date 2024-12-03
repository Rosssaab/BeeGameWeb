$(document).ready(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let gameStarted = false;

    // Load game images
    const backgroundImage = new Image();
    backgroundImage.src = '/static/background.jpg';

    const beeImage = new Image();
    beeImage.src = '/static/bee.png';

    const flowerImage = new Image();
    flowerImage.src = '/static/Flower.png';

    // Load sound effects
    const gulpSound = new Audio('/static/sounds/gulp.mp3');
    const dohSound = new Audio('/static/sounds/doh.wav');
    const fallingSound = new Audio('/static/sounds/falling.mp3');

    // Load frog image
    const frogImage = new Image();
    frogImage.src = '/static/frog.gif';

    // Bee position and size
    let beeX = canvas.width / 2;
    let beeY = canvas.height / 2;
    const beeWidth = 50;
    const beeHeight = 50;

    // Flowers array and difficulty settings
    let flowers = [];
    let flowerSpeed = 2;
    let flowerInterval = 2000;
    let flowersPerSpawn = 1;
    let flowerCreationInterval;
    let gameOver = false;
    let flashInterval;

    // Frog variables
    let frog = null;
    let frogInterval;
    const FROG_SPEED = 4;
    let beeStunned = false;
    let stunTimeout;

    // Spider variables
    let spider = null;
    let spiderInterval;
    const SPIDER_SPEED = 2;

    // Create new flowers
    function createFlowers() {
        for (let i = 0; i < flowersPerSpawn; i++) {
            flowers.push({
                x: Math.random() * (canvas.width - 40),
                y: -40 - (Math.random() * 100),
                width: 40,
                height: 40
            });
        }
    }

    // Increase difficulty over time
    function increaseDifficulty() {
        flowerSpeed += 0.1;
        flowerInterval = Math.max(500, flowerInterval - 100);
        flowersPerSpawn = Math.min(5, flowersPerSpawn + 1);

        // Only clear and reset flower interval if game is still running
        if (gameStarted && !gameOver) {
            clearInterval(flowerCreationInterval);
            flowerCreationInterval = setInterval(createFlowers, flowerInterval);
        }
    }

    // Collision detection function
    function checkCollision(bee, flower) {
        return bee.x < flower.x + flower.width &&
            bee.x + bee.width > flower.x &&
            bee.y < flower.y + flower.height &&
            bee.y + bee.height > flower.y;
    }

    function startCountdown() {
        let count = 3;
        const countdownElement = $('#countdown');
        countdownElement.text('3');
        countdownElement.show();

        const countInterval = setInterval(() => {
            countdownElement.text(count);
            count--;

            if (count < 0) {
                clearInterval(countInterval);
                $('#overlay').hide();
                startGame();
            }
        }, 1000);
    }

    function showGameOver() {
        gameOver = true;
        gameStarted = false;

        // Clear all intervals
        clearInterval(flowerCreationInterval);
        clearAllDifficultyIntervals();

        // Show overlay with game over message
        $('#overlay').show();
        $('#start-button').hide();
        $('#countdown').hide();

        if ($('#game-over-msg').length === 0) {
            $('#overlay').append('<div id="game-over-msg">Game Over!</div>');
        }

        let visible = true;
        flashInterval = setInterval(() => {
            $('#game-over-msg').css('visibility', visible ? 'visible' : 'hidden');
            visible = !visible;
        }, 500);

        // Wait for click to restart
        $(document).one('click', resetGame);
    }

    // Keep track of difficulty interval
    let difficultyInterval;

    function createFrog() {
        if (!gameStarted || gameOver) return;

        frog = {
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            speed: FROG_SPEED
        };
    }

    function createSpider() {
        if (!gameStarted || gameOver) return;

        spider = {
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            speed: SPIDER_SPEED,
            trackingSpeed: 2
        };
    }

    function stunBee() {
        if (beeStunned) return;

        beeStunned = true;

        // Play falling sound
        fallingSound.currentTime = 0;
        fallingSound.play();

        // Store initial position for animation
        const startY = beeY;
        const targetY = canvas.height - beeHeight;
        const fallDuration = 500;
        const startTime = performance.now();

        function animateFall(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / fallDuration, 1);

            // Quadratic easing for more natural fall
            const easeProgress = progress * (2 - progress);
            beeY = startY + (targetY - startY) * easeProgress;

            if (progress < 1) {
                requestAnimationFrame(animateFall);
            }
        }

        requestAnimationFrame(animateFall);

        // Recover after 1 second
        if (stunTimeout) {
            clearTimeout(stunTimeout);
        }
        stunTimeout = setTimeout(() => {
            beeStunned = false;
            beeY = canvas.height / 2;
        }, 1000);
    }

    function startGame() {
        gameStarted = true;
        gameOver = false;
        beeStunned = false;

        // Clear any existing intervals first
        clearAllDifficultyIntervals();

        // Start all intervals fresh
        flowerCreationInterval = setInterval(createFlowers, flowerInterval);
        difficultyInterval = setInterval(increaseDifficulty, 10000);

        // Create frog every 5-10 seconds
        frogInterval = setInterval(() => {
            createFrog();
        }, Math.random() * 5000 + 5000);

        // Create spider every 10-20 seconds
        spiderInterval = setInterval(() => {
            createSpider();
        }, Math.random() * 10000 + 10000);

        requestAnimationFrame(gameLoop);
    }

    function clearAllDifficultyIntervals() {
        clearInterval(difficultyInterval);
        clearInterval(flowerCreationInterval);
        clearInterval(frogInterval);
        clearInterval(spiderInterval);
        if (stunTimeout) {
            clearTimeout(stunTimeout);
        }
    }

    function resetGame() {
        clearInterval(flashInterval);
        clearAllDifficultyIntervals();

        // Reset game variables
        gameOver = false;
        gameStarted = false;
        flowers = [];
        frog = null;
        beeStunned = false;
        flowerSpeed = 2;
        flowerInterval = 2000;
        flowersPerSpawn = 1;
        beeX = canvas.width / 2;
        beeY = canvas.height / 2;

        updateGameState('reset_score');

        $('#game-over-msg').remove();
        $('#start-button').show();
        $('#score').text('Score: 0');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    function updateGameState(action) {
        $.ajax({
            url: '/game_state',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: action }),
            success: function (response) {
                $('#score').text('Score: ' + response.score);
                $('#high-score').text('High Score: ' + response.high_score);
                if (response.game_over && !gameOver) {
                    showGameOver();
                }
            }
        });
    }

    function gameLoop() {
        if (!gameStarted || gameOver) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        const bee = {
            x: beeX,
            y: beeY,
            width: beeWidth,
            height: beeHeight
        };

        // Update and draw frog
        if (frog) {
            frog.y += frog.speed;

            if (!beeStunned && checkCollision(bee, frog)) {
                stunBee();
                frog = null;
            }

            if (frog && frog.y > canvas.height) {
                frog = null;
            }

            if (frog) {
                ctx.drawImage(frogImage, frog.x, frog.y, frog.width, frog.height);
            }
        }

        // Update and draw spider
        if (spider) {
            spider.y += spider.speed;

            if (spider.x < beeX) {
                spider.x += spider.trackingSpeed;
            } else if (spider.x > beeX) {
                spider.x -= spider.trackingSpeed;
            }

            if (!beeStunned && checkCollision(bee, spider)) {
                stunBee();
                spider = null;
            }

            if (spider && spider.y > canvas.height) {
                spider = null;
            }

            if (spider) {
                ctx.drawImage(spiderImage, spider.x, spider.y, spider.width, spider.height);
            }
        }

        // Update and draw flowers
        flowers = flowers.filter(flower => {
            flower.y += flowerSpeed;

            if (!beeStunned && checkCollision(bee, flower)) {
                gulpSound.currentTime = 0;
                gulpSound.play();
                updateGameState('collect_flower');
                return false;
            }

            if (flower.y >= canvas.height) {
                dohSound.currentTime = 0;
                dohSound.play();
                updateGameState('miss_flower');
                return false;
            }

            ctx.drawImage(flowerImage, flower.x, flower.y, flower.width, flower.height);
            return true;
        });

        // Draw bee
        ctx.drawImage(beeImage, beeX, beeY, beeWidth, beeHeight);

        requestAnimationFrame(gameLoop);
    }

    // Handle mouse movement only when bee isn't stunned
    $('#gameCanvas').mousemove(function (event) {
        if (!beeStunned) {
            const rect = canvas.getBoundingClientRect();
            beeX = event.clientX - rect.left - 25;
            beeY = event.clientY - rect.top - 25;
        }
    });

    Promise.all([
        new Promise(resolve => backgroundImage.onload = resolve),
        new Promise(resolve => beeImage.onload = resolve),
        new Promise(resolve => flowerImage.onload = resolve)
    ]).then(() => {
        $('#start-button').click(function () {
            $(this).hide();
            startCountdown();
        });
    });
});