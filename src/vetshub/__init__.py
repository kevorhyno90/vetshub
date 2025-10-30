"""VetsHub - Comprehensive Farm Management System"""

__version__ = "1.0.0"
__author__ = "VetsHub Team"

from .models.crop import Crop
from .models.livestock import Livestock
from .models.financial import FinancialRecord
from .models.labor import LaborRecord
from .managers.farm_manager import FarmManager

__all__ = [
    "Crop",
    "Livestock",
    "FinancialRecord",
    "LaborRecord",
    "FarmManager",
]
