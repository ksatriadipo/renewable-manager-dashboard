"""Minimal adapter used by the tests (synthetic data only)."""
import os

# loaded by file path in a separate module instance, so tests steer it through the environment
STATUS = {"T-1": os.environ.get("RMCT_TEST_T1_STATUS", "IN_PROGRESS")}


def tasks():
    return [
        {"id": "T-1", "title": "Synthetic task one", "batch": "B2", "workstream": "ws", "kind": "patch", "priority": "P1",
         "status": os.environ.get("RMCT_TEST_T1_STATUS", "IN_PROGRESS"), "owner": "agent", "milestone": "M1", "src": "fake", "history": [("2026-01-01", "READY", "doc")]},
        {"id": "T-2", "title": "Synthetic task two", "batch": "B2", "workstream": "ws", "kind": "doc", "priority": "P2",
         "status": "BLOCKED", "owner": "agent", "milestone": "M1", "blocker": "waiting", "src": "fake"},
    ]


def apply_halt(L):
    return L


def findings():
    return [{"id": "F-1", "severity": "P1", "summary": "synthetic", "status": "OPEN", "src": "fake"}], {}


def decisions():
    return [{"id": "D-1", "topic": "t", "text": "x", "status": "DECIDED", "src": "fake"}]


def milestones():
    return [{"id": "M1", "name": "Milestone 1", "scope": "s", "members": {"milestone": ["M1"]}}]
