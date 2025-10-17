from __future__ import annotations
from typing import Dict, Iterable, List
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

class TogetherStreamer:
    def __init__(self, model: str | None = None) -> None:
        api_key = os.getenv("TOGETHER_API_KEY")
        if not api_key:
            raise RuntimeError("TOGETHER_API_KEY is not set")
        
        # Together AI uses OpenAI-compatible API with custom base URL
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.together.xyz/v1"
        )
        self.model = model or os.getenv("TOGETHER_MODEL", "openai/gpt-oss-20b")

    def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> Iterable[str]:
        """
        Stream chat completion from Together AI.
        Together AI uses OpenAI-compatible API, so this is very similar to OpenAIStreamer.
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True,
            **kwargs,
        )
        for chunk in response:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield delta.content
