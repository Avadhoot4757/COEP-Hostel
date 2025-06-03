from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'blocks', BlockViewSet)
router.register(r'floors', FloorViewSet)
router.register(r'rooms-crud', RoomViewSet)

urlpatterns = [
    path('user-events/', UserEventsView.as_view(), name='user-events'),
    path("room-status/", RoomGroupStatusView.as_view(), name="room-status"),
    path('rooms/', RoomListView.as_view(), name='room_list'),
    path("student-available/", AvailableStudentsView.as_view(), name="available-students"),
    path("invites/", RoomInvitesView.as_view(), name="room-invites"),
    path('preferences/', PreferenceView.as_view(), name='preferences'),
    path('api/', include(router.urls))
]

