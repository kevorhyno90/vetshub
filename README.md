# VetsHub - Comprehensive Farm Management System

A comprehensive farm management system is an integrated, data-driven platform that unifies and streamlines all aspects of a farm's operations to enhance efficiency, profitability, and sustainability. It provides a centralized hub for managing everything from crop cycles and livestock health to financial budgets and labor. By moving beyond simple record-keeping, these systems leverage technology and data analytics to improve decision-making and optimize resource use.

## Features

### Core Management Modules

1. **Crop Management**
   - Track crop types, varieties, and growth characteristics
   - Manage crop cycles from planting to harvest
   - Monitor field locations, area coverage, and planting dates
   - Record yields and production metrics
   - Track status throughout the growing cycle

2. **Livestock Health Management**
   - Maintain detailed livestock records with unique tag numbers
   - Track species, breeds, and individual animal information
   - Record health events: vaccinations, treatments, checkups, illnesses
   - Monitor veterinary visits and associated costs
   - Schedule and track follow-up appointments
   - Manage animal status lifecycle

3. **Financial Management**
   - Create and manage budgets by category and fiscal year
   - Track planned vs. actual expenditures
   - Record income and expense transactions
   - Monitor budget variances and performance
   - Link transactions to specific budgets
   - Generate financial reports and summaries

4. **Labor Management**
   - Maintain worker profiles with roles and rates
   - Track work hours and activities
   - Record labor costs per activity
   - Monitor worker status and employment history
   - Analyze labor distribution across farm operations

5. **Analytics & Reporting**
   - Crop performance analysis with yield per hectare calculations
   - Livestock health statistics and trends
   - Financial summary with profit/loss analysis
   - Labor cost analysis by activity type
   - Comprehensive dashboard overview
   - Data-driven insights for decision making

## Technology Stack

- **Backend Framework**: Flask 3.0
- **Database**: SQLAlchemy ORM with SQLite (configurable for PostgreSQL/MySQL)
- **API**: RESTful API with JSON responses
- **CORS**: Flask-CORS for cross-origin support
- **Testing**: pytest with pytest-flask
- **Analytics**: pandas and numpy for data analysis

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/kevorhyno90/vetshub.git
cd vetshub
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python run.py
```

The API will be available at `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Crop Management
- `GET /api/crops/` - List all crops
- `POST /api/crops/` - Create a new crop
- `GET /api/crops/<id>` - Get crop details
- `PUT /api/crops/<id>` - Update crop
- `DELETE /api/crops/<id>` - Delete crop
- `GET /api/crops/cycles` - List all crop cycles
- `POST /api/crops/cycles` - Create crop cycle
- `GET /api/crops/cycles/<id>` - Get cycle details
- `PUT /api/crops/cycles/<id>` - Update cycle
- `DELETE /api/crops/cycles/<id>` - Delete cycle

#### Livestock Management
- `GET /api/livestock/` - List all livestock
- `POST /api/livestock/` - Create livestock record
- `GET /api/livestock/<id>` - Get livestock details
- `PUT /api/livestock/<id>` - Update livestock
- `DELETE /api/livestock/<id>` - Delete livestock
- `GET /api/livestock/health-records` - List all health records
- `POST /api/livestock/health-records` - Create health record
- `GET /api/livestock/<id>/health-records` - Get animal's health records

#### Financial Management
- `GET /api/financial/budgets` - List all budgets
- `POST /api/financial/budgets` - Create budget
- `GET /api/financial/budgets/<id>` - Get budget details
- `PUT /api/financial/budgets/<id>` - Update budget
- `DELETE /api/financial/budgets/<id>` - Delete budget
- `GET /api/financial/transactions` - List all transactions
- `POST /api/financial/transactions` - Create transaction

#### Labor Management
- `GET /api/labor/workers` - List all workers
- `POST /api/labor/workers` - Create worker
- `GET /api/labor/workers/<id>` - Get worker details
- `PUT /api/labor/workers/<id>` - Update worker
- `DELETE /api/labor/workers/<id>` - Delete worker
- `GET /api/labor/work-logs` - List all work logs
- `POST /api/labor/work-logs` - Create work log
- `GET /api/labor/workers/<id>/work-logs` - Get worker's logs

#### Analytics
- `GET /api/analytics/dashboard` - Get comprehensive dashboard
- `GET /api/analytics/crop-performance` - Crop performance metrics
- `GET /api/analytics/livestock-health` - Livestock health summary
- `GET /api/analytics/financial-summary?fiscal_year=<year>` - Financial summary
- `GET /api/analytics/labor-statistics?start_date=<date>&end_date=<date>` - Labor statistics

## Testing

Run the test suite:
```bash
pytest
```

Run tests with coverage:
```bash
pytest --cov=vetshub tests/
```

## Configuration

The system can be configured through environment variables:

- `FLASK_ENV` - Set to 'development', 'production', or 'testing'
- `SECRET_KEY` - Secret key for session management
- `DATABASE_URL` - Database connection string

## Project Structure

```
vetshub/
├── vetshub/
│   ├── __init__.py
│   ├── app.py              # Application factory
│   ├── config.py           # Configuration classes
│   ├── models/             # Database models
│   │   ├── __init__.py
│   │   ├── crop.py
│   │   ├── livestock.py
│   │   ├── financial.py
│   │   └── labor.py
│   ├── api/                # API routes
│   │   ├── __init__.py
│   │   ├── crop_routes.py
│   │   ├── livestock_routes.py
│   │   ├── financial_routes.py
│   │   ├── labor_routes.py
│   │   └── analytics_routes.py
│   ├── analytics/          # Analytics services
│   │   ├── __init__.py
│   │   └── analytics_service.py
│   └── services/           # Business logic services
├── tests/                  # Test suite
├── run.py                  # Application entry point
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
