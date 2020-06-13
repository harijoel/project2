import time
from collections import deque

class Channel:
	def __init__(self, name):
		self.name = name
		self.users = []
		self.messages = deque([], maxlen=100)

	def add_user(self, user):
		self.users.append(user)

	def rem_user(self, user):
		self.users.remove(user)

	def add_message(self, message):
		self.messages.append(message)

	def list_messages(self):
		m = []
		for msg in self.messages:
			m.append({"username": msg.user, "message": msg.message, "timestamp": str(msg.timestamp)})
		return m


class Message:
	def __init__(self, user, message):
		self.user = user
		self.message = message
		self.timestamp = int(time.time())

#may not need a user class, could make finding users in channel harder because it is a pointer and not a string