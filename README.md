# VetsHub - Comprehensive Farm Management System

A comprehensive farm management system is an integrated, data-driven platform that unifies and streamlines all aspects of a farm's operations to enhance efficiency, profitability, and sustainability. It provides a centralized hub for managing everything from crop cycles and livestock health to financial budgets and labor. By moving beyond simple record-keeping, these systems leverage technology and data analytics to improve decision-making and optimize resource use.

## Features

### Core Management Modules

1. **Crop Management**
   - Track crop cycles from planting to harvest
   - Monitor field locations and acreage
   - Record yields and production metrics
   - Calculate yield per acre and profitability
   - Add notes and observations

2. **Livestock Management**
   - Track individual animals with unique IDs
   - Monitor health records and treatments
   - Schedule and track vaccinations
   - Record production (milk, eggs, etc.)
   - Manage animal sales and purchases
   - Track weight and growth metrics

3. **Financial Management**
   - Record income and expenses
   - Categorize transactions
   - Link finances to specific crops or livestock
   - Track payment methods
   - Generate financial summaries

4. **Labor Management**
   - Track worker hours and tasks
   - Calculate labor costs
   - Link labor to specific operations
   - Monitor worker productivity
   - Generate labor reports

5. **Data Analytics & Reporting**
   - Financial summaries and profit analysis
   - Crop performance metrics
   - Livestock statistics
   - Resource utilization reports
   - Profitability analysis
   - Comprehensive farm reports

### Centralized Hub

The `FarmManager` class serves as a centralized hub, providing unified access to all farm operations:
- Single interface for all management functions
- Cross-module data integration
- Comprehensive dashboard views
- Streamlined operations

## Installation

```bash
# Clone the repository
git clone https://github.com/kevorhyno90/vetshub.git
cd vetshub

# Install the package
pip install -e .
```

## Quick Start

```python
from datetime import datetime
from vetshub import FarmManager, Crop, Livestock, FinancialRecord, LaborRecord

# Create farm manager
farm = FarmManager("My Farm")

# Add a crop
corn = Crop(
    name="Corn",
    variety="Sweet Corn",
    field_location="North Field",
    area_acres=50.0,
    planting_date=datetime(2025, 4, 15),
    expected_harvest_date=datetime(2025, 9, 30)
)
farm.add_crop(corn)

# Add livestock
cow = Livestock(
    species="cattle",
    breed="Holstein",
    tag_id="H-001",
    birth_date=datetime(2023, 3, 15),
    gender="female"
)
cow.update_weight(1200, "lbs")
farm.add_livestock(cow)

# Record finances
income = FinancialRecord(
    transaction_date=datetime.now(),
    transaction_type="income",
    category="crop_sales",
    amount=5000.0,
    description="Corn sales"
)
farm.add_financial_record(income)

# Track labor
labor = LaborRecord(
    worker_name="John Smith",
    work_date=datetime.now(),
    hours_worked=8.0,
    task_description="Field planting",
    hourly_rate=18.0
)
farm.add_labor_record(labor)

# Generate reports
dashboard = farm.get_dashboard_summary()
print(dashboard)
```

## CLI Demo

Run the demonstration CLI to see the system in action:

```bash
python src/vetshub/cli.py
```

This will demonstrate:
- Adding crops and tracking cycles
- Managing livestock and health records
- Recording financial transactions
- Tracking labor costs
- Generating analytics and reports
- Accessing the centralized hub

## Testing

Run the comprehensive test suite:

```bash
python -m pytest tests/
# or
python tests/test_farm_system.py
```

## Architecture

The system is built with a modular architecture:

```
vetshub/
├── models/          # Data models (Crop, Livestock, Financial, Labor)
├── managers/        # FarmManager - centralized hub
├── analytics/       # Analytics engine for data-driven insights
└── cli.py          # Command-line interface demo
```

## Use Cases

- **Small to Medium Farms**: Centralize operations and improve efficiency
- **Organic Farms**: Track sustainable practices and certifications
- **Livestock Operations**: Monitor animal health and production
- **Crop Farms**: Optimize planting schedules and yields
- **Mixed Operations**: Integrate all aspects of diverse farming

## Benefits

- ✓ **Data-Driven Decisions**: Analytics provide actionable insights
- ✓ **Increased Efficiency**: Streamlined operations and automation
- ✓ **Better Profitability**: Track costs and optimize resource use
- ✓ **Improved Sustainability**: Monitor and optimize resource usage
- ✓ **Centralized Management**: Single hub for all operations
- ✓ **Scalable**: Grows with your farm's needs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.
