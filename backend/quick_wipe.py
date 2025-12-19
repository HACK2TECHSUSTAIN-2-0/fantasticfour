"""
Quick utility to wipe the incidents table.
Run with an activated venv: python quick_wipe.py
"""

from app.database import SessionLocal, engine
from sqlalchemy import text

def wipe_incidents():
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM incidents"))

if __name__ == "__main__":
    wipe_incidents()
    print("Incidents table cleared.")
