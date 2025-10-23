"""LLM factory for creating and managing LLM providers."""
import os
import logging
from typing import Dict, Iterable, List, Protocol, Optional
from app.config.settings import get_settings
from app.openai_client import OpenAIStreamer
from app.anthropic_client import AnthropicStreamer
from app.together_client import TogetherStreamer


class LLMStreamer(Protocol):
    """Protocol for LLM streaming clients."""
    
    def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> Iterable[str]:
        """Stream chat completion from LLM provider."""
        ...


class LLMFactory:
    """Factory for creating LLM streaming clients."""
    
    def __init__(self):
        """Initialize the LLM factory."""
        self.logger = logging.getLogger('llm.factory')
        self._providers = {
            'anthropic': AnthropicStreamer,
            'openai': OpenAIStreamer,
            'together': TogetherStreamer,
        }
    
    def create_streamer(self, provider: str = None, model: str = None) -> LLMStreamer:
        """Create an LLM streamer instance.
        
        Args:
            provider: LLM provider name (anthropic, openai, together)
            model: Specific model to use (optional)
            
        Returns:
            LLMStreamer instance
            
        Raises:
            ValueError: If provider is not supported
            RuntimeError: If provider initialization fails
        """
        if provider is None:
            settings = get_settings()
            provider = settings.llm_provider
        
        provider = provider.strip().lower()
        
        if provider not in self._providers:
            self.logger.error(f"Unsupported LLM provider: {provider}")
            raise ValueError(f"Unsupported LLM provider: {provider}")
        
        try:
            self.logger.info(f"Creating LLM streamer for provider: {provider}")
            streamer_class = self._providers[provider]
            streamer = streamer_class(model=model)
            
            self.logger.info(f"LLM streamer created successfully: {provider}, model: {getattr(streamer, 'model', 'unknown')}")
            return streamer
            
        except Exception as e:
            self.logger.error(f"Failed to create LLM streamer for provider {provider}: {str(e)}")
            raise RuntimeError(f"Failed to create LLM streamer for provider {provider}: {str(e)}")
    
    def get_default_streamer(self) -> LLMStreamer:
        """Get the default LLM streamer based on configuration.
        
        Returns:
            Default LLMStreamer instance
        """
        return self.create_streamer()
    
    def get_supported_providers(self) -> List[str]:
        """Get list of supported LLM providers.
        
        Returns:
            List of supported provider names
        """
        return list(self._providers.keys())
    
    def is_provider_supported(self, provider: str) -> bool:
        """Check if a provider is supported.
        
        Args:
            provider: Provider name to check
            
        Returns:
            True if provider is supported, False otherwise
        """
        return provider.strip().lower() in self._providers


class LLMFactoryManager:
    """Manager for LLM factory instances with lazy initialization."""
    
    _instance: Optional[LLMFactory] = None
    
    @classmethod
    def create_factory(cls) -> LLMFactory:
        """Create or return existing LLM factory instance."""
        if cls._instance is None:
            cls._instance = LLMFactory()
        return cls._instance
    
    @classmethod
    def reset_instance(cls) -> None:
        """Reset the singleton instance (useful for testing)."""
        cls._instance = None


# Factory function for backward compatibility
def get_llm_factory() -> LLMFactory:
    """Get the global LLM factory instance."""
    return LLMFactoryManager.create_factory()
