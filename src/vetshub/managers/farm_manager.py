"""Farm Manager - Central hub for managing all farm operations"""

from typing import List, Dict, Optional, Any
from datetime import datetime
from ..models.crop import Crop
from ..models.livestock import Livestock
from ..models.financial import FinancialRecord
from ..models.labor import LaborRecord
from ..analytics.analytics_engine import AnalyticsEngine


class FarmManager:
    """
    Centralized hub for managing all aspects of farm operations.
    Provides unified access to crops, livestock, finances, and labor.
    """
    
    def __init__(self, farm_name: str):
        self.farm_name = farm_name
        self.crops: Dict[str, Crop] = {}
        self.livestock: Dict[str, Livestock] = {}
        self.financial_records: Dict[str, FinancialRecord] = {}
        self.labor_records: Dict[str, LaborRecord] = {}
        self.analytics = AnalyticsEngine(self)
    
    # Crop Management
    def add_crop(self, crop: Crop) -> str:
        """Add a crop to the farm"""
        self.crops[crop.id] = crop
        return crop.id
    
    def get_crop(self, crop_id: str) -> Optional[Crop]:
        """Get a crop by ID"""
        return self.crops.get(crop_id)
    
    def list_crops(self, status: Optional[str] = None) -> List[Crop]:
        """List all crops, optionally filtered by status"""
        if status:
            return [c for c in self.crops.values() if c.status == status]
        return list(self.crops.values())
    
    def remove_crop(self, crop_id: str) -> bool:
        """Remove a crop from the farm"""
        if crop_id in self.crops:
            del self.crops[crop_id]
            return True
        return False
    
    # Livestock Management
    def add_livestock(self, animal: Livestock) -> str:
        """Add a livestock animal to the farm"""
        self.livestock[animal.id] = animal
        return animal.id
    
    def get_livestock(self, livestock_id: str) -> Optional[Livestock]:
        """Get a livestock animal by ID"""
        return self.livestock.get(livestock_id)
    
    def list_livestock(self, species: Optional[str] = None, status: Optional[str] = None) -> List[Livestock]:
        """List all livestock, optionally filtered by species and/or status"""
        animals = list(self.livestock.values())
        if species:
            animals = [a for a in animals if a.species == species]
        if status:
            animals = [a for a in animals if a.status == status]
        return animals
    
    def remove_livestock(self, livestock_id: str) -> bool:
        """Remove a livestock animal from the farm"""
        if livestock_id in self.livestock:
            del self.livestock[livestock_id]
            return True
        return False
    
    # Financial Management
    def add_financial_record(self, record: FinancialRecord) -> str:
        """Add a financial record"""
        self.financial_records[record.id] = record
        return record.id
    
    def get_financial_record(self, record_id: str) -> Optional[FinancialRecord]:
        """Get a financial record by ID"""
        return self.financial_records.get(record_id)
    
    def list_financial_records(
        self,
        transaction_type: Optional[str] = None,
        category: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[FinancialRecord]:
        """List financial records with optional filters"""
        records = list(self.financial_records.values())
        
        if transaction_type:
            records = [r for r in records if r.transaction_type == transaction_type]
        if category:
            records = [r for r in records if r.category == category]
        if start_date:
            records = [r for r in records if r.transaction_date >= start_date]
        if end_date:
            records = [r for r in records if r.transaction_date <= end_date]
        
        return records
    
    # Labor Management
    def add_labor_record(self, record: LaborRecord) -> str:
        """Add a labor record"""
        self.labor_records[record.id] = record
        return record.id
    
    def get_labor_record(self, record_id: str) -> Optional[LaborRecord]:
        """Get a labor record by ID"""
        return self.labor_records.get(record_id)
    
    def list_labor_records(
        self,
        worker_name: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[LaborRecord]:
        """List labor records with optional filters"""
        records = list(self.labor_records.values())
        
        if worker_name:
            records = [r for r in records if r.worker_name == worker_name]
        if start_date:
            records = [r for r in records if r.work_date >= start_date]
        if end_date:
            records = [r for r in records if r.work_date <= end_date]
        
        return records
    
    # Dashboard and Summary Methods
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get a comprehensive dashboard summary of farm operations"""
        return {
            "farm_name": self.farm_name,
            "summary": {
                "total_crops": len(self.crops),
                "active_crops": len([c for c in self.crops.values() if c.status in ["planted", "growing"]]),
                "total_livestock": len(self.livestock),
                "active_livestock": len([a for a in self.livestock.values() if a.status == "active"]),
                "total_financial_records": len(self.financial_records),
                "total_labor_records": len(self.labor_records),
            },
            "financial_summary": self.analytics.get_financial_summary(),
            "livestock_summary": self.analytics.get_livestock_summary(),
            "crop_summary": self.analytics.get_crop_summary(),
        }
    
    def __repr__(self) -> str:
        return f"FarmManager(farm_name={self.farm_name}, crops={len(self.crops)}, livestock={len(self.livestock)})"
