from flask import Flask, render_template, request, jsonify, url_for

app = Flask(__name__, static_url_path='/static')

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
    game_over = False
    
    if data['action'] == 'collect_flower':
        score += 1
        if score > high_score:
            high_score = score
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
    app.run(debug=True, port=5001)
