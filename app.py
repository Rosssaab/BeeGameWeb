from flask import Flask, render_template, request, jsonify, url_for
import os

app = Flask(__name__, static_url_path='/static')

# File to store high score
SCORE_FILE = "high_score.txt"

# Function to read high score from file
def read_high_score():
    try:
        with open(SCORE_FILE, 'r') as f:
            return int(f.read().strip())
    except (FileNotFoundError, ValueError):
        return 0

# Function to write high score to file
def write_high_score(score):
    with open(SCORE_FILE, 'w') as f:
        f.write(str(score))

# Initialize high score from file
score = 0
high_score = read_high_score()

@app.route('/health')
def health_check():
    return 'OK', 200

@app.route('/BeeGame/')
@app.route('/')
def index():
    return render_template('index.html', high_score=high_score)

@app.route('/game_state', methods=['POST'])
def game_state():
    global score, high_score
    data = request.get_json()
    game_over = False
    
    if data['action'] == 'collect_flower':
        score += 1
        if score > high_score:
            high_score = score
            write_high_score(high_score)  # Save new high score to file
    elif data['action'] == 'miss_flower':
        score = max(0, score - 5)
        if score == 0:  # Game over when score reaches 0
            game_over = True
    elif data['action'] == 'reset_score':
        score = 0

    return jsonify({
        'score': score,
        'high_score': high_score,
        'game_over': game_over
    })

if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=8086)
