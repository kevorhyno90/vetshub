"""Labor record model for tracking farm labor"""

from datetime import datetime
from typing import Optional
from .base import BaseModel


class LaborRecord(BaseModel):
    """Model representing a labor record"""
    
    def __init__(
        self,
        worker_name: str,
        work_date: datetime,
        hours_worked: float,
        task_description: str,
        hourly_rate: float,
        id: str = None
    ):
        super().__init__(id)
        self.worker_name = worker_name
        self.work_date = work_date
        self.hours_worked = hours_worked
        self.task_description = task_description
        self.hourly_rate = hourly_rate
        self.total_cost = hours_worked * hourly_rate
        self.reference_id: Optional[str] = None  # Link to crop, livestock, etc.
        self.reference_type: Optional[str] = None  # crop, livestock, maintenance, etc.
        self.status: str = "completed"  # completed, pending, cancelled
        self.notes: str = ""
    
    def set_reference(self, reference_type: str, reference_id: str):
        """Link this labor record to another entity"""
        self.reference_type = reference_type
        self.reference_id = reference_id
        self.update()
    
    def update_hours(self, hours_worked: float):
        """Update hours worked and recalculate total cost"""
        self.hours_worked = hours_worked
        self.total_cost = hours_worked * self.hourly_rate
        self.update()
    
    def add_notes(self, notes: str):
        """Add notes to the labor record"""
        self.notes = notes
        self.update()
    
    def __repr__(self) -> str:
        return f"LaborRecord(id={self.id}, worker={self.worker_name}, hours={self.hours_worked}, task={self.task_description})"
