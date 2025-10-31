"""
Tests for crop management API
"""
import json
from datetime import date


def test_create_crop(client):
    """Test creating a new crop"""
    response = client.post('/api/crops/', 
        data=json.dumps({
            'name': 'Wheat',
            'variety': 'Hard Red Winter',
            'description': 'Winter wheat for flour production',
            'typical_growth_days': 180
        }),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Wheat'
    assert data['variety'] == 'Hard Red Winter'


def test_get_crops(client):
    """Test getting all crops"""
    # First create a crop
    client.post('/api/crops/',
        data=json.dumps({
            'name': 'Corn',
            'variety': 'Sweet Corn'
        }),
        content_type='application/json'
    )
    
    response = client.get('/api/crops/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) >= 1
    assert any(crop['name'] == 'Corn' for crop in data)


def test_create_crop_cycle(client):
    """Test creating a crop cycle"""
    # First create a crop
    crop_response = client.post('/api/crops/',
        data=json.dumps({
            'name': 'Soybeans',
            'typical_growth_days': 120
        }),
        content_type='application/json'
    )
    crop_data = json.loads(crop_response.data)
    
    # Create crop cycle
    response = client.post('/api/crops/cycles',
        data=json.dumps({
            'crop_id': crop_data['id'],
            'field_location': 'North Field',
            'area_hectares': 50.5,
            'planting_date': '2024-05-01',
            'expected_harvest_date': '2024-09-15',
            'status': 'planted'
        }),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['field_location'] == 'North Field'
    assert data['area_hectares'] == 50.5
    assert data['status'] == 'planted'


def test_update_crop_cycle(client):
    """Test updating a crop cycle"""
    # Create crop and cycle
    crop_response = client.post('/api/crops/',
        data=json.dumps({'name': 'Rice'}),
        content_type='application/json'
    )
    crop_data = json.loads(crop_response.data)
    
    cycle_response = client.post('/api/crops/cycles',
        data=json.dumps({
            'crop_id': crop_data['id'],
            'field_location': 'Paddy Field',
            'status': 'planned'
        }),
        content_type='application/json'
    )
    cycle_data = json.loads(cycle_response.data)
    
    # Update to harvested with yield
    update_response = client.put(f'/api/crops/cycles/{cycle_data["id"]}',
        data=json.dumps({
            'status': 'harvested',
            'yield_amount': 4500.5,
            'yield_unit': 'kg'
        }),
        content_type='application/json'
    )
    assert update_response.status_code == 200
    updated_data = json.loads(update_response.data)
    assert updated_data['status'] == 'harvested'
    assert updated_data['yield_amount'] == 4500.5
