"""
Psychs GEO Platform v2.0.0-PROD: Global Configuration & Secrets Manager
Supports Next-Gen Frontier Models: Gemini 3.7 Flash, GPT-6 Astra, Claude Fable 5.1, GLM-4 Plus, Grok-3, DeepSeek R1, Perplexity Sonar.
"""

import os
from typing import Dict, Any, Optional
from .compat import BaseModel, Field

class ApiKeySettings(BaseModel):
    openai_api_key: str = ""
    openai_model: str = "gpt-6-astra"  # 'gpt-6-astra' | 'o3-mini' | 'gpt-4.5-preview' | 'chatgpt-4o-latest'
    perplexity_api_key: str = ""
    perplexity_model: str = "sonar-reasoning-pro"  # 'sonar-reasoning-pro' | 'sonar-pro'
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.7-flash"  # 'gemini-3.7-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash'
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-fable-5.1"  # 'claude-fable-5.1' | 'claude-3-7-sonnet-20250219'
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-reasoner"  # 'deepseek-reasoner' (R1) | 'deepseek-chat' (V3)
    glm_api_key: str = ""
    glm_model: str = "glm-4-plus"  # 'glm-4-plus' | 'glm-4-air' | 'glm-4v'
    grok_api_key: str = ""
    grok_model: str = "grok-3"  # 'grok-3' | 'grok-2'
    proxy_url: str = ""
    execution_mode: str = "HYBRID_SANDBOX"  # 'LIVE' | 'HYBRID_SANDBOX'
    proxy_enabled: bool = True
    active_proxy_provider: str = "BrightData Residential Pool (US-East / EU-Central)"
    total_proxies_online: int = 4250

class ConfigManager:
    _instance: Optional['ConfigManager'] = None
    _settings: ApiKeySettings

    def __init__(self):
        self._settings = ApiKeySettings(
            openai_api_key=os.environ.get("OPENAI_API_KEY", ""),
            openai_model=os.environ.get("OPENAI_MODEL", "gpt-6-astra"),
            perplexity_api_key=os.environ.get("PERPLEXITY_API_KEY", ""),
            perplexity_model=os.environ.get("PERPLEXITY_MODEL", "sonar-reasoning-pro"),
            gemini_api_key=os.environ.get("GEMINI_API_KEY", ""),
            gemini_model=os.environ.get("GEMINI_MODEL", "gemini-3.7-flash"),
            anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY", ""),
            anthropic_model=os.environ.get("ANTHROPIC_MODEL", "claude-fable-5.1"),
            deepseek_api_key=os.environ.get("DEEPSEEK_API_KEY", ""),
            deepseek_model=os.environ.get("DEEPSEEK_MODEL", "deepseek-reasoner"),
            glm_api_key=os.environ.get("GLM_API_KEY", ""),
            glm_model=os.environ.get("GLM_MODEL", "glm-4-plus"),
            grok_api_key=os.environ.get("GROK_API_KEY", ""),
            grok_model=os.environ.get("GROK_MODEL", "grok-3"),
            proxy_url=os.environ.get("PROXY_ROTATING_URL", "http://res_user_7894:pass_x882@us-east.brightdata.io:22225"),
            execution_mode=os.environ.get("PSYCHS_EXECUTION_MODE", "HYBRID_SANDBOX"),
            proxy_enabled=True,
            active_proxy_provider="BrightData Residential Pool (US-East / EU-Central)",
            total_proxies_online=4250
        )

    @classmethod
    def get_instance(cls) -> 'ConfigManager':
        if cls._instance is None:
            cls._instance = ConfigManager()
        return cls._instance

    def get_settings(self) -> ApiKeySettings:
        return self._settings

    def update_settings(self, updates: Dict[str, Any]) -> ApiKeySettings:
        current = self._settings.model_dump()
        for k, v in updates.items():
            if k in current and v is not None:
                if isinstance(v, str) and "..." in v and len(v) < 15:
                    continue
                current[k] = v
        self._settings = ApiKeySettings(**current)
        return self._settings

    def get_masked_settings(self) -> Dict[str, Any]:
        data = self._settings.model_dump()
        for key in ["openai_api_key", "perplexity_api_key", "gemini_api_key", "anthropic_api_key", "deepseek_api_key", "glm_api_key", "grok_api_key"]:
            val = data.get(key, "")
            if val and len(val) > 8:
                data[key] = f"{val[:4]}...{val[-4:]}"
            elif val:
                data[key] = "****"
            else:
                data[key] = ""
        
        # Mask proxy password if present
        if "@" in data["proxy_url"]:
            parts = data["proxy_url"].split("@")
            data["proxy_url_masked"] = f"http://***:***@{parts[1]}"
        else:
            data["proxy_url_masked"] = data["proxy_url"]
        return data
