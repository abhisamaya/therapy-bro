from __future__ import annotations
from typing import Dict, Iterable, List
import os
import logging
from dotenv import load_dotenv
from openai import OpenAI

# Create logger for OpenAI client
llm_logger = logging.getLogger('llm.openai')

load_dotenv()

class OpenAIStreamer:
    def __init__(self, model: str | None = None) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            llm_logger.error("OPENAI_API_KEY is not set")
            raise RuntimeError("OPENAI_API_KEY is not set")
        
        self.client = OpenAI(api_key=api_key)
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-5-nano")
        llm_logger.info(f"OpenAI client initialized with model: {self.model}")

    def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> Iterable[str]:
        llm_logger.info(f"Starting OpenAI chat stream with {len(messages)} messages")
        
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
            
            llm_logger.info(f"OpenAI stream completed successfully, yielded {token_count} tokens")
            
        except Exception as e:
            llm_logger.error(f"OpenAI streaming failed: {str(e)}")
            raise
