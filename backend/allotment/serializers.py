from rest_framework import serializers
from django.contrib.auth import get_user_model
from authentication.models import StudentMain
from .models import *

User = get_user_model()

class RoomGroupSerializer(serializers.ModelSerializer):
    members = serializers.StringRelatedField(many=True)

    class Meta:
        model = RoomGroup
        fields = ["id", "name", "members"]

class AvailableStudentSerializer(serializers.ModelSerializer):
    branch = serializers.CharField(source='StudentMain.branch', read_only=True)
    class Meta:
        model = User
        fields = ["id", "username", "email", "branch"]

class RoomInviteSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    receiver = serializers.StringRelatedField()

    class Meta:
        model = RoomInvite
        fields = ["id", "sender", "receiver", "status", "timestamp"]


from rest_framework import serializers
from .models import Block, Floor, Room, Preference, RoomGroup

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
        fields = ['id', 'name', 'gender', 'year', 'floors']

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
            group = request.user.room_groups.get()  # Assume one group per user
            if group.members.count() != 4:
                raise serializers.ValidationError("Group must have exactly 4 members")
            
            # Get non-occupied rooms for group's year and gender
            # student_data = request.user.student_data_entry
            # blocks = Block.objects.filter(year=student_data.year, gender=student_data.gender)
            blocks = Block.objects.all()
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
