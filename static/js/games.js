$(document).ready(function() {
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

    // Load sound effect
    const gulpSound = new Audio('/static/sounds/gulp.mp3');

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
        
        clearInterval(flowerCreationInterval);
        flowerCreationInterval = setInterval(createFlowers, flowerInterval);
    }

    // Collision detection function
    function checkCollision(bee, flower) {
        return bee.x < flower.x + flower.width &&
               bee.x + bee.width > flower.x &&
               bee.y < flower.y + flower.height &&
               bee.y + bee.height > flower.y;
    }

    function startCountdown() {
        let count = 5;
        const countdownElement = $('#countdown');
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

    function startGame() {
        gameStarted = true;
        flowerCreationInterval = setInterval(createFlowers, flowerInterval);
        setInterval(increaseDifficulty, 10000);
        requestAnimationFrame(gameLoop);
    }

    // Wait for images to load before starting the game
    Promise.all([
        new Promise(resolve => backgroundImage.onload = resolve),
        new Promise(resolve => beeImage.onload = resolve),
        new Promise(resolve => flowerImage.onload = resolve)
    ]).then(() => {
        $('#start-button').click(function() {
            $(this).hide();
            startCountdown();
        });
    });

    function gameLoop() {
        if (!gameStarted) return;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // Create bee object for collision detection
        const bee = {
            x: beeX,
            y: beeY,
            width: beeWidth,
            height: beeHeight
        };

        // Update and draw flowers
        flowers = flowers.filter(flower => {
            flower.y += flowerSpeed;
            
            // Check for collision with bee
            if (checkCollision(bee, flower)) {
                gulpSound.currentTime = 0;
                gulpSound.play();
                updateGameState('collect_flower');
                return false;
            }
            
            // Draw the flower
            ctx.drawImage(flowerImage, flower.x, flower.y, flower.width, flower.height);
            
            return flower.y < canvas.height;
        });

        // Draw bee
        ctx.drawImage(beeImage, beeX, beeY, beeWidth, beeHeight);

        // Request the next frame
        requestAnimationFrame(gameLoop);
    }

    // Handle mouse movement
    $('#gameCanvas').mousemove(function(event) {
        const rect = canvas.getBoundingClientRect();
        beeX = event.clientX - rect.left - 25;
        beeY = event.clientY - rect.top - 25;
    });

    // Function to update game state
    function updateGameState(action) {
        $.ajax({
            url: '/game_state',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: action }),
            success: function(response) {
                $('#score').text('Score: ' + response.score);
                $('#high-score').text('High Score: ' + response.high_score);
                if (response.game_over) {
                    alert('Game Over!');
                }
            }
        });
    }
});