import os, unittest

from rmct import db
from rmct.ingest import run
from tests.helpers import make_cfg


class IngestTest(unittest.TestCase):
    def setUp(self):
        os.environ["RMCT_TEST_T1_STATUS"] = "IN_PROGRESS"
        self.cfg = make_cfg()

    def counts(self):
        con = db.connect(self.cfg["db_path"])
        try:
            return {t: con.execute("SELECT COUNT(*) FROM %s" % t).fetchone()[0] for t in ("tasks", "task_history", "risks", "findings")}
        finally:
            con.close()

    def test_idempotent(self):
        r1 = run.ingest(self.cfg)
        self.assertTrue(r1["ok"])
        c1 = self.counts()
        run.ingest(self.cfg)
        self.assertEqual(c1, self.counts())
        self.assertEqual(c1["tasks"], 2)

    def test_source_change_appends_history(self):
        run.ingest(self.cfg)
        h = self.counts()["task_history"]
        os.environ["RMCT_TEST_T1_STATUS"] = "IMPLEMENTED"
        run.ingest(self.cfg)
        self.assertEqual(self.counts()["task_history"], h + 1)
        con = db.connect(self.cfg["db_path"])
        self.assertEqual(con.execute("SELECT status FROM tasks WHERE id='T-1'").fetchone()[0], "IMPLEMENTED")
        con.close()


if __name__ == "__main__":
    unittest.main()
