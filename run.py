#!/usr/bin/env python
"""
Main entry point for VetsHub Farm Management System
"""
import os
from vetshub.app import create_app

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # Only enable debug mode if explicitly set in environment
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
