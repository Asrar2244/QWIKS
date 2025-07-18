#!/usr/bin/env python
"""
Startup script for QR Menu Django backend
This script helps with initial setup and running the development server
"""

import os
import sys
import subprocess
import django
from django.core.management import execute_from_command_line

def run_command(command):
    """Run a shell command and return success status"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {command}")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {command}")
        print(f"Error: {e.stderr}")
        return False

def setup_django():
    """Setup Django project"""
    print("🚀 Setting up QR Menu Django Backend...")
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qr_menu_app.settings')
    
    # Install dependencies
    print("\n📦 Installing dependencies...")
    if not run_command("pip install -r requirements.txt"):
        print("Failed to install dependencies. Make sure you're in a virtual environment.")
        return False
    
    # Create media directories
    print("\n📁 Creating media directories...")
    os.makedirs('media/restaurant_logos', exist_ok=True)
    os.makedirs('media/qr_codes', exist_ok=True)
    os.makedirs('media/menu_items', exist_ok=True)
    os.makedirs('staticfiles', exist_ok=True)
    print("✅ Media directories created")
    
    # Make migrations
    print("\n🗃️ Creating database migrations...")
    if not run_command("python manage.py makemigrations"):
        return False
    
    # Run migrations
    print("\n🗃️ Applying database migrations...")
    if not run_command("python manage.py migrate"):
        return False
    
    # Create superuser (optional)
    print("\n👤 Would you like to create a superuser? (y/n): ", end="")
    create_superuser = input().lower().strip()
    if create_superuser in ['y', 'yes']:
        run_command("python manage.py createsuperuser")
    
    print("\n✅ Django setup complete!")
    return True

def run_server():
    """Run the development server"""
    print("\n🌐 Starting Django development server...")
    print("Server will be available at: http://localhost:8000")
    print("Admin panel will be available at: http://localhost:8000/admin")
    print("API docs will be available at: http://localhost:8000/api")
    print("\nPress Ctrl+C to stop the server\n")
    
    run_command("python manage.py runserver")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "setup":
        setup_django()
    elif len(sys.argv) > 1 and sys.argv[1] == "server":
        run_server()
    else:
        print("QR Menu Django Backend")
        print("Usage:")
        print("  python start.py setup  - Setup the Django project")
        print("  python start.py server - Run the development server")
        print("\nFor first time setup, run: python start.py setup") 