import pygame
import random
import sys  # For sys.exit()

# Initialize Pygame
pygame.init()

# Initialize the mixer for sound
pygame.mixer.init()

# Load sounds
gulp_sound = pygame.mixer.Sound('gulp.mp3')  # Verify file path and extension
doh_sound = pygame.mixer.Sound('doh.wav')    # Verify file path and extension
gameover_sound = pygame.mixer.Sound('gameover.wav')  # Verify file path and extension

# Set the volume
gulp_sound.set_volume(0.5)
gameover_sound.set_volume(0.5)


# Load and play background music
background_music = 'background_music.mp3'  # Verify file path and extension
pygame.mixer.music.load(background_music)
pygame.mixer.music.set_volume(0.2)  # Set background music volume to 50%
pygame.mixer.music.play(-1)  # Play the music in an infinite loop

# Set up resizable display
width, height = 1024, 800
window = pygame.display.set_mode((width, height), pygame.RESIZABLE)
pygame.display.set_caption("Bee Catching Flowers")

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)

# Load images
background_image = pygame.image.load('background.jpg')  # Verify file path and extension
bee_image = pygame.image.load('bee.png')  # Verify file path and extension
flower_image = pygame.image.load('flower.png')  # Verify file path and extension

# Load quiet button image
quiet_button_image = pygame.image.load('quiet.png')  # Ensure this path is correct
quiet_button_rect = quiet_button_image.get_rect(topleft=(width - 80, 10))  # Adjust position as needed

# Bee settings
bee_rect = bee_image.get_rect()
bee_rect.topleft = (width // 2, height - bee_rect.height)

# Flower settings
flower_speed = 3
initial_flower_count = 5

# Function to spawn a flower
def spawn_flower():
    flower_rect = flower_image.get_rect(topleft=(random.randint(0, width - flower_image.get_width()), 0))
    return flower_rect

# Function to display the countdown
def countdown():
    font = pygame.font.SysFont(None, 72)
    countdown_start = 5
    for i in range(countdown_start, 0, -1):
        window.fill(BLACK)  # Clear the screen
        countdown_text = font.render(str(i), True, WHITE)
        countdown_rect = countdown_text.get_rect(center=(width // 2, height // 2))
        window.blit(countdown_text, countdown_rect)
        pygame.display.flip()
        pygame.time.wait(1000)  # Wait for 1 second

# Function to display the game over message with flashing effect and buttons
def show_game_over(high_score):
    global running
    global game_over
    
    font = pygame.font.SysFont(None, 72)
    game_over_text = font.render('Game Over', True, WHITE)
    high_score_text = font.render(f'High Score: {high_score}', True, WHITE)

    # Define a smaller box size
    box_width = max(game_over_text.get_width(), high_score_text.get_width()) + 40
    box_height = game_over_text.get_height() + high_score_text.get_height() + 80  # Increase height for buttons
    box_rect = pygame.Rect((width // 2 - box_width // 2, height // 2 - box_height // 2), (box_width, box_height))
    
    # Create buttons
    button_width, button_height = 150, 40
    quit_button_rect = pygame.Rect(width // 2 - button_width // 2, height // 2 + box_height // 2 + 20, button_width, button_height)
    restart_button_rect = pygame.Rect(width // 2 - button_width // 2, height // 2 + box_height // 2 + 70, button_width, button_height)

    # Play game over sound
    gameover_sound.play()

    while game_over:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            if event.type == pygame.MOUSEBUTTONDOWN:
                mouse_x, mouse_y = event.pos
                if quit_button_rect.collidepoint(mouse_x, mouse_y):
                    pygame.quit()
                    sys.exit()
                elif restart_button_rect.collidepoint(mouse_x, mouse_y):
                    return  # Return to restart the game

        # Flash the "Game Over" message
        for _ in range(3):  # Flash the message 6 times
            try:
                window.fill(BLACK)  # Fill background with black to enhance contrast
                # Draw the smaller box
                pygame.draw.rect(window, RED, box_rect, border_radius=10)  # Rounded corners
                # Draw the texts
                window.blit(game_over_text, (box_rect.x + 20, box_rect.y + 20))  # Draw "Game Over" text
                window.blit(high_score_text, (box_rect.x + 20, box_rect.y + game_over_text.get_height() + 30))  # Draw high score text
                # Draw buttons
                pygame.draw.rect(window, GREEN, quit_button_rect, border_radius=5)  # Rounded corners for buttons
                pygame.draw.rect(window, GREEN, restart_button_rect, border_radius=5)  # Rounded corners for buttons
                draw_text(window, "Quit", 30, BLACK, quit_button_rect.center)  # Label for "Quit" button
                draw_text(window, "Restart", 30, BLACK, restart_button_rect.center)  # Label for "Restart" button
                pygame.display.flip()
                pygame.time.wait(200)  # Wait for 200 milliseconds

                window.fill(BLACK)
                pygame.display.flip()
                pygame.time.wait(200)  # Wait for 200 milliseconds
            except pygame.error:
                break  # Exit the loop if there's an error with the display surface

# Function to draw centered text
def draw_text(surface, text, size, color, center):
    font = pygame.font.SysFont(None, size)
    textobj = font.render(text, True, color)
    textrect = textobj.get_rect()
    textrect.center = center
    surface.blit(textobj, textrect)

# Game variables
flowers = [spawn_flower() for _ in range(initial_flower_count)]  # Start with 5 flowers
score = 0
high_score = 0
font = pygame.font.SysFont(None, 36)
clock = pygame.time.Clock()
spawn_timer = 0  # Timer to control when to spawn new flowers
spawn_delay = 1000  # Spawn new flowers every 1000 milliseconds (1 second)
has_collected_flower = False  # Track if the bee has collected at least one flower
music_on = True  # State of background music

# Difficulty variables
difficulty_timer = 0
difficulty_interval = 1500
difficulty_increase_interval = 3000
flower_speed_increment = 0.5
flower_spawn_increment = 1

# Main game loop
running = True
game_over = False

# Display countdown before starting the game
countdown()

while running:
    if game_over:
        show_game_over(high_score)
        # Reset the game variables
        flowers = [spawn_flower() for _ in range(initial_flower_count)]
        score = 0
        has_collected_flower = False
        flower_speed = 3  # Reset flower speed
        difficulty_timer = 0  # Reset difficulty timer
        game_over = False
        continue

    # Handle event queue
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
        if event.type == pygame.VIDEORESIZE:  # Handle window resizing
            width, height = event.w, event.h
            window = pygame.display.set_mode((width, height), pygame.RESIZABLE)
            # Update button position when resizing the window
            quiet_button_rect.topleft = (width - 130, 10)
        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_x, mouse_y = event.pos
            # Check if music button is clicked
            if quiet_button_rect.collidepoint(mouse_x, mouse_y):
                if music_on:
                    pygame.mixer.music.stop()
                    quiet_button_image = pygame.image.load('loud.png')
                else:
                    pygame.mixer.music.play(-1)
                    quiet_button_image = pygame.image.load('quiet.png')
                music_on = not music_on

    # Draw background
    background_scaled = pygame.transform.scale(background_image, (width, height))  # Scale the background to fit window
    window.blit(background_scaled, (0, 0))

    # Blit the quiet button image
    window.blit(quiet_button_image, quiet_button_rect)

    # Bee movement controlled by the mouse (restricted to bottom 50%)
    mouse_x, mouse_y = pygame.mouse.get_pos()
    bee_rect.centerx = mouse_x  # Bee moves horizontally with the mouse

    # Restrict vertical movement to bottom 50% of the screen
    min_y = height * 0.25  # Restriction starts from 25% of the screen height
    max_y = height - bee_rect.height
    bee_rect.centery = max(min_y, min(mouse_y, max_y))

    # Keep bee within the screen bounds horizontally
    if bee_rect.left < 0:
        bee_rect.left = 0
    if bee_rect.right > width:
        bee_rect.right = width

    # Update flower positions
    for flower_rect in flowers[:]:
        flower_rect.y += flower_speed

        # Check for collision with the bee
        if bee_rect.colliderect(flower_rect):
            flowers.remove(flower_rect)
            score += 1
            has_collected_flower = True  # Set flag to true when the bee collects a flower
            gulp_sound.play()  # Play gulp sound when bee collects a flower
            # Update high score if the new score is higher
            if score > high_score:
                high_score = score

        # If flower goes off the screen
        if flower_rect.top > height:
            flowers.remove(flower_rect)
            score -= 5  # Decrease score when flower hits the floor
            doh_sound.play()  # Play "doh" sound when flower hits the floor

    # Check for game over condition
    if score <= 0 and has_collected_flower:
        game_over = True

    # Spawn new flowers at intervals
    spawn_timer += clock.get_time()
    if spawn_timer >= spawn_delay:
        flowers.append(spawn_flower())
        spawn_timer = 0  # Reset timer after spawning a new flower

    # Increase difficulty
    difficulty_timer += clock.get_time()
    if difficulty_timer >= difficulty_increase_interval:
        flower_speed += flower_speed_increment
        for _ in range(flower_spawn_increment):
            flowers.append(spawn_flower())
        difficulty_timer = 0  # Reset timer after increasing difficulty

    # Draw bee and flowers
    window.blit(bee_image, bee_rect)
    for flower_rect in flowers:
        window.blit(flower_image, flower_rect)

    # Draw score and high score
    score_text = font.render(f"Score: {score}", True, WHITE)
    window.blit(score_text, (10, 10))
    
    high_score_text = font.render(f"High Score: {high_score}", True, WHITE)
    window.blit(high_score_text, ((window.get_width() / 2) - 100, 10))

    # Update display
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()
