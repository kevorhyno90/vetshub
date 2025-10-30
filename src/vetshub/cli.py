"""Command-line interface for VetsHub Farm Management System"""

import sys
import json
from datetime import datetime
from vetshub import FarmManager, Crop, Livestock, FinancialRecord, LaborRecord


def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_json(data):
    """Pretty print JSON data"""
    print(json.dumps(data, indent=2, default=str))


def demo_comprehensive_farm_system():
    """Demonstrate the comprehensive farm management system"""
    
    print_header("VetsHub - Comprehensive Farm Management System")
    print("Initializing farm management system...")
    
    # Create farm manager
    farm = FarmManager("Green Valley Farm")
    print(f"\nFarm Manager created for: {farm.farm_name}")
    
    # 1. CROP MANAGEMENT
    print_header("1. Crop Management")
    
    # Add crops
    corn_crop = Crop(
        name="Corn",
        variety="Sweet Corn Hybrid",
        field_location="North Field",
        area_acres=50.0,
        planting_date=datetime(2025, 4, 15),
        expected_harvest_date=datetime(2025, 9, 30)
    )
    corn_crop.record_expense(5000.0)  # Seeds and fertilizer
    farm.add_crop(corn_crop)
    print(f"Added crop: {corn_crop}")
    
    wheat_crop = Crop(
        name="Wheat",
        variety="Winter Wheat",
        field_location="South Field",
        area_acres=75.0,
        planting_date=datetime(2025, 3, 1),
        expected_harvest_date=datetime(2025, 8, 15)
    )
    wheat_crop.record_expense(7500.0)
    wheat_crop.harvest(datetime(2025, 8, 15), 4500.0, "bushels")
    wheat_crop.record_revenue(22500.0)
    farm.add_crop(wheat_crop)
    print(f"Added crop: {wheat_crop}")
    
    # 2. LIVESTOCK MANAGEMENT
    print_header("2. Livestock Management")
    
    # Add livestock
    cow1 = Livestock(
        species="cattle",
        breed="Holstein",
        tag_id="H-001",
        birth_date=datetime(2023, 3, 15),
        gender="female"
    )
    cow1.purchase_price = 1500.0
    cow1.update_weight(1200, "lbs")
    cow1.add_vaccination(datetime(2025, 5, 1), "Brucellosis Vaccine", datetime(2026, 5, 1))
    cow1.record_production(datetime(2025, 10, 1), "milk", 50, "gallons")
    farm.add_livestock(cow1)
    print(f"Added livestock: {cow1}")
    
    chicken1 = Livestock(
        species="chicken",
        breed="Rhode Island Red",
        tag_id="C-001",
        birth_date=datetime(2025, 1, 10),
        gender="female"
    )
    chicken1.purchase_price = 25.0
    chicken1.record_production(datetime(2025, 10, 1), "eggs", 12, "count")
    farm.add_livestock(chicken1)
    print(f"Added livestock: {chicken1}")
    
    # 3. FINANCIAL MANAGEMENT
    print_header("3. Financial Management")
    
    # Add financial records
    income1 = FinancialRecord(
        transaction_date=datetime(2025, 8, 20),
        transaction_type="income",
        category="crop_sales",
        amount=22500.0,
        description="Wheat harvest sales"
    )
    income1.set_reference("crop", wheat_crop.id)
    farm.add_financial_record(income1)
    print(f"Added financial record: {income1}")
    
    expense1 = FinancialRecord(
        transaction_date=datetime(2025, 4, 10),
        transaction_type="expense",
        category="seeds",
        amount=5000.0,
        description="Corn seeds and fertilizer"
    )
    expense1.set_reference("crop", corn_crop.id)
    farm.add_financial_record(expense1)
    print(f"Added financial record: {expense1}")
    
    expense2 = FinancialRecord(
        transaction_date=datetime(2025, 5, 15),
        transaction_type="expense",
        category="equipment",
        amount=15000.0,
        description="New tractor maintenance"
    )
    farm.add_financial_record(expense2)
    print(f"Added financial record: {expense2}")
    
    # 4. LABOR MANAGEMENT
    print_header("4. Labor Management")
    
    # Add labor records
    labor1 = LaborRecord(
        worker_name="John Smith",
        work_date=datetime(2025, 4, 15),
        hours_worked=8.0,
        task_description="Corn planting",
        hourly_rate=18.0
    )
    labor1.set_reference("crop", corn_crop.id)
    farm.add_labor_record(labor1)
    print(f"Added labor record: {labor1}")
    
    labor2 = LaborRecord(
        worker_name="Jane Doe",
        work_date=datetime(2025, 8, 15),
        hours_worked=10.0,
        task_description="Wheat harvesting",
        hourly_rate=20.0
    )
    labor2.set_reference("crop", wheat_crop.id)
    farm.add_labor_record(labor2)
    print(f"Added labor record: {labor2}")
    
    # 5. ANALYTICS & REPORTING
    print_header("5. Data Analytics & Reporting")
    
    print("\n--- Dashboard Summary ---")
    dashboard = farm.get_dashboard_summary()
    print_json(dashboard)
    
    print("\n--- Profitability Analysis ---")
    profitability = farm.analytics.get_profitability_analysis()
    print_json(profitability)
    
    print("\n--- Resource Utilization ---")
    resources = farm.analytics.get_resource_utilization()
    print_json(resources)
    
    print("\n--- Comprehensive Farm Report ---")
    report = farm.analytics.generate_report("comprehensive")
    print_json(report)
    
    # 6. CENTRALIZED OPERATIONS
    print_header("6. Centralized Hub - Quick Access")
    
    print("\nActive Crops:")
    for crop in farm.list_crops(status="planted"):
        print(f"  - {crop.name} ({crop.variety}): {crop.area_acres} acres")
    
    print("\nActive Livestock:")
    for animal in farm.list_livestock(status="active"):
        print(f"  - {animal.species} ({animal.breed}), Tag: {animal.tag_id}")
    
    print("\nRecent Financial Activity:")
    for record in list(farm.financial_records.values())[:3]:
        print(f"  - {record.transaction_type.upper()}: ${record.amount:.2f} - {record.description}")
    
    print_header("Demo Complete")
    print("The comprehensive farm management system provides:")
    print("  ✓ Unified crop cycle management")
    print("  ✓ Livestock health tracking")
    print("  ✓ Financial budget management")
    print("  ✓ Labor resource tracking")
    print("  ✓ Data analytics and reporting")
    print("  ✓ Centralized operational hub")
    print("  ✓ Decision-making insights")
    print("\nAll operations are integrated and data-driven!")


if __name__ == "__main__":
    demo_comprehensive_farm_system()
