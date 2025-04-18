
import sys
import os


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


from tests.mocks import mock_db


from api.permissions import router as permissions_router
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI, HTTPException
from api.permissions import router as permissions_router

class TestPermissionsAPI(unittest.TestCase):
    def setUp(self):
        # Create a test FastAPI app and mount the router
        self.app = FastAPI()
        self.app.include_router(permissions_router, prefix="")
        self.client = TestClient(self.app)
        
        # Create mocks for database and security
        self.db_patcher = patch("api.permissions.db")
        self.mock_db = self.db_patcher.start()
        
        self.security_patcher = patch("api.permissions.get_current_user")
        self.mock_security = self.security_patcher.start()
        
        # Mock module constants from config
        self.modules_patcher = patch("api.permissions.MODULES", ["patient_mgmt", "user_mgmt", "pharmacy"])
        self.mock_modules = self.modules_patcher.start()
        
        self.levels_patcher = patch("api.permissions.PERMISSION_LEVELS", ["None", "View", "Edit"])
        self.mock_levels = self.levels_patcher.start()
    
    def tearDown(self):
        self.db_patcher.stop()
        self.security_patcher.stop()
        self.modules_patcher.stop()
        self.levels_patcher.stop()
    
    def test_permissions_options(self):
        """Test getting permission options (modules and levels)"""
        response = self.client.get("/options")
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "modules": ["patient_mgmt", "user_mgmt", "pharmacy"],
            "levels": ["None", "View", "Edit"]
        })
    
    def test_update_permissions_as_admin(self):
        """Test updating permissions as an admin user"""
        # Setup admin user
        self.mock_security.return_value = {"username": "admin"}
        
        # Setup target user
        target_username = "testuser"
        self.mock_db.get_user.return_value = {
            "username": target_username,
            "permissions": {
                "patient_mgmt": "View",
                "user_mgmt": "None",
                "pharmacy": "None"
            }
        }
        
        # Setup database update success
        self.mock_db.update_user_permissions.return_value = True
        
        # New permissions to apply
        new_permissions = {
            "patient_mgmt": "Edit",
            "user_mgmt": "View",
            "pharmacy": "None"
        }
        
        # Make request
        response = self.client.post(f"/{target_username}/permissions", json=new_permissions)
        
        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "username": target_username,
            "permissions": new_permissions
        })
        self.mock_security.assert_called_once()
        self.mock_db.get_user.assert_called_once_with(target_username)
        self.mock_db.update_user_permissions.assert_called_once_with(target_username, new_permissions)
    
    def test_update_permissions_not_admin(self):
        """Test updating permissions as a non-admin user (should fail)"""
        # Setup non-admin user
        self.mock_security.return_value = {"username": "regularuser"}
        
        # New permissions to apply
        new_permissions = {
            "patient_mgmt": "Edit",
            "user_mgmt": "View",
            "pharmacy": "None"
        }
        
        # Make request
        response = self.client.post("/testuser/permissions", json=new_permissions)
        
        # Assertions
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json(), {"detail": "Admin access required"})
        self.mock_security.assert_called_once()
        self.mock_db.get_user.assert_not_called()
        self.mock_db.update_user_permissions.assert_not_called()
    
    def test_update_permissions_user_not_found(self):
        """Test updating permissions for a non-existent user"""
        # Setup admin user
        self.mock_security.return_value = {"username": "admin"}
        
        # Setup target user not found
        target_username = "nonexistentuser"
        self.mock_db.get_user.return_value = None
        
        # New permissions to apply
        new_permissions = {
            "patient_mgmt": "Edit",
            "user_mgmt": "View",
            "pharmacy": "None"
        }
        
        # Make request
        response = self.client.post(f"/{target_username}/permissions", json=new_permissions)
        
        # Assertions
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "User not found"})
        self.mock_security.assert_called_once()
        self.mock_db.get_user.assert_called_once_with(target_username)
        self.mock_db.update_user_permissions.assert_not_called()
    
    def test_update_permissions_invalid_module(self):
        """Test updating permissions with an invalid module name"""
        # Setup admin user
        self.mock_security.return_value = {"username": "admin"}
        
        # Setup target user
        target_username = "testuser"
        self.mock_db.get_user.return_value = {
            "username": target_username,
            "permissions": {
                "patient_mgmt": "View",
                "user_mgmt": "None",
                "pharmacy": "None"
            }
        }
        
        # Invalid permissions to apply (invalid_module is not in the valid modules list)
        invalid_permissions = {
            "patient_mgmt": "Edit",
            "invalid_module": "View",
            "pharmacy": "None"
        }
        
        # Make request
        response = self.client.post(f"/{target_username}/permissions", json=invalid_permissions)
        
        # Assertions
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid setting", response.json()["detail"])
        self.mock_security.assert_called_once()
        self.mock_db.get_user.assert_called_once_with(target_username)
        self.mock_db.update_user_permissions.assert_not_called()
    
    def test_update_permissions_invalid_level(self):
        """Test updating permissions with an invalid permission level"""
        # Setup admin user
        self.mock_security.return_value = {"username": "admin"}
        
        # Setup target user
        target_username = "testuser"
        self.mock_db.get_user.return_value = {
            "username": target_username,
            "permissions": {
                "patient_mgmt": "View",
                "user_mgmt": "None",
                "pharmacy": "None"
            }
        }
        
        # Invalid permissions to apply (SuperAdmin is not a valid level)
        invalid_permissions = {
            "patient_mgmt": "Edit",
            "user_mgmt": "SuperAdmin",
            "pharmacy": "None"
        }
        
        # Make request
        response = self.client.post(f"/{target_username}/permissions", json=invalid_permissions)
        
        # Assertions
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid setting", response.json()["detail"])
        self.mock_security.assert_called_once()
        self.mock_db.get_user.assert_called_once_with(target_username)
        self.mock_db.update_user_permissions.assert_not_called()
    
    def test_update_permissions_db_failure(self):
        """Test handling of database failure during permission update"""
        # Setup admin user
        self.mock_security.return_value = {"username": "admin"}
        
        # Setup target user
        target_username = "testuser"
        self.mock_db.get_user.return_value = {
            "username": target_username,
            "permissions": {
                "patient_mgmt": "View",
                "user_mgmt": "None",
                "pharmacy": "None"
            }
        }
        
        # Setup database update failure
        self.mock_db.update_user_permissions.return_value = False
        
        # New permissions to apply
        new_permissions = {
            "patient_mgmt": "Edit",
            "user_mgmt": "View",
            "pharmacy": "None"
        }
        
        # Make request
        response = self.client.post(f"/{target_username}/permissions", json=new_permissions)
        
        # Assertions
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Failed to update permissions"})
        self.mock_security.assert_called_once()
        self.mock_db.get_user.assert_called_once_with(target_username)
        self.mock_db.update_user_permissions.assert_called_once_with(target_username, new_permissions)

if __name__ == "__main__":
    unittest.main()