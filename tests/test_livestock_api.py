"""
Tests for livestock management API
"""
import json


def test_create_livestock(client):
    """Test creating a new livestock record"""
    response = client.post('/api/livestock/',
        data=json.dumps({
            'tag_number': 'COW-001',
            'species': 'cattle',
            'breed': 'Holstein',
            'date_of_birth': '2022-01-15',
            'gender': 'female',
            'acquisition_date': '2022-03-01',
            'acquisition_cost': 1200.50,
            'current_weight': 450.0
        }),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['tag_number'] == 'COW-001'
    assert data['species'] == 'cattle'
    assert data['breed'] == 'Holstein'


def test_create_health_record(client):
    """Test creating a health record for livestock"""
    # First create livestock
    livestock_response = client.post('/api/livestock/',
        data=json.dumps({
            'tag_number': 'SHEEP-001',
            'species': 'sheep',
            'gender': 'male'
        }),
        content_type='application/json'
    )
    livestock_data = json.loads(livestock_response.data)
    
    # Create health record
    response = client.post('/api/livestock/health-records',
        data=json.dumps({
            'livestock_id': livestock_data['id'],
            'record_date': '2024-06-15',
            'record_type': 'vaccination',
            'description': 'Annual vaccination for common diseases',
            'treatment': 'Multivalent vaccine',
            'veterinarian': 'Dr. Smith',
            'cost': 45.00
        }),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['record_type'] == 'vaccination'
    assert data['cost'] == 45.00


def test_get_livestock_health_records(client):
    """Test retrieving health records for a specific livestock"""
    # Create livestock
    livestock_response = client.post('/api/livestock/',
        data=json.dumps({
            'tag_number': 'PIG-001',
            'species': 'pig'
        }),
        content_type='application/json'
    )
    livestock_data = json.loads(livestock_response.data)
    
    # Create multiple health records
    for i in range(3):
        client.post('/api/livestock/health-records',
            data=json.dumps({
                'livestock_id': livestock_data['id'],
                'record_date': f'2024-0{i+1}-15',
                'record_type': 'checkup',
                'description': f'Monthly checkup {i+1}'
            }),
            content_type='application/json'
        )
    
    # Get all records for this livestock
    response = client.get(f'/api/livestock/{livestock_data["id"]}/health-records')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 3
