import sqlite3
from typing import Dict, List, Optional
import json


class SQLiteDatabase:
    def __init__(self, db_path: str = "./db/clinikit.db"):
        self.db_path = db_path
        self._initialize_database()

    def _connect(self):
        return sqlite3.connect(self.db_path)

    def _initialize_database(self):
        with self._connect() as conn:
            cursor = conn.cursor()
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    password TEXT NOT NULL,
                    permissions TEXT NOT NULL
                )
            """)
            # Create patients table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS patients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    date_of_birth TEXT NOT NULL,
                    gender TEXT NOT NULL,
                    last_visit TEXT NOT NULL,
                    contact TEXT NOT NULL,
                    emergency_contact TEXT NOT NULL,
                    insurance TEXT NOT NULL,
                    medical_history TEXT,
                    notes TEXT
                )
            """)

            cursor.execute("""
                           CREATE TABLE IF NOT EXISTS modules (
                            id TEXT PRIMARY KEY,
                            href TEXT NOT NULL,
                            title TEXT NOT NULL,
                            description TEXT NOT NULL,
                            icon TEXT NOT NULL
                        );
            """)
            conn.commit()
            self._initialize_default_data()

    def _initialize_default_data(self):
        # Insert default users if they don't exist
        default_users = {
            "admin": {
                "password": "password",
                "permissions": '{"patient_mgmt": "Edit", "user_mgmt": "Edit", "appointments": "Edit"}',
            },
            "doc": {
                "password": "password",
                "permissions": '{"patient_mgmt": "View", "user_mgmt": "None", "appointments": "View"}',
            },
        }
        with self._connect() as conn:
            cursor = conn.cursor()
            for username, data in default_users.items():
                cursor.execute("""
                    INSERT OR IGNORE INTO users (username, password, permissions)
                    VALUES (?, ?, ?)
                """, (username, data["password"], data["permissions"]))
            
           # Insert default modules if they don't exist
            cursor.execute("""
                INSERT OR IGNORE INTO modules (id, href, title, description, icon) VALUES
                ('patient_mgmt', '/patients', 'Patient Management', 'View, add, and edit patient records.', 'Users'),
                ('user_mgmt', '/users', 'User Management', 'Add, remove, and manage system users.', 'User'),
                ('appointments', '/appointments', 'Appointments', 'Manage patient appointments.', 'Calendar');
            """)
            conn.commit()

    # User operations
    def get_user(self, username: str) -> Optional[Dict]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT username, password, permissions FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()
            if row:
                return {
                    "username": row[0],
                    "password": row[1],
                    "permissions": json.loads(row[2]),
                }
            return None

    def list_users(self) -> List[Dict]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT username, password, permissions FROM users")
            rows = cursor.fetchall()
            return [
                {
                    "username": row[0],
                    "password": row[1],
                    "permissions": json.loads(row[2]),
                }
                for row in rows
            ]

    def update_user_permissions(self, username: str, permissions: Dict[str, str]) -> bool:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users
                SET permissions = ?
                WHERE username = ?
            """, (json.dumps(permissions), username))
            conn.commit()
            return cursor.rowcount > 0
    
    def list_modules(self) -> Dict[str, Dict]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, href, title, description, icon FROM modules")
            rows = cursor.fetchall()
            return {
                row[0]: {
                    "href": row[1],
                    "title": row[2],
                    "description": row[3],
                    "icon": row[4],
                }
                for row in rows
            }
    # Patient operations
    def list_patients_summary(self) -> List[Dict]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, date_of_birth, gender, last_visit
                FROM patients
            """)
            rows = cursor.fetchall()
            return [
                {
                    "id": row[0],
                    "name": row[1],
                    "date_of_birth": row[2],
                    "gender": row[3],
                    "last_visit": row[4],
                }
                for row in rows
            ]

    def get_patient(self, patient_id: int) -> Optional[Dict]:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, date_of_birth, gender, last_visit, contact, emergency_contact, insurance, medical_history, notes
                FROM patients
                WHERE id = ?
            """, (patient_id,))
            row = cursor.fetchone()
            if row:
                return {
                    "id": row[0],
                    "name": row[1],
                    "date_of_birth": row[2],
                    "gender": row[3],
                    "last_visit": row[4],
                    "contact": json.loads(row[5]),
                    "emergency_contact": json.loads(row[6]),
                    "insurance": row[7],
                    "medical_history": row[8],
                    "notes": row[9],
                }
            return None

    def create_patient(self, patient_data: Dict) -> Dict:
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO patients (name, date_of_birth, gender, last_visit, contact, emergency_contact, insurance, medical_history, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                patient_data["name"],
                patient_data["date_of_birth"],
                patient_data["gender"],
                patient_data["last_visit"],
                json.dumps(patient_data["contact"]),
                json.dumps(patient_data["emergency_contact"]),
                patient_data["insurance"],
                patient_data.get("medical_history"),
                patient_data.get("notes"),
            ))
            conn.commit()
            patient_data["id"] = cursor.lastrowid
            return patient_data

    def update_patient(self, patient_id: int, updates: Dict) -> Optional[Dict]:
        patient = self.get_patient(patient_id)
        if not patient:
            return None
        with self._connect() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE patients
                SET name = ?, date_of_birth = ?, gender = ?, last_visit = ?, contact = ?, emergency_contact = ?, insurance = ?, medical_history = ?, notes = ?
                WHERE id = ?
            """, (
                updates.get("name", patient["name"]),
                updates.get("date_of_birth", patient["date_of_birth"]),
                updates.get("gender", patient["gender"]),
                updates.get("last_visit", patient["last_visit"]),
                json.dumps(updates.get("contact", patient["contact"])),
                json.dumps(updates.get("emergency_contact", patient["emergency_contact"])),
                updates.get("insurance", patient["insurance"]),
                updates.get("medical_history", patient["medical_history"]),
                updates.get("notes", patient["notes"]),
                patient_id,
            ))
            conn.commit()
            return self.get_patient(patient_id)