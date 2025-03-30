from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RoomGroup, RoomInvite

User = get_user_model()

class RoomGroupSerializer(serializers.ModelSerializer):
    members = serializers.StringRelatedField(many=True)

    class Meta:
        model = RoomGroup
        fields = ["id", "name", "members"]

class AvailableStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]

class RoomInviteSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    receiver = serializers.StringRelatedField()

    class Meta:
        model = RoomInvite
        fields = ["id", "sender", "receiver", "status", "timestamp"]

