#!/usr/bin/env python3
"""
Test PostgreSQL Connection and Run Migrations
"""

import os
import django

# Set the database URL environment variable
os.environ['DATABASE_URL'] = 'postgresql://root:CbLnpr7Y1Hv2sgcxPbXw0Ft6ff2uco9Q@dpg-d2ld1815pdvs73aipin0-a.oregon-postgres.render.com:5432/qwiks_db'

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qr_menu_app.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def test_connection():
    """Test database connection"""
    try:
        print("🔌 Testing PostgreSQL connection...")
        cursor = connection.cursor()
        cursor.execute('SELECT version();')
        version = cursor.fetchone()
        print(f"✅ Connected to: {version[0]}")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def run_migrations():
    """Run Django migrations"""
    try:
        print("\n🔄 Running migrations...")
        # Simulate running migrations
        from django.core.management import call_command
        call_command('migrate', verbosity=1)
        print("✅ Migrations completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Migrations failed: {e}")
        return False

def test_models():
    """Test if models can access the database"""
    try:
        print("\n🐍 Testing Django models...")
        from restaurants.models import Restaurant, Table, MenuItem
        
        # Try to count objects
        restaurant_count = Restaurant.objects.count()
        table_count = Table.objects.count()
        menu_item_count = MenuItem.objects.count()
        
        print(f"✅ Models working:")
        print(f"   • Restaurants: {restaurant_count}")
        print(f"   • Tables: {table_count}")
        print(f"   • Menu Items: {menu_item_count}")
        
        return True
    except Exception as e:
        print(f"❌ Models test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 PostgreSQL Connection and Migration Test")
    print("=" * 50)
    
    # Test connection
    if test_connection():
        # Run migrations
        if run_migrations():
            # Test models
            test_models()
        else:
            print("❌ Cannot proceed without migrations")
    else:
        print("❌ Cannot proceed without database connection")
    
    print("\n" + "=" * 50)
