import sys
import json
from zhipuai import ZhipuAI
from dotenv import load_dotenv
import os

load_dotenv()
# Get the API key, model, and messages from command - line arguments
api_key = os.getenv('ZHIPU_API_KEY')
model = sys.argv[1]
messages = json.loads(sys.argv[2])

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