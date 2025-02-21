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
load_dotenv(backend_env_path)

# Get the API key and model
api_key = os.getenv('ZHIPU_API_KEY')
model = os.getenv('ZHIPUAI_MODEL', 'glm-4-flash')

def write_error(error_msg):
    sys.stderr.write(f"Error: {error_msg}\n")
    sys.stderr.flush()
    print(json.dumps({"error": error_msg}))
    sys.stdout.flush()

def write_response(response):
    print(json.dumps({"response": response}))
    sys.stdout.flush()

if not api_key:
    write_error("ZHIPU_API_KEY environment variable is not set")
    sys.exit(1)

# Get messages from command line arguments
try:
    if len(sys.argv) <= 1:
        write_error("No messages provided in command line arguments")
        sys.exit(1)
    
    messages_json = sys.argv[1]
    messages_data = json.loads(messages_json)
    
    if not isinstance(messages_data, list):
        messages_data = [messages_data]
    
    # Ensure messages are in the correct format
    messages = []
    for msg in messages_data:
        if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
            messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
        else:
            write_error("Invalid message format. Each message must have 'role' and 'content'")
            sys.exit(1)
        
except json.JSONDecodeError as e:
    write_error(f"Invalid JSON format: {str(e)}")
    sys.exit(1)
except Exception as e:
    write_error(f"Invalid messages format: {str(e)}")
    sys.exit(1)

try:
    client = ZhipuAI(api_key=api_key)
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

    write_response(full_response)

except Exception as e:
    error_msg = str(e)
    if "insufficient balance" in error_msg.lower():
        write_error("Your Zhipu AI account has insufficient balance. Please recharge your account.")
    else:
        write_error(f"AI API error: {str(e)}")
    sys.exit(1)