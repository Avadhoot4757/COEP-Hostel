from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class RoomInvite(models.Model):
    sender = models.ForeignKey(User, related_name="sent_invites", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_invites", on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.sender} -> {self.receiver}"

class Block(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    per_room_capacity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [models.Index(fields=['name'])]

class Floor(models.Model):
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
    )
    CLASS_CHOICES = (
        ('fy', 'First Year'),
        ('sy', 'Second Year'),
        ('ty', 'Third Year'),
        ('btech', 'Final Year'),
    )

    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='floors')
    number = models.PositiveIntegerField()
    name = models.CharField(max_length=50, blank=True)
    hostel_map_image = models.ImageField(upload_to='hostel_maps/', blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    class_name = models.CharField(max_length=10, choices=CLASS_CHOICES, default='fy')

    def __str__(self):
        return f"{self.name or f'Floor {self.number}'} - {self.block.name}"

    class Meta:
        unique_together = ('block', 'number')
        ordering = ['number']
        indexes = [models.Index(fields=['gender', 'class_name'])]

class Room(models.Model):
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='rooms')
    room_id = models.CharField(max_length=10)
    is_occupied = models.BooleanField(default=False)
    alloted_group = models.ForeignKey(
        'RoomGroup',  # Reference the RoomGroup model
        on_delete=models.SET_NULL,  # If the RoomGroup is deleted, set the field to NULL
        null=True,  # Allow the field to be NULL (for unallotted rooms)
        blank=True,  # Allow the field to be blank in forms
        related_name='allotted_rooms'  # Name for reverse relationship
    )
    def __str__(self):
        return f"Room {self.room_id} ({self.floor})"

    class Meta:
        unique_together = ('floor', 'room_id')
        ordering = ['room_id']

class RoomGroup(models.Model):
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
    )
    CLASS_CHOICES = (
        ('fy', 'First Year'),
        ('sy', 'Second Year'),
        ('ty', 'Third Year'),
        ('btech', 'Final Year'),
    )

    name = models.CharField(max_length=100)
    members = models.ManyToManyField(User, related_name="room_groups")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    class_name = models.CharField(max_length=10, choices=CLASS_CHOICES, default='fy')

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
