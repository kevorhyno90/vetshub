"""
Tests for analytics API
"""
import json


def test_get_dashboard(client):
    """Test getting dashboard overview"""
    response = client.get('/api/analytics/dashboard')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check all required sections exist
    assert 'crop_performance' in data
    assert 'livestock_health' in data
    assert 'financial_summary' in data
    assert 'labor_statistics' in data


def test_crop_performance_analytics(client):
    """Test crop performance analytics"""
    # Create some test data
    crop_response = client.post('/api/crops/',
        data=json.dumps({
            'name': 'Test Crop',
            'typical_growth_days': 90
        }),
        content_type='application/json'
    )
    crop_data = json.loads(crop_response.data)
    
    # Create harvested cycle
    client.post('/api/crops/cycles',
        data=json.dumps({
            'crop_id': crop_data['id'],
            'area_hectares': 10.0,
            'status': 'harvested',
            'yield_amount': 5000.0,
            'yield_unit': 'kg'
        }),
        content_type='application/json'
    )
    
    response = client.get('/api/analytics/crop-performance')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)


def test_livestock_health_summary(client):
    """Test livestock health summary"""
    response = client.get('/api/analytics/livestock-health')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'total_active_livestock' in data
    assert 'health_records_last_90_days' in data
    assert 'records_by_type' in data
    assert 'livestock_by_species' in data


def test_financial_summary(client):
    """Test financial summary"""
    response = client.get('/api/analytics/financial-summary?fiscal_year=2024')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'fiscal_year' in data
    assert data['fiscal_year'] == 2024
    assert 'total_planned_budget' in data
    assert 'total_income' in data
    assert 'total_expenses' in data
    assert 'net_profit' in data


def test_labor_statistics(client):
    """Test labor statistics"""
    response = client.get('/api/analytics/labor-statistics')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'total_hours_worked' in data
    assert 'total_labor_cost' in data
    assert 'active_workers' in data
    assert 'activity_breakdown' in data
