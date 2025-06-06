from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsStudent
from .models import *
from adminrole.models import *
from .serializers import *
from django.http import JsonResponse
from django.db.models import Q

User = get_user_model()

class UserEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'student':
            return JsonResponse({"events": []}, status=200)

        events = SelectDates.objects.filter(year=request.user.class_name).values(
            'event', 'year', 'start_date', 'end_date'
        )
        return Response({"events": list(events)}, status=200)

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
    
        room_group = user_groups.first()  # Assuming user is in only one group
        member_count = room_group.members.count()
    
        if member_count <= 1:
            return Response(
                {"error": "Cannot leave a room group with only one member"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
        # Remove user from the room group
        room_group.members.remove(user)
    
        # If only 1 member left or none, delete the group (Preferences will cascade due to on_delete=models.CASCADE)
        if room_group.members.count() <= 1:
            room_group.delete()
        else:
            # If group still has more than one member, delete its preferences
            room_group.preferences.all().delete()
    
        return Response(
            {"message": "Successfully left the room group"},
            status=status.HTTP_200_OK
        )
    # def post(self, request):
    #     user = request.user
    #     user_groups = user.room_groups.all()
    #
    #     if not user_groups:
    #         return Response(
    #             {"error": "You are not part of any room group"},
    #             status=status.HTTP_400_BAD_REQUEST
    #         )
    #
    #     room_group = user_groups.first()  # Assume user is in at most one room group
    #     member_count = room_group.members.count()
    #
    #     if member_count <= 1:
    #         return Response(
    #             {"error": "Cannot leave a room group with only one member"},
    #             status=status.HTTP_400_BAD_REQUEST
    #         )
    #
    #     # Remove user from the room group
    #     room_group.members.remove(user)
    #
    #     # Delete the room group if it becomes empty
    #     if room_group.members.count() <= 1:
    #         room_group.delete()
    #
    #     return Response(
    #         {"message": "Successfully left the room group"},
    #         status=status.HTTP_200_OK
    #     )

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

            # Get IDs of users with pending RoomInvite (sent or received by request.user)
            pending_invite_users = RoomInvite.objects.filter(
                Q(sender=request.user) | Q(receiver=request.user)
            ).values_list('sender__id', 'receiver__id').distinct()

            # Combine sender and receiver IDs from pending invites
            pending_invite_user_ids = set()
            for sender_id, receiver_id in pending_invite_users:
                pending_invite_user_ids.add(sender_id)
                pending_invite_user_ids.add(receiver_id)

            # Filter available students by user_type, class_name, gender, excluding occupied and pending invite users
            available_students = User.objects.filter(
                user_type="student",
                data_entry__class_name=student_data.class_name,
                data_entry__gender=student_data.gender
            ).exclude(
                id__in=occupied_users
            ).exclude(
                id__in=pending_invite_user_ids
            ).exclude(id=request.user.id)

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
            student_data = StudentDataEntry.objects.get(user=request.user)
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
            # Check if sender's group is full based on block capacity
            sender_groups = request.user.room_groups.all()
            if sender_groups.exists():
                group = sender_groups.first()
                # Find the block matching the group's gender and class_name
                block = Block.objects.filter(
                    floors__gender=student_data.gender,
                    floors__class_name=student_data.class_name
                ).first()
                if not block:
                    return Response(
                        {"error": "No suitable block found for your group"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if group.members.count() >= block.per_room_capacity:
                    return Response(
                        {"error": f"Your room group is already full (capacity: {block.per_room_capacity})"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            # Check for reverse invite
            reverse_invite_exists = RoomInvite.objects.filter(
                sender=receiver, receiver=request.user
            ).exists()

            if reverse_invite_exists:
                return Response(
                    {"error": "A pending invite already exists from receiver to sender."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check for existing invite
            invite, created = RoomInvite.objects.get_or_create(
                sender=request.user, receiver=receiver
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
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": "Student data not found for this user"},
                status=status.HTTP_404_NOT_FOUND
            )

class RoomInvitesView(APIView):
    """Get sent and received invites & manage them"""
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        sent_invites = RoomInvite.objects.filter(sender=request.user)
        received_invites = RoomInvite.objects.filter(receiver=request.user)

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
                invite.delete()
                return Response({"message": "Invite rejected"}, status=status.HTTP_200_OK)

            elif action == "accept" and invite.receiver == request.user:
                if request.user.room_groups.exists():
                    return Response(
                        {"error": "You are already in a room group"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                sender_rooms = invite.sender.room_groups.all()
                sender_data = StudentDataEntry.objects.get(user=invite.sender)
                # Find the block matching the sender's gender and class_name
                block = Block.objects.filter(
                    floors__gender=sender_data.gender,
                    floors__class_name=sender_data.class_name
                ).first()
                if not block:
                    return Response(
                        {"error": "No suitable block found for the group"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if sender_rooms.exists():
                    room = sender_rooms.first()
                    # Check if group is full
                    if room.members.count() >= block.per_room_capacity:
                        return Response(
                            {"error": f"Room group is already full (capacity: {block.per_room_capacity})"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    # Ensure unique room name
                    base_name = f"Room-{invite.sender.username}"
                    suffix = 1
                    while RoomGroup.objects.filter(name=base_name).exists():
                        base_name = f"Room-{invite.sender.username}-{suffix}"
                        suffix += 1
                    room = RoomGroup.objects.create(
                        name=base_name,
                        gender=sender_data.gender,
                        class_name=sender_data.class_name
                    )
                    room.members.add(invite.sender)

                # Prevent duplicate membership
                if not room.members.filter(id=invite.receiver.id).exists():
                    room.members.add(invite.receiver)

                # Delete other pending received invites for the user
                RoomInvite.objects.filter(
                    receiver=invite.receiver
                ).exclude(id=invite.id).delete()

                # Check if group is full
                if room.members.count() >= block.per_room_capacity:
                    # Delete all pending sent invites from group members
                    group_member_ids = room.members.values_list("id", flat=True)
                    RoomInvite.objects.filter(
                        sender__id__in=group_member_ids
                    ).delete()

                invite.delete()

                return Response({"message": "Invite accepted, added to room"}, status=status.HTTP_200_OK)

            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        except RoomInvite.DoesNotExist:
            return Response({"error": "Invite not found"}, status=status.HTTP_404_NOT_FOUND)
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": "Student data not found for sender"},
                status=status.HTTP_404_NOT_FOUND
            )

class RoomListView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        try:
            # Get user's class_name and gender from StudentDataEntry
            student_data = StudentDataEntry.objects.get(user=request.user)
            class_name = student_data.class_name
            gender = student_data.gender

            # Fetch blocks with floors matching user's class_name and gender
            blocks = Block.objects.filter(
                floors__class_name=class_name,
                floors__gender=gender
            ).distinct().prefetch_related('floors__rooms')
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
            student_data = StudentDataEntry.objects.get(user=request.user)
            # Find the block matching the group's gender and class_name
            block = Block.objects.filter(
                floors__gender=student_data.gender,
                floors__class_name=student_data.class_name
            ).first()
            if not block:
                return Response(
                    {"error": "No suitable block found for your group"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Check if group has the correct number of members for the block's capacity
            if group.members.count() != block.per_room_capacity:
                return Response(
                    {"error": f"Room group must have exactly {block.per_room_capacity} members to save preferences"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer = PreferenceSubmitSerializer(data=request.data, context={'request': request})
            
            if serializer.is_valid():
                preferences = serializer.validated_data['preferences']
                
                Preference.objects.filter(room_group=group).delete()
                
                for rank, room_id in enumerate(preferences, 1):
                    # Ensure room belongs to a block with matching capacity
                    room = Room.objects.get(
                        room_id=room_id,
                        floor__gender=student_data.gender,
                        floor__class_name=student_data.class_name,
                        floor__block__per_room_capacity=block.per_room_capacity
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
            return Response({"error": "One or more rooms are invalid or do not match the block capacity"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(e)
            return Response({"error": "An error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BlockViewSet(viewsets.ModelViewSet):
    #permission_classes = [IsAuthenticated, IsStaffUser]
    queryset = Block.objects.all()
    serializer_class = BlockSerializer

class FloorViewSet(viewsets.ModelViewSet):
#    permission_classes = [IsAuthenticated, IsStaffUser]
    queryset = Floor.objects.all()
    serializer_class = FloorSerializer

class RoomViewSet(viewsets.ModelViewSet):
#    permission_classes = [IsAuthenticated, IsStaffUser]
    queryset = Room.objects.all()
    serializer_class = RoomSerializer       
