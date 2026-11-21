"""Primary -> replica sync: signature, replay protection, auth isolation, edit round-trip through the HTTP API."""
import base64, gzip, http.client, json, os, subprocess, tempfile, threading, unittest

from rmct import auth, db, sync
from rmct.ingest import run
from rmct.server import make_server
from tests.helpers import make_cfg


def keypair(d, name):
    k = os.path.join(d, name)
    subprocess.run(["ssh-keygen", "-q", "-t", "ed25519", "-N", "", "-C", name, "-f", k], check=True)
    signers = os.path.join(d, name + ".signers")
    open(signers, "w").write('rmct-vps namespaces="rmct-sync" %s\n' % " ".join(open(k + ".pub").read().split()[:2]))
    return k, signers


class SyncTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = tempfile.mkdtemp(prefix="rmct-sync-")
        cls.key, cls.signers = keypair(cls.d, "vps")
        cls.other, _ = keypair(cls.d, "attacker")
        cls.pcfg = make_cfg()
        run.ingest(cls.pcfg, trigger="test")
        cls.rcfg = dict(make_cfg(), mode="replica", allowed_signers=cls.signers)
        cls.srv = make_server(cls.rcfg, bind="127.0.0.1", port=0)
        cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.pcfg.update(replica_url="http://127.0.0.1:%d" % cls.port, sync_key=cls.key)

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def req(self, method, path, body=None, headers=None, raw=None):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=30)
        h = {"X-RMCT": "1"}
        h.update(headers or {})
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        if data is not None and raw is None:
            h["Content-Type"] = "application/json"
        c.request(method, path, body=data, headers=h)
        r = c.getresponse()
        txt = r.read().decode()
        return r.status, (json.loads(txt) if txt.startswith(("{", "[")) else txt), r.getheader("Set-Cookie")

    def snapshot(self, key):
        con = db.connect(self.pcfg["db_path"])
        con.execute("BEGIN IMMEDIATE")
        snap = sync.export(con, 0)
        con.execute("COMMIT")
        con.close()
        body = gzip.compress(json.dumps(snap, default=str).encode())
        return body, base64.b64encode(sync.sign(body, key)).decode()

    def test_1_unsigned_and_foreign_signature_rejected(self):
        body, _ = self.snapshot(self.key)
        st, b, _ = self.req("POST", "/api/sync", raw=body, headers={"X-RMCT-Signature": ""})
        self.assertEqual(st, 403)
        body2, sig2 = self.snapshot(self.other)
        st, b, _ = self.req("POST", "/api/sync", raw=body2, headers={"X-RMCT-Signature": sig2})
        self.assertEqual(st, 403)
        tampered = bytearray(body2)
        st, b, _ = self.req("POST", "/api/sync", raw=bytes(tampered[:-1]) + b"x", headers={"X-RMCT-Signature": self.snapshot(self.key)[1]})
        self.assertEqual(st, 403)

    def test_2_push_replay_and_login_and_edit_roundtrip(self):
        # owner gets a setup link through the signed channel
        pcon = db.connect(self.pcfg["db_path"])
        tok, exp = auth.create_setup_token(pcon, 1)
        sync.add_setup_token_hash(pcon, auth._h(tok), exp)
        pcon.close()
        res = sync.push(self.pcfg)
        self.assertTrue(res["ok"], res)
        # same snapshot again is refused (replay)
        body, sig = self.snapshot(self.key)
        rcon = db.connect(self.rcfg["db_path"])
        seq = int(rcon.execute("SELECT value FROM sync_state WHERE key='seq'").fetchone()[0])
        rcon.close()
        snap = json.loads(gzip.decompress(body))
        snap["seq"] = seq
        old = gzip.compress(json.dumps(snap).encode())
        st, _, _ = self.req("POST", "/api/sync", raw=old, headers={"X-RMCT-Signature": base64.b64encode(sync.sign(old, self.key)).decode()})
        self.assertEqual(st, 403)
        # data arrived, auth tables untouched except the delivered token hash
        rcon = db.connect(self.rcfg["db_path"])
        pcon = db.connect(self.pcfg["db_path"])
        self.assertEqual(rcon.execute("SELECT COUNT(*) FROM tasks").fetchone()[0], pcon.execute("SELECT COUNT(*) FROM tasks").fetchone()[0])
        self.assertEqual(rcon.execute("SELECT COUNT(*) FROM users").fetchone()[0], 0)
        rcon.close()
        # login on the replica with the delivered token, then edit a task there
        st, b, _ = self.req("POST", "/api/setup", {"token": tok, "username": "owner", "password": "a-long-password-123"})
        self.assertEqual(st, 200, b)
        st, b, ck = self.req("POST", "/api/login", {"username": "owner", "password": "a-long-password-123"})
        self.assertEqual(st, 200)
        cookie = {"Cookie": ck.split(";")[0]}
        tid = pcon.execute("SELECT id FROM tasks ORDER BY id LIMIT 1").fetchone()[0]
        st, b, _ = self.req("PATCH", "/api/tasks/" + tid, {"note": "edited on phone"}, headers=cookie)
        self.assertEqual(st, 200, b)
        st, b, _ = self.req("POST", "/api/tasks", {"title": "New replica task"}, headers=cookie)
        self.assertEqual(st, 201, b)
        new_id = b["id"]
        # next push brings the edits to the primary with history + lock, and the replica keeps them after the snapshot
        res = sync.push(self.pcfg)
        self.assertTrue(res["ok"])
        self.assertEqual(res["edits_received"], 2)
        r = pcon.execute("SELECT note, locked_fields FROM tasks WHERE id=?", (tid,)).fetchone()
        self.assertEqual(r["note"], "edited on phone")
        self.assertIn("note", json.loads(r["locked_fields"]))
        self.assertTrue(pcon.execute("SELECT 1 FROM tasks WHERE id=?", (new_id,)).fetchone())
        hist = pcon.execute("SELECT source FROM task_history WHERE task_id=? AND field='note' ORDER BY seq DESC", (tid,)).fetchone()[0]
        self.assertIn("replica edit", hist)
        # manual edit survives a primary ingestion and stays on the replica after the following sync (acked)
        run.ingest(self.pcfg, trigger="test")
        res = sync.push(self.pcfg)
        self.assertTrue(res["ok"])
        self.assertEqual(res["edits_received"], 0)
        rcon = db.connect(self.rcfg["db_path"])
        self.assertEqual(rcon.execute("SELECT note FROM tasks WHERE id=?", (tid,)).fetchone()[0], "edited on phone")
        self.assertEqual(rcon.execute("SELECT COUNT(*) FROM outbox WHERE acked_at IS NULL").fetchone()[0], 0)
        self.assertEqual(rcon.execute("SELECT COUNT(*) FROM users").fetchone()[0], 1)
        rcon.close()
        pcon.close()

    def test_3_replica_refuses_ingest_and_primary_has_no_sync_endpoint(self):
        st, b, _ = self.req("POST", "/api/ingest", {})
        self.assertIn(st, (401, 409))


if __name__ == "__main__":
    unittest.main()
