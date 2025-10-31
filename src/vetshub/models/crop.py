"""Crop model for managing crop cycles and production"""

from datetime import datetime
from typing import Optional, List
from .base import BaseModel


class Crop(BaseModel):
    """Model representing a crop cycle"""
    
    def __init__(
        self,
        name: str,
        variety: str,
        field_location: str,
        area_acres: float,
        planting_date: datetime,
        expected_harvest_date: datetime,
        id: str = None
    ):
        super().__init__(id)
        self.name = name
        self.variety = variety
        self.field_location = field_location
        self.area_acres = area_acres
        self.planting_date = planting_date
        self.expected_harvest_date = expected_harvest_date
        self.actual_harvest_date: Optional[datetime] = None
        self.yield_amount: Optional[float] = None
        self.yield_unit: str = "bushels"
        self.status: str = "planted"  # planted, growing, harvested, failed
        self.notes: List[str] = []
        self.expenses: float = 0.0
        self.revenue: float = 0.0
    
    def harvest(self, harvest_date: datetime, yield_amount: float, yield_unit: str = "bushels"):
        """Record harvest information"""
        self.actual_harvest_date = harvest_date
        self.yield_amount = yield_amount
        self.yield_unit = yield_unit
        self.status = "harvested"
        self.update()
    
    def add_note(self, note: str):
        """Add a note about this crop"""
        self.notes.append(note)
        self.update()
    
    def record_expense(self, amount: float):
        """Record an expense for this crop"""
        self.expenses += amount
        self.update()
    
    def record_revenue(self, amount: float):
        """Record revenue from this crop"""
        self.revenue += amount
        self.update()
    
    def get_profit(self) -> float:
        """Calculate profit for this crop"""
        return self.revenue - self.expenses
    
    def get_yield_per_acre(self) -> Optional[float]:
        """Calculate yield per acre"""
        if self.yield_amount and self.area_acres > 0:
            return self.yield_amount / self.area_acres
        return None
    
    def __repr__(self) -> str:
        return f"Crop(id={self.id}, name={self.name}, variety={self.variety}, status={self.status})"
