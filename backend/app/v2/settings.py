"""Validated runtime configuration for the v2 production control plane."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class V2Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    environment: Literal["development", "test", "staging", "production"] = Field(
        default="development", validation_alias="PSYCHS_ENVIRONMENT"
    )
    v2_enabled: bool = Field(default=False, validation_alias="PSYCHS_V2_ENABLED")
    database_url: str = Field(default="", validation_alias="DATABASE_URL")
    redis_url: str = Field(default="", validation_alias="REDIS_URL")
    cors_allowed_origins_raw: str = Field(default="", validation_alias="PSYCHS_CORS_ALLOWED_ORIGINS")
    oidc_issuer: str = Field(default="", validation_alias="PSYCHS_OIDC_ISSUER")
    oidc_audience: str = Field(default="", validation_alias="PSYCHS_OIDC_AUDIENCE")
    oidc_jwks_url: str = Field(default="", validation_alias="PSYCHS_OIDC_JWKS_URL")
    oidc_algorithms_raw: str = Field(default="RS256", validation_alias="PSYCHS_OIDC_ALGORITHMS")
    oidc_require_jti: bool = Field(default=False, validation_alias="PSYCHS_OIDC_REQUIRE_JTI")
    oidc_max_token_lifetime_seconds: int = Field(
        default=900, ge=60, le=3600, validation_alias="PSYCHS_OIDC_MAX_TOKEN_LIFETIME_SECONDS"
    )
    oidc_step_up_max_age_seconds: int = Field(
        default=900, ge=60, le=3600, validation_alias="PSYCHS_OIDC_STEP_UP_MAX_AGE_SECONDS"
    )
    oidc_step_up_acr_values_raw: str = Field(default="", validation_alias="PSYCHS_OIDC_STEP_UP_ACR_VALUES")
    oidc_step_up_amr_values_raw: str = Field(
        default="mfa,otp,hwk", validation_alias="PSYCHS_OIDC_STEP_UP_AMR_VALUES"
    )
    database_pool_size: int = Field(default=10, ge=1, le=100, validation_alias="DATABASE_POOL_SIZE")
    database_pool_overflow: int = Field(default=10, ge=0, le=100, validation_alias="DATABASE_POOL_OVERFLOW")
    otel_enabled: bool = Field(default=False, validation_alias="OTEL_ENABLED")
    otel_exporter_otlp_endpoint: str = Field(default="", validation_alias="OTEL_EXPORTER_OTLP_ENDPOINT")
    otel_exporter_otlp_metrics_endpoint: str = Field(
        default="", validation_alias="OTEL_EXPORTER_OTLP_METRICS_ENDPOINT"
    )
    otel_service_name: str = Field(
        default="psychs-api", min_length=1, max_length=128, validation_alias="OTEL_SERVICE_NAME"
    )
    otel_trace_sample_ratio: float = Field(default=0.1, ge=0.0, le=1.0, validation_alias="OTEL_TRACE_SAMPLE_RATIO")

    @property
    def cors_allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins_raw.split(",") if origin.strip()]

    @property
    def oidc_algorithms(self) -> list[str]:
        return [algorithm.strip() for algorithm in self.oidc_algorithms_raw.split(",") if algorithm.strip()]

    @property
    def oidc_step_up_acr_values(self) -> frozenset[str]:
        return frozenset(value.strip() for value in self.oidc_step_up_acr_values_raw.split(",") if value.strip())

    @property
    def oidc_step_up_amr_values(self) -> frozenset[str]:
        return frozenset(value.strip().lower() for value in self.oidc_step_up_amr_values_raw.split(",") if value.strip())

    @property
    def metrics_endpoint(self) -> str:
        if self.otel_exporter_otlp_metrics_endpoint:
            return self.otel_exporter_otlp_metrics_endpoint
        endpoint = self.otel_exporter_otlp_endpoint.rstrip("/")
        if endpoint.endswith("/v1/traces"):
            return f"{endpoint.removesuffix('/v1/traces')}/v1/metrics"
        return f"{endpoint}/v1/metrics"

    @property
    def async_database_url(self) -> str:
        if self.database_url.startswith("postgresql+psycopg://"):
            return self.database_url
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url

    @model_validator(mode="after")
    def validate_secure_runtime(self):
        permitted_algorithms = {"RS256", "RS384", "RS512", "ES256", "ES384", "ES512"}
        if not self.oidc_algorithms or not set(self.oidc_algorithms).issubset(permitted_algorithms):
            raise ValueError("Only approved asymmetric OIDC signing algorithms are permitted")
        if any("*" in origin for origin in self.cors_allowed_origins):
            raise ValueError("Wildcard CORS origins are not permitted")
        if self.otel_enabled:
            if not self.otel_exporter_otlp_endpoint:
                raise ValueError("OTEL_EXPORTER_OTLP_ENDPOINT is required when OTEL_ENABLED is true")
            if self.environment in {"staging", "production"} and not self.otel_exporter_otlp_endpoint.startswith("https://"):
                raise ValueError("Production OTLP export must use HTTPS")
            if self.environment in {"staging", "production"} and not self.metrics_endpoint.startswith("https://"):
                raise ValueError("Production OTLP metrics export must use HTTPS")

        if self.environment in {"staging", "production"}:
            required = {
                "PSYCHS_V2_ENABLED": self.v2_enabled,
                "DATABASE_URL": self.database_url,
                "REDIS_URL": self.redis_url,
                "PSYCHS_CORS_ALLOWED_ORIGINS": self.cors_allowed_origins_raw,
                "PSYCHS_OIDC_ISSUER": self.oidc_issuer,
                "PSYCHS_OIDC_AUDIENCE": self.oidc_audience,
                "PSYCHS_OIDC_JWKS_URL": self.oidc_jwks_url,
            }
            missing = [name for name, value in required.items() if not value]
            if missing:
                raise ValueError(f"Missing required secure runtime settings: {', '.join(missing)}")
            if not self.database_url.startswith(("postgresql://", "postgresql+psycopg://")):
                raise ValueError("Production DATABASE_URL must use PostgreSQL")
            if not self.oidc_issuer.startswith("https://") or not self.oidc_jwks_url.startswith("https://"):
                raise ValueError("Production OIDC issuer and JWKS URL must use HTTPS")
            if not self.oidc_require_jti:
                raise ValueError("PSYCHS_OIDC_REQUIRE_JTI must be true in staging and production")
            if not self.oidc_step_up_acr_values and not self.oidc_step_up_amr_values:
                raise ValueError("At least one OIDC step-up ACR or AMR value is required")
        return self


@lru_cache(maxsize=1)
def get_v2_settings() -> V2Settings:
    return V2Settings()
