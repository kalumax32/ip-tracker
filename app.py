from flask import Flask, render_template, request, jsonify
import requests


app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/track_ip', methods=['POST'])
def track_ip():
    ip = request.form['ip']
    try:
        api_key='8106572b51d5059b7a55e50843f13268' 
        response = requests.get(f'https://ipapi.co/{ip}/json/').json()
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
