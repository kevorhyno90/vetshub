"""
API routes for analytics and reporting
"""
from flask import Blueprint, request, jsonify
from vetshub.analytics.analytics_service import AnalyticsService
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    """Get comprehensive dashboard overview"""
    overview = AnalyticsService.get_dashboard_overview()
    return jsonify(overview)


@analytics_bp.route('/crop-performance', methods=['GET'])
def get_crop_performance():
    """Get crop performance analytics"""
    performance = AnalyticsService.get_crop_performance()
    return jsonify(performance)


@analytics_bp.route('/livestock-health', methods=['GET'])
def get_livestock_health():
    """Get livestock health summary"""
    health_summary = AnalyticsService.get_livestock_health_summary()
    return jsonify(health_summary)


@analytics_bp.route('/financial-summary', methods=['GET'])
def get_financial_summary():
    """Get financial summary"""
    fiscal_year = request.args.get('fiscal_year', type=int)
    if fiscal_year is None:
        fiscal_year = datetime.now().year
    
    summary = AnalyticsService.get_financial_summary(fiscal_year)
    return jsonify(summary)


@analytics_bp.route('/labor-statistics', methods=['GET'])
def get_labor_statistics():
    """Get labor statistics"""
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    start_date = datetime.fromisoformat(start_date_str).date() if start_date_str else None
    end_date = datetime.fromisoformat(end_date_str).date() if end_date_str else None
    
    statistics = AnalyticsService.get_labor_statistics(start_date, end_date)
    return jsonify(statistics)
