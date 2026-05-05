import sys
import os

# Add the expense-tracker directory to the Python path
# This ensures that `from database.db import ...` works
current_dir = os.path.dirname(__file__)
project_root = os.path.join(current_dir, '..', 'expense-tracker')
sys.path.insert(0, project_root)

# Import the Flask app
from app import app
