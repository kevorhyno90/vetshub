"""
Livestock management models for tracking animal health and production
"""
from datetime import datetime
from vetshub.models import db


class Livestock(db.Model):
    """Model for individual livestock animals"""
    __tablename__ = 'livestock'
    
    id = db.Column(db.Integer, primary_key=True)
    tag_number = db.Column(db.String(50), unique=True, nullable=False)
    species = db.Column(db.String(50), nullable=False)  # cattle, sheep, goat, pig, poultry
    breed = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    status = db.Column(db.String(50), default='active')  # active, sold, deceased
    acquisition_date = db.Column(db.Date)
    acquisition_cost = db.Column(db.Float)
    current_weight = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    health_records = db.relationship('HealthRecord', backref='animal', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'tag_number': self.tag_number,
            'species': self.species,
            'breed': self.breed,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'status': self.status,
            'acquisition_date': self.acquisition_date.isoformat() if self.acquisition_date else None,
            'acquisition_cost': self.acquisition_cost,
            'current_weight': self.current_weight,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class HealthRecord(db.Model):
    """Model for tracking livestock health records and treatments"""
    __tablename__ = 'health_records'
    
    id = db.Column(db.Integer, primary_key=True)
    livestock_id = db.Column(db.Integer, db.ForeignKey('livestock.id'), nullable=False)
    record_date = db.Column(db.Date, nullable=False)
    record_type = db.Column(db.String(50), nullable=False)  # vaccination, treatment, checkup, illness
    description = db.Column(db.Text, nullable=False)
    treatment = db.Column(db.Text)
    veterinarian = db.Column(db.String(100))
    cost = db.Column(db.Float)
    next_followup_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'livestock_id': self.livestock_id,
            'tag_number': self.animal.tag_number if self.animal else None,
            'record_date': self.record_date.isoformat() if self.record_date else None,
            'record_type': self.record_type,
            'description': self.description,
            'treatment': self.treatment,
            'veterinarian': self.veterinarian,
            'cost': self.cost,
            'next_followup_date': self.next_followup_date.isoformat() if self.next_followup_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
