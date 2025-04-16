from django.urls import path
<<<<<<< HEAD
from .views import PendingStudentsView, VerifiedStudentsView, RejectedStudentsView ,setDatesView
from .views import *
=======
from .views import *

>>>>>>> fde8694e7fb4e082c17d936838f6142b7caade1e
urlpatterns = [
    # path('students/pending/', PendingStudentsView.as_view(), name='pending-students'),
    # path('students/verified/', VerifiedStudentsView.as_view(), name='verified-students'),
    # path('students/rejected/', RejectedStudentsView.as_view(), name='rejected-students'),
    # path('rectorHome',rectorHomeView.as_view(),name='rectorHome'),
    path('setDates/',setDatesView.as_view(),name='setDates'),
    path('students/pending/', PendingStudentsView.as_view(), name='pending-students'),
    path('students/verified/', VerifiedStudentsView.as_view(), name='verified-students'),
    path('students/rejected/', RejectedStudentsView.as_view(), name='rejected-students'),
<<<<<<< HEAD
    path('students/<str:roll_no>/', StudentDetailView.as_view(), name='student-detail'),
    path('students/year/<str:year>/', StudentsByYearView.as_view(), name='students-by-year'),
=======
    # path('rectorHome',rectorHomeView.as_view(),name='rectorHome'),
    path('set-dates/',SetDatesView.as_view(),name='setDates'),
>>>>>>> fde8694e7fb4e082c17d936838f6142b7caade1e
]
