from __future__ import annotations
from typing import Dict, Iterable, List
import os
import logging
from dotenv import load_dotenv
from openai import OpenAI

# Create logger for Together client
llm_logger = logging.getLogger('llm.together')

load_dotenv()

class TogetherStreamer:
    def __init__(self, model: str | None = None) -> None:
        api_key = os.getenv("TOGETHER_API_KEY")
        if not api_key:
            llm_logger.error("TOGETHER_API_KEY is not set")
            raise RuntimeError("TOGETHER_API_KEY is not set")
        
        # Together AI uses OpenAI-compatible API with custom base URL
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.together.xyz/v1"
        )
        self.model = model or os.getenv("TOGETHER_MODEL", "openai/gpt-oss-20b")
        llm_logger.info(f"Together AI client initialized with model: {self.model}")

    def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> Iterable[str]:
        """
        Stream chat completion from Together AI.
        Together AI uses OpenAI-compatible API, so this is very similar to OpenAIStreamer.
        """
        llm_logger.info(f"Starting Together AI chat stream with {len(messages)} messages")
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                **kwargs,
            )
            
            token_count = 0
            for chunk in response:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    token_count += 1
                    yield delta.content
            
            llm_logger.info(f"Together AI stream completed successfully, yielded {token_count} tokens")
            
        except Exception as e:
            llm_logger.error(f"Together AI streaming failed: {str(e)}")
            raise
