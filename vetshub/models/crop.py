"""
Crop management models for tracking crop cycles and production
"""
from datetime import datetime
from vetshub.models import db


class Crop(db.Model):
    """Model for individual crop types"""
    __tablename__ = 'crops'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100))
    description = db.Column(db.Text)
    typical_growth_days = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    cycles = db.relationship('CropCycle', backref='crop', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'variety': self.variety,
            'description': self.description,
            'typical_growth_days': self.typical_growth_days,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CropCycle(db.Model):
    """Model for tracking individual crop growing cycles"""
    __tablename__ = 'crop_cycles'
    
    id = db.Column(db.Integer, primary_key=True)
    crop_id = db.Column(db.Integer, db.ForeignKey('crops.id'), nullable=False)
    field_location = db.Column(db.String(200))
    area_hectares = db.Column(db.Float)
    planting_date = db.Column(db.Date)
    expected_harvest_date = db.Column(db.Date)
    actual_harvest_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='planned')  # planned, planted, growing, harvested
    yield_amount = db.Column(db.Float)
    yield_unit = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'crop_id': self.crop_id,
            'crop_name': self.crop.name if self.crop else None,
            'field_location': self.field_location,
            'area_hectares': self.area_hectares,
            'planting_date': self.planting_date.isoformat() if self.planting_date else None,
            'expected_harvest_date': self.expected_harvest_date.isoformat() if self.expected_harvest_date else None,
            'actual_harvest_date': self.actual_harvest_date.isoformat() if self.actual_harvest_date else None,
            'status': self.status,
            'yield_amount': self.yield_amount,
            'yield_unit': self.yield_unit,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
