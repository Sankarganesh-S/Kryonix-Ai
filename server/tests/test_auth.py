import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", f"sqlite:///{Path(tempfile.gettempdir()) / 'kryonix_test.db'}")

from server.main import app
from server.services.auth_service import create_access_token


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_me_rejects_invalid_sub_claim(client):
    token = create_access_token({"sub": "not-a-number"})

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired token"


def test_login_rejects_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        json={"email": "ghost@example.com", "password": "wrongpassword"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"
