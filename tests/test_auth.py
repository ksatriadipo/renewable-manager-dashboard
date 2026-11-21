import unittest

from rmct import auth, db
from tests.helpers import make_cfg


class AuthTest(unittest.TestCase):
    def setUp(self):
        self.con = db.connect(make_cfg()["db_path"])
        db.migrate(self.con)

    def test_password_hash_roundtrip(self):
        h = auth.hash_password("correct horse battery")
        self.assertTrue(auth.verify_password("correct horse battery", h))
        self.assertFalse(auth.verify_password("wrong", h))
        self.assertNotIn("correct", h)

    def test_setup_token_single_use(self):
        tok, _ = auth.create_setup_token(self.con)
        self.assertTrue(auth.setup_token_valid(self.con, tok))
        self.assertTrue(auth.use_setup_token(self.con, tok))
        self.assertFalse(auth.use_setup_token(self.con, tok))
        stored = [r[0] for r in self.con.execute("SELECT token_hash FROM setup_tokens")]
        self.assertNotIn(tok, stored)

    def test_login_session_logout(self):
        auth.set_password(self.con, "owner", "a-long-password")
        self.assertIsNone(auth.login(self.con, "owner", "nope-nope-nope", "ua", 1))
        tok = auth.login(self.con, "owner", "a-long-password", "ua", 1)
        self.assertEqual(auth.session_user(self.con, tok), "owner")
        auth.logout(self.con, tok)
        self.assertIsNone(auth.session_user(self.con, tok))

    def test_short_password_rejected(self):
        with self.assertRaises(ValueError):
            auth.set_password(self.con, "owner", "short")

    def test_rate_limit(self):
        key = "test-key-rl"
        for _ in range(8):
            self.assertTrue(auth.rate_ok(key))
            auth.rate_hit(key)
        self.assertFalse(auth.rate_ok(key))


if __name__ == "__main__":
    unittest.main()
