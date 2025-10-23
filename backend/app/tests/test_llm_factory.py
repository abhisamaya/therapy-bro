"""Tests for LLM factory."""
import pytest
from unittest.mock import Mock, patch
from app.services.llm_factory import LLMFactory, get_llm_factory


class TestLLMFactory:
    """Test cases for LLMFactory."""
    
    def test_get_supported_providers(self):
        """Test getting supported providers."""
        factory = LLMFactory()
        
        providers = factory.get_supported_providers()
        
        assert "anthropic" in providers
        assert "openai" in providers
        assert "together" in providers
        assert len(providers) == 3
    
    def test_is_provider_supported(self):
        """Test checking if provider is supported."""
        factory = LLMFactory()
        
        assert factory.is_provider_supported("anthropic") is True
        assert factory.is_provider_supported("openai") is True
        assert factory.is_provider_supported("together") is True
        assert factory.is_provider_supported("invalid") is False
        assert factory.is_provider_supported("ANTHROPIC") is True  # Case insensitive
        assert factory.is_provider_supported("  openai  ") is True  # Whitespace handling
    
    def test_create_streamer_unsupported_provider(self):
        """Test creating streamer with unsupported provider."""
        factory = LLMFactory()
        
        with pytest.raises(ValueError, match="Unsupported LLM provider: invalid"):
            factory.create_streamer("invalid")
    
    def test_global_factory_instance(self):
        """Test global factory instance."""
        llm_factory = get_llm_factory()
        assert isinstance(llm_factory, LLMFactory)
        assert llm_factory.get_supported_providers() == ["anthropic", "openai", "together"]
    
    def test_factory_initialization(self):
        """Test factory initialization."""
        factory = LLMFactory()
        
        # Test that providers are properly registered
        assert "anthropic" in factory._providers
        assert "openai" in factory._providers
        assert "together" in factory._providers
        
        # Test that logger is set
        assert factory.logger is not None
        assert factory.logger.name == "llm.factory"
