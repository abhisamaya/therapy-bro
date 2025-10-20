Backend Refactoring Plan (Phases 1–12)

This document summarizes the executed/targeted refactor plan for the FastAPI backend.

Phase 1: Foundation - Configuration & Service Utilities
- Create `app/config/settings.py` with validated settings (JWT, LLM provider, wallet bonus, etc.).
- Add `app/services/base_service.py` and testing scaffolding.

Phase 2: Wallet Service Extraction
- Implement `app/services/wallet_service.py` with: create_wallet_with_bonus, get_or_create_wallet, get_wallet_balance.
- Replace duplicated wallet creation in routes.

Phase 3: User Service Extraction
- Implement `app/services/user_service.py` with user CRUD/auth/profile methods.
- Routes call services instead of inline DB logic.

Phase 4: Session Service Extraction
- Implement `app/services/session_service.py` for session CRUD/history.
- Update routes to use the service.

Phase 5: Message Service & LLM Factory
- Implement `app/services/llm_factory.py` and `app/services/message_service.py`.
- Centralize provider selection and streaming logic.

Phase 6: Router Extraction - Auth
- Create `app/routers/auth.py` and move `register/login/me/profile/google/logout`.
- Register the router in `app/main.py`.

Phase 7: Router Extraction - Sessions
- Create `app/routers/sessions.py` and move session routes.

Phase 8: Router Extraction - Wallet
- Create `app/routers/wallet.py` and move wallet routes.

Phase 9: Repository Layer
- Create repositories for users, sessions, messages, wallets; update services to use them.

Phase 10: Dependency Injection & Clean Main
- Add `app/dependencies.py` with DI helpers and keep `app/main.py` minimal (init, middleware, router registration).

Phase 11: Error Handling & Validation
- Add `app/exceptions.py` (domain errors) and `app/middleware/error_handler.py` (global handlers).
- Enforce consistent error responses and richer validation.

Phase 12: Final Optimization & Documentation
- Add async where beneficial; implement DB connection pooling in `app/db.py`.
- Create `app/README.md` and update root `README.md`.
- Run and stabilize full test suite.

Validation & Success Metrics
- All endpoints functional; tests pass (see `app/tests/`).
- Clear separation of concerns; easier maintenance and feature work.

See also
- `backend/app/README.md` – architecture, structure, pooling, dev guidelines.

