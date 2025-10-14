from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import socket
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)

def extract_domain(user_input):
    """Extract domain from full URL or return raw input if it's a domain or IP"""
    # If input doesn't have scheme, add dummy scheme
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
        # Step 1: Extract domain or IP from full URL
        domain_or_ip = extract_domain(user_input)

        # Step 2: Resolve domain to IP
        try:
            resolved_ip = socket.gethostbyname(domain_or_ip)
        except socket.gaierror:
            return jsonify({"error": "Invalid domain or IP"}), 400

        # Step 3: Use IP geolocation API
        response = requests.get(f"https://ipapi.co/{resolved_ip}/json/")
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch IP info"}), 500

        ip_data = response.json()

        result = {
            "resolved_ip": resolved_ip,
            "city": ip_data.get("city"),
            "region": ip_data.get("region"),
            "country_name": ip_data.get("country_name"),
            "org": ip_data.get("org"),
            "timezone": ip_data.get("timezone"),
            "latitude": ip_data.get("latitude"),
            "longitude": ip_data.get("longitude")
        }

        return jsonify(result)

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Server error"}), 500

if __name__ == "__main__":
    app.run(debug=True)
