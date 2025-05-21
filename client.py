import grpc
import redesocial_pb2
import redesocial_pb2_grpc
import threading
import time
import sys
from datetime import datetime
import pytz

class SocialMediaClient:
    def __init__(self):
        self.channel = None
        self.stub = None
        self.username = None
        self.notification_thread = None
        self.is_running = True
        self.server_address = None

    def connect_to_available_server(self):
        ports = [50051, 50052, 50053]
        for port in ports:
            try:
                server_address = f"localhost:{port}"
                print(f"Tentando conectar ao servidor em {server_address}...")
                channel = grpc.insecure_channel(server_address)
                stub = redesocial_pb2_grpc.SocialNetworkStub(channel)
                stub.SyncTime(redesocial_pb2.ClockSyncRequest(serverId="client", localTime=int(time.time())))
                self.channel = channel
                self.stub = stub
                self.server_address = server_address
                print(f"Conectado ao servidor em {server_address}")
                return True
            except Exception as e:
                print(f"Não foi possível conectar ao servidor em {server_address}: {e}")
                continue
        return False

    def start_notification_listener(self):
        def listen_for_updates():
            try:
                request = redesocial_pb2.NotificationRequest(user=self.username)
                for notification in self.stub.SubscribeToUpdates(request):
                    print(f"\n[Notification] {notification.user}: {notification.content} ({self.format_timestamp(notification.timestamp)})")
            except Exception as e:
                print(f"Error in notification stream: {e}")
                if self.connect_to_available_server():
                    self.start_notification_listener()

        self.notification_thread = threading.Thread(target=listen_for_updates)
        self.notification_thread.daemon = True
        self.notification_thread.start()

    def create_post(self, content):
        try:
            request = redesocial_pb2.Post(
                user=self.username,
                content=content,
                timestamp=int(time.time())
            )
            response = self.stub.CreatePost(request)
            print(f"Post created: {response.message}")
        except Exception as e:
            print(f"Error creating post: {e}")
            if self.connect_to_available_server():
                self.create_post(content)

    def send_direct_message(self, recipient, message):
        try:
            request = redesocial_pb2.DirectMessage(
                sender=self.username,
                receiver=recipient,
                message=message,
                timestamp=int(time.time())
            )
            response = self.stub.SendDirectMessage(request)
            print(f"Message sent: {response.message}")
        except Exception as e:
            print(f"Error sending message: {e}")
            if self.connect_to_available_server():
                self.send_direct_message(recipient, message)

    def follow_user(self, target_user):
        try:
            request = redesocial_pb2.FollowRequest(
                follower=self.username,
                followee=target_user
            )
            response = self.stub.ConnectUsers(request)
            print(f"Follow request: {response.message}")
        except Exception as e:
            print(f"Error following user: {e}")
            if self.connect_to_available_server():
                self.follow_user(target_user)

    def display_menu(self):
        print("\n=== Social Media Client Menu ===")
        print(f"Conectado ao servidor: {self.server_address}")
        print("1. Post")
        print("2. Private Message")
        print("3. Follow User")
        print("4. Exit")
        return input("Select an option: ")

    def run(self):
        if not self.connect_to_available_server():
            print("Não foi possível conectar a nenhum servidor disponível.")
            return

        self.username = input("Enter your username: ")
        print(f"Welcome, {self.username}!")
        self.start_notification_listener()

        while self.is_running:
            choice = self.display_menu()

            if choice == "1":
                content = input("Enter your post content: ")
                self.create_post(content)
            elif choice == "2":
                recipient = input("Enter recipient username: ")
                message = input("Enter your message: ")
                self.send_direct_message(recipient, message)
            elif choice == "3":
                target = input("Enter username to follow: ")
                self.follow_user(target)
            elif choice == "4":
                self.is_running = False
                print("Goodbye!")
            else:
                print("Invalid option. Please try again.")

    def format_timestamp(self, ts):
        tz = pytz.timezone("America/Sao_Paulo")
        return datetime.fromtimestamp(ts, tz).strftime("%d/%m/%Y %H:%M:%S %Z")

if __name__ == "__main__":
    client = SocialMediaClient()
    client.run()
