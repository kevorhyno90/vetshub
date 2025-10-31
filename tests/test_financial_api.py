"""
Tests for financial management API
"""
import json


def test_create_budget(client):
    """Test creating a new budget"""
    response = client.post('/api/financial/budgets',
        data=json.dumps({
            'name': 'Crop Production Budget 2024',
            'category': 'crop',
            'fiscal_year': 2024,
            'planned_amount': 50000.00,
            'start_date': '2024-01-01',
            'end_date': '2024-12-31',
            'description': 'Budget for all crop production activities'
        }),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Crop Production Budget 2024'
    assert data['planned_amount'] == 50000.00
    assert data['fiscal_year'] == 2024


def test_create_transaction(client):
    """Test creating a financial transaction"""
    response = client.post('/api/financial/transactions',
        data=json.dumps({
            'transaction_date': '2024-06-15',
            'transaction_type': 'expense',
            'category': 'seeds',
            'amount': 1500.00,
            'description': 'Purchase of corn seeds',
            'payment_method': 'card',
            'reference_number': 'INV-2024-001'
        }),
        content_type='application/json'
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['transaction_type'] == 'expense'
    assert data['amount'] == 1500.00
    assert data['category'] == 'seeds'


def test_budget_variance_calculation(client):
    """Test that budget variance is calculated correctly"""
    # Create a budget
    budget_response = client.post('/api/financial/budgets',
        data=json.dumps({
            'name': 'Equipment Budget',
            'category': 'equipment',
            'fiscal_year': 2024,
            'planned_amount': 10000.00
        }),
        content_type='application/json'
    )
    budget_data = json.loads(budget_response.data)
    
    # Update actual amount
    update_response = client.put(f'/api/financial/budgets/{budget_data["id"]}',
        data=json.dumps({
            'actual_amount': 12500.00
        }),
        content_type='application/json'
    )
    
    updated_data = json.loads(update_response.data)
    assert updated_data['planned_amount'] == 10000.00
    assert updated_data['actual_amount'] == 12500.00
    assert updated_data['variance'] == 2500.00  # Over budget
