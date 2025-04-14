from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsStudent
from .models import *
from .serializers import *

User = get_user_model()


class RoomGroupStatusView(APIView):
    """ 
    1. Get current user's room group status 
    2. Allow user to leave a room group with more than one member
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        user_groups = request.user.room_groups.all()
        if not user_groups:
            return Response({"message": "You are not part of any room group"}, status=status.HTTP_200_OK)

        serializer = RoomGroupSerializer(user_groups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        user_groups = user.room_groups.all()

        if not user_groups:
            return Response(
                {"error": "You are not part of any room group"},
                status=status.HTTP_400_BAD_REQUEST
            )

        room_group = user_groups.first()  # Assume user is in at most one room group
        member_count = room_group.members.count()

        if member_count <= 1:
            return Response(
                {"error": "Cannot leave a room group with only one member"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Remove user from the room group
        room_group.members.remove(user)

        # Delete the room group if it becomes empty
        if room_group.members.count() <= 1:
            room_group.delete()

        return Response(
            {"message": "Successfully left the room group"},
            status=status.HTTP_200_OK
        )


class AvailableStudentsView(APIView):
    """Get available students & send room invites"""
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        try:
            # Get the requesting user's StudentDataEntry
            student_data = StudentDataEntry.objects.get(user=request.user)
            
            # Get IDs of users in RoomGroups with matching gender and class_name
            occupied_users = RoomGroup.objects.filter(
                gender=student_data.gender,
                class_name=student_data.class_name
            ).values_list("members__id", flat=True)

            # Filter available students by user_type, class_name, gender
            available_students = User.objects.filter(
                user_type="student",
                data_entry__class_name=student_data.class_name,
                data_entry__gender=student_data.gender
            ).exclude(id__in=occupied_users).exclude(id=request.user.id)

            # Serialize the results
            serializer = AvailableStudentSerializer(
                available_students,
                many=True,
                context={"request": request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": "Student data not found for this user"},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        receiver_id = request.data.get("receiver_id")
        try:
            receiver = User.objects.get(id=receiver_id)
            # Prevent inviting self
            if receiver == request.user:
                return Response(
                    {"error": "Cannot send invite to yourself"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Ensure receiver is a student
            if receiver.user_type != "student":
                return Response(
                    {"error": "User is not a student"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Check if receiver is in a room group
            if receiver.room_groups.exists():
                return Response(
                    {"error": "User is already in a room"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Check if sender's group is full
            sender_groups = request.user.room_groups.all()
            if sender_groups.exists() and sender_groups.first().members.count() >= 4:
                return Response(
                    {"error": "Your room group is already full"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check for existing invite
            invite, created = RoomInvite.objects.get_or_create(
                sender=request.user, receiver=receiver, status="pending"
            )

            if not created:
                return Response(
                    {"error": "Invite already sent"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"message": "Invite sent successfully"},
                status=status.HTTP_201_CREATED
            )

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class RoomInvitesView(APIView):
    """Get sent and received invites & manage them"""
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        sent_invites = RoomInvite.objects.filter(sender=request.user, status="pending")
        received_invites = RoomInvite.objects.filter(receiver=request.user, status="pending")

        sent_serializer = RoomInviteSerializer(sent_invites, many=True)
        received_serializer = RoomInviteSerializer(received_invites, many=True)

        return Response({
            "sent_invites": sent_serializer.data,
            "received_invites": received_serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        action = request.data.get("action")
        invite_id = request.data.get("invite_id")

        try:
            invite = RoomInvite.objects.get(id=invite_id)

            if action == "cancel" and invite.sender == request.user:
                invite.delete()
                return Response({"message": "Invite cancelled"}, status=status.HTTP_200_OK)

            elif action == "reject" and invite.receiver == request.user:
                invite.status = "rejected"
                invite.save()
                return Response({"message": "Invite rejected"}, status=status.HTTP_200_OK)

            elif action == "accept" and invite.receiver == request.user:
                # Prevent accepting if already in a group
                if request.user.room_groups.exists():
                    return Response(
                        {"error": "You are already in a room group"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                invite.status = "accepted"
                invite.save()

                # Add receiver to sender's room (or create a new one)
                sender_rooms = invite.sender.room_groups.all()
                sender_data = StudentDataEntry.objects.get(user=invite.sender)
                if sender_rooms.exists():
                    room = sender_rooms.first()
                else:
                    # Ensure unique room name
                    base_name = f"Room-{invite.sender.username}"
                    suffix = 1
                    while RoomGroup.objects.filter(name=base_name).exists():
                        base_name = f"Room-{invite.sender.username}-{suffix}"
                        suffix += 1
                    room = RoomGroup.objects.create(name=base_name, gender=sender_data.gender, class_name=sender_data.class_name)
                    room.members.add(invite.sender)

                # Prevent duplicate membership
                if not room.members.filter(id=invite.receiver.id).exists():
                    room.members.add(invite.receiver)

                # Delete other pending received invites for the user
                RoomInvite.objects.filter(
                    receiver=invite.receiver, status="pending"
                ).exclude(id=invite.id).delete()

                # Check if group is full (assume max 4 members)
                if room.members.count() >= 4:
                    # Delete all pending sent invites from group members
                    group_member_ids = room.members.values_list("id", flat=True)
                    RoomInvite.objects.filter(
                        sender__id__in=group_member_ids, status="pending"
                    ).delete()

                return Response({"message": "Invite accepted, added to room"}, status=status.HTTP_200_OK)

            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        except RoomInvite.DoesNotExist:
            return Response({"error": "Invite not found"}, status=status.HTTP_404_NOT_FOUND)


class RoomListView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        try:
            # Get user's year and gender from StudentDataEntry
            student_data = StudentDataEntry.objects.get(user=request.user)
            year = student_data.class_name
            gender = student_data.gender

            # Fetch blocks matching user's year and gender
            blocks = Block.objects.filter(class_name=year, gender=gender).prefetch_related('floors__rooms')
            serializer = BlockSerializer(blocks, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": "Complete your student profile to view rooms"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": "An error occurred while fetching rooms"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            group = request.user.room_groups.get()
            preferences = Preference.objects.filter(room_group=group).order_by('rank')
            serializer = PreferenceSerializer(preferences, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RoomGroup.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            group = request.user.room_groups.get()
            # Check if group has exactly 4 members
            if group.members.count() != 4:
                return Response(
                    {"error": "Room group must have exactly 4 members to save preferences"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer = PreferenceSubmitSerializer(data=request.data, context={'request': request})
            
            if serializer.is_valid():
                preferences = serializer.validated_data['preferences']
                student_data = StudentDataEntry.objects.get(user=request.user)
                
                Preference.objects.filter(room_group=group).delete()
                
                for rank, room_id in enumerate(preferences, 1):
                    room = Room.objects.get(
                        room_id=room_id,
                        floor__block__year=student_data.year,
                        floor__block__gender=student_data.gender
                    )
                    Preference.objects.create(
                        room_group=group,
                        room=room,
                        rank=rank
                    )
                
                return Response({"message": "Preferences saved successfully"}, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except RoomGroup.DoesNotExist:
            return Response({"error": "You must be in a group to save preferences"}, status=status.HTTP_400_BAD_REQUEST)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Complete your student profile"}, status=status.HTTP_400_BAD_REQUEST)
        except Room.DoesNotExist:
            return Response({"error": "One or more rooms are invalid"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
