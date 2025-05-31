import uuid
import shutil
import base64
import os
import requests
import tempfile
import nltk
import torch
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import subprocess
from tqdm import tqdm
import time

import fitz  # from pymupdf package
from styletts2 import tts

# Firebase imports
import firebase_admin
from firebase_admin import credentials, storage

# Bypass proxy for localhost
os.environ['NO_PROXY'] = 'localhost,127.0.0.1'

app = Flask(__name__)
# Allow all origins, all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Firebase Admin SDK
cred = credentials.Certificate('graduationproject-586b4-firebase-adminsdk-fbsvc-3e8050edb7.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'graduationproject-586b4.firebasestorage.app'
})

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# Monkey-patch torch.load to bypass PyTorch 2.6+ restriction
_orig_torch_load = torch.load
def _torch_load_full(*args, **kwargs):
    kwargs['weights_only'] = False
    return _orig_torch_load(*args, **kwargs)
torch.load = _torch_load_full

# Ensure the NLTK tokenizer is available
nltk.download('punkt', quiet=True)

print(" ^=^t^d Loading StyleTTS2 model ^ ")
engine = tts.StyleTTS2()
print(" ^|^e Model loaded.")

# Function to upload video to Firebase Storage
def upload_video_to_firebase(file_path: str, file_name: str) -> str:
    """
    Upload video file to Firebase Storage and return the download URL
    """
    try:
        bucket = storage.bucket()
        
        # Generate unique filename with timestamp
        timestamp = str(int(time.time()))
        unique_filename = f"videos/{timestamp}_{file_name}"
        
        # Upload file to Firebase Storage
        blob = bucket.blob(unique_filename)
        blob.upload_from_filename(file_path)
        
        # Make the blob publicly accessible
        blob.make_public()
        
        # Get the public download URL
        download_url = blob.public_url
        
        print(f"Video uploaded to Firebase Storage: {unique_filename}")
        return download_url
        
    except Exception as e:
        print(f"Error uploading video to Firebase: {str(e)}")
        raise e

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        image_paths = data.get('images')

        if not prompt or not image_paths:
            return jsonify({"error": "Missing 'prompt' or 'images' field"}), 400

        images_data = []
        for path in image_paths:
            if not os.path.exists(path):
                return jsonify({"error": f"Image not found: {path}"}), 400
            with open(path, 'rb') as img_file:
                image_data = base64.b64encode(img_file.read()).decode('utf-8')
                images_data.append(image_data)

        payload = {
            "model": "gemma3:27b",
            "prompt": prompt,
            "images": images_data,
            "stream": False
        }

        response = requests.post("http://localhost:11434/api/generate", json=payload)
        if response.status_code == 200:
            return jsonify({"response": response.json().get('response')})
        else:
            return jsonify({"error": "Failed to generate response", "details": response.text}), response.status_code

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route('/generate-and-speak', methods=['POST'])
def generate_and_speak():
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        image_paths = data.get('images')

        if not prompt or not image_paths:
            return jsonify({"error": "Missing 'prompt' or 'images' field"}), 400

        images_data = []
        for path in image_paths:
            if not os.path.exists(path):
                return jsonify({"error": f"Image not found: {path}"}), 400
            with open(path, 'rb') as img_file:
                image_data = base64.b64encode(img_file.read()).decode('utf-8')
                images_data.append(image_data)

        payload = {
            "model": "gemma3:27b",
            "prompt": prompt,
            "images": images_data,
            "stream": False
        }

        response = requests.post("http://localhost:11434/api/generate", json=payload)
        if response.status_code != 200:
            return jsonify({"error": "Failed to generate response", "details": response.text}), response.status_code

        gemma_text = response.json().get('response', '')
        if not gemma_text:
            return jsonify({"error": "Empty response from gemma3"}), 500

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmpfile:
            output_path = tmpfile.name

        engine.inference(gemma_text, output_wav_file=output_path)

        return send_file(output_path, mimetype="audio/wav", as_attachment=True, download_name="gemma3_speech.wav")

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route('/generate-video', methods=['POST'])
def generate_video():
    try:
        uploaded_file = request.files.get('file')
        if not uploaded_file:
            return jsonify({"error": "Missing uploaded file"}), 400

        file_data = uploaded_file.read()
        if not file_data:
            return jsonify({"error": "Uploaded file is empty"}), 400

        folder_code = str(uuid.uuid4())[:8]
        image_folder = f"images_{folder_code}"
        os.makedirs(image_folder, exist_ok=True)

        try:
            pdf = fitz.open(stream=file_data, filetype="pdf")
        except Exception as e:
            return jsonify({"error": "Failed to open PDF", "details": str(e)}), 400

        image_paths = []
        for i, page in enumerate(pdf):
            pix = page.get_pixmap(dpi=200)
            image_path = os.path.join(image_folder, f"img{i}.png")
            pix.save(image_path)
            image_paths.append(image_path)
        pdf.close()

        slide_videos = []
        # Progress bar over slide processing
        for idx, img_path in enumerate(tqdm(image_paths, desc="Processing slides", unit="slide")):
            with open(img_path, 'rb') as img_file:
                image_data = base64.b64encode(img_file.read()).decode('utf-8')

            payload = {
                "model": "gemma3:27b",
                "prompt": "Extract the text in the image and generate a text to read by instructor about this slide",
                "images": [image_data],
                "stream": False
            }
            resp = requests.post("http://localhost:11434/api/generate", json=payload)
            resp.raise_for_status()
            text = resp.json().get('response', f"Slide {idx}")

            # Generate or fallback audio
            audio_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            audio_file.close()
            try:
                engine.inference(text, output_wav_file=audio_file.name)
            except Exception:
                os.unlink(audio_file.name)
                silent = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
                silent.close()
                subprocess.run([
                    "ffmpeg", "-y",
                    "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
                    "-t", "2", silent.name
                ], check=True)
                audio_path = silent.name
            else:
                audio_path = audio_file.name

            slide_vid = os.path.join(tempfile.gettempdir(), f"slide_{folder_code}_{idx}.mp4")
            cmd = [
                "ffmpeg", "-y",
                "-fflags", "+genpts",
                "-loop", "1", "-i", img_path,
                "-i", audio_path,
                "-c:v", "libx264", "-tune", "stillimage",
                "-vf", "scale=ceil(iw/2)*2:ceil(ih/2)*2",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-shortest",
                slide_vid
            ]
            subprocess.run(cmd, check=True)

            slide_videos.append(slide_vid)
            os.unlink(audio_path)

        if not slide_videos:
            shutil.rmtree(image_folder)
            return jsonify({"error": "No slide videos generated."}), 500

        # Progress bar for concatenation
        list_file = os.path.join(tempfile.gettempdir(), f"concat_{folder_code}.txt")
        with open(list_file, "w") as lf:
            for vid in tqdm(slide_videos, desc="Writing concat list", unit="clip"):
                lf.write(f"file '{vid}'\n")

        final_video_path = os.path.join(tempfile.gettempdir(), f"final_video_{folder_code}.mp4")
        concat_cmd = [
            "ffmpeg", "-y",
            "-fflags", "+genpts",
            "-avoid_negative_ts", "make_zero",
            "-f", "concat", "-safe", "0",
            "-i", list_file,
            "-c", "copy",
            final_video_path
        ]
        subprocess.run(concat_cmd, check=True)

        shutil.rmtree(image_folder)
        os.remove(list_file)
        for vid in slide_videos:
            os.remove(vid)

        # Upload video to Firebase Storage
        download_url = upload_video_to_firebase(final_video_path, f"presentation_video_{folder_code}.mp4")

        # Get file size before cleanup
        file_size = os.path.getsize(final_video_path)
        
        # Clean up the local file after upload
        os.remove(final_video_path)

        return jsonify({
            "download_url": download_url,
            "file_name": f"presentation_video_{folder_code}.mp4",
            "file_size": file_size,
            "timestamp": int(time.time()),
            "message": "Video generated and uploaded successfully"
        })

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route('/list-videos', methods=['GET'])
def list_videos():
    """
    List all videos stored in Firebase Storage
    """
    try:
        bucket = storage.bucket()
        blobs = bucket.list_blobs(prefix='videos/')
        
        videos = []
        for blob in blobs:
            if blob.name.endswith('.mp4'):
                videos.append({
                    "name": blob.name,
                    "file_name": blob.name.split('/')[-1],
                    "size": blob.size,
                    "created": blob.time_created.isoformat() if blob.time_created else None,
                    "download_url": blob.public_url if blob.public_url else f"https://storage.googleapis.com/{bucket.name}/{blob.name}"
                })
        
        return jsonify({"videos": videos})
        
    except Exception as e:
        return jsonify({"error": "Failed to list videos", "message": str(e)}), 500

@app.route('/delete-video', methods=['DELETE'])
def delete_video():
    """
    Delete a video from Firebase Storage
    """
    try:
        data = request.get_json()
        video_name = data.get('video_name')
        
        if not video_name:
            return jsonify({"error": "Missing 'video_name' field"}), 400
        
        bucket = storage.bucket()
        blob = bucket.blob(video_name)
        
        if blob.exists():
            blob.delete()
            return jsonify({"message": "Video deleted successfully"})
        else:
            return jsonify({"error": "Video not found"}), 404
            
    except Exception as e:
        return jsonify({"error": "Failed to delete video", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7111, debug=True)