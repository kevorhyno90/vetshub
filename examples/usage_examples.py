"""
Example Usage of VetsHub Farm Management System

This file demonstrates various use cases and patterns for using the system.
"""

from datetime import datetime, timedelta
from vetshub import FarmManager, Crop, Livestock, FinancialRecord, LaborRecord


def example_basic_usage():
    """Basic usage example"""
    print("=== Basic Usage Example ===\n")
    
    # Initialize farm
    farm = FarmManager("Sunny Acres Farm")
    
    # Add a crop
    tomatoes = Crop(
        name="Tomatoes",
        variety="Roma",
        field_location="Greenhouse 1",
        area_acres=2.5,
        planting_date=datetime(2025, 3, 1),
        expected_harvest_date=datetime(2025, 7, 15)
    )
    farm.add_crop(tomatoes)
    print(f"Added: {tomatoes}")
    
    # Track crop expenses
    tomatoes.record_expense(200.0)  # Seeds
    tomatoes.record_expense(150.0)  # Fertilizer
    print(f"Total expenses: ${tomatoes.expenses}")
    
    # Harvest the crop
    tomatoes.harvest(datetime(2025, 7, 20), 1250.0, "lbs")
    tomatoes.record_revenue(3750.0)
    print(f"Profit: ${tomatoes.get_profit()}")


def example_livestock_management():
    """Livestock management example"""
    print("\n=== Livestock Management Example ===\n")
    
    farm = FarmManager("Green Pastures Farm")
    
    # Add dairy cow
    bessie = Livestock(
        species="cattle",
        breed="Jersey",
        tag_id="J-042",
        birth_date=datetime(2022, 4, 15),
        gender="female"
    )
    bessie.purchase_price = 2000.0
    bessie.update_weight(1100, "lbs")
    
    # Track health
    bessie.add_health_record(
        datetime(2025, 6, 1),
        "Annual checkup",
        "All vitals normal, administered vitamins",
        "Dr. Johnson"
    )
    
    # Track vaccinations
    bessie.add_vaccination(
        datetime(2025, 6, 1),
        "Brucellosis Vaccine",
        datetime(2026, 6, 1)
    )
    
    # Record production
    for day in range(30):
        date = datetime(2025, 10, 1) + timedelta(days=day)
        bessie.record_production(date, "milk", 6.5, "gallons")
    
    farm.add_livestock(bessie)
    print(f"Added: {bessie}")
    print(f"Production records: {len(bessie.production_records)}")
    print(f"Health records: {len(bessie.health_records)}")
    print(f"Age in days: {bessie.get_age_days()}")


def example_financial_tracking():
    """Financial tracking example"""
    print("\n=== Financial Tracking Example ===\n")
    
    farm = FarmManager("Prosperous Farm")
    
    # Record various transactions
    transactions = [
        ("income", "crop_sales", 15000.0, "Wheat harvest sales"),
        ("expense", "seeds", 2500.0, "Spring seed purchase"),
        ("expense", "equipment", 8000.0, "Tractor repair"),
        ("income", "livestock_sales", 5000.0, "Cattle sale"),
        ("expense", "feed", 3500.0, "Livestock feed"),
        ("expense", "utilities", 800.0, "Electricity and water"),
    ]
    
    for trans_type, category, amount, description in transactions:
        record = FinancialRecord(
            transaction_date=datetime.now(),
            transaction_type=trans_type,
            category=category,
            amount=amount,
            description=description
        )
        farm.add_financial_record(record)
    
    # Get financial summary
    summary = farm.analytics.get_financial_summary()
    print(f"Total Income: ${summary['total_income']:.2f}")
    print(f"Total Expenses: ${summary['total_expenses']:.2f}")
    print(f"Net Profit: ${summary['net_profit']:.2f}")
    print(f"Profit Margin: {summary['profit_margin']:.2f}%")


def example_labor_tracking():
    """Labor tracking example"""
    print("\n=== Labor Tracking Example ===\n")
    
    farm = FarmManager("Busy Bee Farm")
    
    # Add a crop for reference
    corn = Crop(
        name="Corn",
        variety="Sweet",
        field_location="South Field",
        area_acres=40.0,
        planting_date=datetime(2025, 4, 1),
        expected_harvest_date=datetime(2025, 9, 1)
    )
    crop_id = farm.add_crop(corn)
    
    # Track labor for planting
    workers = [
        ("John Smith", 10.0, "Field preparation", 18.0),
        ("Jane Doe", 12.0, "Planting", 20.0),
        ("Bob Johnson", 8.0, "Irrigation setup", 19.0),
    ]
    
    for name, hours, task, rate in workers:
        labor = LaborRecord(
            worker_name=name,
            work_date=datetime(2025, 4, 1),
            hours_worked=hours,
            task_description=task,
            hourly_rate=rate
        )
        labor.set_reference("crop", crop_id)
        farm.add_labor_record(labor)
    
    # Get labor summary
    summary = farm.analytics.get_labor_summary()
    print(f"Total Hours: {summary['total_hours']}")
    print(f"Total Cost: ${summary['total_cost']:.2f}")
    print(f"Number of Workers: {summary['worker_count']}")


def example_analytics_reports():
    """Analytics and reporting example"""
    print("\n=== Analytics & Reporting Example ===\n")
    
    farm = FarmManager("Data-Driven Farm")
    
    # Add sample data
    crop = Crop("Wheat", "Winter", "Field A", 100.0, datetime(2025, 3, 1), datetime(2025, 8, 1))
    crop.record_expense(8000.0)
    crop.harvest(datetime(2025, 8, 1), 6000.0, "bushels")
    crop.record_revenue(30000.0)
    farm.add_crop(crop)
    
    cow = Livestock("cattle", "Angus", "A-001", datetime(2022, 1, 1), "male")
    cow.purchase_price = 1200.0
    cow.sell(datetime(2025, 10, 1), 1800.0)
    farm.add_livestock(cow)
    
    farm.add_financial_record(
        FinancialRecord(datetime.now(), "income", "crop_sales", 30000.0, "Wheat sales")
    )
    farm.add_financial_record(
        FinancialRecord(datetime.now(), "expense", "seeds", 8000.0, "Wheat seeds")
    )
    
    # Generate comprehensive report
    report = farm.analytics.generate_report("comprehensive")
    
    print("Comprehensive Farm Report:")
    print(f"  Farm: {report['farm_name']}")
    print(f"  Crop Profit: ${report['crop_summary']['total_profit']:.2f}")
    print(f"  Livestock Profit: ${report['livestock_summary']['profit_from_sales']:.2f}")
    print(f"  Overall Net Profit: ${report['profitability_analysis']['overall_net_profit']:.2f}")
    print(f"  Land in Use: {report['resource_utilization']['land_utilization']['total_acres_in_use']} acres")


def example_integrated_workflow():
    """Complete integrated workflow example"""
    print("\n=== Integrated Workflow Example ===\n")
    
    # Step 1: Create farm
    farm = FarmManager("Complete Farm")
    print("Step 1: Farm created")
    
    # Step 2: Plan crop season
    soybean = Crop(
        name="Soybeans",
        variety="Organic",
        field_location="East Field",
        area_acres=60.0,
        planting_date=datetime(2025, 5, 1),
        expected_harvest_date=datetime(2025, 10, 15)
    )
    crop_id = farm.add_crop(soybean)
    print("Step 2: Crop planned")
    
    # Step 3: Record planting expenses and labor
    expense = FinancialRecord(
        datetime(2025, 5, 1),
        "expense",
        "seeds",
        4500.0,
        "Organic soybean seeds"
    )
    expense.set_reference("crop", crop_id)
    farm.add_financial_record(expense)
    
    labor = LaborRecord("Team Lead", datetime(2025, 5, 1), 20.0, "Soybean planting", 22.0)
    labor.set_reference("crop", crop_id)
    farm.add_labor_record(labor)
    
    soybean.record_expense(4500.0)
    print("Step 3: Expenses and labor recorded")
    
    # Step 4: Harvest and record revenue
    soybean.harvest(datetime(2025, 10, 15), 3600.0, "bushels")
    soybean.record_revenue(25200.0)
    
    income = FinancialRecord(
        datetime(2025, 10, 15),
        "income",
        "crop_sales",
        25200.0,
        "Soybean harvest sales"
    )
    income.set_reference("crop", crop_id)
    farm.add_financial_record(income)
    print("Step 4: Harvest completed and revenue recorded")
    
    # Step 5: Generate dashboard and analysis
    dashboard = farm.get_dashboard_summary()
    print("\nStep 5: Dashboard Summary")
    print(f"  Crop Yield per Acre: {soybean.get_yield_per_acre():.2f} bushels/acre")
    print(f"  Crop Profit: ${soybean.get_profit():.2f}")
    print(f"  Farm Net Profit: ${dashboard['financial_summary']['net_profit']:.2f}")
    print(f"  Profit Margin: {dashboard['financial_summary']['profit_margin']:.2f}%")


if __name__ == "__main__":
    example_basic_usage()
    example_livestock_management()
    example_financial_tracking()
    example_labor_tracking()
    example_analytics_reports()
    example_integrated_workflow()
    
    print("\n" + "="*60)
    print("All examples completed successfully!")
    print("="*60)
