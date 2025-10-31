"""
API routes for crop management
"""
from flask import Blueprint, request, jsonify
from vetshub.models import db
from vetshub.models.crop import Crop, CropCycle
from datetime import datetime

crop_bp = Blueprint('crop', __name__)


@crop_bp.route('/', methods=['GET'])
def get_crops():
    """Get all crops"""
    crops = Crop.query.all()
    return jsonify([crop.to_dict() for crop in crops])


@crop_bp.route('/', methods=['POST'])
def create_crop():
    """Create a new crop"""
    data = request.get_json()
    crop = Crop(
        name=data['name'],
        variety=data.get('variety'),
        description=data.get('description'),
        typical_growth_days=data.get('typical_growth_days')
    )
    db.session.add(crop)
    db.session.commit()
    return jsonify(crop.to_dict()), 201


@crop_bp.route('/<int:crop_id>', methods=['GET'])
def get_crop(crop_id):
    """Get a specific crop"""
    crop = Crop.query.get_or_404(crop_id)
    return jsonify(crop.to_dict())


@crop_bp.route('/<int:crop_id>', methods=['PUT'])
def update_crop(crop_id):
    """Update a crop"""
    crop = Crop.query.get_or_404(crop_id)
    data = request.get_json()
    
    crop.name = data.get('name', crop.name)
    crop.variety = data.get('variety', crop.variety)
    crop.description = data.get('description', crop.description)
    crop.typical_growth_days = data.get('typical_growth_days', crop.typical_growth_days)
    
    db.session.commit()
    return jsonify(crop.to_dict())


@crop_bp.route('/<int:crop_id>', methods=['DELETE'])
def delete_crop(crop_id):
    """Delete a crop"""
    crop = Crop.query.get_or_404(crop_id)
    db.session.delete(crop)
    db.session.commit()
    return '', 204


@crop_bp.route('/cycles', methods=['GET'])
def get_crop_cycles():
    """Get all crop cycles"""
    cycles = CropCycle.query.all()
    return jsonify([cycle.to_dict() for cycle in cycles])


@crop_bp.route('/cycles', methods=['POST'])
def create_crop_cycle():
    """Create a new crop cycle"""
    data = request.get_json()
    cycle = CropCycle(
        crop_id=data['crop_id'],
        field_location=data.get('field_location'),
        area_hectares=data.get('area_hectares'),
        planting_date=datetime.fromisoformat(data['planting_date']).date() if data.get('planting_date') else None,
        expected_harvest_date=datetime.fromisoformat(data['expected_harvest_date']).date() if data.get('expected_harvest_date') else None,
        status=data.get('status', 'planned'),
        notes=data.get('notes')
    )
    db.session.add(cycle)
    db.session.commit()
    return jsonify(cycle.to_dict()), 201


@crop_bp.route('/cycles/<int:cycle_id>', methods=['GET'])
def get_crop_cycle(cycle_id):
    """Get a specific crop cycle"""
    cycle = CropCycle.query.get_or_404(cycle_id)
    return jsonify(cycle.to_dict())


@crop_bp.route('/cycles/<int:cycle_id>', methods=['PUT'])
def update_crop_cycle(cycle_id):
    """Update a crop cycle"""
    cycle = CropCycle.query.get_or_404(cycle_id)
    data = request.get_json()
    
    cycle.field_location = data.get('field_location', cycle.field_location)
    cycle.area_hectares = data.get('area_hectares', cycle.area_hectares)
    cycle.status = data.get('status', cycle.status)
    cycle.yield_amount = data.get('yield_amount', cycle.yield_amount)
    cycle.yield_unit = data.get('yield_unit', cycle.yield_unit)
    cycle.notes = data.get('notes', cycle.notes)
    
    if data.get('planting_date'):
        cycle.planting_date = datetime.fromisoformat(data['planting_date']).date()
    if data.get('expected_harvest_date'):
        cycle.expected_harvest_date = datetime.fromisoformat(data['expected_harvest_date']).date()
    if data.get('actual_harvest_date'):
        cycle.actual_harvest_date = datetime.fromisoformat(data['actual_harvest_date']).date()
    
    db.session.commit()
    return jsonify(cycle.to_dict())


@crop_bp.route('/cycles/<int:cycle_id>', methods=['DELETE'])
def delete_crop_cycle(cycle_id):
    """Delete a crop cycle"""
    cycle = CropCycle.query.get_or_404(cycle_id)
    db.session.delete(cycle)
    db.session.commit()
    return '', 204
