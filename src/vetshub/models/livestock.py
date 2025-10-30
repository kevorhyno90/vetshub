"""Livestock model for managing animal health and production"""

from datetime import datetime
from typing import Optional, List, Dict
from .base import BaseModel


class Livestock(BaseModel):
    """Model representing a livestock animal"""
    
    def __init__(
        self,
        species: str,
        breed: str,
        tag_id: str,
        birth_date: datetime,
        gender: str,
        id: str = None
    ):
        super().__init__(id)
        self.species = species  # cattle, pig, chicken, sheep, etc.
        self.breed = breed
        self.tag_id = tag_id  # Physical tag/identifier on the animal
        self.birth_date = birth_date
        self.gender = gender
        self.weight: Optional[float] = None
        self.weight_unit: str = "lbs"
        self.status: str = "active"  # active, sold, deceased, quarantine
        self.health_records: List[Dict] = []
        self.vaccinations: List[Dict] = []
        self.production_records: List[Dict] = []  # milk, eggs, etc.
        self.notes: List[str] = []
        self.purchase_price: float = 0.0
        self.sale_price: Optional[float] = None
    
    def add_health_record(self, date: datetime, condition: str, treatment: str, vet_name: str = ""):
        """Add a health record for the animal"""
        record = {
            "date": date.isoformat(),
            "condition": condition,
            "treatment": treatment,
            "vet_name": vet_name
        }
        self.health_records.append(record)
        self.update()
    
    def add_vaccination(self, date: datetime, vaccine_name: str, next_due_date: Optional[datetime] = None):
        """Record a vaccination"""
        vaccination = {
            "date": date.isoformat(),
            "vaccine_name": vaccine_name,
            "next_due_date": next_due_date.isoformat() if next_due_date else None
        }
        self.vaccinations.append(vaccination)
        self.update()
    
    def record_production(self, date: datetime, product_type: str, quantity: float, unit: str):
        """Record production (milk, eggs, etc.)"""
        production = {
            "date": date.isoformat(),
            "product_type": product_type,
            "quantity": quantity,
            "unit": unit
        }
        self.production_records.append(production)
        self.update()
    
    def update_weight(self, weight: float, unit: str = "lbs"):
        """Update animal's weight"""
        self.weight = weight
        self.weight_unit = unit
        self.update()
    
    def add_note(self, note: str):
        """Add a note about this animal"""
        self.notes.append(note)
        self.update()
    
    def sell(self, sale_date: datetime, sale_price: float):
        """Record sale of the animal"""
        self.sale_price = sale_price
        self.status = "sold"
        self.add_note(f"Sold on {sale_date.isoformat()} for ${sale_price}")
        self.update()
    
    def get_age_days(self) -> int:
        """Get animal's age in days"""
        return (datetime.now() - self.birth_date).days
    
    def __repr__(self) -> str:
        return f"Livestock(id={self.id}, species={self.species}, breed={self.breed}, tag_id={self.tag_id}, status={self.status})"
