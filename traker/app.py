from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import socket
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)

def extract_domain(user_input):
    if not user_input.startswith("http://") and not user_input.startswith("https://"):
        user_input = "http://" + user_input

    parsed_url = urlparse(user_input)
    return parsed_url.hostname

@app.route("/api/track", methods=["POST"])
def track():
    data = request.get_json()
    user_input = data.get("input")

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    try:
        domain_or_ip = extract_domain(user_input)

        try:
            resolved_ip = socket.gethostbyname(domain_or_ip)
        except socket.gaierror:
            return jsonify({"error": "Invalid domain or IP"}), 400

        response = requests.get(f"http://ip-api.com/json/{resolved_ip}")
        
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch IP info"}), 500

        ip_data = response.json()

        result = {
            "resolved_ip": resolved_ip,
            "city": ip_data.get("city"),
            "region": ip_data.get("regionName"),
            "country_name": ip_data.get("country"),
            "org": ip_data.get("isp"),
            "timezone": ip_data.get("timezone"),
            "latitude": ip_data.get("lat"),
            "longitude": ip_data.get("lon")
        }

        return jsonify(result)

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Server error"}), 500

if __name__ == "__main__":
    app.run(debug=True)