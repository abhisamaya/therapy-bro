from __future__ import annotations
from typing import Dict, Iterable, List
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

class OpenAIStreamer:
    def __init__(self, model: str | None = None) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        self.client = OpenAI(api_key=api_key)
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> Iterable[str]:
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
