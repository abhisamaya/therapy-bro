"""Base service class with common patterns for all services."""
from typing import TypeVar, Generic, Optional, List, Any
from sqlalchemy.orm import Session
from sqlmodel import SQLModel
from sqlalchemy import select, delete
import logging

# Type variables for generic service
T = TypeVar('T', bound=SQLModel)
CreateSchema = TypeVar('CreateSchema')
UpdateSchema = TypeVar('UpdateSchema')


class BaseService(Generic[T]):
    """Base service class providing common database operations."""
    
    def __init__(self, db_session: Session):
        """Initialize service with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def create(self, obj: T) -> T:
        """Create a new object in the database.
        
        Args:
            obj: The object to create
            
        Returns:
            The created object with ID populated
        """
        self.logger.debug(f"Creating {obj.__class__.__name__}")
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        self.logger.info(f"Created {obj.__class__.__name__} with ID: {getattr(obj, 'id', 'unknown')}")
        return obj
    
    def get_by_id(self, model_class: type[T], obj_id: int) -> Optional[T]:
        """Get object by ID.
        
        Args:
            model_class: The model class
            obj_id: The object ID
            
        Returns:
            The object if found, None otherwise
        """
        self.logger.debug(f"Getting {model_class.__name__} by ID: {obj_id}")
        obj = self.db.exec(select(model_class).where(model_class.id == obj_id)).scalar_one_or_none()
        if obj:
            self.logger.debug(f"Found {model_class.__name__} with ID: {obj_id}")
        else:
            self.logger.debug(f"{model_class.__name__} not found with ID: {obj_id}")
        return obj
    
    def get_all(self, model_class: type[T], limit: Optional[int] = None, offset: int = 0) -> List[T]:
        """Get all objects of a model class.
        
        Args:
            model_class: The model class
            limit: Maximum number of objects to return
            offset: Number of objects to skip
            
        Returns:
            List of objects
        """
        self.logger.debug(f"Getting all {model_class.__name__} objects")
        query = select(model_class)
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        
        objects = self.db.exec(query).scalars().all()
        self.logger.debug(f"Found {len(objects)} {model_class.__name__} objects")
        return objects
    
    def update(self, obj: T) -> T:
        """Update an existing object.
        
        Args:
            obj: The object to update
            
        Returns:
            The updated object
        """
        self.logger.debug(f"Updating {obj.__class__.__name__} with ID: {getattr(obj, 'id', 'unknown')}")
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        self.logger.info(f"Updated {obj.__class__.__name__} with ID: {getattr(obj, 'id', 'unknown')}")
        return obj
    
    def delete(self, model_class: type[T], obj_id: int) -> bool:
        """Delete an object by ID.
        
        Args:
            model_class: The model class
            obj_id: The object ID
            
        Returns:
            True if deleted, False if not found
        """
        self.logger.debug(f"Deleting {model_class.__name__} with ID: {obj_id}")
        obj = self.get_by_id(model_class, obj_id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            self.logger.info(f"Deleted {model_class.__name__} with ID: {obj_id}")
            return True
        else:
            self.logger.warning(f"Cannot delete {model_class.__name__} with ID: {obj_id} - not found")
            return False
    
    def delete_by_criteria(self, model_class: type[T], **criteria) -> int:
        """Delete objects by criteria.
        
        Args:
            model_class: The model class
            **criteria: Criteria to match for deletion
            
        Returns:
            Number of objects deleted
        """
        self.logger.debug(f"Deleting {model_class.__name__} objects by criteria: {criteria}")
        query = delete(model_class)
        for key, value in criteria.items():
            query = query.where(getattr(model_class, key) == value)
        
        result = self.db.exec(query)
        self.db.commit()
        deleted_count = result.rowcount
        self.logger.info(f"Deleted {deleted_count} {model_class.__name__} objects")
        return deleted_count
    
    def find_by_criteria(self, model_class: type[T], **criteria) -> List[T]:
        """Find objects by criteria.
        
        Args:
            model_class: The model class
            **criteria: Criteria to match
            
        Returns:
            List of matching objects
        """
        self.logger.debug(f"Finding {model_class.__name__} objects by criteria: {criteria}")
        query = select(model_class)
        for key, value in criteria.items():
            query = query.where(getattr(model_class, key) == value)
        
        objects = self.db.exec(query).scalars().all()
        self.logger.debug(f"Found {len(objects)} {model_class.__name__} objects matching criteria")
        return objects
    
    def find_one_by_criteria(self, model_class: type[T], **criteria) -> Optional[T]:
        """Find one object by criteria.
        
        Args:
            model_class: The model class
            **criteria: Criteria to match
            
        Returns:
            The first matching object or None
        """
        self.logger.debug(f"Finding one {model_class.__name__} object by criteria: {criteria}")
        query = select(model_class)
        for key, value in criteria.items():
            query = query.where(getattr(model_class, key) == value)
        
        obj = self.db.exec(query).scalar_one_or_none()
        if obj:
            self.logger.debug(f"Found {model_class.__name__} object")
        else:
            self.logger.debug(f"No {model_class.__name__} object found matching criteria")
        return obj
