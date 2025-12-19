from app.ai.triage import run_ai_triage
from app.network.sender import handle_alert
from app.llm.enrichment import enrich_alert
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# 1. Run triage
#triage = run_ai_triage("I’m walking in the campus right now and someone has been following me for the last few minutes, I don’t feel safe.", silent=True)
triage = run_ai_triage("someone trying to kill me", silent=True)
# 2. Send alert
delivery = handle_alert(triage)

print("\n📡 DELIVERY RESULT")
print(delivery)

# 3. LLM enrichment (only if delivered)
if delivery["delivered"]:
    enrichment = enrich_alert(delivery["payload"])
    print("\n🔁 LLM ENRICHMENT UPDATE")
    print(enrichment)
