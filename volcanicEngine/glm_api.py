import sys
import json
import argparse
from zhipuai import ZhipuAI
from dotenv import load_dotenv
import os
from pathlib import Path
import io
import signal
import re
import time
import threading
import traceback

# Set stdout to use UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

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

def sanitize_unicode(text):
    """Remove invalid Unicode characters and surrogate pairs"""
    if not isinstance(text, str):
        return text
        
    # Replace lone surrogates with the Unicode replacement character
    text = text.encode('utf-16', 'surrogatepass').decode('utf-16', 'replace')
    
    # Remove any other control characters except common whitespace
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    return text

def process_messages(messages_data):
    # Ensure messages are in the correct format
    messages = []
    if not isinstance(messages_data, list):
        messages_data = [messages_data]
        
    for msg in messages_data:
        if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
            # Sanitize the content to remove invalid Unicode
            sanitized_content = sanitize_unicode(msg['content'])
            
            messages.append({
                'role': msg['role'],
                'content': sanitized_content
            })
        else:
            return None, "Invalid message format. Each message must have 'role' and 'content'"
    
    return messages, None

def handle_request(messages_data, request_id=None):
    start_time = time.time()
    req_id = request_id or f"req-{int(time.time())}-{os.urandom(3).hex()}"
    
    try:
        print(f"[{req_id}] Processing request with {len(messages_data) if isinstance(messages_data, list) else 1} messages", file=sys.stderr)
        sys.stderr.flush()
        
        messages, error = process_messages(messages_data)
        if error:
            print(f"[{req_id}] Error processing messages: {error}", file=sys.stderr)
            sys.stderr.flush()
            return {"error": error, "request_id": req_id}
        
        # Log sanitized messages for debugging
        print(f"[{req_id}] Processed {len(messages)} sanitized messages", file=sys.stderr)
        sys.stderr.flush()
        
        # Set a timeout for the API call
        timeout_seconds = 25  # 25 second timeout for API call
        
        # Create a thread to handle the API call
        response_data = {"response": None, "error": None}
        api_thread = threading.Thread(target=call_api, args=(messages, response_data, req_id))
        api_thread.daemon = True
        api_thread.start()
        
        # Wait for the thread to complete with timeout
        api_thread.join(timeout_seconds)
        
        # Check if the thread is still alive (timeout occurred)
        if api_thread.is_alive():
            print(f"[{req_id}] API call timed out after {timeout_seconds} seconds", file=sys.stderr)
            sys.stderr.flush()
            return {"error": f"API request timed out after {timeout_seconds} seconds", "request_id": req_id}
        
        # Check for errors
        if response_data["error"]:
            print(f"[{req_id}] API call failed: {response_data['error']}", file=sys.stderr)
            sys.stderr.flush()
            return {"error": response_data["error"], "request_id": req_id}
        
        # Sanitize the response
        sanitized_response = sanitize_unicode(response_data["response"])
        
        # Log completion time
        elapsed = time.time() - start_time
        print(f"[{req_id}] Request completed in {elapsed:.2f} seconds", file=sys.stderr)
        sys.stderr.flush()
        
        return {"response": sanitized_response, "request_id": req_id, "elapsed_seconds": elapsed}

    except Exception as e:
        elapsed = time.time() - start_time
        error_msg = str(e)
        print(f"[{req_id}] Exception in handle_request: {error_msg}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        
        if "insufficient balance" in error_msg.lower():
            return {
                "error": "Your Zhipu AI account has insufficient balance. Please recharge your account.", 
                "request_id": req_id,
                "elapsed_seconds": elapsed
            }
        else:
            # Sanitize error message to ensure it's valid UTF-8
            safe_error = sanitize_unicode(str(e))
            return {
                "error": f"AI API error: {safe_error}", 
                "request_id": req_id,
                "elapsed_seconds": elapsed
            }

def call_api(messages, result_dict, req_id):
    """Thread function to call the API with timeout handling"""
    try:
        print(f"[{req_id}] Starting API call", file=sys.stderr)
        sys.stderr.flush()
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True
        )

        # Combine content chunks into a single response
        full_response = ""
        chunk_count = 0
        for chunk in response:
            chunk_count += 1
            choice_delta = chunk.choices[0].delta
            if hasattr(choice_delta, 'content') and choice_delta.content is not None:
                full_response += choice_delta.content
                
            # Periodically log progress for long responses
            if chunk_count % 50 == 0:
                print(f"[{req_id}] Received {chunk_count} chunks so far", file=sys.stderr)
                sys.stderr.flush()
        
        print(f"[{req_id}] API call completed with {chunk_count} chunks", file=sys.stderr)
        sys.stderr.flush()
        
        result_dict["response"] = full_response
    except Exception as e:
        print(f"[{req_id}] Error in API call: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        result_dict["error"] = f"API call error: {sanitize_unicode(str(e))}"


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
    request_count = 0
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            request_count += 1
            request_id = f"req-{request_count}-{int(time.time())}"
                
            try:
                request = json.loads(line)
                if 'messages' in request:
                    # Extract request_id if provided
                    req_id = request.get('request_id', request_id)
                    
                    # Handle the request with timeout protection
                    result = handle_request(request['messages'], req_id)
                    print(json.dumps(result))
                    sys.stdout.flush()
                else:
                    print(json.dumps({"error": "No messages field in request", "request_id": request_id}))
                    sys.stdout.flush()
            except json.JSONDecodeError as e:
                print(json.dumps({"error": f"Invalid JSON in request: {str(e)}", "request_id": request_id}))
                sys.stdout.flush()
                
        except KeyboardInterrupt:
            print(json.dumps({"error": "Server interrupted", "request_id": "system"}))
            sys.stdout.flush()
            break
        except Exception as e:
            error_msg = sanitize_unicode(str(e))
            print(json.dumps({"error": f"Server error: {error_msg}", "request_id": request_id}))
            traceback.print_exc(file=sys.stderr)
            sys.stderr.flush()
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