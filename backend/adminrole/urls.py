from django.urls import path
from .views import *

urlpatterns = [
    # path('students/pending/', PendingStudentsView.as_view(), name='pending-students'),
    # path('students/verified/', VerifiedStudentsView.as_view(), name='verified-students'),
    # path('students/rejected/', RejectedStudentsView.as_view(), name='rejected-students'),
    # path('rectorHome',rectorHomeView.as_view(),name='rectorHome'),
    path('students/pending/', PendingStudentsView.as_view(), name='pending-students'),
    path('students/verified/', VerifiedStudentsView.as_view(), name='verified-students'),
    path('students/rejected/', RejectedStudentsView.as_view(), name='rejected-students'),
    path('students/year/', StudentsByYearView.as_view(), name='students-by-year'),
    path('students/<str:roll_no>/', StudentDetailView.as_view(), name='student-detail'),
    # path('rectorHome',rectorHomeView.as_view(),name='rectorHome'),
    path('set-dates/',SetDatesView.as_view(),name='setDates'),
    path("wardens/", WardensView.as_view(), name="wardens"),
    path("wardens/<int:user_id>/", WardensView.as_view(), name="warden-detail"),
    path("managers/", ManagersView.as_view(), name="managers"),
    path("managers/<int:user_id>/", ManagersView.as_view(), name="manager-detail"),
    path("students/", StudentsView.as_view(), name="students"),
    path("seat-matrix/", SeatMatrixView.as_view(), name="seat-matrix"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("allot-branch-ranks/", AllotBranchRanksView.as_view(), name="allot-branch-ranks"),
    path('select-students/', SelectStudentsView.as_view(), name='select-students'),
    path('get-students/', GetStudentsView.as_view(), name='get-students'),
    path('select-student/', SelectStudentView.as_view(), name='select-student'),
    path('remove-student/', RemoveStudentView.as_view(), name='remove-student'),

]
