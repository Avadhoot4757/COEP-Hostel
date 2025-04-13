from django.urls import path
from .views import PendingStudentsView, VerifiedStudentsView, RejectedStudentsView ,setDatesView

urlpatterns = [
    path('students/pending/', PendingStudentsView.as_view(), name='pending-students'),
    path('students/verified/', VerifiedStudentsView.as_view(), name='verified-students'),
    path('students/rejected/', RejectedStudentsView.as_view(), name='rejected-students'),
    # path('rectorHome',rectorHomeView.as_view(),name='rectorHome'),
    path('setDates/',setDatesView.as_view(),name='setDates'),
]
