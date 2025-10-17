"""Base service class with common patterns for all services."""
from typing import TypeVar, Generic, Optional, List, Any, Type
from sqlalchemy.orm import Session
from sqlmodel import SQLModel
from sqlalchemy import select, delete
from sqlalchemy.sql.elements import UnaryExpression
import logging

# Type variables for generic service
T = TypeVar("T", bound=SQLModel)
CreateSchema = TypeVar("CreateSchema")
UpdateSchema = TypeVar("UpdateSchema")


class BaseService(Generic[T]):
    """Base service class providing common database operations."""

    def __init__(self, db_session: Session):
        """Initialize service with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)

    # -----------------------------
    # helpers
    # -----------------------------
    @staticmethod
    def _get_pk_column(model_class: Type[SQLModel]) -> Any:
        """Return the primary key column for ordering / lookups."""
        # Prefer 'id' if present; otherwise fall back to table PK
        if hasattr(model_class, "id"):
            return getattr(model_class, "id")
        # Fallback to first PK column from table metadata
        pk_cols = list(model_class.__table__.primary_key.columns)  # type: ignore[attr-defined]
        if not pk_cols:
            raise ValueError(f"{model_class.__name__} has no primary key defined.")
        return pk_cols[0]

    @staticmethod
    def _validate_and_build_filters(model_class: Type[SQLModel], **criteria) -> list[Any]:
        filters = []
        for key, value in criteria.items():
            col = getattr(model_class, key, None)
            if col is None:
                raise AttributeError(f"{model_class.__name__} has no attribute '{key}'")
            filters.append(col == value)
        return filters

    # -----------------------------
    # CRUD
    # -----------------------------
    def create(self, obj: T) -> T:
        """Create a new object in the database."""
        self.logger.debug(f"Creating {obj.__class__.__name__}")
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        self.logger.info(f"Created {obj.__class__.__name__} with ID: {getattr(obj, 'id', 'unknown')}")
        return obj

    def get_by_id(self, model_class: Type[T], obj_id: int) -> Optional[T]:
        """Get object by primary key (uses Session.get for identity map)."""
        self.logger.debug(f"Getting {model_class.__name__} by ID: {obj_id}")
        obj = self.db.get(model_class, obj_id)
        self.logger.debug(f"{'Found' if obj else 'Not found'} {model_class.__name__} with ID: {obj_id}")
        return obj

    def get_all(self, model_class: Type[T], limit: Optional[int] = None, offset: int = 0) -> List[T]:
        """Get all objects with deterministic ordering for stable pagination."""
        self.logger.debug(f"Getting all {model_class.__name__} objects")
        pk = self._get_pk_column(model_class)
        query = select(model_class).order_by(pk.asc() if isinstance(pk, UnaryExpression) else pk)
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        objects = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(objects)} {model_class.__name__} objects")
        return objects

    def update(self, obj: T) -> T:
        """Update an existing object."""
        self.logger.debug(f"Updating {obj.__class__.__name__} with ID: {getattr(obj, 'id', 'unknown')}")
        # .add() is harmless if already persistent; keeps it explicit
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        self.logger.info(f"Updated {obj.__class__.__name__} with ID: {getattr(obj, 'id', 'unknown')}")
        return obj

    def delete(self, model_class: Type[T], obj_id: int) -> bool:
        """Delete an object by ID."""
        self.logger.debug(f"Deleting {model_class.__name__} with ID: {obj_id}")
        obj = self.get_by_id(model_class, obj_id)
        if not obj:
            self.logger.warning(f"Cannot delete {model_class.__name__} with ID: {obj_id} - not found")
            return False
        self.db.delete(obj)
        self.db.commit()
        self.logger.info(f"Deleted {model_class.__name__} with ID: {obj_id}")
        return True

    def delete_by_criteria(self, model_class: Type[T], **criteria) -> int:
        """Delete objects by criteria; returns number deleted."""
        self.logger.debug(f"Deleting {model_class.__name__} objects by criteria: {criteria}")
        filters = self._validate_and_build_filters(model_class, **criteria)
        stmt = delete(model_class)
        for f in filters:
            stmt = stmt.where(f)
        result = self.db.execute(stmt)
        self.db.commit()
        # Note: some drivers may yield -1 for rowcount; PG/MySQL are fine.
        deleted_count = result.rowcount or 0
        self.logger.info(f"Deleted {deleted_count} {model_class.__name__} objects")
        return deleted_count

    def find_by_criteria(self, model_class: Type[T], **criteria) -> List[T]:
        """Find objects by criteria, ordered deterministically by PK asc."""
        self.logger.debug(f"Finding {model_class.__name__} objects by criteria: {criteria}")
        filters = self._validate_and_build_filters(model_class, **criteria)
        pk = self._get_pk_column(model_class)
        query = select(model_class)
        for f in filters:
            query = query.where(f)
        query = query.order_by(pk.asc() if isinstance(pk, UnaryExpression) else pk)
        objects = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(objects)} {model_class.__name__} objects matching criteria")
        return objects

    def find_one_by_criteria(self, model_class: Type[T], **criteria) -> Optional[T]:
        """Find the first matching object (deterministic) or None."""
        self.logger.debug(f"Finding one {model_class.__name__} object by criteria: {criteria}")
        filters = self._validate_and_build_filters(model_class, **criteria)
        pk = self._get_pk_column(model_class)
        query = select(model_class)
        for f in filters:
            query = query.where(f)
        query = query.order_by(pk.asc() if isinstance(pk, UnaryExpression) else pk).limit(1)
        obj = self.db.execute(query).scalars().first()
        self.logger.debug(f"{'Found' if obj else 'No'} {model_class.__name__} object matching criteria")
        return obj
