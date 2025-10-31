"""
API routes for labor management
"""
from flask import Blueprint, request, jsonify
from vetshub.models import db
from vetshub.models.labor import Worker, WorkLog
from datetime import datetime

labor_bp = Blueprint('labor', __name__)


@labor_bp.route('/workers', methods=['GET'])
def get_workers():
    """Get all workers"""
    workers = Worker.query.all()
    return jsonify([worker.to_dict() for worker in workers])


@labor_bp.route('/workers', methods=['POST'])
def create_worker():
    """Create a new worker"""
    data = request.get_json()
    worker = Worker(
        first_name=data['first_name'],
        last_name=data['last_name'],
        employee_id=data.get('employee_id'),
        role=data.get('role'),
        hire_date=datetime.fromisoformat(data['hire_date']).date() if data.get('hire_date') else None,
        phone=data.get('phone'),
        email=data.get('email'),
        hourly_rate=data.get('hourly_rate'),
        status=data.get('status', 'active'),
        notes=data.get('notes')
    )
    db.session.add(worker)
    db.session.commit()
    return jsonify(worker.to_dict()), 201


@labor_bp.route('/workers/<int:worker_id>', methods=['GET'])
def get_worker(worker_id):
    """Get a specific worker"""
    worker = Worker.query.get_or_404(worker_id)
    return jsonify(worker.to_dict())


@labor_bp.route('/workers/<int:worker_id>', methods=['PUT'])
def update_worker(worker_id):
    """Update worker information"""
    worker = Worker.query.get_or_404(worker_id)
    data = request.get_json()
    
    worker.first_name = data.get('first_name', worker.first_name)
    worker.last_name = data.get('last_name', worker.last_name)
    worker.role = data.get('role', worker.role)
    worker.phone = data.get('phone', worker.phone)
    worker.email = data.get('email', worker.email)
    worker.hourly_rate = data.get('hourly_rate', worker.hourly_rate)
    worker.status = data.get('status', worker.status)
    worker.notes = data.get('notes', worker.notes)
    
    if data.get('hire_date'):
        worker.hire_date = datetime.fromisoformat(data['hire_date']).date()
    
    db.session.commit()
    return jsonify(worker.to_dict())


@labor_bp.route('/workers/<int:worker_id>', methods=['DELETE'])
def delete_worker(worker_id):
    """Delete a worker"""
    worker = Worker.query.get_or_404(worker_id)
    db.session.delete(worker)
    db.session.commit()
    return '', 204


@labor_bp.route('/work-logs', methods=['GET'])
def get_work_logs():
    """Get all work logs"""
    logs = WorkLog.query.all()
    return jsonify([log.to_dict() for log in logs])


@labor_bp.route('/work-logs', methods=['POST'])
def create_work_log():
    """Create a new work log"""
    data = request.get_json()
    log = WorkLog(
        worker_id=data['worker_id'],
        work_date=datetime.fromisoformat(data['work_date']).date(),
        hours_worked=data['hours_worked'],
        activity_type=data.get('activity_type'),
        location=data.get('location'),
        description=data.get('description'),
        notes=data.get('notes')
    )
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201


@labor_bp.route('/workers/<int:worker_id>/work-logs', methods=['GET'])
def get_worker_logs(worker_id):
    """Get work logs for a specific worker"""
    worker = Worker.query.get_or_404(worker_id)
    logs = worker.work_logs.all()
    return jsonify([log.to_dict() for log in logs])


@labor_bp.route('/work-logs/<int:log_id>', methods=['GET'])
def get_work_log(log_id):
    """Get a specific work log"""
    log = WorkLog.query.get_or_404(log_id)
    return jsonify(log.to_dict())


@labor_bp.route('/work-logs/<int:log_id>', methods=['PUT'])
def update_work_log(log_id):
    """Update a work log"""
    log = WorkLog.query.get_or_404(log_id)
    data = request.get_json()
    
    log.hours_worked = data.get('hours_worked', log.hours_worked)
    log.activity_type = data.get('activity_type', log.activity_type)
    log.location = data.get('location', log.location)
    log.description = data.get('description', log.description)
    log.notes = data.get('notes', log.notes)
    
    if data.get('work_date'):
        log.work_date = datetime.fromisoformat(data['work_date']).date()
    
    db.session.commit()
    return jsonify(log.to_dict())


@labor_bp.route('/work-logs/<int:log_id>', methods=['DELETE'])
def delete_work_log(log_id):
    """Delete a work log"""
    log = WorkLog.query.get_or_404(log_id)
    db.session.delete(log)
    db.session.commit()
    return '', 204
