import grpc
from concurrent import futures
import time
import threading
import redesocial_pb2
import redesocial_pb2_grpc
import logging
import sys
import queue

class SocialMediaService(redesocial_pb2_grpc.SocialNetworkServicer):
    def __init__(self, instance_id, peer_instances):
        self.instance_id = instance_id
        self.peer_instances = peer_instances
        self.feed_entries = []
        self.direct_messages = []
        self.user_connections = {}
        self.active_users = {}
        self._time_offset = 0
        self.thread_lock = threading.Lock()
        self.log_file = f"server_log_{instance_id}.txt"
        logging.basicConfig(filename=self.log_file, level=logging.INFO)

    def log_event(self, message):
        print(f"[{self.instance_id}] {message}")
        logging.info(message)

    def get_current_time(self):
        return int(time.time()) + self._time_offset

    def adjust_time(self, delta):
        self._time_offset += delta

    def CreatePost(self, request, context):
        self.feed_entries.append(request)
        self.log_event(f"New post from {request.user}: {request.content} | {request.timestamp}")

        with self.thread_lock:
            for follower, following in self.user_connections.items():
                if request.user in following and follower in self.active_users:
                    try:
                        notification = redesocial_pb2.Notification(
                            user=request.user,
                            content=request.content,
                            timestamp=request.timestamp
                        )
                        self.active_users[follower].put(notification)
                        self.log_event(f"Notification sent to {follower}: {request.content}")
                    except Exception as e:
                        self.log_event(f"Failed to notify {follower}: {e}")

        self.replicate_to_peers("post", request)

        return redesocial_pb2.Ack(success=True, message="Post successfully replicated")

    def SendDirectMessage(self, request, context):
        self.direct_messages.append(request)
        self.log_event(f"Direct message from {request.sender} to {request.receiver}: {request.message} | {request.timestamp}")

        with self.thread_lock:
            if request.receiver in self.active_users:
                try:
                    notification = redesocial_pb2.Notification(
                        user=request.sender,
                        content=request.message,
                        timestamp=request.timestamp
                    )
                    self.active_users[request.receiver].put(notification)
                    self.log_event(f"Notification sent to {request.receiver}: {request.message}")
                except Exception as e:
                    self.log_event(f"Failed to notify {request.receiver}: {e}")

        self.replicate_to_peers("message", request)

        return redesocial_pb2.Ack(success=True, message="Message successfully replicated")

    def ReplicatePost(self, request, context):
        self.feed_entries.append(request)
        self.log_event(f"Replicated post: {request.user} - {request.content} | {request.timestamp}")
        return redesocial_pb2.Ack(success=True, message="Post received via replication")

    def ReplicateDirectMessage(self, request, context):
        self.direct_messages.append(request)
        self.log_event(f"Replicated message from {request.sender} to {request.receiver}: {request.message} | {request.timestamp}")
        return redesocial_pb2.Ack(success=True, message="Message received via replication")

    def ReplicateFollow(self, request, context):
        if request.follower not in self.user_connections:
            self.user_connections[request.follower] = []
        if request.followee not in self.user_connections[request.follower]:
            self.user_connections[request.follower].append(request.followee)
        self.log_event(f"Replicated follow: {request.follower} -> {request.followee}")
        return redesocial_pb2.Ack(success=True, message="Follow replicated")

    def ConnectUsers(self, request, context):
        if request.follower not in self.user_connections:
            self.user_connections[request.follower] = []
        if request.followee not in self.user_connections[request.follower]:
            self.user_connections[request.follower].append(request.followee)
        self.log_event(f"{request.follower} is now following {request.followee}")

        self.replicate_to_peers("follow", request)

        return redesocial_pb2.Ack(success=True, message=f"{request.follower} is now following {request.followee}")

    def SubscribeToUpdates(self, request, context):
        user = request.user
        self.log_event(f"User connected for updates: {user}")

        notification_queue = queue.Queue()

        with self.thread_lock:
            self.active_users[user] = notification_queue

        try:
            while True:
                try:
                    notification = notification_queue.get(timeout=1)
                    yield notification
                except queue.Empty:
                    if context.is_active():
                        continue
                    else:
                        break
        finally:
            with self.thread_lock:
                if user in self.active_users:
                    del self.active_users[user]
            self.log_event(f"User disconnected from updates: {user}")

    def SyncTime(self, request, context):
        self.log_event(f"Time sync received from {request.serverId} | Received time: {request.localTime}")
        return redesocial_pb2.ClockSyncResponse(adjustedTime=self.get_current_time())

    def synchronize_time(self):
        self.log_event("Starting time synchronization (Berkeley)")
        times = [("self", self.get_current_time())]

        for host, port in self.peer_instances:
            try:
                channel = grpc.insecure_channel(f"{host}:{port}")
                client = redesocial_pb2_grpc.SocialNetworkStub(channel)
                response = client.SyncTime(redesocial_pb2.ClockSyncRequest(
                    serverId=self.instance_id,
                    localTime=times[0][1]
                ))
                times.append((f"{host}:{port}", response.adjustedTime))
            except Exception as e:
                self.log_event(f"Error querying {host}:{port} - {e}")

        average = sum(t for _, t in times) // len(times)
        self.log_event(f"Average time: {average}")

        for source, time_value in times:
            delta = average - time_value
            if source == "self":
                self.adjust_time(delta)
                self.log_event(f"Local adjustment applied: {delta}")
            else:
                host, port = source.split(":")
                try:
                    channel = grpc.insecure_channel(f"{host}:{port}")
                    client = redesocial_pb2_grpc.SocialNetworkStub(channel)
                    client.SyncTime(redesocial_pb2.ClockSyncRequest(
                        serverId=self.instance_id,
                        localTime=average
                    ))
                    self.log_event(f"Adjustment sent to {source}: {delta}")
                except Exception as e:
                    self.log_event(f"Failed to send adjustment to {source} - {e}")

    def replicate_to_peers(self, data_type, data):
        for host, port in self.peer_instances:
            try:
                channel = grpc.insecure_channel(f"{host}:{port}")
                client = redesocial_pb2_grpc.SocialNetworkStub(channel)

                if data_type == "post":
                    client.ReplicatePost(data)
                elif data_type == "message":
                    client.ReplicateDirectMessage(data)
                elif data_type == "follow":
                    client.ReplicateFollow(data)
            except Exception as e:
                self.log_event(f"Error replicating to {host}:{port} - {e}")


def start_server(port, server_id, peer_instances):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    service = SocialMediaService(server_id, peer_instances)
    redesocial_pb2_grpc.add_SocialNetworkServicer_to_server(service, server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    print(f"Server {server_id} started on port {port}")

    if server_id == "50051":
        threading.Thread(target=lambda: sync_loop(service), daemon=True).start()

    server.wait_for_termination()

def sync_loop(service):
    while True:
        time.sleep(60)
        service.synchronize_time()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python servidor.py <port>")
        sys.exit(1)

    port = sys.argv[1]

    SERVER_CONFIG = {
        "50051": [("127.0.0.1", "50052"), ("127.0.0.1", "50053")],
        "50052": [("127.0.0.1", "50051"), ("127.0.0.1", "50053")],
        "50053": [("127.0.0.1", "50051"), ("127.0.0.1", "50052")],
    }

    peers = SERVER_CONFIG.get(port, [])
    start_server(port, server_id=port, peer_instances=peers)
