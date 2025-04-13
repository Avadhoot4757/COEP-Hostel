from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

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

class Block(models.Model):
    GENDER_CHOICES = (
        ('M', 'Boys'),
        ('F', 'Girls'),
    )
    YEAR_CHOICES = (
        ('1', '1st Year'),
        ('2', '2nd Year'),
        ('3', '3rd Year'),
        ('4', '4th Year'),
    )

    name = models.CharField(max_length=50, unique=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    year = models.CharField(max_length=1, choices=YEAR_CHOICES)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.get_gender_display()}, {self.get_year_display()})"

    class Meta:
        indexes = [models.Index(fields=['gender', 'year'])]

class Floor(models.Model):
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='floors')
    number = models.PositiveIntegerField()
    name = models.CharField(max_length=50, blank=True)
    hostel_map_image = models.ImageField(upload_to='hostel_maps/', blank=True, null=True)

    def __str__(self):
        return f"{self.name or f'Floor {self.number}'} - {self.block.name}"

    class Meta:
        unique_together = ('block', 'number')
        ordering = ['number']

class Room(models.Model):
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='rooms')
    room_id = models.CharField(max_length=10)
    is_occupied = models.BooleanField(default=False)
    capacity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"Room {self.room_id} ({self.floor})"

    class Meta:
        unique_together = ('floor', 'room_id')
        ordering = ['room_id']

class RoomGroup(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(User, related_name="room_groups")

    def __str__(self):
        return self.name

class Preference(models.Model):
    room_group = models.ForeignKey(RoomGroup, on_delete=models.CASCADE, related_name='preferences')
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    rank = models.PositiveIntegerField()

    class Meta:
        unique_together = ('room_group', 'room')
        indexes = [models.Index(fields=['room_group', 'rank'])]

    def __str__(self):
        return f"{self.room_group.name} - Room {self.room.room_id} (Rank {self.rank})"
