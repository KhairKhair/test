
import sys
import os


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


from tests.mocks import mock_db


from api.permissions import router as permissions_router

import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from api.patients import router as patients_router

class TestPatientRegistration(unittest.TestCase):
    def setUp(self):
        # Create a test FastAPI app and mount the router
        self.app = FastAPI()
        self.app.include_router(patients_router, prefix="")
        self.client = TestClient(self.app)
        
        # Create a mock for the database functions
        self.db_patcher = patch("api.patients.db")
        self.mock_db = self.db_patcher.start()
        
        # Create a mock for the security functions
        self.security_patcher = patch("api.patients.get_current_user")
        self.mock_security = self.security_patcher.start()
        
        # Mock authenticated user
        self.mock_security.return_value = {"username": "testuser", "permissions": {"patient_mgmt": "Edit"}}
    
    def tearDown(self):
        self.db_patcher.stop()
        self.security_patcher.stop()
    
    def test_get_patients_success(self):
        """Test successful retrieval of all patients"""
        # Setup mock return value for list_patients_summary
        mock_patients = [
            {"id": 1, "name": "John Smith", "date_of_birth": "1990-01-01", "gender": "Male", "last_visit": "2023-01-15"},
            {"id": 2, "name": "Jane Doe", "date_of_birth": "1985-05-10", "gender": "Female", "last_visit": "2023-02-20"}
        ]
        self.mock_db.list_patients_summary.return_value = mock_patients
        
        # Make request
        response = self.client.get("/")
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"patients": mock_patients})
        self.mock_security.assert_called_once()
        self.mock_db.list_patients_summary.assert_called_once()
    
    def test_get_patient_detail_success(self):
        """Test successful retrieval of a specific patient"""
        patient_id = 1
        mock_patient = {
            "id": patient_id,
            "name": "John Smith",
            "date_of_birth": "1990-01-01",
            "gender": "Male", 
            "last_visit": "2023-01-15",
            "contact": {"phone": "555-1234", "email": "john@example.com"},
            "emergency_contact": {"name": "Mary Smith", "phone": "555-5678"},
            "insurance": "Blue Cross",
            "medical_history": "Allergies to penicillin",
            "notes": "Regular checkup patient"
        }
        self.mock_db.get_patient.return_value = mock_patient
        
        # Make request
        response = self.client.get(f"/{patient_id}")
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), mock_patient)
        self.mock_security.assert_called_once()
        self.mock_db.get_patient.assert_called_once_with(patient_id)
    
    def test_get_patient_detail_not_found(self):
        """Test retrieval of a non-existent patient"""
        patient_id = 999
        self.mock_db.get_patient.return_value = None
        
        # Make request
        response = self.client.get(f"/{patient_id}")
        
        # Assertions
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Patient not found"})
        self.mock_security.assert_called_once()
        self.mock_db.get_patient.assert_called_once_with(patient_id)
    
    def test_create_patient_success(self):
        """Test successful creation of a new patient"""
        new_patient_data = {
            "name": "New Patient",
            "date_of_birth": "2000-03-15",
            "gender": "Female",
            "last_visit": "2023-03-01",
            "contact": {"phone": "555-9876", "email": "newpatient@example.com"},
            "emergency_contact": {"name": "Emergency Contact", "phone": "555-4321"},
            "insurance": "Health Plus",
            "medical_history": "No known allergies",
            "notes": "First-time patient"
        }
        created_patient = {**new_patient_data, "id": 3}
        self.mock_db.create_patient.return_value = created_patient
        
        # Make request
        response = self.client.post("/new", json=new_patient_data)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), created_patient)
        self.mock_security.assert_called_once()
        self.mock_db.create_patient.assert_called_once_with(new_patient_data)
    
    def test_update_patient_success(self):
        """Test successful update of an existing patient"""
        patient_id = 1
        update_data = {
            "name": "John Smith Updated",
            "insurance": "Medicare",
            "notes": "Updated patient notes"
        }
        updated_patient = {
            "id": patient_id,
            "name": "John Smith Updated",
            "date_of_birth": "1990-01-01",
            "gender": "Male", 
            "last_visit": "2023-01-15",
            "contact": {"phone": "555-1234", "email": "john@example.com"},
            "emergency_contact": {"name": "Mary Smith", "phone": "555-5678"},
            "insurance": "Medicare",
            "medical_history": "Allergies to penicillin",
            "notes": "Updated patient notes"
        }
        self.mock_db.update_patient.return_value = updated_patient
        
        # Make request
        response = self.client.post(f"/{patient_id}", json=update_data)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), updated_patient)
        self.mock_security.assert_called_once()
        self.mock_db.update_patient.assert_called_once_with(patient_id, update_data)

if __name__ == "__main__":
    unittest.main()