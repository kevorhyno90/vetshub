"""
API routes for financial management
"""
from flask import Blueprint, request, jsonify
from vetshub.models import db
from vetshub.models.financial import Budget, Transaction
from datetime import datetime

financial_bp = Blueprint('financial', __name__)


@financial_bp.route('/budgets', methods=['GET'])
def get_budgets():
    """Get all budgets"""
    budgets = Budget.query.all()
    return jsonify([budget.to_dict() for budget in budgets])


@financial_bp.route('/budgets', methods=['POST'])
def create_budget():
    """Create a new budget"""
    data = request.get_json()
    budget = Budget(
        name=data['name'],
        category=data['category'],
        fiscal_year=data['fiscal_year'],
        planned_amount=data['planned_amount'],
        start_date=datetime.fromisoformat(data['start_date']).date() if data.get('start_date') else None,
        end_date=datetime.fromisoformat(data['end_date']).date() if data.get('end_date') else None,
        description=data.get('description')
    )
    db.session.add(budget)
    db.session.commit()
    return jsonify(budget.to_dict()), 201


@financial_bp.route('/budgets/<int:budget_id>', methods=['GET'])
def get_budget(budget_id):
    """Get a specific budget"""
    budget = Budget.query.get_or_404(budget_id)
    return jsonify(budget.to_dict())


@financial_bp.route('/budgets/<int:budget_id>', methods=['PUT'])
def update_budget(budget_id):
    """Update a budget"""
    budget = Budget.query.get_or_404(budget_id)
    data = request.get_json()
    
    budget.name = data.get('name', budget.name)
    budget.category = data.get('category', budget.category)
    budget.planned_amount = data.get('planned_amount', budget.planned_amount)
    budget.actual_amount = data.get('actual_amount', budget.actual_amount)
    budget.description = data.get('description', budget.description)
    
    if data.get('start_date'):
        budget.start_date = datetime.fromisoformat(data['start_date']).date()
    if data.get('end_date'):
        budget.end_date = datetime.fromisoformat(data['end_date']).date()
    
    db.session.commit()
    return jsonify(budget.to_dict())


@financial_bp.route('/budgets/<int:budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    """Delete a budget"""
    budget = Budget.query.get_or_404(budget_id)
    db.session.delete(budget)
    db.session.commit()
    return '', 204


@financial_bp.route('/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    transactions = Transaction.query.all()
    return jsonify([transaction.to_dict() for transaction in transactions])


@financial_bp.route('/transactions', methods=['POST'])
def create_transaction():
    """Create a new transaction"""
    data = request.get_json()
    transaction = Transaction(
        transaction_date=datetime.fromisoformat(data['transaction_date']).date(),
        transaction_type=data['transaction_type'],
        category=data['category'],
        amount=data['amount'],
        description=data['description'],
        budget_id=data.get('budget_id'),
        payment_method=data.get('payment_method'),
        reference_number=data.get('reference_number'),
        notes=data.get('notes')
    )
    db.session.add(transaction)
    
    # Update budget actual amount if linked
    if transaction.budget_id:
        budget = Budget.query.get(transaction.budget_id)
        if budget:
            if transaction.transaction_type == 'expense':
                budget.actual_amount += transaction.amount
            # Income would reduce actual expenses
    
    db.session.commit()
    return jsonify(transaction.to_dict()), 201


@financial_bp.route('/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get a specific transaction"""
    transaction = Transaction.query.get_or_404(transaction_id)
    return jsonify(transaction.to_dict())


@financial_bp.route('/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update a transaction"""
    transaction = Transaction.query.get_or_404(transaction_id)
    data = request.get_json()
    
    transaction.transaction_type = data.get('transaction_type', transaction.transaction_type)
    transaction.category = data.get('category', transaction.category)
    transaction.amount = data.get('amount', transaction.amount)
    transaction.description = data.get('description', transaction.description)
    transaction.payment_method = data.get('payment_method', transaction.payment_method)
    transaction.reference_number = data.get('reference_number', transaction.reference_number)
    transaction.notes = data.get('notes', transaction.notes)
    
    if data.get('transaction_date'):
        transaction.transaction_date = datetime.fromisoformat(data['transaction_date']).date()
    
    db.session.commit()
    return jsonify(transaction.to_dict())


@financial_bp.route('/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction"""
    transaction = Transaction.query.get_or_404(transaction_id)
    db.session.delete(transaction)
    db.session.commit()
    return '', 204
