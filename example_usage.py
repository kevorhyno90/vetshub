#!/usr/bin/env python
"""
Example script demonstrating the VetsHub Farm Management System API usage
"""
import requests
import json
from datetime import date, datetime

# Base API URL
BASE_URL = "http://localhost:5000/api"

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    if response.status_code < 300:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")

def main():
    """Demonstrate API usage"""
    
    print("VetsHub Farm Management System - API Demo")
    print("="*60)
    
    # 1. Create a crop
    print("\n1. Creating a crop...")
    crop_data = {
        "name": "Wheat",
        "variety": "Hard Red Winter",
        "description": "Winter wheat for flour production",
        "typical_growth_days": 180
    }
    response = requests.post(f"{BASE_URL}/crops/", json=crop_data)
    print_response("Create Crop", response)
    crop_id = response.json()['id'] if response.status_code == 201 else None
    
    # 2. Create a crop cycle
    if crop_id:
        print("\n2. Creating a crop cycle...")
        cycle_data = {
            "crop_id": crop_id,
            "field_location": "North Field",
            "area_hectares": 50.5,
            "planting_date": "2024-05-01",
            "expected_harvest_date": "2024-09-15",
            "status": "planted"
        }
        response = requests.post(f"{BASE_URL}/crops/cycles", json=cycle_data)
        print_response("Create Crop Cycle", response)
    
    # 3. Create livestock
    print("\n3. Creating livestock...")
    livestock_data = {
        "tag_number": "COW-001",
        "species": "cattle",
        "breed": "Holstein",
        "date_of_birth": "2022-01-15",
        "gender": "female",
        "acquisition_date": "2022-03-01",
        "acquisition_cost": 1200.50,
        "current_weight": 450.0
    }
    response = requests.post(f"{BASE_URL}/livestock/", json=livestock_data)
    print_response("Create Livestock", response)
    livestock_id = response.json()['id'] if response.status_code == 201 else None
    
    # 4. Create health record
    if livestock_id:
        print("\n4. Creating health record...")
        health_data = {
            "livestock_id": livestock_id,
            "record_date": "2024-06-15",
            "record_type": "vaccination",
            "description": "Annual vaccination for common diseases",
            "treatment": "Multivalent vaccine",
            "veterinarian": "Dr. Smith",
            "cost": 45.00
        }
        response = requests.post(f"{BASE_URL}/livestock/health-records", json=health_data)
        print_response("Create Health Record", response)
    
    # 5. Create budget
    print("\n5. Creating budget...")
    budget_data = {
        "name": "Crop Production Budget 2024",
        "category": "crop",
        "fiscal_year": 2024,
        "planned_amount": 50000.00,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "description": "Budget for all crop production activities"
    }
    response = requests.post(f"{BASE_URL}/financial/budgets", json=budget_data)
    print_response("Create Budget", response)
    
    # 6. Create transaction
    print("\n6. Creating transaction...")
    transaction_data = {
        "transaction_date": "2024-06-15",
        "transaction_type": "expense",
        "category": "seeds",
        "amount": 1500.00,
        "description": "Purchase of wheat seeds",
        "payment_method": "card",
        "reference_number": "INV-2024-001"
    }
    response = requests.post(f"{BASE_URL}/financial/transactions", json=transaction_data)
    print_response("Create Transaction", response)
    
    # 7. Create worker
    print("\n7. Creating worker...")
    worker_data = {
        "first_name": "John",
        "last_name": "Doe",
        "employee_id": "EMP-001",
        "role": "field worker",
        "hire_date": "2024-01-15",
        "phone": "555-0123",
        "email": "john.doe@example.com",
        "hourly_rate": 18.50,
        "status": "active"
    }
    response = requests.post(f"{BASE_URL}/labor/workers", json=worker_data)
    print_response("Create Worker", response)
    worker_id = response.json()['id'] if response.status_code == 201 else None
    
    # 8. Create work log
    if worker_id:
        print("\n8. Creating work log...")
        worklog_data = {
            "worker_id": worker_id,
            "work_date": "2024-06-15",
            "hours_worked": 8.0,
            "activity_type": "planting",
            "location": "North Field",
            "description": "Planting wheat seeds"
        }
        response = requests.post(f"{BASE_URL}/labor/work-logs", json=worklog_data)
        print_response("Create Work Log", response)
    
    # 9. Get analytics dashboard
    print("\n9. Getting analytics dashboard...")
    response = requests.get(f"{BASE_URL}/analytics/dashboard")
    print_response("Analytics Dashboard", response)
    
    print("\n" + "="*60)
    print("Demo completed!")
    print("="*60)

if __name__ == "__main__":
    print("NOTE: Make sure the Flask server is running on port 5000")
    print("Run: python run.py")
    print()
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\nERROR: Could not connect to the API server.")
        print("Please make sure the Flask server is running:")
        print("  python run.py")
