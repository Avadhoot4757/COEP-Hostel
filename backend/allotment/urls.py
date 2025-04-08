from django.urls import path
from .views import RoomGroupStatusView, AvailableStudentsView, RoomInvitesView

urlpatterns = [
    path("room-status/", RoomGroupStatusView.as_view(), name="room-status"),
    path("student-available/", AvailableStudentsView.as_view(), name="available-students"),
    path("invites/", RoomInvitesView.as_view(), name="room-invites"),
]

