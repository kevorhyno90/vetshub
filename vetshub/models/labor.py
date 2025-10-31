"""
Labor management models for tracking workers and their activities
"""
from datetime import datetime
from vetshub.models import db


class Worker(db.Model):
    """Model for farm workers and labor resources"""
    __tablename__ = 'workers'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    employee_id = db.Column(db.String(50), unique=True)
    role = db.Column(db.String(100))  # farm manager, field worker, livestock handler, mechanic, etc.
    hire_date = db.Column(db.Date)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    hourly_rate = db.Column(db.Float)
    status = db.Column(db.String(50), default='active')  # active, inactive, terminated
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    work_logs = db.relationship('WorkLog', backref='worker', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'employee_id': self.employee_id,
            'role': self.role,
            'hire_date': self.hire_date.isoformat() if self.hire_date else None,
            'phone': self.phone,
            'email': self.email,
            'hourly_rate': self.hourly_rate,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class WorkLog(db.Model):
    """Model for tracking worker activities and hours"""
    __tablename__ = 'work_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    work_date = db.Column(db.Date, nullable=False)
    hours_worked = db.Column(db.Float, nullable=False)
    activity_type = db.Column(db.String(100))  # planting, harvesting, feeding, maintenance, etc.
    location = db.Column(db.String(200))
    description = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        labor_cost = self.hours_worked * self.worker.hourly_rate if self.worker and self.worker.hourly_rate else 0
        
        return {
            'id': self.id,
            'worker_id': self.worker_id,
            'worker_name': f"{self.worker.first_name} {self.worker.last_name}" if self.worker else None,
            'work_date': self.work_date.isoformat() if self.work_date else None,
            'hours_worked': self.hours_worked,
            'activity_type': self.activity_type,
            'location': self.location,
            'description': self.description,
            'labor_cost': labor_cost,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
