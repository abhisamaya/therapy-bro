from __future__ import annotations
from typing import Dict, Iterable, List
import os
import logging
from dotenv import load_dotenv
from anthropic import Anthropic

# Create logger for Anthropic client
llm_logger = logging.getLogger('llm.anthropic')

load_dotenv()


class AnthropicStreamer:
    def __init__(self, model: str | None = None) -> None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            llm_logger.error("ANTHROPIC_API_KEY is not set")
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        
        self.client = Anthropic(api_key=api_key)
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929")
        llm_logger.info(f"Anthropic client initialized with model: {self.model}")

    def _convert_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        llm_logger.debug(f"Converting {len(messages)} messages for Anthropic format")
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
        llm_logger.debug(f"Converted to {len(converted)} messages")
        return converted

    def stream_chat(self, messages: List[Dict[str, str]], **kwargs) -> Iterable[str]:
        llm_logger.info(f"Starting Anthropic chat stream with {len(messages)} messages")
        
        system_prompt = None
        if messages and messages[0].get("role") == "system":
            system_prompt = messages[0].get("content")
            msg_body = self._convert_messages(messages[1:])
            llm_logger.debug("Using system prompt from first message")
        else:
            msg_body = self._convert_messages(messages)
            llm_logger.debug("No system prompt detected")

        try:
            with self.client.messages.stream(
                model=self.model,
                max_tokens=int(os.getenv("ANTHROPIC_MAX_TOKENS", "1024")),
                system=system_prompt,
                messages=msg_body,
                temperature=float(os.getenv("ANTHROPIC_TEMPERATURE", "0.5")),
                **kwargs,
            ) as stream:
                token_count = 0
                for event in stream:
                    if event.type == "content_block_delta":
                        delta = event.delta
                        if delta and getattr(delta, "text", None):
                            token_count += 1
                            yield delta.text
                
                llm_logger.info(f"Anthropic stream completed successfully, yielded {token_count} tokens")
                
                # ensure stream is consumed; final message can be accessed if needed
                _ = stream.get_final_message()
                
        except Exception as e:
            llm_logger.error(f"Anthropic streaming failed: {str(e)}")
            raise


