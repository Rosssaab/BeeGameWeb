$(document).ready(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let gameStarted = false;
    let gameActive = true;

    // Touch control variables
    let touchActive = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let touchCurrentY = 0;
    const TOUCH_SENSITIVITY = 1.5;

    // Load game images
    const backgroundImage = new Image();
    backgroundImage.src = 'static/background.jpg';

    const beeImage = new Image();
    beeImage.src = 'static/bee.png';

    const flowerImage = new Image();
    flowerImage.src = 'static/Flower.png';

    const birdImage = new Image();
    birdImage.src = 'static/spider.gif';

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

    // Bird variables
    let bird = null;
    let birdInterval;
    const BIRD_SPEED = 2;
    let beeStunned = false;
    let stunTimeout;

    // Initialize sounds object first
    const sounds = {};
    
    // Function to safely load a sound
    function loadSound(key, path) {
        try {
            sounds[key] = new Audio(path);
            sounds[key].load(); // Explicitly load the audio
        } catch (error) {
            console.error(`Failed to load sound: ${key}`, error);
            sounds[key] = null;
        }
    }

    // Load all sounds
    loadSound('collect', 'static/sounds/gulp.mp3');
    loadSound('hit', 'static/sounds/doh.wav');
    loadSound('falling', 'static/sounds/Falling.mp3');
    loadSound('gameOver', 'static/sounds/gameover.wav');
    loadSound('background', 'static/sounds/background_music.mp3');
    loadSound('scream', 'static/sounds/scream.wav');
    loadSound('police', 'static/sounds/police.mp3');
    loadSound('beep', 'static/sounds/beep.mp3');

    // Safely set sound properties
    if (sounds.background) {
        sounds.background.loop = true;
        sounds.background.volume = 0.3;
    }
    if (sounds.police) {
        sounds.police.loop = true;
    }

    // Add error handling for sound loading
    Object.values(sounds).forEach(sound => {
        if (sound) {
            sound.onerror = (e) => {
                console.error('Error loading sound:', e);
            };
        }
    });

    // Add at the top with other game variables
    let currentScore = 0;
    let currentGameHighScore = 0;  // Track highest score in current game

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
        
        $('#overlay').show();
        countdownElement.show();
        countdownElement.text('3');
        
        if (sounds.beep) {
            sounds.beep.play().catch(error => console.log('Beep sound failed to play:', error));
        }

        const countInterval = setInterval(() => {
            count--;
            
            if (count > 0) {
                countdownElement.text(count);
                if (sounds.beep) {
                    sounds.beep.currentTime = 0;
                    sounds.beep.play().catch(error => console.log('Beep sound failed to play:', error));
                }
            }
            
            if (count === 0) {
                clearInterval(countInterval);
                $('#overlay').hide();
                countdownElement.hide();
                resetGame();
                gameStarted = true;
                startGame();
            }
        }, 1000);
    }

    function showGameOver() {
        gameOver = true;
        gameStarted = false;
        gameActive = false;

        clearInterval(flowerCreationInterval);
        clearAllDifficultyIntervals();

        $('#overlay').show();
        $('#start-button').hide();
        $('#countdown').hide();

        if ($('#game-over-msg').length === 0) {
            $('#overlay').append(`
                <div id="game-over-msg">
                    Game Over!<br>
                    <span style="font-size: 36px;">Highest Score: ${currentGameHighScore}</span>
                </div>
            `);
        }

        $(document).one('click', resetGame);

        sounds.gameOver.play().catch(error => console.log('Game over sound failed to play:', error));
        sounds.background.pause();
        sounds.background.currentTime = 0;
    }

    let difficultyInterval;

    function createBird() {
        if (!gameStarted || gameOver) return;

        bird = {
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            speed: BIRD_SPEED,
            trackingSpeed: 3
        };

        sounds.police.currentTime = 0;
        sounds.police.play().catch(error => console.log('Police siren failed to play:', error));
    }

    function stunBee() {
        if (beeStunned) return;

        sounds.hit.play().catch(error => console.log('Hit sound failed to play:', error));
        sounds.falling.play().catch(error => console.log('Falling sound failed to play:', error));
        beeStunned = true;
        
        const startY = beeY;
        const targetY = canvas.height - beeHeight;
        const fallDuration = 500;
        const startTime = performance.now();

        function animateFall(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / fallDuration, 1);

            const easeProgress = progress * (2 - progress);
            beeY = startY + (targetY - startY) * easeProgress;

            if (progress < 1) {
                requestAnimationFrame(animateFall);
            } else {
                setTimeout(() => {
                    beeStunned = false;
                    beeY = canvas.height / 2;
                }, 2000);
            }
        }

        requestAnimationFrame(animateFall);
    }

    function startGame() {
        gameStarted = true;
        gameOver = false;
        gameActive = true;
        beeStunned = false;

        clearAllDifficultyIntervals();

        flowerCreationInterval = setInterval(createFlowers, flowerInterval);
        difficultyInterval = setInterval(increaseDifficulty, 10000);

        birdInterval = setInterval(() => {
            createBird();
        }, Math.random() * 5000 + 10000);

        sounds.background.play().catch(error => console.log('Background audio failed to play:', error));

        requestAnimationFrame(gameLoop);
    }

    function clearAllDifficultyIntervals() {
        clearInterval(difficultyInterval);
        clearInterval(flowerCreationInterval);
        clearInterval(birdInterval);
        if (stunTimeout) {
            clearTimeout(stunTimeout);
        }
    }

    function resetGame() {
        clearInterval(flashInterval);
        clearAllDifficultyIntervals();

        gameOver = false;
        gameStarted = false;
        gameActive = true;
        flowers = [];
        bird = null;
        beeStunned = false;
        flowerSpeed = 2;
        flowerInterval = 2000;
        flowersPerSpawn = 1;
        beeX = canvas.width / 2;
        beeY = canvas.height / 2;
        currentScore = 0;
        currentGameHighScore = 0;

        updateGameState('reset_score');

        $('#game-over-msg').remove();
        $('#start-button').show();
        $('#score').text('Score: 0');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        Object.values(sounds).forEach(sound => {
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    }

    function updateGameState(action) {
        $.ajax({
            url: 'game_state',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: action }),
            success: function (response) {
                currentScore = response.score;
                currentGameHighScore = Math.max(currentGameHighScore, currentScore);
                $('#score').text('Score: ' + currentScore);
                $('#high-score').text('High Score: ' + response.high_score);
                if (response.game_over && !gameOver) {
                    showGameOver();
                }
            }
        });
    }

    function gameLoop() {
        if (!gameStarted || gameOver) {
            return;
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

            if (!beeStunned && checkCollision(bee, flower)) {
                sounds.collect.play().catch(error => console.log('Collect sound failed to play:', error));
                updateGameState('collect_flower');
                return false;
            }

            if (flower.y >= canvas.height) {
                sounds.hit.play().catch(error => console.log('Doh sound failed to play:', error));
                updateGameState('miss_flower');
                return false;
            }

            ctx.drawImage(flowerImage, flower.x, flower.y, flower.width, flower.height);
            return true;
        });

        if (!beeStunned && bird) {
            bird.y += bird.speed;

            if (bird.x < beeX) {
                bird.x += bird.trackingSpeed;
            } else if (bird.x > beeX) {
                bird.x -= bird.trackingSpeed;
            }

            if (checkCollision(bee, bird)) {
                stunBee();
                bird = null;
                sounds.police.pause();
                sounds.police.currentTime = 0;
            }

            if (bird && bird.y > canvas.height) {
                bird = null;
                sounds.police.pause();
                sounds.police.currentTime = 0;
            }

            if (bird) {
                ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);
            }
        }

        ctx.drawImage(beeImage, beeX, beeY, beeWidth, beeHeight);

        requestAnimationFrame(gameLoop);
    }

    // Setup touch controls
    function setupTouchControls() {
        const touchArea = document.getElementById('touch-controls');
        
        touchArea.addEventListener('touchstart', function(e) {
            touchActive = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchCurrentX = touchStartX;
            touchCurrentY = touchStartY;
            e.preventDefault();
        }, { passive: false });

        touchArea.addEventListener('touchmove', function(e) {
            if (!touchActive || beeStunned) return;
            
            touchCurrentX = e.touches[0].clientX;
            touchCurrentY = e.touches[0].clientY;
            
            // Calculate deltas for both X and Y
            const deltaX = (touchCurrentX - touchStartX);
            const deltaY = (touchCurrentY - touchStartY);
            
            // Move bee based on touch movement
            const newX = Math.max(0, Math.min(canvas.width - beeWidth, 
                beeX + (deltaX * TOUCH_SENSITIVITY)));
            const newY = Math.max(0, Math.min(canvas.height - beeHeight, 
                beeY + (deltaY * TOUCH_SENSITIVITY)));
                
            // Update positions if they changed
            if (newX !== beeX || newY !== beeY) {
                beeX = newX;
                beeY = newY;
                touchStartX = touchCurrentX;
                touchStartY = touchCurrentY;
            }
            
            e.preventDefault();
        }, { passive: false });

        touchArea.addEventListener('touchend', function() {
            touchActive = false;
        });

        touchArea.addEventListener('touchcancel', function() {
            touchActive = false;
        });
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
        new Promise(resolve => {
            backgroundImage.onload = resolve;
            backgroundImage.onerror = () => console.error('Failed to load background image');
        }),
        new Promise(resolve => {
            beeImage.onload = resolve;
            beeImage.onerror = () => console.error('Failed to load bee image');
        }),
        new Promise(resolve => {
            flowerImage.onload = resolve;
            flowerImage.onerror = () => console.error('Failed to load flower image');
        }),
        new Promise(resolve => {
            birdImage.onload = resolve;
            birdImage.onerror = () => console.error('Failed to load bird image');
        })
    ]).then(() => {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        
        $('#overlay').show();
        $('#start-button').show();
        
        $('#start-button').off('click').on('click', function() {
            console.log('Start button clicked');
            $(this).hide();
            startCountdown();
        });

        // Initialize touch controls
        setupTouchControls();
        
    }).catch(error => {
        console.error('Error loading game assets:', error);
    });
});