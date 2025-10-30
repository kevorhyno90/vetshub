"""Base model class for all farm entities"""

from datetime import datetime
from typing import Dict, Any
import json


class BaseModel:
    """Base class for all farm management models"""
    
    def __init__(self, id: str = None):
        self.id = id or self._generate_id()
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def _generate_id(self) -> str:
        """Generate a unique ID for the entity"""
        import uuid
        return str(uuid.uuid4())
    
    def update(self):
        """Update the timestamp when entity is modified"""
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        result = {}
        for key, value in self.__dict__.items():
            if isinstance(value, datetime):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result
    
    def to_json(self) -> str:
        """Convert model to JSON string"""
        return json.dumps(self.to_dict(), indent=2)
    
    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(id={self.id})"
