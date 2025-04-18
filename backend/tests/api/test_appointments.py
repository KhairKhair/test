import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from api.appointments import router as appointments_router
from api.appointments import appointments as mock_appointments_db

class TestAppointmentsAPI(unittest.TestCase):
    def setUp(self):
        # Create a test FastAPI app and mount the router
        self.app = FastAPI()
        self.app.include_router(appointments_router, prefix="")
        self.client = TestClient(self.app)
        
        # Save the original appointments data
        self.original_appointments = mock_appointments_db.copy()
        
        # Reset appointments to a known state before each test
        mock_appointments_db.clear()
        mock_appointments_db.extend([
            {
                "id": 1,
                "patient_name": "Test Patient",
                "date": "2023-10-01",
                "time": "10:00",
                "reason": "Test Reason",
                "status": "Scheduled"
            },
            {
                "id": 2,
                "patient_name": "Another Patient",
                "date": "2023-10-02",
                "time": "11:00",
                "reason": "Follow-up",
                "status": "Completed"
            }
        ])
    
    def tearDown(self):
        # Restore original appointments data
        mock_appointments_db.clear()
        mock_appointments_db.extend(self.original_appointments)
    
    def test_get_appointments(self):
        """Test retrieving all appointments"""
        response = self.client.get("/")
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["appointments"]), 2)
        self.assertEqual(response.json()["appointments"][0]["id"], 1)
        self.assertEqual(response.json()["appointments"][0]["patient_name"], "Test Patient")
        self.assertEqual(response.json()["appointments"][1]["id"], 2)
        self.assertEqual(response.json()["appointments"][1]["patient_name"], "Another Patient")
    
    def test_get_appointment_by_id_found(self):
        """Test retrieving a specific appointment by ID when it exists"""
        appointment_id = 1
        response = self.client.get(f"/{appointment_id}")
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["appointment"]["id"], appointment_id)
        self.assertEqual(response.json()["appointment"]["patient_name"], "Test Patient")
        self.assertEqual(response.json()["appointment"]["date"], "2023-10-01")
        self.assertEqual(response.json()["appointment"]["time"], "10:00")
        self.assertEqual(response.json()["appointment"]["reason"], "Test Reason")
        self.assertEqual(response.json()["appointment"]["status"], "Scheduled")
    
    def test_get_appointment_by_id_not_found(self):
        """Test retrieving a non-existent appointment"""
        appointment_id = 999  # Non-existent ID
        response = self.client.get(f"/{appointment_id}")
        
        # Assertions
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Appointment not found")
    
    def test_create_appointment(self):
        """Test creating a new appointment"""
        new_appointment = {
            "date": "2023-10-03",
            "time": "09:30",
            "reason": "New Consultation",
            "status": "Scheduled"
        }
        
        response = self.client.post("/new", json=new_appointment)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        created_appointment = response.json()["appointment"]
        self.assertEqual(created_appointment["id"], 3)  # New ID should be 3
        self.assertEqual(created_appointment["date"], "2023-10-03")
        self.assertEqual(created_appointment["time"], "09:30")
        self.assertEqual(created_appointment["reason"], "New Consultation")
        self.assertEqual(created_appointment["status"], "Scheduled")
        
        # Verify it was added to the mock database
        self.assertEqual(len(mock_appointments_db), 3)
        self.assertEqual(mock_appointments_db[2]["id"], 3)
        self.assertEqual(mock_appointments_db[2]["date"], "2023-10-03")
    
    def test_update_appointment_success(self):
        """Test updating an existing appointment"""
        appointment_id = 1
        update_data = {
            "date": "2023-10-05",
            "time": "14:00",
            "reason": "Updated Reason",
            "status": "Completed"
        }
        
        response = self.client.post(f"/{appointment_id}", json=update_data)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        updated_appointment = response.json()
        self.assertEqual(updated_appointment["id"], 1)
        self.assertEqual(updated_appointment["patient_name"], "Test Patient")  # Unchanged
        self.assertEqual(updated_appointment["date"], "2023-10-05")  # Updated
        self.assertEqual(updated_appointment["time"], "14:00")  # Updated
        self.assertEqual(updated_appointment["reason"], "Updated Reason")  # Updated
        self.assertEqual(updated_appointment["status"], "Completed")  # Updated
        
        # Verify it was updated in the mock database
        self.assertEqual(mock_appointments_db[0]["date"], "2023-10-05")
        self.assertEqual(mock_appointments_db[0]["status"], "Completed")
    
    def test_update_appointment_not_found(self):
        """Test updating a non-existent appointment"""
        appointment_id = 999  # Non-existent ID
        update_data = {
            "date": "2023-10-05",
            "time": "14:00",
            "reason": "Updated Reason",
            "status": "Completed"
        }
        
        response = self.client.post(f"/{appointment_id}", json=update_data)
        
        # Assertions
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Appointment not found")
        
        # Verify mock database wasn't changed
        self.assertEqual(len(mock_appointments_db), 2)

if __name__ == "__main__":
    unittest.main()