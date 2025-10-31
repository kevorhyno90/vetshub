"""Financial record model for tracking farm finances"""

from datetime import datetime
from typing import Optional
from .base import BaseModel


class FinancialRecord(BaseModel):
    """Model representing a financial transaction"""
    
    def __init__(
        self,
        transaction_date: datetime,
        transaction_type: str,  # income or expense
        category: str,
        amount: float,
        description: str,
        id: str = None
    ):
        super().__init__(id)
        self.transaction_date = transaction_date
        self.transaction_type = transaction_type.lower()
        if self.transaction_type not in ["income", "expense"]:
            raise ValueError("transaction_type must be 'income' or 'expense'")
        self.category = category
        self.amount = amount
        self.description = description
        self.reference_id: Optional[str] = None  # Link to crop, livestock, etc.
        self.reference_type: Optional[str] = None  # crop, livestock, labor, etc.
        self.payment_method: str = "cash"
        self.notes: str = ""
    
    def set_reference(self, reference_type: str, reference_id: str):
        """Link this financial record to another entity"""
        self.reference_type = reference_type
        self.reference_id = reference_id
        self.update()
    
    def add_notes(self, notes: str):
        """Add notes to the financial record"""
        self.notes = notes
        self.update()
    
    def __repr__(self) -> str:
        return f"FinancialRecord(id={self.id}, type={self.transaction_type}, category={self.category}, amount=${self.amount:.2f})"
