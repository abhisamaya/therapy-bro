"""Tests for memory system components."""
import pytest
import uuid
from datetime import datetime, timezone
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.models import User, ChatSession, Message, MemoryChunk
from app.services.memory_agent import MemoryAgent, AgentState
from app.services.memory_chunker import MemoryChunkerService
from app.repositories.memory_repository import MemoryRepository
from app.services.vector_store import VectorStoreService
from app.config.settings import get_settings


class TestMemoryAgent:
    """Test MemoryAgent functionality."""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        return Mock(spec=Session)
    
    @pytest.fixture
    def memory_agent(self, mock_db_session):
        """Create MemoryAgent instance with mocked dependencies."""
        with patch('app.services.memory_agent.get_vector_store') as mock_vs, \
             patch('app.services.memory_agent.SessionService') as mock_ss, \
             patch('app.services.memory_agent.UserRepository') as mock_ur, \
             patch('app.repositories.session_repository.SessionRepository') as mock_sr, \
             patch('app.repositories.message_repository.MessageRepository') as mock_mr:
            
            # Setup mocks
            mock_vs.return_value = Mock()
            mock_ss.return_value = Mock()
            mock_ur.return_value = Mock()
            mock_sr.return_value = Mock()
            mock_mr.return_value = Mock()
            
            agent = MemoryAgent(mock_db_session)
            return agent
    
    def test_memory_agent_initialization(self, memory_agent):
        """Test MemoryAgent initializes correctly."""
        assert memory_agent.db is not None
        assert memory_agent.vector_store is not None
        assert memory_agent.session_service is not None
        assert memory_agent.user_repository is not None
        assert memory_agent.session_repository is not None
        assert memory_agent.message_repository is not None
        assert memory_agent.memory_enabled is True
        assert memory_agent.memory_limit == 3
    
    def test_memory_agent_process_basic(self, memory_agent):
        """Test basic MemoryAgent.process() functionality."""
        # Mock user
        mock_user = Mock()
        mock_user.name = "Test User"
        memory_agent.user_repository.find_by_id.return_value = mock_user
        
        # Mock conversation history
        history = [
            {"role": "system", "content": "You are TherapyBro"},
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"}
        ]
        
        # Mock graph execution
        mock_final_state = {
            "final_context": [
                {"role": "system", "content": "Enhanced prompt with user name"},
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"}
            ]
        }
        
        with patch.object(memory_agent.graph, 'invoke', return_value=mock_final_state):
            result = memory_agent.process(
                user_id=1,
                session_id="test-session",
                message="What's my name?",
                history=history
            )
            
            assert result == mock_final_state["final_context"]
            memory_agent.user_repository.find_by_id.assert_called_once_with(1)
    
    def test_memory_agent_process_with_user_name(self, memory_agent):
        """Test MemoryAgent includes user name in context."""
        # Mock user with name
        mock_user = Mock()
        mock_user.name = "Alice"
        memory_agent.user_repository.find_by_id.return_value = mock_user
        
        # Mock graph execution
        mock_final_state = {
            "final_context": [
                {"role": "system", "content": "Enhanced prompt with Alice"},
                {"role": "user", "content": "Hello"}
            ]
        }
        
        with patch.object(memory_agent.graph, 'invoke', return_value=mock_final_state):
            result = memory_agent.process(
                user_id=1,
                session_id="test-session",
                message="Hello",
                history=[{"role": "user", "content": "Hello"}]
            )
            
            # Verify user name was retrieved
            memory_agent.user_repository.find_by_id.assert_called_once_with(1)
    
    def test_memory_agent_process_no_user(self, memory_agent):
        """Test MemoryAgent handles missing user gracefully."""
        # Mock user not found
        memory_agent.user_repository.find_by_id.return_value = None
        
        # Mock graph execution
        mock_final_state = {
            "final_context": [
                {"role": "system", "content": "Enhanced prompt without user name"},
                {"role": "user", "content": "Hello"}
            ]
        }
        
        with patch.object(memory_agent.graph, 'invoke', return_value=mock_final_state):
            result = memory_agent.process(
                user_id=999,
                session_id="test-session",
                message="Hello",
                history=[{"role": "user", "content": "Hello"}]
            )
            
            # Should still work without user name
            assert result == mock_final_state["final_context"]
    
    def test_memory_agent_process_graph_error(self, memory_agent):
        """Test MemoryAgent handles graph execution errors."""
        # Mock user
        mock_user = Mock()
        mock_user.name = "Test User"
        memory_agent.user_repository.find_by_id.return_value = mock_user
        
        # Mock graph execution failure
        with patch.object(memory_agent.graph, 'invoke', side_effect=Exception("Graph error")):
            result = memory_agent.process(
                user_id=1,
                session_id="test-session",
                message="Hello",
                history=[{"role": "user", "content": "Hello"}]
            )
            
            # Should return original history on error
            assert result == [{"role": "user", "content": "Hello"}]


class TestMemoryChunkerService:
    """Test MemoryChunkerService functionality."""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        return Mock(spec=Session)
    
    @pytest.fixture
    def memory_chunker(self, mock_db_session):
        """Create MemoryChunkerService instance with mocked dependencies."""
        with patch('app.services.memory_chunker.get_vector_store') as mock_vs, \
             patch('app.repositories.memory_repository.MemoryRepository') as mock_mr:
            
            # Setup mocks
            mock_vs.return_value = Mock()
            mock_mr.return_value = Mock()
            
            chunker = MemoryChunkerService(mock_db_session)
            return chunker
    
    def test_chunk_and_store_session(self, memory_chunker):
        """Test chunking and storing a session."""
        # Create mock messages
        messages = [
            Mock(id=1, role="system", content="System prompt"),
            Mock(id=2, role="user", content="Hello"),
            Mock(id=3, role="assistant", content="Hi there!"),
            Mock(id=4, role="user", content="How are you?"),
            Mock(id=5, role="assistant", content="I'm good, thanks!"),
            Mock(id=6, role="user", content="That's great"),
            Mock(id=7, role="assistant", content="Yes, it is!")
        ]
        
        # Mock vector store
        memory_chunker.vector_store.add_memory = Mock()
        
        # Mock repository (it's created in __init__)
        memory_chunker.memory_repo.create = Mock()
        
        # Test chunking
        memory_chunker.chunk_and_store_session(
            session_id="test-session",
            user_id=1,
            messages=messages
        )
        
        # Verify vector store was called
        assert memory_chunker.vector_store.add_memory.called
        
        # Verify repository was called
        assert memory_chunker.memory_repo.create.called
    
    def test_create_semantic_chunks(self, memory_chunker):
        """Test semantic chunking logic."""
        # Create mock messages
        messages = [
            Mock(id=1, role="system", content="System prompt"),
            Mock(id=2, role="user", content="Hello"),
            Mock(id=3, role="assistant", content="Hi there!"),
            Mock(id=4, role="user", content="How are you?"),
            Mock(id=5, role="assistant", content="I'm good, thanks!"),
            Mock(id=6, role="user", content="That's great"),
            Mock(id=7, role="assistant", content="Yes, it is!")
        ]
        
        chunks = memory_chunker._create_semantic_chunks(messages)
        
        # Should skip system message and create chunks
        assert len(chunks) > 0
        
        # Each chunk should have text and message IDs
        for chunk_text, msg_ids in chunks:
            assert isinstance(chunk_text, str)
            assert isinstance(msg_ids, list)
            assert len(msg_ids) > 0
    
    def test_create_semantic_chunks_empty(self, memory_chunker):
        """Test chunking with empty messages."""
        chunks = memory_chunker._create_semantic_chunks([])
        assert chunks == []
    
    def test_create_semantic_chunks_only_system(self, memory_chunker):
        """Test chunking with only system messages."""
        messages = [
            Mock(id=1, role="system", content="System prompt"),
            Mock(id=2, role="system", content="Another system prompt")
        ]
        
        chunks = memory_chunker._create_semantic_chunks(messages)
        assert chunks == []


class TestMemoryRepository:
    """Test MemoryRepository functionality."""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        return Mock(spec=Session)
    
    @pytest.fixture
    def memory_repository(self, mock_db_session):
        """Create MemoryRepository instance."""
        return MemoryRepository(mock_db_session)
    
    def test_create_memory_chunk(self, memory_repository):
        """Test creating a memory chunk."""
        chunk = MemoryChunk(
            chunk_id="test-chunk-123",
            user_id=1,
            session_id="test-session",
            chunk_text="Test conversation chunk",
            message_ids="1,2,3",
            chunk_type="conversation"
        )
        
        memory_repository.create(chunk)
        
        # Verify session.add was called
        memory_repository.db.add.assert_called_once_with(chunk)
        memory_repository.db.commit.assert_called_once()
    
    def test_find_by_user_id(self, memory_repository):
        """Test finding chunks by user ID."""
        # Mock query result
        mock_chunks = [
            Mock(chunk_id="chunk1", user_id=1),
            Mock(chunk_id="chunk2", user_id=1)
        ]
        memory_repository.db.execute.return_value.scalars.return_value.all.return_value = mock_chunks
        
        result = memory_repository.find_by_user_id(1, limit=10)
        
        assert len(result) == 2
        assert result[0].chunk_id == "chunk1"
        assert result[1].chunk_id == "chunk2"
    
    def test_find_by_session_id(self, memory_repository):
        """Test finding chunks by session ID."""
        # Mock query result
        mock_chunks = [Mock(chunk_id="chunk1", session_id="test-session")]
        memory_repository.db.execute.return_value.scalars.return_value.all.return_value = mock_chunks
        
        result = memory_repository.find_by_session_id("test-session")
        
        assert len(result) == 1
        assert result[0].chunk_id == "chunk1"
    
    def test_count_by_user_id(self, memory_repository):
        """Test counting chunks by user ID."""
        # Mock count result
        memory_repository.db.execute.return_value.scalar.return_value = 5
        
        result = memory_repository.count_by_user_id(1)
        
        assert result == 5
    
    def test_delete_by_chunk_id(self, memory_repository):
        """Test deleting chunk by chunk ID."""
        # Mock execute result
        mock_result = Mock()
        mock_result.rowcount = 1
        memory_repository.db.execute.return_value = mock_result
        
        result = memory_repository.delete_by_chunk_id("test-chunk")
        
        assert result is True
        memory_repository.db.execute.assert_called_once()
        memory_repository.db.commit.assert_called_once()


class TestVectorStoreService:
    """Test VectorStoreService functionality."""
    
    @pytest.fixture
    def vector_store(self):
        """Create VectorStoreService instance with mocked ChromaDB."""
        with patch('app.services.vector_store.chromadb') as mock_chromadb:
            # Mock ChromaDB client and collection
            mock_client = Mock()
            mock_collection = Mock()
            mock_client.get_or_create_collection.return_value = mock_collection
            mock_chromadb.PersistentClient.return_value = mock_client
            
            vs = VectorStoreService()
            vs.client = mock_client
            vs.collection = mock_collection
            return vs
    
    def test_add_memory(self, vector_store):
        """Test adding memory to vector store."""
        vector_store.add_memory(
            chunk_id="test-chunk",
            text="Test conversation",
            metadata={"user_id": 1, "session_id": "test-session"}
        )
        
        # Verify collection.add was called
        vector_store.collection.add.assert_called_once()
        call_args = vector_store.collection.add.call_args
        assert call_args[1]["ids"] == ["test-chunk"]
        assert call_args[1]["documents"] == ["Test conversation"]
        assert call_args[1]["metadatas"] == [{"user_id": 1, "session_id": "test-session"}]
    
    def test_search_memories(self, vector_store):
        """Test searching memories."""
        # Mock search results
        mock_results = {
            "documents": [["Found memory 1", "Found memory 2"]],
            "metadatas": [[{"user_id": 1}, {"user_id": 1}]],
            "distances": [[0.1, 0.2]],
            "ids": [["chunk1", "chunk2"]]
        }
        vector_store.collection.query.return_value = mock_results
        
        result = vector_store.search_memories(
            query="test query",
            user_id=1,
            limit=5
        )
        
        assert result == mock_results
        vector_store.collection.query.assert_called_once()
    
    def test_search_memories_with_similarity_filter(self, vector_store):
        """Test searching memories with similarity filtering."""
        # Mock search results with distances
        mock_results = {
            "documents": [["Found memory 1", "Found memory 2", "Found memory 3"]],
            "metadatas": [[{"user_id": 1}, {"user_id": 1}, {"user_id": 1}]],
            "distances": [[0.1, 0.5, 0.8]],  # 0.8 > 0.7 threshold
            "ids": [["chunk1", "chunk2", "chunk3"]]
        }
        vector_store.collection.query.return_value = mock_results
        
        result = vector_store.search_memories(
            query="test query",
            user_id=1,
            limit=5,
            min_similarity=0.7
        )
        
        # Should filter out chunk3 (distance 0.8 -> similarity 0.2 < 0.7)
        # Only chunks with distance <= 0.3 (similarity >= 0.7) should remain
        assert len(result["documents"][0]) == 1  # Only "Found memory 1" (distance 0.1)
        assert "Found memory 1" in result["documents"][0]
        assert "Found memory 3" not in result["documents"][0]
    
    def test_delete_memory(self, vector_store):
        """Test deleting memory by chunk ID."""
        vector_store.delete_memory("test-chunk")
        
        vector_store.collection.delete.assert_called_once_with(ids=["test-chunk"])
    
    def test_delete_user_memories(self, vector_store):
        """Test deleting all memories for a user."""
        vector_store.delete_user_memories(1)
        
        vector_store.collection.delete.assert_called_once_with(where={"user_id": 1})
    
    def test_get_collection_stats(self, vector_store):
        """Test getting collection statistics."""
        # Mock collection count and name
        vector_store.collection.count.return_value = 42
        vector_store.collection.name = "therapybro_memories"
        
        stats = vector_store.get_collection_stats()
        
        assert stats["name"] == "therapybro_memories"
        assert stats["count"] == 42


class TestMemoryIntegration:
    """Integration tests for memory system."""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        return Mock(spec=Session)
    
    def test_memory_system_end_to_end(self, mock_db_session):
        """Test complete memory system workflow."""
        # This would be a more comprehensive integration test
        # that tests the full flow from message processing to memory retrieval
        
        # Mock all dependencies
        with patch('app.services.memory_agent.get_vector_store') as mock_vs, \
             patch('app.services.memory_agent.SessionService') as mock_ss, \
             patch('app.services.memory_agent.UserRepository') as mock_ur, \
             patch('app.repositories.session_repository.SessionRepository') as mock_sr, \
             patch('app.repositories.message_repository.MessageRepository') as mock_mr:
            
            # Setup mocks
            mock_vs.return_value = Mock()
            mock_ss.return_value = Mock()
            mock_ur.return_value = Mock()
            mock_sr.return_value = Mock()
            mock_mr.return_value = Mock()
            
            # Create agent
            agent = MemoryAgent(mock_db_session)
            
            # Mock user
            mock_user = Mock()
            mock_user.name = "Integration Test User"
            agent.user_repository.find_by_id.return_value = mock_user
            
            # Mock graph execution
            mock_final_state = {
                "final_context": [
                    {"role": "system", "content": "Enhanced prompt"},
                    {"role": "user", "content": "Hello"}
                ]
            }
            
            with patch.object(agent.graph, 'invoke', return_value=mock_final_state):
                result = agent.process(
                    user_id=1,
                    session_id="integration-test",
                    message="Hello",
                    history=[{"role": "user", "content": "Hello"}]
                )
                
                assert result == mock_final_state["final_context"]
                agent.user_repository.find_by_id.assert_called_once_with(1)
    
    def test_memory_settings_integration(self):
        """Test that memory settings are properly loaded."""
        settings = get_settings()
        
        assert hasattr(settings, 'memory_enabled')
        assert hasattr(settings, 'memory_retrieval_limit')
        assert hasattr(settings, 'chroma_persist_directory')
        assert hasattr(settings, 'memory_min_similarity')
        assert hasattr(settings, 'embedding_model')
        
        # Verify default values
        assert settings.memory_enabled is True
        assert settings.memory_retrieval_limit == 3
        assert settings.chroma_persist_directory == "./chroma_db"
        assert settings.memory_min_similarity == 0.7
        assert settings.embedding_model == "text-embedding-3-small"


class TestMemoryBehaviorGaps:
    """Additional high-value behavior tests to cover gaps."""

    @pytest.fixture
    def agent(self, db_session):
        # Use a real agent instance but stub external calls
        agent = MemoryAgent(db_session)
        return agent

    def test_first_conversation_context_injected(self, agent, monkeypatch):
        """When there are no recent sessions or memories, inject first-convo context."""
        # Force no memory retrieval and no recent context
        monkeypatch.setattr(agent, "_get_recent_context", lambda u, s: None)
        monkeypatch.setattr(agent.vector_store, "search_memories", lambda **kwargs: {"documents": [[]], "metadatas": [[]], "distances": [[]], "ids": [[]]})

        # Also skip memory need to go directly to build_context
        def _assess_skip(state):
            state["needs_memory"] = False
            return state
        monkeypatch.setattr(agent, "_assess_memory_need", _assess_skip)
        # Rebuild graph to capture patched node
        agent.graph = agent._build_graph()

        history = [{"role": "system", "content": "You are TherapyBro"}]
        ctx = agent.process(user_id=1, session_id="s1", message="hi", history=history)

        system_text = ctx[0]["content"] if ctx and ctx[0]["role"] == "system" else ""
        assert "<conversation_context>" in system_text
        assert "first conversation" in system_text

    def test_assess_memory_true_retrieves(self, agent, monkeypatch):
        """If assess says TRUE, we retrieve and include memories in context."""
        def _assess_true(state):
            state["needs_memory"] = True
            return state
        monkeypatch.setattr(agent, "_assess_memory_need", _assess_true)
        # Rebuild graph to capture patched node
        agent.graph = agent._build_graph()

        monkeypatch.setattr(agent, "_get_recent_context", lambda u, s: None)
        monkeypatch.setattr(
            agent.vector_store,
            "search_memories",
            lambda query, user_id, limit=None, min_similarity=None: {
                "documents": [["Past memory A", "Past memory B"]],
                "metadatas": [[{"user_id": user_id}, {"user_id": user_id}]],
                "distances": [[0.2, 0.3]],
                "ids": [["a", "b"]],
            },
        )

        history = [{"role": "system", "content": "You are TherapyBro"}]
        ctx = agent.process(user_id=2, session_id="s2", message="remember last time?", history=history)

        system_text = ctx[0]["content"] if ctx and ctx[0]["role"] == "system" else ""
        assert "<relevant_memories>" in system_text
        assert "Past memory A" in system_text

    def test_assess_memory_false_skips(self, agent, monkeypatch):
        """If assess says FALSE, we skip retrieval and do not include memories."""
        def _assess_false(state):
            state["needs_memory"] = False
            return state
        monkeypatch.setattr(agent, "_assess_memory_need", _assess_false)
        # Rebuild graph to capture patched node
        agent.graph = agent._build_graph()

        # Even if search would return docs, it should be skipped
        called = {"q": False}
        def _search(**kwargs):
            called["q"] = True
            return {"documents": [["Should not appear"]]}
        monkeypatch.setattr(agent.vector_store, "search_memories", _search)
        monkeypatch.setattr(agent, "_get_recent_context", lambda u, s: None)

        history = [{"role": "system", "content": "You are TherapyBro"}]
        ctx = agent.process(user_id=3, session_id="s3", message="hi", history=history)

        assert called["q"] is False  # ensure we did not hit vector store
        system_text = ctx[0]["content"] if ctx and ctx[0]["role"] == "system" else ""
        assert "<relevant_memories>" not in system_text
