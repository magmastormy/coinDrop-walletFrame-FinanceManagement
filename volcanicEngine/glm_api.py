import sys
import json
import argparse
from zhipuai import ZhipuAI
from dotenv import load_dotenv
import os
from pathlib import Path
import io
import signal

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

# Parse command line arguments
parser = argparse.ArgumentParser(description="ZhipuAI API client")
parser.add_argument('--server-mode', action='store_true', help="Run in server mode")
parser.add_argument('messages', nargs='?', help="JSON-encoded messages")

args = parser.parse_args()

# Initialize the AI client
client = ZhipuAI(api_key=api_key)

def process_messages(messages_data):
    # Ensure messages are in the correct format
    messages = []
    if not isinstance(messages_data, list):
        messages_data = [messages_data]
        
    for msg in messages_data:
        if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
            messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
        else:
            return None, "Invalid message format. Each message must have 'role' and 'content'"
    
    return messages, None

def handle_request(messages_data):
    try:
        messages, error = process_messages(messages_data)
        if error:
            return {"error": error}
        
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

        return {"response": full_response}

    except Exception as e:
        error_msg = str(e)
        if "insufficient balance" in error_msg.lower():
            return {"error": "Your Zhipu AI account has insufficient balance. Please recharge your account."}
        else:
            return {"error": f"AI API error: {str(e)}"}

# Handle SIGTERM gracefully
def handle_sigterm(signum, frame):
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)

# Run in server mode if requested
if args.server_mode:
    # Signal that we're ready
    print("READY")
    sys.stdout.flush()
    
    # Process requests from stdin
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
                
            try:
                request = json.loads(line)
                if 'messages' in request:
                    result = handle_request(request['messages'])
                    print(json.dumps(result))
                    sys.stdout.flush()
                else:
                    print(json.dumps({"error": "No messages field in request"}))
                    sys.stdout.flush()
            except json.JSONDecodeError:
                print(json.dumps({"error": "Invalid JSON in request"}))
                sys.stdout.flush()
                
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(json.dumps({"error": f"Server error: {str(e)}"}))
            sys.stdout.flush()
    
    sys.exit(0)

# One-shot mode (backward compatibility)
if not args.messages:
    write_error("No messages provided in command line arguments")
    sys.exit(1)

try:
    messages_data = json.loads(args.messages)
    result = handle_request(messages_data)
    
    if "error" in result:
        write_error(result["error"])
        sys.exit(1)
    else:
        write_response(result["response"])
        
except json.JSONDecodeError as e:
    write_error(f"Invalid JSON format: {str(e)}")
    sys.exit(1)
except Exception as e:
    write_error(f"Unexpected error: {str(e)}")
    sys.exit(1)