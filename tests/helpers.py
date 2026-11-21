import os, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def make_cfg():
    d = tempfile.mkdtemp(prefix="rmct-test-")
    return {"db_path": os.path.join(d, "t.sqlite"), "adapter_path": os.path.join(HERE, "fake_adapter.py"),
            "backup_dir": d, "cookie_secure": False, "session_days": 1, "web_dir": os.path.join(d, "web"),
            "sources": {"runner_logs": os.path.join(d, "none", "*_nohup.log"), "test_xml": [], "git_repos": [],
                        "claude_dirs": os.path.join(d, "none-claude-*"), "disk_path": d}}
