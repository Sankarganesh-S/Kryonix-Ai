import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server.models.base import Base
from server.models.chat import Chat
from server.models.user import User
from server.services import chat_service
from server.services.file_service import MAX_FILE_SIZE, process_file
from server.services.otp_service import _store, generate_and_send_otp, verify_otp


class CoreServiceTests(unittest.TestCase):
    def setUp(self):
        _store.clear()
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()
        self.user = User(email="owner@example.com", username="owner", hashed_password="x")
        self.other = User(email="other@example.com", username="other", hashed_password="x")
        self.db.add_all([self.user, self.other])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        _store.clear()

    @patch("server.services.otp_service._send")
    def test_otp_is_single_use_and_purpose_bound(self, _send):
        generate_and_send_otp("owner@example.com", "owner", "reset")
        otp = _store["owner@example.com"]["otp"]

        self.assertFalse(verify_otp("owner@example.com", otp, "login")[0])
        self.assertTrue(verify_otp("owner@example.com", otp, "reset")[0])
        self.assertFalse(verify_otp("owner@example.com", otp, "reset")[0])

    def test_chat_cannot_be_written_by_another_user(self):
        chat = Chat(title="Private", user_id=self.other.id)
        self.db.add(chat)
        self.db.commit()

        with self.assertRaisesRegex(ValueError, "Chat not found"):
            chat_service.chat_sync(
                self.db,
                message="hello",
                history=[],
                model=None,
                chat_id=chat.id,
                user_id=self.user.id,
            )

    @patch("server.services.chat_service.get_ai_response", return_value="hello")
    def test_chat_is_saved_for_its_owner(self, _ai):
        result = chat_service.chat_sync(
            self.db,
            message="hello",
            history=[],
            model=None,
            chat_id=None,
            user_id=self.user.id,
        )
        chat = self.db.get(Chat, result["chat_id"])
        self.assertEqual(chat.user_id, self.user.id)
        self.assertEqual(len(chat.messages), 2)

    def test_file_size_limit_and_text_processing(self):
        too_large = process_file("large.txt", "text/plain", b"x" * (MAX_FILE_SIZE + 1))
        self.assertEqual(too_large["type"], "error")
        text = process_file("notes.txt", "text/plain", b"hello")
        self.assertEqual(text["content"], "hello")


if __name__ == "__main__":
    unittest.main()
