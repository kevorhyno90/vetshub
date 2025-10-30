"""
Main application factory for VetsHub Farm Management System
"""
from flask import Flask
from flask_cors import CORS
from vetshub.config import config
from vetshub.models import db


def create_app(config_name='default'):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Register blueprints
    from vetshub.api.crop_routes import crop_bp
    from vetshub.api.livestock_routes import livestock_bp
    from vetshub.api.financial_routes import financial_bp
    from vetshub.api.labor_routes import labor_bp
    from vetshub.api.analytics_routes import analytics_bp
    
    app.register_blueprint(crop_bp, url_prefix='/api/crops')
    app.register_blueprint(livestock_bp, url_prefix='/api/livestock')
    app.register_blueprint(financial_bp, url_prefix='/api/financial')
    app.register_blueprint(labor_bp, url_prefix='/api/labor')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        """Root endpoint"""
        return {
            'message': 'VetsHub Farm Management System API',
            'version': '1.0.0',
            'endpoints': {
                'crops': '/api/crops',
                'livestock': '/api/livestock',
                'financial': '/api/financial',
                'labor': '/api/labor',
                'analytics': '/api/analytics'
            }
        }
    
    @app.route('/health')
    def health():
        """Health check endpoint"""
        return {'status': 'healthy'}
    
    return app
