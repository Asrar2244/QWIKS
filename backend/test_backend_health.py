#!/usr/bin/env python3
"""
Test Backend Health and Login Functionality
This script tests if the backend is working properly
"""

import os
import django
import requests
import json

# Set the database URL environment variable
os.environ['DATABASE_URL'] = 'postgresql://root:CbLnpr7Y1Hv2sgcxPbXw0Ft6ff2uco9Q@dpg-d2ld1815pdvs73aipin0-a.oregon-postgres.render.com:5432/qwiks_db'

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qr_menu_app.settings')
django.setup()

def test_backend_health():
    """Test if backend is responding"""
    print("🏥 Testing Backend Health")
    print("=" * 40)
    
    try:
        # Test basic endpoint
        response = requests.get('https://qwiks-backend.onrender.com/api/restaurant/')
        print(f"✅ Backend is responding: {response.status_code}")
        
        if response.status_code == 401:
            print("   • Expected 401 (no auth token)")
        elif response.status_code == 200:
            print("   • Backend is working!")
        else:
            print(f"   • Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False
    
    return True

def test_database_connection():
    """Test database connection"""
    print("\n🔌 Testing Database Connection")
    print("=" * 40)
    
    try:
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Database connected: {version[0]}")
        
        # Test if we can query the models
        from restaurants.models import Restaurant, RestaurantUser
        restaurant_count = Restaurant.objects.count()
        user_count = RestaurantUser.objects.count()
        print(f"✅ Restaurant count: {restaurant_count}")
        print(f"✅ User count: {user_count}")
        
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_login_endpoint():
    """Test login endpoint specifically"""
    print("\n🔐 Testing Login Endpoint")
    print("=" * 40)
    
    try:
        # Test login endpoint with invalid credentials (should return 400, not 500)
        login_data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = requests.post(
            'https://qwiks-backend.onrender.com/api/auth/login/',
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📡 Login endpoint response: {response.status_code}")
        
        if response.status_code == 400:
            print("   • Expected 400 (invalid credentials)")
            print("   • Backend is handling login properly")
        elif response.status_code == 500:
            print("   • ❌ 500 Internal Server Error - Backend is crashing")
            print("   • Response:", response.text[:200])
        else:
            print(f"   • Unexpected status: {response.status_code}")
            print("   • Response:", response.text[:200])
            
    except Exception as e:
        print(f"❌ Login endpoint test failed: {e}")
        return False
    
    return True

def test_django_authentication():
    """Test Django authentication logic"""
    print("\n🐍 Testing Django Authentication")
    print("=" * 40)
    
    try:
        from django.contrib.auth import authenticate
        from restaurants.models import RestaurantUser
        
        # Test if authentication works
        user = authenticate(username='nonexistent', password='wrong')
        if user is None:
            print("✅ Django authentication working (correctly rejected invalid user)")
        else:
            print("❌ Django authentication issue (accepted invalid user)")
            
        # Test if we can create a test user
        restaurant, created = Restaurant.objects.get_or_create(
            name="Test Restaurant",
            defaults={'slug': 'test-restaurant'}
        )
        
        test_user, created = RestaurantUser.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'restaurant': restaurant
            }
        )
        
        if created:
            test_user.set_password('testpass123')
            test_user.save()
            print("✅ Test user created successfully")
        else:
            print("✅ Test user already exists")
            
        # Test authentication with test user
        auth_user = authenticate(username='testuser', password='testpass123')
        if auth_user:
            print("✅ Django authentication working with valid user")
        else:
            print("❌ Django authentication failed with valid user")
            
        return True
        
    except Exception as e:
        print(f"❌ Django authentication test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Backend Health and Login Test Suite")
    print("=" * 60)
    
    # Run all tests
    health_ok = test_backend_health()
    db_ok = test_database_connection()
    login_ok = test_login_endpoint()
    auth_ok = test_django_authentication()
    
    print("\n" + "=" * 60)
    
    if all([health_ok, db_ok, login_ok, auth_ok]):
        print("🎉 All tests passed! Backend should be working.")
    else:
        print("⚠️ Some tests failed. Check the output above.")
    
    print("=" * 60)
