import os, http.client, json, threading, unittest

from rmct import auth, db, server
from rmct.ingest import run
from tests.helpers import make_cfg


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["RMCT_TEST_T1_STATUS"] = "IN_PROGRESS"
        cls.cfg = make_cfg()
        run.ingest(cls.cfg)
        cls.srv = server.make_server(cls.cfg, "127.0.0.1", 0)
        cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        con = db.connect(cls.cfg["db_path"])
        cls.setup_tok, _ = auth.create_setup_token(con)
        con.close()
        cls.cookie = None

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()

    def req(self, method, path, body=None, cookie=True, csrf=True):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=30)
        h = {"Content-Type": "application/json"}
        if csrf:
            h["X-RMCT"] = "1"
        if cookie and type(self).cookie:
            h["Cookie"] = type(self).cookie
        c.request(method, path, json.dumps(body) if body is not None else None, h)
        r = c.getresponse()
        data = r.read()
        sc = r.getheader("Set-Cookie")
        c.close()
        try:
            data = json.loads(data)
        except Exception:
            pass
        return r.status, data, sc

    def login(self):
        if type(self).cookie:
            return
        st, _, _ = self.req("POST", "/api/setup", {"token": self.setup_tok, "username": "owner", "password": "a-long-password"}, cookie=False)
        self.assertEqual(st, 200)
        st, _, sc = self.req("POST", "/api/login", {"username": "owner", "password": "a-long-password"}, cookie=False)
        self.assertEqual(st, 200)
        self.assertIn("HttpOnly", sc)
        self.assertIn("SameSite=Strict", sc)
        type(self).cookie = sc.split(";")[0]

    def test_01_unauthenticated_401(self):
        self.assertEqual(self.req("GET", "/healthz", cookie=False)[0], 200)
        for m, p in (("GET", "/api/me"), ("GET", "/api/dashboard"), ("POST", "/api/tasks"), ("PATCH", "/api/tasks/T-1"),
                     ("GET", "/api/tasks/T-1/history"), ("POST", "/api/ingest"), ("POST", "/api/logout")):
            self.assertEqual(self.req(m, p, {} if m != "GET" else None, cookie=False)[0], 401, p)

    def test_02_csrf_header_required(self):
        self.login()
        self.assertEqual(self.req("PATCH", "/api/tasks/T-1", {"owner": "x"}, csrf=False)[0], 403)
        self.assertEqual(self.req("POST", "/api/login", {"username": "owner", "password": "a-long-password"}, cookie=False, csrf=False)[0], 403)

    def test_03_setup_token_reuse_rejected(self):
        self.login()
        st, _, _ = self.req("POST", "/api/setup", {"token": self.setup_tok, "username": "evil", "password": "a-long-password"}, cookie=False)
        self.assertEqual(st, 403)

    def test_04_me_and_dashboard(self):
        self.login()
        st, d, _ = self.req("GET", "/api/me")
        self.assertEqual((st, d["username"]), (200, "owner"))
        st, d, _ = self.req("GET", "/api/dashboard")
        self.assertEqual(st, 200)
        self.assertIn("tasks", d)

    def test_05_crud_history_and_manual_survives_ingest(self):
        self.login()
        st, t, _ = self.req("POST", "/api/tasks", {"title": "Manual task", "priority": "P2", "planned_finish": "2026-12-01"})
        self.assertEqual(st, 201)
        self.assertEqual(t["status"], "NOT_STARTED")
        mid = t["id"]
        self.assertEqual(self.req("POST", "/api/tasks", {"title": ""})[0], 400)
        self.assertEqual(self.req("PATCH", "/api/tasks/T-1", {"status": "BOGUS"})[0], 400)
        self.assertEqual(self.req("PATCH", "/api/tasks/T-1", {"planned_start": "21-11-2026"})[0], 400)
        st, t1, _ = self.req("PATCH", "/api/tasks/T-1", {"owner": "alice", "notes": "checked", "est_p50_d": "1.5"})
        self.assertEqual(st, 200)
        self.assertEqual(sorted(t1["changed"]), ["est_p50_d", "note", "owner"])
        self.assertIn("owner", t1["locked_fields"])
        self.assertEqual(self.req("PATCH", "/api/tasks/T-1", {"owner": "bob", "updated_at": "1999-01-01"})[0], 409)
        st, d, _ = self.req("GET", "/api/dashboard")
        self.assertEqual([x for x in d["tasks"] if x["id"] == "T-1"][0]["owner"], "alice")
        # re-ingest with a changed source owner + status: manual owner survives, status follows source
        os.environ["RMCT_TEST_T1_STATUS"] = "IMPLEMENTED"
        st, res, _ = self.req("POST", "/api/ingest")
        self.assertEqual(st, 200)
        self.assertGreaterEqual(res["issues"], 1)
        st, d, _ = self.req("GET", "/api/dashboard")
        t1 = [x for x in d["tasks"] if x["id"] == "T-1"][0]
        self.assertEqual((t1["owner"], t1["note"], t1["status"]), ("alice", "checked", "IMPLEMENTED"))
        self.assertTrue(any(x["id"] == mid for x in d["tasks"]))
        st, h, _ = self.req("GET", "/api/tasks/T-1/history")
        self.assertEqual(st, 200)
        fields = [(x["field"], x["actor"]) for x in h["history"]]
        self.assertIn(("owner", "owner"), fields)
        self.assertIn(("status", "ingest"), fields)
        n = len(h["history"])
        self.req("PATCH", "/api/tasks/T-1", {"owner": "carol"})
        self.assertEqual(len(self.req("GET", "/api/tasks/T-1/history")[1]["history"]), n + 1)
        self.assertEqual(self.req("GET", "/api/tasks/NOPE/history")[0], 404)
        con = db.connect(self.cfg["db_path"])
        acts = [r[0] for r in con.execute("SELECT action FROM audit_log")]
        con.close()
        self.assertIn("task_update", acts)
        self.assertIn("task_create", acts)

    def test_06_static_traversal_blocked(self):
        st, _, _ = self.req("GET", "/../../etc/passwd", cookie=False)
        self.assertIn(st, (200, 404))  # SPA fallback page or 404, never the file
        st, d, _ = self.req("GET", "/%2e%2e/%2e%2e/etc/passwd", cookie=False)
        self.assertNotIn("root:", str(d))

    def test_99_logout(self):
        self.login()
        self.assertEqual(self.req("POST", "/api/logout")[0], 200)
        self.assertEqual(self.req("GET", "/api/me")[0], 401)
        type(self).cookie = None


if __name__ == "__main__":
    unittest.main()
