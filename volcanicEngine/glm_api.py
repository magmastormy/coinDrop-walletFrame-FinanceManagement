import sys
import json
from zhipuai import ZhipuAI
from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env from the backend directory
backend_env_path = Path(__file__).parent.parent / 'backend' / '.env'
print(f"Looking for .env file at: {backend_env_path}")
print(f"File exists: {backend_env_path.exists()}")

if backend_env_path.exists():
    with open(backend_env_path, 'r') as f:
        print("Contents of .env file:")
        print(f.read())

load_dotenv(backend_env_path)
print(f"Environment variables after loading:")
print(f"ZHIPU_API_KEY present: {'ZHIPU_API_KEY' in os.environ}")

# Get the API key, model, and messages from command - line arguments
api_key = os.getenv('ZHIPU_API_KEY')

if len(sys.argv) < 2:
    print("Usage: python glm_api.py <model_name>")
    print("Example: python glm_api.py glm-4")
    sys.exit(1)

model = sys.argv[1]

# Use a hardcoded message for testing
messages = [{"role": "user", "content": "Hello"}]

if not api_key:
    print("Error: ZHIPU_API_KEY environment variable is not set")
    print(f"Environment file path: {backend_env_path}")
    print("Please ensure the API key is properly set in your backend/.env file")
    print("Format should be: ZHIPU_API_KEY=your_api_key_here")
    sys.exit(1)

client = ZhipuAI(api_key=api_key)
response = client.chat.completions.create(
    model=model,
    messages=messages,
    stream=True
)

results = []
for chunk in response:
    # Convert the ChoiceDelta object to a dictionary or a JSON-compatible format
    choice_delta = chunk.choices[0].delta
    results.append({
        'content': choice_delta.content,  # Use the correct attribute
        # Replace 'other_attribute' with the actual attribute name(s) available in ChoiceDelta
        # For example, if there's an attribute called 'additional_info', use that instead
        'additional_info': choice_delta.additional_info if hasattr(choice_delta, 'additional_info') else None
    })

# Print the JSON output with UTF-8 encoding
print(json.dumps(results, ensure_ascii=False).encode('utf-8').decode('utf-8'))