from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsStudent
from .models import RoomGroup, RoomInvite
from .serializers import RoomGroupSerializer, AvailableStudentSerializer, RoomInviteSerializer

User = get_user_model()

class RoomGroupStatusView(APIView):
    """ 1. Get current user's room group status """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        user_groups = request.user.room_groups.all()
        if not user_groups:
            return Response({"message": "You are not part of any room group"}, status=status.HTTP_200_OK)

        serializer = RoomGroupSerializer(user_groups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AvailableStudentsView(APIView):
    """ 2. Get available students & send room invites """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        occupied_users = RoomGroup.objects.values_list("members", flat=True)
        available_students = User.objects.exclude(id__in=occupied_users)
        serializer = AvailableStudentSerializer(available_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        receiver_id = request.data.get("receiver_id")
        try:
            receiver = User.objects.get(id=receiver_id)
            if receiver.room_groups.exists():
                return Response({"error": "User is already in a room"}, status=status.HTTP_400_BAD_REQUEST)

            invite, created = RoomInvite.objects.get_or_create(sender=request.user, receiver=receiver)

            if not created:
                return Response({"error": "Invite already sent"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"message": "Invite sent successfully"}, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class RoomInvitesView(APIView):
    """ 3. Get sent and received invites & manage them """
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
                invite.status = "accepted"
                invite.save()

                # Add receiver to sender's room (or create a new one if sender has none)
                sender_rooms = invite.sender.room_groups.all()
                if sender_rooms.exists():
                    room = sender_rooms.first()
                else:
                    room = RoomGroup.objects.create(name=f"Room-{invite.sender.username}")
                    room.members.add(invite.sender)

                room.members.add(invite.receiver)
                return Response({"message": "Invite accepted, added to room"}, status=status.HTTP_200_OK)

            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        except RoomInvite.DoesNotExist:
            return Response({"error": "Invite not found"}, status=status.HTTP_404_NOT_FOUND)

