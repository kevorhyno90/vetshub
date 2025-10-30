"""
Financial management models for tracking budgets, expenses, and revenue
"""
from datetime import datetime
from vetshub.models import db


class Budget(db.Model):
    """Model for financial budgets and planning"""
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)  # crop, livestock, equipment, labor, other
    fiscal_year = db.Column(db.Integer, nullable=False)
    planned_amount = db.Column(db.Float, nullable=False)
    actual_amount = db.Column(db.Float, default=0.0)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        variance = self.actual_amount - self.planned_amount if self.planned_amount else 0
        variance_pct = (variance / self.planned_amount * 100) if self.planned_amount else 0
        
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'fiscal_year': self.fiscal_year,
            'planned_amount': self.planned_amount,
            'actual_amount': self.actual_amount,
            'variance': variance,
            'variance_percentage': variance_pct,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Transaction(db.Model):
    """Model for recording financial transactions"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_date = db.Column(db.Date, nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)  # income, expense
    category = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id'))
    payment_method = db.Column(db.String(50))  # cash, check, card, transfer
    reference_number = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    budget = db.relationship('Budget', backref='transactions')
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'transaction_type': self.transaction_type,
            'category': self.category,
            'amount': self.amount,
            'description': self.description,
            'budget_id': self.budget_id,
            'payment_method': self.payment_method,
            'reference_number': self.reference_number,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
