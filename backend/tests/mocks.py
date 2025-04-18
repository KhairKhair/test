# backend/tests/mocks.py
import sys
from unittest.mock import MagicMock

# Create a mock for the SQLiteDatabase class
mock_db = MagicMock()

# Create a patch for the entire module
sys.modules['db.database'] = MagicMock()
sys.modules['db.database'].SQLiteDatabase = MagicMock
sys.modules['db.database'].SQLiteDatabase.return_value = mock_db