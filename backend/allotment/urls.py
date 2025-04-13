from django.urls import path
from .views import *

urlpatterns = [
    path("room-status/", RoomGroupStatusView.as_view(), name="room-status"),
    path('rooms/', RoomListView.as_view(), name='room_list'),
    path("student-available/", AvailableStudentsView.as_view(), name="available-students"),
    path("invites/", RoomInvitesView.as_view(), name="room-invites"),
    path('preferences/', PreferenceView.as_view(), name='preferences'),
]

