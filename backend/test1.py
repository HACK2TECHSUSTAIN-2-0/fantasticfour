from app.ai.triage import run_ai_triage
from app.network.sender import handle_alert

triage = run_ai_triage("someone is coming behind me", silent=True)
result = handle_alert(triage)

print(result)
