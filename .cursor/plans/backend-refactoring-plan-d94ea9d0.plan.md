<!-- d94ea9d0-63fa-4617-966d-a80f49477aa0 21a0eb21-17be-4cc9-854a-bf461174fbf1 -->
# Backend Refactoring Plan

## Phase 1: Foundation - Configuration & Service Utilities (Week 1, Day 1-2)

**Goal**: Extract configuration and create base service utilities

**Tasks**:

1. Create `app/config/settings.py` for centralized configuration

   - Move all environment variables and constants
   - Add `Settings` class with validation
   - Include: `INITIAL_WALLET_BALANCE`, `LLM_PROVIDER`, `JWT_*` configs

2. Create `app/services/__init__.py` and `app/services/base_service.py`

   - Base class for all services with common patterns
   - Database session management utilities

3. Create `app/tests/__init__.py` for testing infrastructure

   - Setup pytest configuration
   - Create fixtures for database, users, sessions

**Validation**: Run existing endpoints, verify configuration loading works

---

## Phase 2: Wallet Service Extraction (Week 1, Day 3-4)

**Goal**: Eliminate wallet creation duplication (appears 4 times)

**Tasks**:

1. Create `app/services/wallet_service.py`

   - `create_wallet_with_bonus(user_id: int) -> Wallet`
   - `get_or_create_wallet(user_id: int) -> Wallet`
   - `get_wallet_balance(user_id: int) -> WalletOut`

2. Replace all 4 wallet creation instances in `main.py`:

   - Line ~154 (register function)
   - Line ~485 (google_auth function)
   - Line ~566 (get_wallet function)
   - Line ~613 (create_wallet function)

3. Create `app/tests/test_wallet_service.py`

   - Test wallet creation with bonus
   - Test get_or_create logic
   - Test duplication prevention

**Validation**: All wallet operations work, tests pass

---

## Phase 3: User Service Extraction (Week 1, Day 5-6)

**Goal**: Extract user management business logic

**Tasks**:

1. Create `app/services/user_service.py`

   - `create_user(user_data: RegisterIn) -> User`
   - `authenticate_user(login_id: str, password: str) -> Optional[User]`
   - `update_user_profile(user_id: int, profile_data: UpdateProfileIn) -> User`
   - `find_by_login_id(login_id: str) -> Optional[User]`
   - `find_by_google_id(google_id: str) -> Optional[User]`

2. Update `main.py` functions to use UserService:

   - `register()` - use `create_user()`
   - `login()` - use `authenticate_user()`
   - `update_profile()` - use `update_user_profile()`
   - `google_auth()` - use `find_by_google_id()`

3. Create `app/tests/test_user_service.py`

   - Test user creation
   - Test authentication
   - Test profile updates

**Validation**: All auth endpoints work, tests pass

---

## Phase 4: Session Service Extraction (Week 2, Day 1-2)

**Goal**: Extract session management business logic

**Tasks**:

1. Create `app/services/session_service.py`

   - `create_session(user_id: int, category: str) -> ChatSession`
   - `get_session(session_id: str, user_id: int) -> Optional[ChatSession]`
   - `get_user_sessions(user_id: int) -> List[ChatSession]`
   - `update_session_notes(session_id: str, notes: str) -> None`
   - `delete_session(session_id: str, user_id: int) -> None`
   - `get_session_history(session_id: str) -> List[Message]`

2. Update `main.py` functions to use SessionService:

   - `start_session()` 
   - `get_history()`
   - `list_chats()`
   - `put_notes()`
   - `delete_session()`

3. Create `app/tests/test_session_service.py`

**Validation**: All session endpoints work, tests pass

---

## Phase 5: Message Service & LLM Factory (Week 2, Day 3-4)

**Goal**: Extract message handling and LLM provider logic

**Tasks**:

1. Create `app/services/llm_factory.py`

   - `LLMFactory.get_streamer() -> BaseStreamer`
   - Remove duplicated provider selection logic

2. Create `app/services/message_service.py`

   - `add_user_message(session_id: str, content: str) -> Message`
   - `add_assistant_message(session_id: str, content: str) -> Message`
   - `get_conversation_history(session_id: str) -> List[Dict]`
   - `stream_llm_response(session_id: str, messages: List[Dict]) -> AsyncGenerator`

3. Update `send_message()` in `main.py` to use services

4. Create tests for both services

**Validation**: Message streaming works, LLM responses generated

---

## Phase 6: Router Extraction - Auth Module (Week 2, Day 5-6)

**Goal**: Split main.py into routers, starting with authentication

**Tasks**:

1. Create `app/routers/__init__.py`

2. Create `app/routers/auth.py`

   - Move: `register`, `login`, `me`, `update_profile`, `google_auth`, `logout`
   - Use APIRouter with prefix `/auth`
   - Import and use services

3. Update `main.py` to include auth router:

   - `app.include_router(auth_router)`
   - Remove moved endpoint functions

4. Create `app/tests/test_auth_router.py`

**Validation**: All auth endpoints still work at same URLs

---

## Phase 7: Router Extraction - Sessions Module (Week 3, Day 1-2)

**Goal**: Extract session-related endpoints

**Tasks**:

1. Create `app/routers/sessions.py`

   - Move: `list_chats`, `start_session`, `get_history`, `put_notes`, `delete_session`, `send_message`
   - Use APIRouter with prefix `/api/sessions`

2. Update `main.py` to include sessions router

3. Create `app/tests/test_sessions_router.py`

**Validation**: All session endpoints work correctly

---

## Phase 8: Router Extraction - Wallet Module (Week 3, Day 3)

**Goal**: Extract wallet endpoints

**Tasks**:

1. Create `app/routers/wallet.py`

   - Move: `get_wallet`, `create_wallet`
   - Use APIRouter with prefix `/api/wallet`

2. Update `main.py` to include wallet router

3. Create `app/tests/test_wallet_router.py`

**Validation**: Wallet endpoints work correctly

---

## Phase 9: Repository Layer Implementation (Week 3, Day 4-5)

**Goal**: Add repository layer for data access

**Tasks**:

1. Create `app/repositories/__init__.py`

2. Create `app/repositories/user_repository.py`

   - Move all User database queries from UserService
   - Methods: `find_by_id`, `find_by_login_id`, `find_by_google_id`, `create`, `update`

3. Create `app/repositories/session_repository.py`

   - Move all ChatSession database queries
   - Methods: `find_by_id`, `find_by_user_id`, `create`, `update`, `delete`

4. Create `app/repositories/message_repository.py`

   - Move Message queries
   - Methods: `create`, `find_by_session_id`, `delete_by_session_id`

5. Create `app/repositories/wallet_repository.py`

   - Move Wallet queries
   - Methods: `find_by_user_id`, `create`, `update`

6. Update all services to use repositories

7. Create repository tests

**Validation**: All functionality intact, cleaner service layer

---

## Phase 10: Dependency Injection & Clean Main (Week 3, Day 6-7)

**Goal**: Implement proper dependency injection and finalize main.py

**Tasks**:

1. Create `app/dependencies.py`

   - `get_db_session()`
   - `get_user_service(db: Session = Depends(get_db_session))`
   - `get_session_service(db: Session = Depends(get_db_session))`
   - `get_wallet_service(db: Session = Depends(get_db_session))`
   - `get_message_service(db: Session = Depends(get_db_session))`

2. Update all routers to use dependency injection

3. Clean up `main.py`:

   - Should only contain: app initialization, middleware, router registration
   - Move logging config to separate file
   - Target: < 100 lines

4. Update all imports across the codebase

**Validation**: All tests pass, main.py is clean and minimal

---

## Phase 11: Error Handling & Validation (Week 4, Day 1-2)

**Goal**: Centralized error handling and enhanced validation

**Tasks**:

1. Create `app/exceptions.py`

   - Custom exception classes: `UserNotFoundError`, `SessionNotFoundError`, `WalletError`

2. Create `app/middleware/error_handler.py`

   - Global exception handlers
   - Consistent error response format

3. Add validation to services:

   - Input validation beyond Pydantic
   - Business rule validation

4. Create error handling tests

**Validation**: Proper error responses, consistent format

---

## Phase 12: Final Optimization & Documentation (Week 4, Day 3-4)

**Goal**: Performance optimization and comprehensive documentation

**Tasks**:

1. Add async where beneficial:

   - LLM streaming
   - Database operations in routers

2. Implement connection pooling configuration in `db.py`

3. Add comprehensive docstrings to all services and repositories

4. Create `app/README.md` with:

   - Architecture overview
   - Directory structure explanation
   - Service interaction diagrams
   - Development guidelines

5. Update main `README.md` with new structure

6. Run full test suite and fix any issues

**Validation**: All tests pass, performance improved, docs complete

---

## Final Structure

```
backend/app/
├── config/
│   └── settings.py
├── routers/
│   ├── __init__.py
│   ├── auth.py
│   ├── sessions.py
│   └── wallet.py
├── services/
│   ├── __init__.py
│   ├── base_service.py
│   ├── user_service.py
│   ├── session_service.py
│   ├── message_service.py
│   ├── wallet_service.py
│   └── llm_factory.py
├── repositories/
│   ├── __init__.py
│   ├── user_repository.py
│   ├── session_repository.py
│   ├── message_repository.py
│   └── wallet_repository.py
├── middleware/
│   └── error_handler.py
├── tests/
│   ├── test_user_service.py
│   ├── test_session_service.py
│   ├── test_wallet_service.py
│   ├── test_auth_router.py
│   └── ...
├── exceptions.py
├── dependencies.py
├── main.py (< 100 lines)
├── models.py
├── schemas.py
├── db.py
└── utils.py
```

## Success Metrics

- main.py reduced from 644 lines to < 100 lines
- Zero code duplication for wallet creation
- All endpoints functional and tested
- Test coverage > 80%
- Clear separation of concerns
- Easy to add new features

### To-dos

- [ ] Phase 1: Create configuration and base service utilities
- [ ] Phase 2: Extract wallet service and eliminate duplication
- [ ] Phase 3: Extract user service and business logic
- [ ] Phase 4: Extract session service
- [ ] Phase 5: Create message service and LLM factory
- [ ] Phase 6: Extract auth router module
- [ ] Phase 7: Extract sessions router module
- [ ] Phase 8: Extract wallet router module
- [ ] Phase 9: Implement repository layer
- [ ] Phase 10: Add dependency injection and clean main.py
- [ ] Phase 11: Centralized error handling and validation
- [ ] Phase 12: Final optimization and documentation