from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class RoomGroup(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(User, related_name="room_groups")

    def __str__(self):
        return self.name

class RoomInvite(models.Model):
    sender = models.ForeignKey(User, related_name="sent_invites", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_invites", on_delete=models.CASCADE)
    status = models.CharField(
        max_length=10,
        choices=[("pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected")],
        default="pending"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} -> {self.receiver} ({self.status})"

