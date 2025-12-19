from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict

app = FastAPI(title="Admin Alert Server")


class AlertPayload(BaseModel):
    event_id: str
    timestamp: str
    triage: Dict


@app.post("/alerts")
def receive_alert(payload: AlertPayload):
    print("\n🚨 ADMIN ALERT RECEIVED")
    print(f"Event ID : {payload.event_id}")
    print(f"Time     : {payload.timestamp}")
    print("Payload  :")
    print(payload.triage)
    print("🚨 END ALERT\n")

    return {
        "status": "received",
        "event_id": payload.event_id
    }
