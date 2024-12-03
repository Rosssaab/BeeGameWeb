from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Game state variables
score = 0
high_score = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game_state', methods=['POST'])
def game_state():
    global score, high_score
    data = request.get_json()
    
    # Update game state based on data from the frontend
    # Example: data might contain actions like 'collect_flower' or 'miss_flower'
    if data['action'] == 'collect_flower':
        score += 1
        if score > high_score:
            high_score = score
    elif data['action'] == 'miss_flower':
        score -= 5

    # Check for game over condition
    game_over = score <= 0

    return jsonify({
        'score': score,
        'high_score': high_score,
        'game_over': game_over
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
