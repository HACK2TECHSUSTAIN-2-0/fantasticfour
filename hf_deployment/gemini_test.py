from dotenv import load_dotenv
import os
import requests

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
assert API_KEY

url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
print("DEBUG GEMINI_API_KEY:", repr(API_KEY))

resp = requests.post(
    f"{url}?key={API_KEY}",
    json={
        "contents": [
            {
                "role": "user",
                "parts": [{"text": "Reply OK"}]
            }
        ]
    },
    timeout=10
)

print(resp.status_code)
print(resp.text)
