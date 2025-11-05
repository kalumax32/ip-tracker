
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests
import socket
from urllib.parse import urlparse
import os

app = Flask(__name__)
CORS(app)

# --- Database Configuration ---
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
# ------------------------------


# --- Database Model Definition (Corrected) ---
# We make `resolved_ip` the primary key. This is more efficient
# and fixes our lookup bug.
class IpRecord(db.Model):
    resolved_ip = db.Column(db.String(100), primary_key=True) # <-- CHANGED
    city = db.Column(db.String(100))
    region = db.Column(db.String(100))
    country_name = db.Column(db.String(100))
    org = db.Column(db.String(200))
    timezone = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
# --------------------------------

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

        # --- MODIFIED LOGIC (Corrected) ---
        
        # 1. Check database (cache) first
        # We need to be inside an application context to use db.session
        with app.app_context():
            # Now this `get` will work correctly because resolved_ip is the primary key
            cached_record = db.session.get(IpRecord, resolved_ip) 
            
            if cached_record:
                # If found, return data from cache
                print(f"Returning from cache: {resolved_ip}") # For debugging
                result = {
                    "resolved_ip": cached_record.resolved_ip,
                    "city": cached_record.city,
                    "region": cached_record.region,
                    "country_name": cached_record.country_name,
                    "org": cached_record.org,
                    "timezone": cached_record.timezone,
                    "latitude": cached_record.latitude,
                    "longitude": cached_record.longitude
                }
                return jsonify(result)

        # 2. If not in cache, fetch from external API
        print(f"Fetching from API: {resolved_ip}") # For debugging
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

        # 3. Save the new result to the database
        with app.app_context():
            new_record = IpRecord(
                resolved_ip=resolved_ip,  # pyright: ignore[reportCallIssue]
                city=result["city"],  # pyright: ignore[reportCallIssue]
                region=result["region"],  # pyright: ignore[reportCallIssue]
                country_name=result["country_name"],  # pyright: ignore[reportCallIssue]
                org=result["org"],  # pyright: ignore[reportCallIssue]
                timezone=result["timezone"],  # pyright: ignore[reportCallIssue]
                latitude=result["latitude"],  # pyright: ignore[reportCallIssue]
                longitude=result["longitude"]  # pyright: ignore[reportCallIssue]
            )
            db.session.add(new_record)
            db.session.commit()
            print(f"Saved to cache: {resolved_ip}") # For debugging
        # --- END OF MODIFIED LOGIC ---

        return jsonify(result)

    except Exception as e:
        print("Error:", e)
        # Rollback in case of error during db commi
        with app.app_context():
            db.session.rollback()
        return jsonify({"error": "Server error"}), 500

if __name__ == "__main__":
    with app.app_context():
        # This will create the database file and tables if they don't exist
        db.create_all()
    app.run(debug=True)