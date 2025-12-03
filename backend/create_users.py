"""
One-time script to create initial users for production deployment.
Run this via Railway's start command or manually after deployment.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

# Create test users
users = [
    {'username': 'admin', 'password': 'admin123', 'role': 'Admin', 'email': 'admin@example.com'},
    {'username': 'manager', 'password': 'manager123', 'role': 'Manager', 'email': 'manager@example.com'},
    {'username': 'member', 'password': 'member123', 'role': 'Member', 'email': 'member@example.com'},
]

for user_data in users:
    if not User.objects.filter(username=user_data['username']).exists():
        User.objects.create_user(**user_data)
        print(f"✅ Created user: {user_data['username']}")
    else:
        print(f"ℹ️  User {user_data['username']} already exists")

print("\n✅ User creation complete!")

