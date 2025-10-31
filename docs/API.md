# VetsHub - API Reference

## Core Modules

### FarmManager

The central hub for managing all farm operations.

```python
from vetshub import FarmManager

farm = FarmManager("My Farm")
```

**Methods:**
- `add_crop(crop: Crop) -> str` - Add a crop and return its ID
- `get_crop(crop_id: str) -> Optional[Crop]` - Get a crop by ID
- `list_crops(status: Optional[str] = None) -> List[Crop]` - List all crops
- `add_livestock(animal: Livestock) -> str` - Add livestock
- `get_livestock(livestock_id: str) -> Optional[Livestock]` - Get livestock by ID
- `list_livestock(species: Optional[str] = None, status: Optional[str] = None) -> List[Livestock]` - List livestock
- `add_financial_record(record: FinancialRecord) -> str` - Add financial record
- `list_financial_records(...)` - List financial records with filters
- `add_labor_record(record: LaborRecord) -> str` - Add labor record
- `list_labor_records(...)` - List labor records with filters
- `get_dashboard_summary() -> Dict` - Get comprehensive dashboard

### Crop

Manages crop cycles and production.

```python
from datetime import datetime
from vetshub import Crop

crop = Crop(
    name="Corn",
    variety="Sweet",
    field_location="Field A",
    area_acres=50.0,
    planting_date=datetime(2025, 4, 1),
    expected_harvest_date=datetime(2025, 9, 1)
)
```

**Methods:**
- `harvest(harvest_date, yield_amount, yield_unit)` - Record harvest
- `add_note(note: str)` - Add a note
- `record_expense(amount: float)` - Record expense
- `record_revenue(amount: float)` - Record revenue
- `get_profit() -> float` - Calculate profit
- `get_yield_per_acre() -> Optional[float]` - Calculate yield per acre

### Livestock

Manages animal health and production.

```python
from vetshub import Livestock
from datetime import datetime

animal = Livestock(
    species="cattle",
    breed="Angus",
    tag_id="A-001",
    birth_date=datetime(2023, 1, 1),
    gender="female"
)
```

**Methods:**
- `add_health_record(date, condition, treatment, vet_name)` - Add health record
- `add_vaccination(date, vaccine_name, next_due_date)` - Record vaccination
- `record_production(date, product_type, quantity, unit)` - Record production
- `update_weight(weight, unit)` - Update weight
- `sell(sale_date, sale_price)` - Record sale
- `get_age_days() -> int` - Get age in days

### FinancialRecord

Tracks financial transactions.

```python
from vetshub import FinancialRecord
from datetime import datetime

record = FinancialRecord(
    transaction_date=datetime.now(),
    transaction_type="income",  # or "expense"
    category="crop_sales",
    amount=5000.0,
    description="Corn sales"
)
```

**Methods:**
- `set_reference(reference_type, reference_id)` - Link to another entity
- `add_notes(notes: str)` - Add notes

### LaborRecord

Tracks farm labor.

```python
from vetshub import LaborRecord
from datetime import datetime

labor = LaborRecord(
    worker_name="John Doe",
    work_date=datetime.now(),
    hours_worked=8.0,
    task_description="Field plowing",
    hourly_rate=18.0
)
```

**Methods:**
- `set_reference(reference_type, reference_id)` - Link to another entity
- `update_hours(hours_worked: float)` - Update hours and recalculate cost
- `add_notes(notes: str)` - Add notes

### AnalyticsEngine

Provides data analytics and reporting.

Accessed via `farm.analytics`:

```python
farm = FarmManager("My Farm")
analytics = farm.analytics
```

**Methods:**
- `get_financial_summary(start_date, end_date) -> Dict` - Financial summary
- `get_crop_summary() -> Dict` - Crop analytics
- `get_livestock_summary() -> Dict` - Livestock statistics
- `get_labor_summary(start_date, end_date) -> Dict` - Labor analysis
- `get_profitability_analysis() -> Dict` - Profitability metrics
- `get_resource_utilization() -> Dict` - Resource usage
- `generate_report(report_type: str) -> Dict` - Generate comprehensive report

## Data Structures

### Dashboard Summary

```python
{
    "farm_name": str,
    "summary": {
        "total_crops": int,
        "active_crops": int,
        "total_livestock": int,
        "active_livestock": int,
        "total_financial_records": int,
        "total_labor_records": int
    },
    "financial_summary": {...},
    "livestock_summary": {...},
    "crop_summary": {...}
}
```

### Financial Summary

```python
{
    "total_income": float,
    "total_expenses": float,
    "net_profit": float,
    "profit_margin": float,
    "income_by_category": Dict[str, float],
    "expense_by_category": Dict[str, float],
    "record_count": int
}
```

### Crop Summary

```python
{
    "total_crops": int,
    "total_area_acres": float,
    "status_breakdown": Dict[str, int],
    "total_expenses": float,
    "total_revenue": float,
    "total_profit": float,
    "avg_yield_per_acre": float,
    "harvested_crops": int
}
```

### Livestock Summary

```python
{
    "total_animals": int,
    "species_breakdown": Dict[str, int],
    "status_breakdown": Dict[str, int],
    "total_purchase_value": float,
    "total_sale_value": float,
    "profit_from_sales": float,
    "animals_with_health_records": int,
    "animals_vaccinated": int
}
```

## Status Values

### Crop Status
- `"planted"` - Crop has been planted
- `"growing"` - Crop is actively growing
- `"harvested"` - Crop has been harvested
- `"failed"` - Crop failed

### Livestock Status
- `"active"` - Animal is active on the farm
- `"sold"` - Animal has been sold
- `"deceased"` - Animal is deceased
- `"quarantine"` - Animal is in quarantine

### Labor Status
- `"completed"` - Work is completed
- `"pending"` - Work is pending
- `"cancelled"` - Work was cancelled

## Common Patterns

### Linking Records

```python
# Link financial record to crop
expense = FinancialRecord(...)
expense.set_reference("crop", crop_id)

# Link labor to livestock
labor = LaborRecord(...)
labor.set_reference("livestock", livestock_id)
```

### Filtering Lists

```python
# Get only active crops
active_crops = farm.list_crops(status="planted")

# Get cattle only
cattle = farm.list_livestock(species="cattle")

# Get income records
income = farm.list_financial_records(transaction_type="income")
```

### Date Filtering

```python
from datetime import datetime, timedelta

start = datetime.now() - timedelta(days=30)
end = datetime.now()

records = farm.list_financial_records(start_date=start, end_date=end)
```
