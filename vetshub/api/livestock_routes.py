"""
API routes for livestock management
"""
from flask import Blueprint, request, jsonify
from vetshub.models import db
from vetshub.models.livestock import Livestock, HealthRecord
from datetime import datetime

livestock_bp = Blueprint('livestock', __name__)


@livestock_bp.route('/', methods=['GET'])
def get_livestock():
    """Get all livestock"""
    livestock = Livestock.query.all()
    return jsonify([animal.to_dict() for animal in livestock])


@livestock_bp.route('/', methods=['POST'])
def create_livestock():
    """Create a new livestock record"""
    data = request.get_json()
    animal = Livestock(
        tag_number=data['tag_number'],
        species=data['species'],
        breed=data.get('breed'),
        date_of_birth=datetime.fromisoformat(data['date_of_birth']).date() if data.get('date_of_birth') else None,
        gender=data.get('gender'),
        acquisition_date=datetime.fromisoformat(data['acquisition_date']).date() if data.get('acquisition_date') else None,
        acquisition_cost=data.get('acquisition_cost'),
        current_weight=data.get('current_weight'),
        notes=data.get('notes')
    )
    db.session.add(animal)
    db.session.commit()
    return jsonify(animal.to_dict()), 201


@livestock_bp.route('/<int:livestock_id>', methods=['GET'])
def get_livestock_by_id(livestock_id):
    """Get a specific livestock"""
    animal = Livestock.query.get_or_404(livestock_id)
    return jsonify(animal.to_dict())


@livestock_bp.route('/<int:livestock_id>', methods=['PUT'])
def update_livestock(livestock_id):
    """Update livestock information"""
    animal = Livestock.query.get_or_404(livestock_id)
    data = request.get_json()
    
    animal.tag_number = data.get('tag_number', animal.tag_number)
    animal.breed = data.get('breed', animal.breed)
    animal.status = data.get('status', animal.status)
    animal.current_weight = data.get('current_weight', animal.current_weight)
    animal.notes = data.get('notes', animal.notes)
    
    if data.get('date_of_birth'):
        animal.date_of_birth = datetime.fromisoformat(data['date_of_birth']).date()
    
    db.session.commit()
    return jsonify(animal.to_dict())


@livestock_bp.route('/<int:livestock_id>', methods=['DELETE'])
def delete_livestock(livestock_id):
    """Delete a livestock record"""
    animal = Livestock.query.get_or_404(livestock_id)
    db.session.delete(animal)
    db.session.commit()
    return '', 204


@livestock_bp.route('/health-records', methods=['GET'])
def get_health_records():
    """Get all health records"""
    records = HealthRecord.query.all()
    return jsonify([record.to_dict() for record in records])


@livestock_bp.route('/health-records', methods=['POST'])
def create_health_record():
    """Create a new health record"""
    data = request.get_json()
    record = HealthRecord(
        livestock_id=data['livestock_id'],
        record_date=datetime.fromisoformat(data['record_date']).date(),
        record_type=data['record_type'],
        description=data['description'],
        treatment=data.get('treatment'),
        veterinarian=data.get('veterinarian'),
        cost=data.get('cost'),
        next_followup_date=datetime.fromisoformat(data['next_followup_date']).date() if data.get('next_followup_date') else None,
        notes=data.get('notes')
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@livestock_bp.route('/<int:livestock_id>/health-records', methods=['GET'])
def get_livestock_health_records(livestock_id):
    """Get health records for a specific livestock"""
    animal = Livestock.query.get_or_404(livestock_id)
    records = animal.health_records.all()
    return jsonify([record.to_dict() for record in records])


@livestock_bp.route('/health-records/<int:record_id>', methods=['GET'])
def get_health_record(record_id):
    """Get a specific health record"""
    record = HealthRecord.query.get_or_404(record_id)
    return jsonify(record.to_dict())


@livestock_bp.route('/health-records/<int:record_id>', methods=['PUT'])
def update_health_record(record_id):
    """Update a health record"""
    record = HealthRecord.query.get_or_404(record_id)
    data = request.get_json()
    
    record.record_type = data.get('record_type', record.record_type)
    record.description = data.get('description', record.description)
    record.treatment = data.get('treatment', record.treatment)
    record.veterinarian = data.get('veterinarian', record.veterinarian)
    record.cost = data.get('cost', record.cost)
    record.notes = data.get('notes', record.notes)
    
    if data.get('record_date'):
        record.record_date = datetime.fromisoformat(data['record_date']).date()
    if data.get('next_followup_date'):
        record.next_followup_date = datetime.fromisoformat(data['next_followup_date']).date()
    
    db.session.commit()
    return jsonify(record.to_dict())


@livestock_bp.route('/health-records/<int:record_id>', methods=['DELETE'])
def delete_health_record(record_id):
    """Delete a health record"""
    record = HealthRecord.query.get_or_404(record_id)
    db.session.delete(record)
    db.session.commit()
    return '', 204
