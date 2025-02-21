import sys
import json
from zhipuai import ZhipuAI
from dotenv import load_dotenv
import os
from pathlib import Path
import io

# Set stdout to use UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load .env from the backend directory
backend_env_path = Path(__file__).parent.parent / 'backend' / '.env'
print(f"Looking for .env file at: {backend_env_path}")
print(f"File exists: {backend_env_path.exists()}")

load_dotenv(backend_env_path)
print(f"Environment variables after loading:")
print(f"ZHIPU_API_KEY present: {'ZHIPU_API_KEY' in os.environ}")

# Get the API key, model, and messages from command - line arguments
api_key = os.getenv('ZHIPU_API_KEY')
model = os.getenv('ZHIPUAI_MODEL', 'glm-4-flash')  # Default to glm-4-0520 if not set

print("Model: ", model)

# Use a hardcoded message for testing
messages = [{"role": "user", "content": "Hello"}]

if not api_key:
    print("Error: ZHIPU_API_KEY environment variable is not set")
    print(f"Environment file path: {backend_env_path}")
    print("Please ensure the API key is properly set in your backend/.env file")
    print("Format should be: ZHIPU_API_KEY=your_api_key_here")
    sys.exit(1)

client = ZhipuAI(api_key=api_key)
try:
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True
    )

    # Combine content chunks into a single response
    full_response = ""
    for chunk in response:
        choice_delta = chunk.choices[0].delta
        if hasattr(choice_delta, 'content') and choice_delta.content is not None:
            full_response += choice_delta.content

    # Print the final response with UTF-8 encoding
    print("\nAI Response:")
    print(full_response)

except Exception as e:
    error_message = str(e)
    if "429" in error_message and "欠费" in error_message:
        print("Error: Your Zhipu AI account has insufficient balance. Please recharge your account.")
        print("Original error:", error_message)
    else:
        print(f"An error occurred while calling the Zhipu AI API: {str(e)}")
    sys.exit(1)