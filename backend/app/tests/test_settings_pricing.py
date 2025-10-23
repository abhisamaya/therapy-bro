from decimal import Decimal
import os

from app.config.settings import SettingsFactory


def reset_settings_env():
    # ensure clean singleton for tests
    SettingsFactory.reset_instance()
    # clear env vars we touch
    os.environ.pop("INR_PER_MINUTE", None)


def test_default_inr_per_minute():
    reset_settings_env()
    settings = SettingsFactory.create_settings()
    assert isinstance(settings.inr_per_minute, Decimal)
    assert settings.inr_per_minute == Decimal("4.00")


def test_env_override_inr_per_minute():
    reset_settings_env()
    os.environ["INR_PER_MINUTE"] = "5.50"
    settings = SettingsFactory.create_settings()
    assert settings.inr_per_minute == Decimal("5.50")
    # cleanup
    reset_settings_env()


