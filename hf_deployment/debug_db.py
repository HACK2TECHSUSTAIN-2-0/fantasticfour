from app.database import SessionLocal
from app import models

db = SessionLocal()
print(f"Database Path: {db.get_bind().url}")

try:
    incidents = db.query(models.Incident).all()
    print(f"Total Incidents: {len(incidents)}")
    for i in incidents:
        print(f"ID: {i.id}")
        print(f"  Type: {i.type}")
        print(f"  Msg: {i.message}")
        print(f"  Status: {i.status}")
        print(f"  Auth: {i.authority}")
        print(f"  Severity: {i.final_severity}")
        print(f"  Officer: {i.officer_message}")
        print("-" * 20)
except Exception as e:
    print(f"Error reading DB: {e}")
finally:
    db.close()
