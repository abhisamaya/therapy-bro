from __future__ import annotations
from typing import Dict, Iterable, List
import os
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()


class AnthropicStreamer:
    def __init__(self, model: str | None = None) -> None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        self.client = Anthropic(api_key=api_key)
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929")

    def _convert_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        converted: List[Dict[str, str]] = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                # We'll pass system as system param outside messages
                converted.append({"role": "user", "content": content})
            elif role in ("user", "assistant"):
                converted.append({"role": role, "content": content})
            else:
                converted.append({"role": "user", "content": content})
        return converted

    def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> Iterable[str]:
        system_prompt = None
        if messages and messages[0].get("role") == "system":
            system_prompt = messages[0].get("content")
            msg_body = self._convert_messages(messages[1:])
        else:
            msg_body = self._convert_messages(messages)

        with self.client.messages.stream(
            model=self.model,
            max_tokens=int(os.getenv("ANTHROPIC_MAX_TOKENS", "1024")),
            system=system_prompt,
            messages=msg_body,
            temperature=float(os.getenv("ANTHROPIC_TEMPERATURE", "0.5")),
            **kwargs,
        ) as stream:
            for event in stream:
                if event.type == "content_block_delta":
                    delta = event.delta
                    if delta and getattr(delta, "text", None):
                        yield delta.text
            # ensure stream is consumed; final message can be accessed if needed
            _ = stream.get_final_message()


