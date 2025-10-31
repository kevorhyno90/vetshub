"""
Tests for labor management API
"""
import json


def test_create_worker(client):
    """Test creating a new worker"""
    response = client.post('/api/labor/workers',
        data=json.dumps({
            'first_name': 'John',
            'last_name': 'Doe',
            'employee_id': 'EMP-001',
            'role': 'field worker',
            'hire_date': '2024-01-15',
            'phone': '555-0123',
            'email': 'john.doe@example.com',
            'hourly_rate': 18.50,
            'status': 'active'
        }),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['first_name'] == 'John'
    assert data['last_name'] == 'Doe'
    assert data['hourly_rate'] == 18.50


def test_create_work_log(client):
    """Test creating a work log"""
    # First create a worker
    worker_response = client.post('/api/labor/workers',
        data=json.dumps({
            'first_name': 'Jane',
            'last_name': 'Smith',
            'hourly_rate': 20.00
        }),
        content_type='application/json'
    )
    worker_data = json.loads(worker_response.data)
    
    # Create work log
    response = client.post('/api/labor/work-logs',
        data=json.dumps({
            'worker_id': worker_data['id'],
            'work_date': '2024-06-15',
            'hours_worked': 8.0,
            'activity_type': 'planting',
            'location': 'North Field',
            'description': 'Planting corn seeds'
        }),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['hours_worked'] == 8.0
    assert data['activity_type'] == 'planting'
    assert data['labor_cost'] == 160.00  # 8 hours * $20/hour


def test_get_worker_logs(client):
    """Test retrieving work logs for a specific worker"""
    # Create worker
    worker_response = client.post('/api/labor/workers',
        data=json.dumps({
            'first_name': 'Bob',
            'last_name': 'Johnson',
            'hourly_rate': 15.00
        }),
        content_type='application/json'
    )
    worker_data = json.loads(worker_response.data)
    
    # Create multiple work logs
    for i in range(3):
        client.post('/api/labor/work-logs',
            data=json.dumps({
                'worker_id': worker_data['id'],
                'work_date': f'2024-06-{15+i}',
                'hours_worked': 8.0,
                'activity_type': 'harvesting'
            }),
            content_type='application/json'
        )
    
    # Get all logs for this worker
    response = client.get(f'/api/labor/workers/{worker_data["id"]}/work-logs')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 3
