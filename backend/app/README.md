Therapy Bro Backend - App Module

Architecture Overview

- FastAPI application organized into routers, services, repositories, and middleware.
- Authentication via JWT, with optional Google OAuth.
- Database via SQLModel/SQLAlchemy with connection pooling (see `app/db.py`).
- Clear error-handling middleware producing standardized error payloads.

Directory Structure

- `routers/`: HTTP route handlers (auth, sessions, wallet)
- `services/`: Business logic and orchestration
- `middleware/`: Cross-cutting concerns (error handling, logging)
- `models.py`: SQLModel table definitions
- `schemas.py`: Pydantic request/response models
- `db.py`: Engine creation, session provider
- `auth.py`: JWT auth helpers and dependencies
- `logging_config.py`: Logger factory helpers

Service Interaction

- Routers depend on service factories via FastAPI `Depends`.
- Services depend on repositories via SQLAlchemy sessions.
- Error handling maps domain exceptions to structured HTTP responses.

Development Guidelines

- Add async where beneficial (LLM streaming, external I/O).
- Keep routers thin; put business rules in services.
- Use dependency overrides in tests for deterministic behavior.
- Maintain comprehensive docstrings for public functions/classes.

Database & Pooling

Configured in `app/db.py` with environment variables:

- `DATABASE_URL` (default: `sqlite:///./chat.db`)
- `DB_POOL_SIZE` (default: 5)
- `DB_MAX_OVERFLOW` (default: 10)
- `DB_POOL_TIMEOUT` (default: 30)
- `DB_POOL_RECYCLE` (default: 1800)

For SQLite, pool settings are safe no-ops; for Postgres/MySQL they apply fully.

Running Tests

From `backend/`:

```bash
pytest -q
```

Local Run

From `backend/`:

```bash
uvicorn app.main:app --reload --port 8000
```

