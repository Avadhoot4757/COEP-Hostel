from django.urls import path
from .views import *
from .views import *

urlpatterns = [
    # path('students/pending/', PendingStudentsView.as_view(), name='pending-students'),
    # path('students/verified/', VerifiedStudentsView.as_view(), name='verified-students'),
    # path('students/rejected/', RejectedStudentsView.as_view(), name='rejected-students'),
    # path('rectorHome',rectorHomeView.as_view(),name='rectorHome'),
    path('students/pending/', PendingStudentsView.as_view(), name='pending-students'),
    path('students/verified/', VerifiedStudentsView.as_view(), name='verified-students'),
    path('students/rejected/', RejectedStudentsView.as_view(), name='rejected-students'),
    path('students/<str:roll_no>/', StudentDetailView.as_view(), name='student-detail'),
    path('students/year/<str:year>/', StudentsByYearView.as_view(), name='students-by-year'),
    # path('rectorHome',rectorHomeView.as_view(),name='rectorHome'),
    path('set-dates/',SetDatesView.as_view(),name='setDates'),
    path("wardens/", WardensView.as_view(), name="wardens"),
    path("wardens/<int:user_id>/", WardensView.as_view(), name="warden-detail"),
    path("managers/", ManagersView.as_view(), name="managers"),
    path("managers/<int:user_id>/", ManagersView.as_view(), name="manager-detail"),
    path("students/", StudentsView.as_view(), name="students"),
]
