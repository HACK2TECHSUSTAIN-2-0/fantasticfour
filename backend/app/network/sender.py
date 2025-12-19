# backend/app/network/sender.py

import socket
import uuid
from datetime import datetime, timezone
import requests


#ADMIN_ENDPOINT = "https://your-server.com/api/alerts"
ADMIN_ENDPOINT = "http://127.0.0.1:8000/alerts"

def is_internet_available(timeout: int = 2) -> bool:
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=timeout)
        return True
    except OSError:
        return False


def build_event_payload(triage_result: dict) -> dict:
    """
    Wraps AI triage output into a transport-safe payload.
    """
    return {
        "event_id": f"evt_{uuid.uuid4().hex[:8]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "triage": triage_result
    }


def send_to_admin(payload: dict) -> bool:
    try:
        response = requests.post(
            ADMIN_ENDPOINT,
            json=payload,
            timeout=3
        )
        response.raise_for_status()
        return True
    except Exception as e:
        print("Internet send failed:", e)
        return False


'''def send_to_admin(payload: dict) -> bool:
    print("\n🚨 ADMIN ALERT (LOCAL STUB)")
    print(payload)
    print("🚨 END ALERT\n")
    return True
'''
def handle_alert(triage_result: dict) -> dict:
    payload = build_event_payload(triage_result)

    sent = send_to_admin(payload)

    if sent:
        return {
            "delivered": True,
            "mode": "internet",
            "payload": payload
        }

    # Offline fallback (visible to judges)
    print("\n⚠️ OFFLINE FALLBACK ACTIVATED")
    print(payload)
    print("⚠️ ALERT STORED / SENT VIA SMS (SIMULATED)\n")

    return {
        "delivered": False,
        "mode": "offline_fallback",
        "payload": payload
    }