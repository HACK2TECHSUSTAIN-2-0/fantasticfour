from dotenv import load_dotenv
import os
import re
import json
import requests


load_dotenv()

# Use Gemini API key - try GEMINI_API_KEY first, then OPENAI_API_KEY (in case it's set to Gemini key)
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
# If neither is set, use the provided key directly
if not api_key:
    api_key = "AIzaSyCC7n6F1Pj4ouQ6OfXlbk4WZOM8aWiu8es"

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


def enrich_alert(payload: dict) -> dict:
    triage = payload["triage"]

    # Check if API key is available
    if not api_key:
        print("⚠️ Gemini API key not configured, using fallback response")
        return fallback_response(payload, reason="Gemini API key not configured; severity-based fallback used")

    prompt = f"""You are an emergency response decision assistant.

Analyze the user message and return ONLY valid JSON. Do not include explanations, markdown code blocks, or extra text. Return ONLY the raw JSON object without any markdown formatting.

User message: "{triage['user_message']}"

Return JSON in this exact format (NO markdown, NO code blocks, just the raw JSON):
{{
    "severity": "LOW | MEDIUM | HIGH",
    "actions": [
        "instruction 1",
        "instruction 2",
        "instruction 3"
    ]
}}"""

    try:
        # Call Gemini API
        response = requests.post(
            f"{GEMINI_API_URL}?key={api_key}",
            json={
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.0,
                    "maxOutputTokens": 500,
                }
            },
            timeout=30
        )

        if response.status_code != 200:
            error_data = response.json() if response.text else {}
            error_msg = error_data.get("error", {}).get("message", response.text)
            print(f"⚠️ Gemini API error (HTTP {response.status_code}): {error_msg[:300]}")
            return fallback_response(payload, reason=f"Gemini API error (HTTP {response.status_code}); severity-based fallback used")

        response_data = response.json()
        
        # Extract text from Gemini response
        if "candidates" not in response_data or not response_data["candidates"]:
            print("⚠️ Empty response from Gemini API")
            return fallback_response(payload, reason="Gemini API returned empty response; severity-based fallback used")
        
        candidate = response_data["candidates"][0]
        if "content" not in candidate or "parts" not in candidate["content"]:
            print("⚠️ Invalid response structure from Gemini API")
            return fallback_response(payload, reason="Gemini API invalid response structure; severity-based fallback used")
        
        parts = candidate["content"]["parts"]
        if not parts or "text" not in parts[0]:
            print("⚠️ No text content in Gemini API response")
            return fallback_response(payload, reason="Gemini API no text content; severity-based fallback used")
        
        raw_text = parts[0]["text"]
        if not raw_text:
            print("⚠️ Empty text response from Gemini API")
            return fallback_response(payload, reason="Gemini API empty text; severity-based fallback used")

    except requests.exceptions.Timeout as e:
        print(f"⚠️ Gemini API request timeout: {str(e)[:300]}")
        print("⚠️ SOLUTION: Request took too long, please check your internet connection.")
        return fallback_response(payload, reason="Gemini API timeout; severity-based fallback used")
        
    except requests.exceptions.ConnectionError as e:
        print(f"⚠️ Gemini API connection error: {str(e)[:300]}")
        print("⚠️ SOLUTION: Please check your internet connection and try again.")
        return fallback_response(payload, reason="Gemini API connection error; severity-based fallback used")
        
    except requests.exceptions.RequestException as e:
        error_type = type(e).__name__
        error_msg = str(e)
        print(f"⚠️ Gemini API request error ({error_type}): {error_msg[:300]}")
        return fallback_response(payload, reason=f"Gemini API request error ({error_type}); severity-based fallback used")
        
    except json.JSONDecodeError as e:
        print(f"⚠️ Failed to parse Gemini API response as JSON: {str(e)[:300]}")
        return fallback_response(payload, reason="Gemini API JSON parse error; severity-based fallback used")
        
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        print(f"⚠️ Unexpected error calling Gemini API ({error_type}): {error_msg[:300]}")
        return fallback_response(payload, reason=f"Unexpected error ({error_type}); severity-based fallback used")

    llm_severity, actions = parse_llm_decision(raw_text)
    if llm_severity is None:
        print(f"⚠️ Failed to parse LLM response.")
        print(f"⚠️ Response preview: {raw_text[:200]}...")
        print(f"⚠️ Attempting to debug parsing...")
        # Try one more time with debug info
        import traceback
        try:
            cleaned = raw_text.strip()
            cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned, flags=re.IGNORECASE | re.MULTILINE)
            cleaned = re.sub(r"\n?```\s*$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE)
            cleaned = cleaned.replace("```", "").strip()
            test_parse = json.loads(cleaned)
            print(f"⚠️ Debug parse successful: {test_parse}")
        except Exception as e:
            print(f"⚠️ Debug parse also failed: {type(e).__name__}: {str(e)}")
        return fallback_response(payload, reason="Failed to parse LLM JSON response; severity-based fallback used")

    final_severity = resolve_final_severity(triage, llm_severity)

    officer_message = sanitize_actions(actions, triage["user_message"])

    return {
        "event_id": payload["event_id"],
        "llm_enrichment": {
            "final_category": triage["category"],
            "final_severity": final_severity,
            "officer_message": officer_message,
            "reasoning": "Gemini LLM proposed severity and actions; final severity resolved deterministically"
        }
    }


# ---------- PARSERS ----------

def parse_llm_decision(text: str):
    """
    Extract and parse JSON from LLM output safely.
    Handles nested JSON and markdown code blocks.
    """
    if not text:
        return None, []

    # Clean up the text - remove markdown code blocks if present
    text = text.strip()
    
    # Remove markdown code blocks more robustly
    # Handle ```json at start
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.IGNORECASE | re.MULTILINE)
    # Handle ``` at end
    text = re.sub(r"\n?```\s*$", "", text, flags=re.IGNORECASE | re.MULTILINE)
    # Handle any remaining ``` markers
    text = text.replace("```", "")
    text = text.strip()

    # Try to parse the entire text as JSON first
    try:
        data = json.loads(text)
        severity = data.get("severity")
        actions = data.get("actions", [])
        
        if severity in {"LOW", "MEDIUM", "HIGH"} and isinstance(actions, list):
            return severity, actions
    except json.JSONDecodeError as e:
        # If JSON is incomplete, try to extract what we can
        pass

    # If direct parsing fails, try to find JSON object using balanced braces
    depth = 0
    start = -1
    for i, char in enumerate(text):
        if char == '{':
            if depth == 0:
                start = i
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0 and start >= 0:
                json_text = text[start:i+1]
                try:
                    data = json.loads(json_text)
                    severity = data.get("severity")
                    actions = data.get("actions", [])
                    
                    if severity in {"LOW", "MEDIUM", "HIGH"} and isinstance(actions, list):
                        return severity, actions
                except json.JSONDecodeError:
                    pass
                start = -1

    # Last resort: try regex matching (less reliable for nested JSON)
    match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text)
    if match:
        json_text = match.group(0)
        try:
            data = json.loads(json_text)
            severity = data.get("severity")
            actions = data.get("actions", [])
            
            if severity in {"LOW", "MEDIUM", "HIGH"} and isinstance(actions, list):
                return severity, actions
        except json.JSONDecodeError:
            pass

    return None, []

def sanitize_actions(actions: list[str], user_message: str) -> str:
    if not actions:
        return (
            f"User reports: '{user_message}'. "
            "Immediate assessment recommended."
        )

    # Join max 3 actions into a single officer message
    return " ".join(actions[:3])


# ---------- FINAL AUTHORITY ----------

def resolve_final_severity(triage: dict, llm_severity: str | None) -> str:
    # Explicit negation always wins
    if triage.get("classification_source") == "explicit_negation":
        return triage["severity"]

    # Deterministic HIGH cannot be downgraded
    if triage["severity"] == "HIGH":
        return "HIGH"

    if llm_severity is None:
        return triage["severity"]

    rank = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
    if rank[llm_severity] > rank[triage["severity"]]:
        return llm_severity

    return triage["severity"]


def fallback_response(payload: dict, reason: str = "LLM unavailable or unparsable; severity-based fallback used"):
    """
    Generate a fallback response when LLM enrichment fails.
    
    Args:
        payload: The alert payload containing triage information
        reason: The reason for using fallback (default: generic message)
    """
    triage = payload["triage"]
    sev = triage["severity"]

    if triage.get("classification_source") == "explicit_negation":
        officer_message = (
            f"User explicitly denied needing help. "
            f"Message: '{triage['user_message']}'. "
            "No action required."
        )

    elif sev == "HIGH":
        officer_message = (
            f"User reports a high-risk situation. "
            f"Message: '{triage['user_message']}'. "
            "Treat as immediate threat. Contact user and dispatch assistance."
        )

    elif sev == "MEDIUM":
        officer_message = (
            f"User reports a concerning situation. "
            f"Message: '{triage['user_message']}'. "
            "Contact user promptly to assess risk and escalate if needed."
        )

    else:  # LOW
        officer_message = (
            f"User reports: '{triage['user_message']}'. "
            "No immediate action required."
        )

    return {
        "event_id": payload["event_id"],
        "llm_enrichment": {
            "final_category": triage["category"],
            "final_severity": sev,
            "officer_message": officer_message,
            "reasoning": reason
        }
    }