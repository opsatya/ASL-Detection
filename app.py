from flask import Flask, request, jsonify
import base64
import numpy as np
from PIL import Image
from io import BytesIO
import os
import time
import logging
import traceback
from flask_cors import CORS
from keras.models import load_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

CORS(app)

# Security: Limit max upload size to 2MB
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB max request

# Load model once when the server starts
MODEL_PATH = 'model/cnn8grps_rad1_model (3).h5'
model = load_model(MODEL_PATH)

# Define the ASL character mapping (A-Z, excluding J and Z which require movement)
ASL_CHAR_MAP = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X', 'Y'
]

def preprocess_image(base64_data):
    """
    Convert base64 image data to preprocessed numpy array for model prediction
    
    Args:
        base64_data (str): Base64 encoded image data (with or without data URL header)
        
    Returns:
        numpy.ndarray: Preprocessed image array ready for model prediction or None if processing fails
    """
    try:
        logger.debug("Starting image preprocessing")
        
        # Validate input
        if not base64_data or not isinstance(base64_data, str):
            logger.error("Invalid base64 data: Empty or not a string")
            return None
            
        # Remove data URL header if present
        if 'base64,' in base64_data:
            base64_data = base64_data.split('base64,')[1].strip()
        elif ',' in base64_data:  # Fallback for other possible formats
            base64_data = base64_data.split(',')[1]
        
        # Add padding if needed (base64 length should be divisible by 4)
        padding = len(base64_data) % 4
        if padding:
            base64_data += '=' * (4 - padding)
            
        # Decode base64 to image
        try:
            image_data = base64.b64decode(base64_data)
            image = Image.open(BytesIO(image_data)).convert('RGB')
        except Exception as e:
            logger.error(f"Failed to decode image: {str(e)}")
            return None
        
        # Log image dimensions before resize
        logger.debug(f"Original image size: {image.size}")
        
        # Convert to RGB if needed (in case of RGBA or other formats)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to 400x400 (model's expected input size)
        image = image.resize((400, 400), Image.Resampling.LANCZOS)
        
        # Convert to numpy array and normalize to [0,1]
        image_array = np.array(image, dtype=np.float32) / 255.0
        
        # Verify the array has the expected shape and values
        if image_array.shape != (400, 400, 3):
            logger.error(f"Unexpected image shape after preprocessing: {image_array.shape}")
            return None
            
        # Add batch dimension
        processed_image = np.expand_dims(image_array, axis=0)
        
        logger.debug("Image preprocessing completed successfully")
        return processed_image
        
    except Exception as e:
        logger.error(f"Error in preprocess_image: {str(e)}\n{traceback.format_exc()}")
        return None

@app.route('/')
def index():
    return jsonify({
        'status': 'running',
        'message': 'ASL Detection API is running',
        'available_endpoints': {
            'GET /': 'API status',
            'POST /predict': 'Predict ASL sign from image (expects base64 image in JSON body)'
        }
    })

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    print("⏺ Request received at /predict")
    """
    Endpoint to receive base64 image and return ASL prediction
    """
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            logger.error("No image data received in request")
            return jsonify({
                'status': 'error',
                'error': 'No image data received'
            }), 400

        logger.info("Received prediction request")
        
        # Log the first 100 chars of the image data for debugging
        logger.debug(f"Image data received (first 100 chars): {data['image'][:100]}...")
        
        # Process the image
        image_array = preprocess_image(data['image'])
        if image_array is None:
            logger.error("Failed to preprocess image")
            return jsonify({
                'status': 'error',
                'error': 'Failed to process image'
            }), 400

        # Make prediction
        start_time = time.time()
        try:
            predictions = model.predict(image_array)
        except Exception as e:
            logger.error(f"Model prediction error: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'status': 'error',
                'error': 'Error during model prediction'
            }), 500

        prediction_time = (time.time() - start_time) * 1000  # Convert to ms

        # Get top prediction
        predicted_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_index])
        predicted_char = ASL_CHAR_MAP[predicted_index]

        # Apply confidence threshold    
        if confidence < 0.4:
            predicted_char = "Uncertain"

        logger.info(f"Prediction: {predicted_char} (Confidence: {confidence*100:.1f}%, Time: {prediction_time:.1f}ms)")

        return jsonify({
            'status': 'success',
            'prediction': predicted_char,
            'confidence': confidence,
            'processing_time_ms': prediction_time
        })

    except Exception as e:
        error_msg = f"Prediction error: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'error': error_msg
        }), 500

if __name__ == '__main__':
    try:
        logger.info("Starting ASL Detection API server...")
        logger.info(f"Model loaded from: {MODEL_PATH}")
        logger.info(f"Available ASL characters: {', '.join(ASL_CHAR_MAP)}")
        
        # Run the app
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=False,  # Set to False in production
            threaded=True  # Handle multiple requests in parallel
        )
    except Exception as e:
        logger.critical(f"Failed to start server: {str(e)}\n{traceback.format_exc()}")