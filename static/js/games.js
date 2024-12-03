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

    // Load sound effects
    const gulpSound = new Audio('/static/sounds/gulp.mp3');
    const dohSound = new Audio('/static/sounds/doh.wav');

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

    function showGameOver() {
        gameOver = true;
        gameStarted = false;
        
        // Clear all intervals
        clearInterval(flowerCreationInterval);
        clearAllDifficultyIntervals();  // New function to clear difficulty intervals
        
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

    function startGame() {
        gameStarted = true;
        gameOver = false;
        flowerCreationInterval = setInterval(createFlowers, flowerInterval);
        difficultyInterval = setInterval(increaseDifficulty, 10000);
        requestAnimationFrame(gameLoop);
    }

    function clearAllDifficultyIntervals() {
        clearInterval(difficultyInterval);
        clearInterval(flowerCreationInterval);
    }

    function resetGame() {
        // Clear all intervals
        clearInterval(flashInterval);
        clearAllDifficultyIntervals();
        
        // Reset game variables
        gameOver = false;
        gameStarted = false;
        flowers = [];
        flowerSpeed = 2;
        flowerInterval = 2000;
        flowersPerSpawn = 1;
        beeX = canvas.width / 2;
        beeY = canvas.height / 2;
        
        // Reset score
        updateGameState('reset_score');
        
        // Reset display
        $('#game-over-msg').remove();
        $('#start-button').show();
        $('#score').text('Score: 0');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    function updateGameState(action) {
        $.ajax({
            url: '/game_state',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: action }),
            success: function(response) {
                $('#score').text('Score: ' + response.score);
                $('#high-score').text('High Score: ' + response.high_score);
                if (response.game_over && !gameOver) {
                    showGameOver();
                }
            }
        });
    }

    function gameLoop() {
        if (!gameStarted || gameOver) {
            return;  // Stop the game loop when game is over
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        const bee = {
            x: beeX,
            y: beeY,
            width: beeWidth,
            height: beeHeight
        };

        flowers = flowers.filter(flower => {
            flower.y += flowerSpeed;
            
            if (checkCollision(bee, flower)) {
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

        ctx.drawImage(beeImage, beeX, beeY, beeWidth, beeHeight);
        requestAnimationFrame(gameLoop);
    }

    $('#gameCanvas').mousemove(function(event) {
        const rect = canvas.getBoundingClientRect();
        beeX = event.clientX - rect.left - 25;
        beeY = event.clientY - rect.top - 25;
    });

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
});