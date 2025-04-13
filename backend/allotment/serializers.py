from rest_framework import serializers
from django.contrib.auth import get_user_model
from authentication.models import StudentDataEntry
from .models import *

User = get_user_model()

class MemberSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='data_entry.first_name')
    last_name = serializers.CharField(source='data_entry.last_name', allow_null=True)
    branch = serializers.CharField(source='data_entry.branch')

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'branch']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not hasattr(instance, 'data_entry'):
            representation['first_name'] = None
            representation['last_name'] = None
            representation['branch'] = None
        return representation

class RoomGroupSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True)

    class Meta:
        model = RoomGroup
        fields = ["id", "name", "members"]

class AvailableStudentSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='data_entry.first_name')
    last_name = serializers.CharField(source='data_entry.last_name', allow_null=True)
    branch = serializers.CharField(source='data_entry.branch')

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "branch"]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not hasattr(instance, 'data_entry'):
            representation['first_name'] = None
            representation['last_name'] = None
            representation['branch'] = None
        return representation

class RoomInviteSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    sender_first_name = serializers.CharField(source='sender.data_entry.first_name')
    sender_last_name = serializers.CharField(source='sender.data_entry.last_name', allow_null=True)
    sender_branch = serializers.CharField(source='sender.data_entry.branch')
    receiver = serializers.StringRelatedField()
    receiver_first_name = serializers.CharField(source='receiver.data_entry.first_name')
    receiver_last_name = serializers.CharField(source='receiver.data_entry.last_name', allow_null=True)
    receiver_branch = serializers.CharField(source='receiver.data_entry.branch')

    class Meta:
        model = RoomInvite
        fields = [
            "id",
            "sender",
            "sender_first_name",
            "sender_last_name",
            "sender_branch",
            "receiver",
            "receiver_first_name",
            "receiver_last_name",
            "receiver_branch",
            "status",
            "timestamp"
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not hasattr(instance.sender, 'data_entry'):
            representation['sender_first_name'] = None
            representation['sender_last_name'] = None
            representation['sender_branch'] = None
        if not hasattr(instance.receiver, 'data_entry'):
            representation['receiver_first_name'] = None
            representation['receiver_last_name'] = None
            representation['receiver_branch'] = None
        return representation

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['room_id', 'is_occupied', 'capacity']

class FloorSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    name = serializers.CharField(required=False, allow_blank=True)
    hostel_map_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Floor
        fields = ['number', 'name', 'rooms', 'hostel_map_image']

class BlockSerializer(serializers.ModelSerializer):
    floors = FloorSerializer(many=True, read_only=True)

    class Meta:
        model = Block
        fields = ['id', 'name', 'gender', 'class_name', 'floors']

class PreferenceSerializer(serializers.ModelSerializer):
    room_id = serializers.CharField(source='room.room_id')

    class Meta:
        model = Preference
        fields = ['room_id', 'rank']

class PreferenceSubmitSerializer(serializers.Serializer):
    preferences = serializers.ListField(child=serializers.CharField())

    def validate_preferences(self, value):
        request = self.context['request']
        try:
            group = request.user.room_groups.get()
            if group.members.count() != 4:
                raise serializers.ValidationError("Group must have exactly 4 members")
            
            student_data = request.user.student_data_entry
            blocks = Block.objects.filter(class_name=student_data.class_name, gender=student_data.gender)
            room_ids = Room.objects.filter(
                floor__block__in=blocks,
                is_occupied=False
            ).values_list('room_id', flat=True)

            if sorted(value) != sorted(room_ids):
                raise serializers.ValidationError(
                    "Preferences must include all available non-occupied rooms"
                )
        except RoomGroup.DoesNotExist:
            raise serializers.ValidationError("You must be in a group to save preferences")
        except StudentDataEntry.DoesNotExist:
            raise serializers.ValidationError("Complete your student profile")

        return value
