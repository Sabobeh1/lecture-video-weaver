
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# ---------- Firebase / GCP ----------
from firebase_admin import credentials, initialize_app, storage as fb_storage
from google.cloud import firestore

# ---------------- basic config ----------------
UPLOAD_DIR = "/sabobeh/FileFromUser"
ALLOWED = {"pdf", "ppt", "pptx"}               # limit extensions

os.makedirs(UPLOAD_DIR, exist_ok=True)         # ensure local dir exists

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024   # 200 MB
CORS(app, supports_credentials=True)

# --------------   Firebase set‑up  --------------
cred = credentials.Certificate("serviceAccount.json")  # keep this json off‑repo!
initialize_app(cred, {"storageBucket": "YOUR_BUCKET.appspot.com"})
db      = firestore.Client()
bucket  = fb_storage.bucket()


# ----------------- helpers -----------------
def allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED


# ----------------- routes ------------------
@app.route("/api/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "Missing form field 'file'"}), 400

    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    if not allowed(f.filename):
        return jsonify({"error": "File type not allowed"}), 400

    fname = secure_filename(f.filename)
    local_path = os.path.join(UPLOAD_DIR, fname)
    f.save(local_path)                                   # 1️⃣ save to disk

    # 2️⃣ optional – push same file to Cloud Storage
    blob = bucket.blob(f"uploads/{fname}")
    blob.upload_from_filename(local_path)
    public_url = blob.generate_signed_url(datetime.utcnow().replace(year=2099))

    # 3️⃣ store metadata in Firestore
    db.collection("uploaded_files").add(
        {
            "filename": fname,
            "server_path": local_path,
            "gcs_url": public_url,
            "size": os.path.getsize(local_path),
            "uploaded_at": firestore.SERVER_TIMESTAMP,
        }
    )

    return jsonify({"success": True, "public_url": public_url}), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True) 
