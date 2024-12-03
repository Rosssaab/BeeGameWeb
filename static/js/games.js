$(document).ready(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Load game images
    const backgroundImage = new Image();
    backgroundImage.src = '/static/background.jpg';  // Adjust path if needed

    const beeImage = new Image();
    beeImage.src = '/static/bee.png';  // Adjust path if needed

    const flowerImage = new Image();
    flowerImage.src = '/static/Flower.png';  // Adjust path if needed

    // Bee position and size
    let beeX = canvas.width / 2;
    let beeY = canvas.height / 2;
    const beeWidth = 50;
    const beeHeight = 50;

    // Flowers array
    let flowers = [];
    const flowerSpeed = 2;
    
    // Create new flower every 2 seconds
    function createFlower() {
        flowers.push({
            x: Math.random() * (canvas.width - 40),  // Random x position
            y: -40,  // Start above the canvas
            width: 40,
            height: 40
        });
    }
    
    setInterval(createFlower, 2000);  // Create new flower every 2 seconds

    // Collision detection function
    function checkCollision(bee, flower) {
        return bee.x < flower.x + flower.width &&
               bee.x + bee.width > flower.x &&
               bee.y < flower.y + flower.height &&
               bee.y + bee.height > flower.y;
    }

    // Wait for images to load before starting the game
    Promise.all([
        new Promise(resolve => backgroundImage.onload = resolve),
        new Promise(resolve => beeImage.onload = resolve),
        new Promise(resolve => flowerImage.onload = resolve)
    ]).then(() => {
        createFlower();  // Create first flower
        requestAnimationFrame(gameLoop);
    });

    function gameLoop() {
        console.log('Game loop running');
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
            flower.y += flowerSpeed;  // Make flower fall
            
            // Check for collision with bee
            if (checkCollision(bee, flower)) {
                updateGameState('collect_flower');
                return false; // Remove flower
            }
            
            // Draw the flower
            ctx.drawImage(flowerImage, flower.x, flower.y, flower.width, flower.height);
            
            // Keep flower if it's still on screen and hasn't been collected
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
        beeX = event.clientX - rect.left - 25; // Center bee on mouse
        beeY = event.clientY - rect.top - 25;  // Center bee on mouse
    });

    let score = 0;
    let highScore = 0;

    function updateGameState(action) {
        $.ajax({
            url: '/game_state',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: action }),
            success: function (response) {
                $('#score').text('Score: ' + response.score);
                $('#high-score').text('High Score: ' + response.high_score);
                if (response.game_over) {
                    alert('Game Over!');
                }
            }
        });
    }
});