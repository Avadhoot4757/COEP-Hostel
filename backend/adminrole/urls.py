from django.urls import path
from .views import *

urlpatterns = [
    path('students/pending/', PendingStudentsView.as_view(), name='pending-students'),
    path('students/verified/', VerifiedStudentsView.as_view(), name='verified-students'),
    path('students/rejected/', RejectedStudentsView.as_view(), name='rejected-students'),
    path('students/year/', StudentsByYearView.as_view(), name='students-by-year'),
    path('students/<str:roll_no>/', StudentDetailView.as_view(), name='student-detail'),
    path("wardens/", WardensView.as_view(), name="wardens"),
    path("wardens/<int:user_id>/", WardensView.as_view(), name="warden-detail"),
    path("managers/", ManagersView.as_view(), name="managers"),
    path("managers/<int:user_id>/", ManagersView.as_view(), name="manager-detail"),
    path("students/", StudentsView.as_view(), name="students"),
    path("seat-matrix/", SeatMatrixView.as_view(), name="seat-matrix"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("allot-branch-ranks/", AllotBranchRanksView.as_view(), name="allot-branch-ranks"),
    path('exp_stu/',exp_students.as_view(), name='exp_stu'),
    path('open-registration/', OpenRegistrationsView.as_view(), name='open-registration'),
    path('open-room-preference/', OpenRoomPreferencesView.as_view(), name='open-room-preferences'),
    path('allot_rooms/',AllotRoomsView.as_view(), name="allot_rooms"),
    path('generate_pdf/',GeneratePDFView.as_view(),name="generate_pdf"),
    path('record_allotment/', RecordAllotmentView.as_view(), name='record_allotment'),
    path('check_allotment/', CheckAllotmentView.as_view(), name='check_allotment'),
    path('reset_allotment/', ResetAllotmentView.as_view(), name='reset_allotment'),
    path('manual_override/', ManualOverrideView.as_view(), name='manual_override'),
    path('branches/', FetchBranchesView.as_view(), name='open-room-preferences'),
    path('select-students/', SelectStudentsAndRankView.as_view(), name='open-room-preferences'),
]
