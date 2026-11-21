"""Configuration: environment variables (secrets/runtime) + a private JSON config (project sources). Both stay off git."""
import json, os

REQUIRED_ENV = ("RMCT_CONFIG",)


class ConfigError(Exception):
    pass


def load(path=None):
    if path:
        os.environ["RMCT_CONFIG"] = path
    missing = [k for k in REQUIRED_ENV if not os.environ.get(k)]
    if missing:
        raise ConfigError("missing environment variables: " + ", ".join(missing))
    path = os.environ["RMCT_CONFIG"]
    if not os.path.exists(path):
        raise ConfigError("RMCT_CONFIG file not found: " + path)
    cfg = json.load(open(path, encoding="utf-8"))
    cfg.setdefault("mode", os.environ.get("RMCT_MODE", "primary"))
    if cfg["mode"] not in ("primary", "replica"):
        raise ConfigError("mode must be primary or replica")
    need = ("db_path", "adapter_path", "sources") if cfg["mode"] == "primary" else ("db_path", "allowed_signers")
    for k in need:
        if k not in cfg:
            raise ConfigError("config key missing: " + k)
    cfg.setdefault("bind", os.environ.get("RMCT_BIND", "127.0.0.1"))
    cfg.setdefault("port", int(os.environ.get("RMCT_PORT", "8790")))
    if "RMCT_COOKIE_SECURE" in os.environ:
        cfg["cookie_secure"] = os.environ["RMCT_COOKIE_SECURE"] == "1"
    cfg.setdefault("cookie_secure", True)
    cfg.setdefault("session_days", int(os.environ.get("RMCT_SESSION_DAYS", "30")))
    cfg.setdefault("public_url", os.environ.get("RMCT_PUBLIC_URL", ""))
    cfg["port"] = int(cfg["port"])
    return cfg
