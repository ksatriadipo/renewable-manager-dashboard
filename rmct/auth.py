"""Authentication: PBKDF2-SHA256 passwords, random session tokens stored only as SHA-256 hashes, one-time setup tokens,
login rate limiting. No password or token is ever logged."""
import datetime, hashlib, hmac, os, secrets, threading, time

from . import db

ITER = 310_000
_rl_lock = threading.Lock()
_attempts = {}


def _h(token):
    return hashlib.sha256(token.encode()).hexdigest()


def hash_password(pw):
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, ITER)
    return "pbkdf2_sha256$%d$%s$%s" % (ITER, salt.hex(), dk.hex())


def verify_password(pw, stored):
    try:
        alg, it, salt, dk = stored.split("$")
        calc = hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt), int(it))
        return hmac.compare_digest(calc.hex(), dk)
    except Exception:
        return False


def rate_ok(key, limit=8, window=300):
    now = time.time()
    with _rl_lock:
        xs = [t for t in _attempts.get(key, []) if now - t < window]
        _attempts[key] = xs
        return len(xs) < limit


def rate_hit(key):
    with _rl_lock:
        _attempts.setdefault(key, []).append(time.time())


def create_setup_token(con, hours=24):
    tok = secrets.token_urlsafe(32)
    exp = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=hours)).replace(microsecond=0).isoformat()
    con.execute("INSERT INTO setup_tokens VALUES (?, ?, ?, NULL)", (_h(tok), db.now(), exp))
    return tok, exp


def use_setup_token(con, tok):
    r = con.execute("SELECT expires_at, used_at FROM setup_tokens WHERE token_hash=?", (_h(tok or ""),)).fetchone()
    if not r or r["used_at"] or r["expires_at"] < db.now():
        return False
    con.execute("UPDATE setup_tokens SET used_at=? WHERE token_hash=?", (db.now(), _h(tok)))
    return True


def setup_token_valid(con, tok):
    r = con.execute("SELECT expires_at, used_at FROM setup_tokens WHERE token_hash=?", (_h(tok or ""),)).fetchone()
    return bool(r and not r["used_at"] and r["expires_at"] >= db.now())


def set_password(con, username, pw):
    if len(pw) < 10:
        raise ValueError("password must be at least 10 characters")
    if not (1 <= len(username) <= 40) or not username.replace("_", "").replace(".", "").replace("-", "").isalnum():
        raise ValueError("username: 1–40 letters, digits, . _ -")
    con.execute("INSERT INTO users(username, pw_hash, created_at) VALUES (?, ?, ?) "
                "ON CONFLICT(username) DO UPDATE SET pw_hash=excluded.pw_hash", (username, hash_password(pw), db.now()))


def login(con, username, pw, ua, days):
    r = con.execute("SELECT pw_hash FROM users WHERE username=?", (username,)).fetchone()
    if not r or not verify_password(pw, r["pw_hash"]):
        return None
    tok = secrets.token_urlsafe(32)
    exp = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days)).replace(microsecond=0).isoformat()
    con.execute("INSERT INTO sessions VALUES (?, ?, ?, ?, ?)", (_h(tok), username, db.now(), exp, (ua or "")[:200]))
    con.execute("UPDATE users SET last_login=? WHERE username=?", (db.now(), username))
    return tok


def session_user(con, tok):
    if not tok:
        return None
    r = con.execute("SELECT username, expires_at FROM sessions WHERE token_hash=?", (_h(tok),)).fetchone()
    if not r or r["expires_at"] <= db.now():
        return None
    return r["username"]


def logout(con, tok):
    if tok:
        con.execute("UPDATE sessions SET expires_at=? WHERE token_hash=?", (db.now(), _h(tok)))


def has_users(con):
    return con.execute("SELECT COUNT(*) FROM users").fetchone()[0] > 0
