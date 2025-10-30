"""Tests for the comprehensive farm management system"""

import unittest
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from vetshub import FarmManager, Crop, Livestock, FinancialRecord, LaborRecord


class TestCropModel(unittest.TestCase):
    """Test crop management functionality"""
    
    def test_crop_creation(self):
        """Test creating a crop"""
        crop = Crop(
            name="Corn",
            variety="Sweet Corn",
            field_location="Field A",
            area_acres=10.0,
            planting_date=datetime.now(),
            expected_harvest_date=datetime.now() + timedelta(days=120)
        )
        self.assertEqual(crop.name, "Corn")
        self.assertEqual(crop.variety, "Sweet Corn")
        self.assertEqual(crop.status, "planted")
        self.assertIsNotNone(crop.id)
    
    def test_crop_harvest(self):
        """Test harvesting a crop"""
        crop = Crop(
            name="Wheat",
            variety="Winter Wheat",
            field_location="Field B",
            area_acres=20.0,
            planting_date=datetime.now() - timedelta(days=100),
            expected_harvest_date=datetime.now()
        )
        crop.harvest(datetime.now(), 1000.0, "bushels")
        self.assertEqual(crop.status, "harvested")
        self.assertEqual(crop.yield_amount, 1000.0)
        self.assertEqual(crop.yield_unit, "bushels")
    
    def test_crop_financials(self):
        """Test crop financial tracking"""
        crop = Crop(
            name="Soybeans",
            variety="Organic",
            field_location="Field C",
            area_acres=15.0,
            planting_date=datetime.now(),
            expected_harvest_date=datetime.now() + timedelta(days=90)
        )
        crop.record_expense(500.0)
        crop.record_expense(300.0)
        crop.record_revenue(2000.0)
        self.assertEqual(crop.expenses, 800.0)
        self.assertEqual(crop.revenue, 2000.0)
        self.assertEqual(crop.get_profit(), 1200.0)
    
    def test_yield_per_acre(self):
        """Test yield per acre calculation"""
        crop = Crop(
            name="Corn",
            variety="Sweet",
            field_location="Field D",
            area_acres=10.0,
            planting_date=datetime.now(),
            expected_harvest_date=datetime.now() + timedelta(days=100)
        )
        crop.harvest(datetime.now(), 500.0, "bushels")
        self.assertEqual(crop.get_yield_per_acre(), 50.0)


class TestLivestockModel(unittest.TestCase):
    """Test livestock management functionality"""
    
    def test_livestock_creation(self):
        """Test creating a livestock animal"""
        cow = Livestock(
            species="cattle",
            breed="Angus",
            tag_id="A-001",
            birth_date=datetime(2023, 1, 1),
            gender="female"
        )
        self.assertEqual(cow.species, "cattle")
        self.assertEqual(cow.breed, "Angus")
        self.assertEqual(cow.status, "active")
        self.assertIsNotNone(cow.id)
    
    def test_livestock_health_records(self):
        """Test adding health records"""
        cow = Livestock(
            species="cattle",
            breed="Holstein",
            tag_id="H-001",
            birth_date=datetime(2023, 6, 15),
            gender="female"
        )
        cow.add_health_record(
            datetime.now(),
            "Routine checkup",
            "Vitamins administered",
            "Dr. Smith"
        )
        self.assertEqual(len(cow.health_records), 1)
        self.assertEqual(cow.health_records[0]["condition"], "Routine checkup")
    
    def test_livestock_vaccinations(self):
        """Test recording vaccinations"""
        pig = Livestock(
            species="pig",
            breed="Yorkshire",
            tag_id="P-001",
            birth_date=datetime(2025, 1, 1),
            gender="male"
        )
        pig.add_vaccination(datetime.now(), "Swine Flu Vaccine", datetime.now() + timedelta(days=365))
        self.assertEqual(len(pig.vaccinations), 1)
        self.assertEqual(pig.vaccinations[0]["vaccine_name"], "Swine Flu Vaccine")
    
    def test_livestock_production(self):
        """Test production tracking"""
        chicken = Livestock(
            species="chicken",
            breed="Leghorn",
            tag_id="C-001",
            birth_date=datetime(2025, 1, 1),
            gender="female"
        )
        chicken.record_production(datetime.now(), "eggs", 10, "count")
        chicken.record_production(datetime.now(), "eggs", 12, "count")
        self.assertEqual(len(chicken.production_records), 2)
    
    def test_livestock_sale(self):
        """Test selling livestock"""
        cow = Livestock(
            species="cattle",
            breed="Angus",
            tag_id="A-002",
            birth_date=datetime(2023, 1, 1),
            gender="male"
        )
        cow.purchase_price = 1000.0
        cow.sell(datetime.now(), 1500.0)
        self.assertEqual(cow.status, "sold")
        self.assertEqual(cow.sale_price, 1500.0)


class TestFinancialRecords(unittest.TestCase):
    """Test financial management functionality"""
    
    def test_income_record(self):
        """Test creating income records"""
        record = FinancialRecord(
            transaction_date=datetime.now(),
            transaction_type="income",
            category="crop_sales",
            amount=5000.0,
            description="Corn sales"
        )
        self.assertEqual(record.transaction_type, "income")
        self.assertEqual(record.amount, 5000.0)
    
    def test_expense_record(self):
        """Test creating expense records"""
        record = FinancialRecord(
            transaction_date=datetime.now(),
            transaction_type="expense",
            category="seeds",
            amount=1000.0,
            description="Wheat seeds"
        )
        self.assertEqual(record.transaction_type, "expense")
        self.assertEqual(record.amount, 1000.0)
    
    def test_invalid_transaction_type(self):
        """Test that invalid transaction types raise an error"""
        with self.assertRaises(ValueError):
            FinancialRecord(
                transaction_date=datetime.now(),
                transaction_type="invalid",
                category="test",
                amount=100.0,
                description="Test"
            )


class TestLaborRecords(unittest.TestCase):
    """Test labor management functionality"""
    
    def test_labor_record_creation(self):
        """Test creating labor records"""
        record = LaborRecord(
            worker_name="John Doe",
            work_date=datetime.now(),
            hours_worked=8.0,
            task_description="Field plowing",
            hourly_rate=15.0
        )
        self.assertEqual(record.worker_name, "John Doe")
        self.assertEqual(record.hours_worked, 8.0)
        self.assertEqual(record.total_cost, 120.0)
    
    def test_update_hours(self):
        """Test updating hours worked"""
        record = LaborRecord(
            worker_name="Jane Doe",
            work_date=datetime.now(),
            hours_worked=6.0,
            task_description="Harvesting",
            hourly_rate=20.0
        )
        record.update_hours(8.0)
        self.assertEqual(record.hours_worked, 8.0)
        self.assertEqual(record.total_cost, 160.0)


class TestFarmManager(unittest.TestCase):
    """Test the centralized farm management hub"""
    
    def setUp(self):
        """Set up test farm manager"""
        self.farm = FarmManager("Test Farm")
    
    def test_farm_creation(self):
        """Test creating a farm manager"""
        self.assertEqual(self.farm.farm_name, "Test Farm")
        self.assertEqual(len(self.farm.crops), 0)
        self.assertEqual(len(self.farm.livestock), 0)
    
    def test_add_crop(self):
        """Test adding crops to farm"""
        crop = Crop(
            name="Corn",
            variety="Sweet",
            field_location="Field A",
            area_acres=10.0,
            planting_date=datetime.now(),
            expected_harvest_date=datetime.now() + timedelta(days=100)
        )
        crop_id = self.farm.add_crop(crop)
        self.assertIn(crop_id, self.farm.crops)
        self.assertEqual(len(self.farm.list_crops()), 1)
    
    def test_add_livestock(self):
        """Test adding livestock to farm"""
        cow = Livestock(
            species="cattle",
            breed="Angus",
            tag_id="A-001",
            birth_date=datetime(2023, 1, 1),
            gender="female"
        )
        livestock_id = self.farm.add_livestock(cow)
        self.assertIn(livestock_id, self.farm.livestock)
        self.assertEqual(len(self.farm.list_livestock()), 1)
    
    def test_filter_livestock_by_species(self):
        """Test filtering livestock by species"""
        cow = Livestock("cattle", "Angus", "A-001", datetime(2023, 1, 1), "female")
        pig = Livestock("pig", "Yorkshire", "P-001", datetime(2024, 1, 1), "male")
        self.farm.add_livestock(cow)
        self.farm.add_livestock(pig)
        
        cattle = self.farm.list_livestock(species="cattle")
        self.assertEqual(len(cattle), 1)
        self.assertEqual(cattle[0].species, "cattle")
    
    def test_financial_filtering(self):
        """Test filtering financial records"""
        income = FinancialRecord(
            datetime.now(),
            "income",
            "crop_sales",
            5000.0,
            "Wheat sales"
        )
        expense = FinancialRecord(
            datetime.now(),
            "expense",
            "seeds",
            1000.0,
            "Corn seeds"
        )
        self.farm.add_financial_record(income)
        self.farm.add_financial_record(expense)
        
        income_records = self.farm.list_financial_records(transaction_type="income")
        self.assertEqual(len(income_records), 1)
        self.assertEqual(income_records[0].transaction_type, "income")


class TestAnalytics(unittest.TestCase):
    """Test analytics and reporting functionality"""
    
    def setUp(self):
        """Set up test farm with data"""
        self.farm = FarmManager("Analytics Test Farm")
        
        # Add some crops
        crop1 = Crop("Corn", "Sweet", "Field A", 10.0, datetime.now(), datetime.now() + timedelta(days=100))
        crop1.record_expense(500.0)
        crop1.harvest(datetime.now(), 500.0, "bushels")
        crop1.record_revenue(2000.0)
        self.farm.add_crop(crop1)
        
        # Add livestock
        cow = Livestock("cattle", "Angus", "A-001", datetime(2023, 1, 1), "female")
        cow.purchase_price = 1000.0
        self.farm.add_livestock(cow)
        
        # Add financial records
        self.farm.add_financial_record(
            FinancialRecord(datetime.now(), "income", "crop_sales", 2000.0, "Corn sales")
        )
        self.farm.add_financial_record(
            FinancialRecord(datetime.now(), "expense", "seeds", 500.0, "Corn seeds")
        )
        
        # Add labor
        self.farm.add_labor_record(
            LaborRecord("John", datetime.now(), 8.0, "Planting", 15.0)
        )
    
    def test_financial_summary(self):
        """Test financial summary generation"""
        summary = self.farm.analytics.get_financial_summary()
        self.assertEqual(summary["total_income"], 2000.0)
        self.assertEqual(summary["total_expenses"], 500.0)
        self.assertEqual(summary["net_profit"], 1500.0)
    
    def test_crop_summary(self):
        """Test crop summary generation"""
        summary = self.farm.analytics.get_crop_summary()
        self.assertEqual(summary["total_crops"], 1)
        self.assertEqual(summary["total_area_acres"], 10.0)
    
    def test_livestock_summary(self):
        """Test livestock summary generation"""
        summary = self.farm.analytics.get_livestock_summary()
        self.assertEqual(summary["total_animals"], 1)
        self.assertIn("cattle", summary["species_breakdown"])
    
    def test_dashboard_summary(self):
        """Test dashboard summary generation"""
        dashboard = self.farm.get_dashboard_summary()
        self.assertEqual(dashboard["farm_name"], "Analytics Test Farm")
        self.assertIn("summary", dashboard)
        self.assertIn("financial_summary", dashboard)
        self.assertIn("crop_summary", dashboard)
        self.assertIn("livestock_summary", dashboard)
    
    def test_comprehensive_report(self):
        """Test comprehensive report generation"""
        report = self.farm.analytics.generate_report("comprehensive")
        self.assertIn("farm_name", report)
        self.assertIn("financial_summary", report)
        self.assertIn("crop_summary", report)
        self.assertIn("livestock_summary", report)
        self.assertIn("profitability_analysis", report)
        self.assertIn("resource_utilization", report)


class TestIntegration(unittest.TestCase):
    """Integration tests for the complete system"""
    
    def test_full_farm_lifecycle(self):
        """Test a complete farm management lifecycle"""
        # Create farm
        farm = FarmManager("Integration Test Farm")
        
        # Add crop
        crop = Crop("Wheat", "Winter", "Field 1", 50.0, datetime.now(), datetime.now() + timedelta(days=120))
        crop.record_expense(3000.0)
        crop_id = farm.add_crop(crop)
        
        # Add livestock
        cow = Livestock("cattle", "Holstein", "H-001", datetime(2023, 1, 1), "female")
        cow.purchase_price = 1500.0
        livestock_id = farm.add_livestock(cow)
        
        # Add labor for crop
        labor = LaborRecord("Worker 1", datetime.now(), 10.0, "Planting wheat", 18.0)
        labor.set_reference("crop", crop_id)
        farm.add_labor_record(labor)
        
        # Harvest crop
        crop.harvest(datetime.now() + timedelta(days=120), 3000.0, "bushels")
        crop.record_revenue(15000.0)
        
        # Add financial records
        farm.add_financial_record(
            FinancialRecord(datetime.now(), "income", "crop_sales", 15000.0, "Wheat sales")
        )
        farm.add_financial_record(
            FinancialRecord(datetime.now(), "expense", "seeds", 3000.0, "Wheat seeds")
        )
        farm.add_financial_record(
            FinancialRecord(datetime.now(), "expense", "labor", 180.0, "Planting labor")
        )
        
        # Generate reports
        dashboard = farm.get_dashboard_summary()
        self.assertGreater(dashboard["financial_summary"]["net_profit"], 0)
        self.assertEqual(dashboard["summary"]["total_crops"], 1)
        self.assertEqual(dashboard["summary"]["total_livestock"], 1)


if __name__ == "__main__":
    unittest.main()
