"""Memory agent using LangGraph for intelligent context retrieval."""
import logging
import os
from typing import TypedDict, Annotated, List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI

from app.services.vector_store import get_vector_store
from app.services.session_service import SessionService
from app.repositories.user_repository import UserRepository
from app.prompts import PromptContext, build_system_prompt
from app.config.settings import get_settings


logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    """State passed through the LangGraph workflow."""
    user_id: int
    user_name: Optional[str]
    session_id: str
    current_message: str
    conversation_history: List[Dict]
    retrieved_memories: List[str]
    needs_memory: bool
    final_context: List[Dict]


class MemoryAgent:
    """
    LangGraph-based agent for intelligent memory retrieval and context building.
    
    Workflow:
    1. Assess if memory retrieval is needed
    2. Retrieve relevant memories if needed
    3. Build enriched context with memories + recent history
    """
    
    def __init__(self, db_session: Session):
        """
        Initialize memory agent.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.vector_store = get_vector_store()
        self.session_service = SessionService(db_session)
        self.user_repository = UserRepository(db_session)
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Import repositories for direct access
        from app.repositories.session_repository import SessionRepository
        from app.repositories.message_repository import MessageRepository
        self.session_repository = SessionRepository(db_session)
        self.message_repository = MessageRepository(db_session)
        
        # Get settings for memory configuration
        settings = get_settings()
        self.memory_enabled = settings.memory_enabled
        self.memory_limit = settings.memory_retrieval_limit
        
        # Fast LLM for classification (cheap and fast)
        self.fast_llm = ChatOpenAI(
            model="gpt-5-nano",
            temperature=0,
            max_tokens=10
        )
        
        # Build the graph
        self.graph = self._build_graph()
        
        self.logger.info(f"MemoryAgent initialized (memory_enabled={self.memory_enabled})")
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(AgentState)
        
        # Define nodes
        workflow.add_node("assess_memory_need", self._assess_memory_need)
        workflow.add_node("retrieve_memories", self._retrieve_memories)
        workflow.add_node("build_context", self._build_context)
        
        # Define edges
        workflow.set_entry_point("assess_memory_need")
        workflow.add_conditional_edges(
            "assess_memory_need",
            self._should_retrieve_memory,
            {
                "retrieve": "retrieve_memories",
                "skip": "build_context"
            }
        )
        workflow.add_edge("retrieve_memories", "build_context")
        workflow.add_edge("build_context", END)
        
        return workflow.compile()
    
    def _assess_memory_need(self, state: AgentState) -> AgentState:
        """
        Decide if we need to retrieve past memories using fast LLM classifier.
        
        Uses gpt-4o-mini for classification (~$0.0001 per request, 200-300ms).
        Falls back to keyword heuristic if LLM fails.
        """
        message = state["current_message"]
        
        if not self.memory_enabled:
            self.logger.debug("Memory retrieval disabled via config")
            state["needs_memory"] = False
            return state
        
        try:
            classifier_prompt = f"""You are a memory retrieval classifier. Decide if the user's message requires retrieving past conversation history.

                                Return TRUE if the message:
                                - References past conversations ("remember when", "last time", "you mentioned")
                                - Asks follow-up questions that need context
                                - Continues a previous topic without explicit context
                                - Mentions something discussed before

                                Return FALSE if the message:
                                - Is a new topic/question
                                - Is self-contained and doesn't need history
                                - Is a greeting or casual statement

                                Respond with only "TRUE" or "FALSE".

                                User message: {message}"""
            
            response = self.fast_llm.invoke(classifier_prompt)
            state["needs_memory"] = "TRUE" in response.content.upper()
            
            self.logger.debug(
                f"LLM classifier: needs_memory={state['needs_memory']} for message: {message[:50]}..."
            )
            
        except Exception as e:
            self.logger.warning(f"LLM classifier failed, using keyword fallback: {str(e)}")
            # Fallback to keyword heuristic
            keywords = ["remember", "last time", "you said", "before", "earlier", "previously", "you mentioned"]
            state["needs_memory"] = any(kw in message.lower() for kw in keywords)
            self.logger.debug(f"Keyword classifier: needs_memory={state['needs_memory']}")
        
        return state
    
    def _should_retrieve_memory(self, state: AgentState) -> str:
        """Conditional edge: decide whether to retrieve memories."""
        return "retrieve" if state["needs_memory"] else "skip"
    
    def _retrieve_memories(self, state: AgentState) -> AgentState:
        """Retrieve relevant memories from vector store."""
        try:
            results = self.vector_store.search_memories(
                query=state["current_message"],
                user_id=state["user_id"],
                limit=self.memory_limit
            )
            
            # Extract documents from results
            documents = results.get("documents", [[]])[0] if results.get("documents") else []
            state["retrieved_memories"] = documents
            
            self.logger.info(
                f"Retrieved {len(documents)} memories for user {state['user_id']}"
            )
            
        except Exception as e:
            self.logger.error(f"Failed to retrieve memories: {str(e)}")
            state["retrieved_memories"] = []
        
        return state
    
    def _build_context(self, state: AgentState) -> AgentState:
        """
        Build enriched context with:
        1. Enhanced system prompt (with user name + memories + recent context)
        2. Current conversation messages
        """
        try:
            conversation = state["conversation_history"]
            
            # Extract system prompt from conversation history (always first message)
            system_prompt_content = None
            remaining_messages = conversation
            
            if conversation and conversation[0]["role"] == "system":
                system_prompt_content = conversation[0]["content"]
                remaining_messages = conversation[1:]  # Everything after system prompt
            
            # Get recent sessions summary
            recent_context_text = self._get_recent_context(
                state["user_id"],
                state["session_id"]
            )
            
            # Build retrieved memories text
            memories_text = None
            if state.get("retrieved_memories"):
                memories_text = "\n\n".join(
                    f"- {memory}" for memory in state["retrieved_memories"]
                )
            
            # Build context injection sections
            context_additions = []
            
            # Add user name context if available
            if state.get("user_name"):
                context_additions.append(f"\n<user_info>\nThe user's name is {state.get('user_name')}.\n</user_info>")
            
            # Add conversation history context (important for first-time users)
            if not recent_context_text and not memories_text:
                context_additions.append(f"\n<conversation_context>\nThis is your first conversation with this user. Welcome them naturally and be present.\n</conversation_context>")
            
            # Add recent sessions context
            if recent_context_text:
                context_additions.append(f"\n<recent_context>\nHere's a brief summary of recent conversations with this user:\n{recent_context_text}\n</recent_context>")
            
            # Add retrieved memories
            if memories_text:
                context_additions.append(f"\n<relevant_memories>\nHere are relevant past conversations that may provide useful context:\n{memories_text}\n</relevant_memories>")
            
            # If we have a system prompt, append context to it
            # Otherwise, build a fresh one with PromptContext
            if system_prompt_content:
                # Append context to existing prompt (don't rebuild from scratch)
                enhanced_prompt = system_prompt_content + "".join(context_additions)
            else:
                # No existing prompt, build fresh with PromptContext
                prompt_context = PromptContext(
                    user_name=state.get("user_name"),
                    recent_sessions=recent_context_text,
                    retrieved_memories=memories_text
                )
                enhanced_prompt = build_system_prompt("therapybro", prompt_context)
            
            # Build final context
            final_context = [{"role": "system", "content": enhanced_prompt}]
            final_context.extend(remaining_messages)
            
            state["final_context"] = final_context
            
            self.logger.info(
                f"Built context with {len(final_context)} messages "
                f"(user_name: {state.get('user_name')}, "
                f"memories: {len(state.get('retrieved_memories', []))}, "
                f"recent_context: {'yes' if recent_context_text else 'no'})"
            )
            
        except Exception as e:
            self.logger.error(f"Failed to build context: {str(e)}")
            # Fallback to original conversation
            state["final_context"] = conversation
        
        return state
    
    def _get_recent_context(self, user_id: int, current_session_id: str) -> Optional[str]:
        """
        Get summary of recent sessions (last 2) excluding current.
        
        Returns formatted string with brief summaries.
        """
        try:
            # Get recent sessions
            all_sessions = self.session_repository.find_by_user_id(user_id)
            
            # Filter out current session and get last 2
            recent_sessions = [
                s for s in all_sessions 
                if s.session_id != current_session_id
            ][-2:]  # Last 2 sessions
            
            if not recent_sessions:
                return None
            
            summaries = []
            for session in recent_sessions:
                first_msg = self._get_first_user_message(session.session_id)
                date_str = session.created_at.strftime('%b %d')
                preview = first_msg[:100] if first_msg else "(no messages)"
                summaries.append(f"- {date_str}: {preview}")
            
            return "\n".join(summaries)
            
        except Exception as e:
            self.logger.error(f"Failed to get recent context: {str(e)}")
            return None
    
    def _get_first_user_message(self, session_id: str) -> str:
        """Get the first user message from a session."""
        try:
            messages = self.message_repository.find_by_session_id(session_id)
            for msg in messages:
                if msg.role == "user":
                    return msg.content
            return ""
        except Exception as e:
            self.logger.error(f"Failed to get first message: {str(e)}")
            return ""
    
    def process(
        self,
        user_id: int,
        session_id: str,
        message: str,
        history: List[Dict]
    ) -> List[Dict]:
        """
        Main entry point - returns enriched conversation context.
        
        Args:
            user_id: User ID
            session_id: Current session ID
            message: Current user message
            history: Existing conversation history
            
        Returns:
            Enriched conversation history with memories and context
        """
        self.logger.info(f"Processing message for user {user_id}, session {session_id}")
        
        # Get user name from database
        user = self.user_repository.find_by_id(user_id)
        user_name = user.name if user and user.name else None
        self.logger.info(f"User name retrieved: {user_name} (user_id: {user_id})")
        
        # Initialize state
        state = {
            "user_id": user_id,
            "user_name": user_name,
            "session_id": session_id,
            "current_message": message,
            "conversation_history": history,
            "retrieved_memories": [],
            "needs_memory": False,
            "final_context": []
        }
        
        # Run the graph
        try:
            final_state = self.graph.invoke(state)
            return final_state["final_context"]
        except Exception as e:
            self.logger.error(f"Graph execution failed: {str(e)}")
            # Fallback to original history
            return history

