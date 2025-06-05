from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import *
from allotment.models import *
from .serializers import *
from authentication.permissions import *
from rest_framework.permissions import IsAuthenticated
from .models import *
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from django.db.models import Count, Sum
from django.db.models import Q
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from django.http import HttpResponse
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side



User = get_user_model()

class SeatMatrixView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        year = request.query_params.get('year')
        gender = request.query_params.get('gender')
        if not year or not gender:
            return Response({"error": "Year and gender are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            seat_matrix = SeatMatrix.objects.get(year=year, gender=gender)
            serializer = SeatMatrixSerializer(seat_matrix)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except SeatMatrix.DoesNotExist:
            return Response({"error": "Seat matrix not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        year = request.data.get('year')
        gender = request.data.get('gender')
        if year and gender:
            try:
                existing_matrix = SeatMatrix.objects.get(year=year, gender=gender)
                if existing_matrix.reserved_seats:
                    existing_matrix.reserved_seats.delete()
                existing_matrix.delete()
            except SeatMatrix.DoesNotExist:
                pass

        serializer = SeatMatrixSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OpenRegistrationsView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        year = request.query_params.get("year")
        if year:
            dates = SelectDates.objects.filter(
                event="Open Registrations", year=year.lower().replace(" ", "_")
            )
        else:
            dates = SelectDates.objects.filter(event="Open Registrations")
        serializer = SelectDatesSerializer(dates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Delete completed events
        now = timezone.now()
        SelectDates.objects.filter(
            event="Open Registrations",
            end_date__lt=now,
            end_date__isnull=False
        ).delete()

        data = request.data.copy()
        data["event"] = "Open Registrations"
        years = data.get("years", [])

        if not years:
            return Response(
                {"error": "At least one year is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for existing ongoing or upcoming events
        existing_events = SelectDates.objects.filter(
            event="Open Registrations",
            year__in=[year.lower().replace(" ", "_") for year in years]
        )
        for event in existing_events:
            is_ongoing = event.start_date <= now and (event.end_date is None or event.end_date >= now)
            is_upcoming = event.start_date > now
            if is_ongoing or is_upcoming:
                status_str = "ongoing" if is_ongoing else "upcoming"
                return Response(
                    {"error": f"Cannot create new event: {status_str} Open Registrations event exists for year {event.year}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = SelectDatesSerializer(data=data, context={"request": request})
        if not serializer.is_valid():
            print("Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(
            {"message": "Open Registrations dates saved successfully"},
            status=status.HTTP_200_OK
        )

    def delete(self, request):
        year = request.query_params.get("year")
        if not year:
            return Response(
                {"error": "Year is required to delete an event"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            instance = SelectDates.objects.get(
                event="Open Registrations", year=year.lower().replace(" ", "_")
            )
            instance.delete()
            return Response(
                {"message": "Open Registrations event deleted successfully"},
                status=status.HTTP_200_OK
            )
        except SelectDates.DoesNotExist:
            return Response(
                {"error": "No Open Registrations event found for the specified year"},
                status=status.HTTP_404_NOT_FOUND
            )

class OpenRoomPreferencesView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        year = request.query_params.get("year")
        if year:
            dates = SelectDates.objects.filter(
                event="Open Room Preferences", year=year.lower().replace(" ", "_")
            )
        else:
            dates = SelectDates.objects.filter(event="Open Room Preferences")
        serializer = SelectDatesSerializer(dates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Delete completed events
        now = timezone.now()
        SelectDates.objects.filter(
            event="Open Room Preferences",
            end_date__lt=now,
            end_date__isnull=False
        ).delete()

        data = request.data.copy()
        data["event"] = "Open Room Preferences"
        years = data.get("years", [])

        if not years:
            return Response(
                {"error": "At least one year is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for existing ongoing or upcoming events
        existing_events = SelectDates.objects.filter(
            event="Open Room Preferences",
            year__in=[year.lower().replace(" ", "_") for year in years]
        )
        for event in existing_events:
            is_ongoing = event.start_date <= now and (event.end_date is None or event.end_date >= now)
            is_upcoming = event.start_date > now
            if is_ongoing or is_upcoming:
                status_str = "ongoing" if is_ongoing else "upcoming"
                return Response(
                    {"error": f"Cannot create new event: {status_str} Open Room Preferences event exists for year {event.year}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = SelectDatesSerializer(data=data, context={"request": request})
        if not serializer.is_valid():
            print("Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(
            {"message": "Open Room Preferences dates saved successfully"},
            status=status.HTTP_200_OK
        )

    def delete(self, request):
        year = request.query_params.get("year")
        if not year:
            return Response(
                {"error": "Year is required to delete an event"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            instance = SelectDates.objects.get(
                event="Open Room Preferences", year=year.lower().replace(" ", "_")
            )
            instance.delete()
            return Response(
                {"message": "Open Room Preferences event deleted successfully"},
                status=status.HTTP_200_OK
            )
        except SelectDates.DoesNotExist:
            return Response(
                {"error": "No Open Room Preferences event found for the specified year"},
                status=status.HTTP_404_NOT_FOUND
            )

class PendingStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        pending_students = StudentDataEntry.objects.filter(verified=None)
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            pending_students = pending_students.filter(class_name=year)
        serializer = StudentDataEntrySerializer(pending_students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        roll_no = request.data.get('roll_no')
        verified = request.data.get('verified')
        if verified not in [True, False]:
            return Response(
                {"error": "Invalid value for 'verified' (must be True or False)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=None)
            student.verified = verified
            student.save()
            return Response(
                {"message": "Student status updated successfully."},
                status=status.HTTP_200_OK
            )
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": "Student not found or already processed."},
                status=status.HTTP_404_NOT_FOUND
            )

class VerifiedStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        verified_students = StudentDataEntry.objects.filter(verified=True)
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            verified_students = verified_students.filter(class_name=year)
        serializer = StudentDataEntrySerializer(verified_students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        roll_no = request.data.get('roll_no')
        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=True)
            student.verified = False
            student.save()
            return Response(
                {"message": "Student rejected successfully."},
                status=status.HTTP_200_OK
            )
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": "Student not found or not verified."},
                status=status.HTTP_404_NOT_FOUND
            )

class RejectedStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        rejected_students = StudentDataEntry.objects.filter(verified=False)
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            rejected_students = rejected_students.filter(class_name=year)
        serializer = StudentDataEntrySerializer(rejected_students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        roll_no = request.data.get('roll_no')
        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=False)
            student.verified = True
            student.save()
            return Response(
                {"message": "Student verified successfully."},
                status=status.HTTP_200_OK
            )
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": "Student not found or not rejected."},
                status=status.HTTP_404_NOT_FOUND
            )

class StudentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request, roll_no):
        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no)
            serializer = StudentDetailSerializer(student)
            return Response({"data": serializer.data}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": "Student not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class StudentsByYearView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        year = request.query_params.get('class_name')
        if year not in dict(StudentDataEntry.CLASS_CHOICES).keys():
            return Response(
                {"error": "Invalid year."},
                status=status.HTTP_400_BAD_REQUEST
            )
        students = StudentDataEntry.objects.filter(class_name=year)
        serializer = StudentDataEntrySerializer(students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

class WardensView(APIView):
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request):
        wardens = User.objects.filter(user_type="warden")
        serializer = UserSerializer(wardens, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UserCreateSerializer(data={**request.data, "user_type": "warden"})
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"message": "Warden created successfully.", "data": UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {"error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, user_type="warden")
            user.delete()
            return Response(
                {"message": "Warden deleted successfully."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Warden not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class ManagersView(APIView):
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request):
        managers = User.objects.filter(user_type="manager")
        serializer = UserSerializer(managers, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UserCreateSerializer(data={**request.data, "user_type": "manager"})
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"message": "Manager created successfully.", "data": UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {"error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, user_type="manager")
            user.delete()
            return Response(
                {"message": "Manager deleted successfully."},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Manager not found."},
                status=status.HTTP_404_NOT_FOUND
            )

class GetBranchesView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        try:
            year = request.query_params.get('year', 'fy')
            gender = request.query_params.get('gender', 'male')
            try:
                seat_matrix = SeatMatrix.objects.get(year=year, gender=gender)
                branches = list(seat_matrix.branch_seats.keys())
                return Response({"branches": branches}, status=status.HTTP_200_OK)
            except SeatMatrix.DoesNotExist:
                return Response({"branches": []}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AllotBranchRanksView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request):
        try:
            year = request.data.get('year')
            gender = request.data.get('gender', 'male')
            valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
            if not year or year not in valid_years:
                return Response(
                    {"error": f"Invalid year. Must be one of: {', '.join(valid_years)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
            if gender not in valid_genders:
                return Response(
                    {"error": f"Invalid gender. Must be one of: {', '.join(valid_genders)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Filter students, excluding manually modified ones
            students = StudentDataEntry.objects.filter(
                class_name=year,
                gender=gender,
                is_manually_modified=False
            ).select_related('branch')

            if not students.exists():
                return Response(
                    {"message": f"No {year} {gender} students found."},
                    status=status.HTTP_200_OK
                )

            # Group students by branch
            branch_groups = {}
            for student in students:
                branch_id = student.branch_id
                if branch_id not in branch_groups:
                    branch_groups[branch_id] = []
                branch_groups[branch_id].append(student)

            # Assign branch ranks
            total_updated = 0
            for branch_id, students in branch_groups.items():
                sorted_students = sorted(students, key=lambda s: (s.cgpa if s.cgpa is not None else 0), reverse=True)
                for rank, student in enumerate(sorted_students, start=1):
                    if student.branch_rank != rank:
                        student.branch_rank = rank
                        student.save(update_fields=['branch_rank'])
                        total_updated += 1

            # Call SelectStudentsView, passing the same request
            select_view = SelectStudentsView()
            select_response = select_view.post(request)

            if select_response.status_code != 200:
                return select_response

            return Response(
                {
                    "message": f"Successfully updated branch ranks for {total_updated} {year} {gender} students and selected students based on seat matrix.",
                    "selection_details": select_response.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StudentsView(APIView):
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request):
        students = User.objects.filter(user_type="student")
        serializer = UserSerializer(students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)
class GetStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        try:
            year = request.query_params.get('year', 'fy')
            gender = request.query_params.get('gender', 'male')
            category = request.query_params.get('category', 'all')
            branch = request.query_params.get('branch', 'all')

            valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
            if year not in valid_years:
                return Response(
                    {"error": f"Invalid year. Must be one of: {', '.join(valid_years)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
            if gender not in valid_genders:
                return Response(
                    {"error": f"Invalid gender. Must be one of: {', '.join(valid_genders)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            query = Q(class_name=year, gender=gender, verified=True)
            if category != 'all':
                query &= Q(caste__caste__iexact=category)
            if branch != 'all':
                query &= Q(branch__branch=branch)

            students = StudentDataEntry.objects.filter(query).select_related('branch', 'caste', 'admission_category').order_by('branch__branch', 'branch_rank')

            student_data = [
                {
                    "roll_no": student.roll_no,
                    "first_name": student.first_name,
                    "middle_name": student.middle_name,
                    "last_name": student.last_name,
                    "class_name": student.class_name,
                    "branch": {"name": student.branch.branch},
                    "verified": student.verified,
                    "selected": student.selected,
                    "last_selection_year": student.last_selection_year,
                    "caste": {"name": student.caste.caste},
                    "admission_category": {"name": student.admission_category.admission_category},
                }
                for student in students
            ]

            return Response({"students": student_data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class SelectStudentView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request):
        try:
            roll_no = request.data.get('roll_no')
            if not roll_no:
                return Response(
                    {"error": "Roll number is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            student = StudentDataEntry.objects.get(roll_no=roll_no)
            student.selected = True
            student.is_manually_modified = True
            student.save(update_fields=['selected', 'is_manually_modified'])
            return Response(
                {"message": f"Student {roll_no} selected successfully."},
                status=status.HTTP_200_OK
            )
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": f"Student with roll number {roll_no} not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RemoveStudentView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request):
        try:
            roll_no = request.data.get('roll_no')
            if not roll_no:
                return Response(
                    {"error": "Roll number is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            student = StudentDataEntry.objects.get(roll_no=roll_no)
            student.selected = False
            student.is_manually_modified = True
            student.save(update_fields=['selected', 'is_manually_modified'])
            return Response(
                {"message": f"Student {roll_no} removed from selection successfully."},
                status=status.HTTP_200_OK
            )
        except StudentDataEntry.DoesNotExist:
            return Response(
                {"error": f"Student with roll number {roll_no} not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SelectStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request):
        try:
            year = request.data.get('year')
            gender = request.data.get('gender', 'male')
            valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
            if not year or year not in valid_years:
                return Response(
                    {"error": f"Invalid year. Must be one of: {', '.join(valid_years)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
            if gender not in valid_genders:
                return Response(
                    {"error": f"Invalid gender. Must be one of: {', '.join(valid_genders)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                seat_matrix = SeatMatrix.objects.get(year=year, gender=gender)
            except SeatMatrix.DoesNotExist:
                return Response(
                    {"error": f"No seat matrix found for year {year} and gender {gender}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Preserve manually modified students
            StudentDataEntry.objects.filter(
                class_name=year,
                gender=gender,
                is_manually_modified=False
            ).update(
                selected=False,
                last_selection_year=year
            )

            students = StudentDataEntry.objects.filter(
                class_name=year,
                gender=gender,
                verified=True,
                is_manually_modified=False
            ).select_related('branch', 'caste').order_by('branch_rank')

            if not students.exists():
                return Response(
                    {"message": f"No verified {year} {gender} students found to select."},
                    status=status.HTTP_200_OK
                )

            branch_seats = seat_matrix.branch_seats
            branch_groups = {}
            for student in students:
                branch_name = student.branch.branch
                if branch_name not in branch_groups:
                    branch_groups[branch_name] = []
                branch_groups[branch_name].append(student)

            total_selected = 0
            for branch_name, branch_students in branch_groups.items():
                if branch_name not in branch_seats:
                    continue

                branch_seat_info = branch_seats[branch_name]
                open_seats = branch_seat_info.get("Open", 0)
                remaining_students = branch_students.copy()
                open_selected = []
                for student in remaining_students:
                    if open_seats <= 0:
                        break
                    open_selected.append(student)
                    open_seats -= 1
                    total_selected += 1

                remaining_students = [s for s in remaining_students if s not in open_selected]
                reserved_categories = {k: v for k, v in branch_seat_info.items() if k != "Open"}
                for category, seats in reserved_categories.items():
                    category_students = [
                        s for s in remaining_students
                        if s.caste.caste.upper() == category.upper()
                    ]
                    category_students.sort(key=lambda s: s.branch_rank or float('inf'))
                    for student in category_students:
                        if seats <= 0:
                            break
                        open_selected.append(student)
                        seats -= 1
                        total_selected += 1
                    remaining_students = [s for s in remaining_students if s not in open_selected]

                for student in open_selected:
                    student.selected = True
                    student.last_selection_year = year
                    student.save(update_fields=['selected', 'last_selection_year'])

            return Response(
                {"message": f"Successfully selected {total_selected} {year} {gender} students based on seat matrix."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class exp_students(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        try:
            year = request.query_params.get('year', 'fy')
            gender = request.query_params.get('gender', 'male')
            category = request.query_params.get('category', 'all')
            export_format = request.query_params.get('format', 'pdf')  # 'pdf' or 'excel'

            valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
            if year not in valid_years:
                return Response(
                    {"error": f"Invalid year. Must be one of: {', '.join(valid_years)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
            if gender not in valid_genders:
                return Response(
                    {"error": f"Invalid gender. Must be one of: {', '.join(valid_genders)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            query = Q(class_name=year, gender=gender, verified=True)
            if category != 'all':
                query &= Q(caste__caste__iexact=category)

            students = StudentDataEntry.objects.filter(query).select_related('branch', 'caste', 'admission_category').order_by('branch__branch', 'branch_rank')

            if not students.exists():
                return Response(
                    {"error": f"No verified students found for year {year}, gender {gender}, category {category}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if export_format == 'excel':
                return self.generate_excel(students, year, gender, category)

            # Default to PDF
            return self.generate_pdf(students, year, gender, category)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def generate_pdf(self, students, year, gender, category):
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(name='Title', fontSize=16, alignment=1, spaceAfter=20)
        branch_style = ParagraphStyle(name='Branch', fontSize=14, spaceBefore=10, spaceAfter=10)

        # Title
        year_label = dict(StudentDataEntry.CLASS_CHOICES).get(year, year)
        gender_label = dict(StudentDataEntry.GENDER_CHOICES).get(gender, gender)
        category_label = category.upper() if category != 'all' else 'All Categories'
        title = Paragraph(f"Student List - {year_label} ({gender_label}, {category_label})", title_style)
        elements.append(title)

        # Group students by branch
        branch_groups = {}
        for student in students:
            branch_name = student.branch.branch
            if branch_name not in branch_groups:
                branch_groups[branch_name] = []
            branch_groups[branch_name].append(student)

        # Create a table for each branch
        for branch_name in sorted(branch_groups.keys()):
            branch_students = branch_groups[branch_name]
            elements.append(Paragraph(f"Branch: {branch_name}", branch_style))

            # Table data
            data = [['ID', 'Name', 'Category']]
            for student in branch_students:
                full_name = f"{student.first_name} {student.middle_name or ''} {student.last_name or ''}".strip()
                category = f"{student.admission_category.admission_category} ({student.caste.caste})"
                data.append([str(student.branch_rank or '-'), full_name, category])

            # Create table
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 12))

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="students_{year}_{gender}_{category}.pdf"'
        response.write(buffer.getvalue())
        buffer.close()
        return response

    def generate_excel(self, students, year, gender, category):
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = f"Students_{year}_{gender}_{category}"

        # Define styles
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = openpyxl.styles.PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")
        border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))
        alignment = Alignment(horizontal='left', vertical='center')

        # Headers
        headers = ['Branch', 'ID', 'Name', 'Category']
        for col, header in enumerate(headers, start=1):
            cell = sheet.cell(row=1, column=col)
            cell.value = header
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
            cell.alignment = alignment

        # Group students by branch
        branch_groups = {}
        for student in students:
            branch_name = student.branch.branch
            if branch_name not in branch_groups:
                branch_groups[branch_name] = []
            branch_groups[branch_name].append(student)

        # Write data
        row = 2
        for branch_name in sorted(branch_groups.keys()):
            for student in branch_groups[branch_name]:
                full_name = f"{student.first_name} {student.middle_name or ''} {student.last_name or ''}".strip()
                category = f"{student.admission_category.admission_category} ({student.caste.caste})"
                sheet.cell(row=row, column=1).value = branch_name
                sheet.cell(row=row, column=2).value = student.branch_rank or '-'
                sheet.cell(row=row, column=3).value = full_name
                sheet.cell(row=row, column=4).value = category
                for col in range(1, 5):
                    sheet.cell(row=row, column=col).border = border
                    sheet.cell(row=row, column=col).alignment = alignment
                row += 1

        # Adjust column widths
        for col in sheet.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2)
            sheet.column_dimensions[column].width = adjusted_width

        buffer = BytesIO()
        workbook.save(buffer)
        buffer.seek(0)
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="students_{year}_{gender}_{category}.xlsx"'
        response.write(buffer.getvalue())
        buffer.close()
        return response


class DashboardView(APIView):
    def get(self, request):
        try:
            year_mapping = {
                "fy": "First Year",
                "sy": "Second Year",
                "ty": "Third Year",
                "btech": "Final Year",
            }
            year_data = {
                "first-year": {"name": "First Year", "male": {}, "female": {}},
                "second-year": {"name": "Second Year", "male": {}, "female": {}},
                "third-year": {"name": "Third Year", "male": {}, "female": {}},
                "final-year": {"name": "Final Year", "male": {}, "female": {}},
            }
            overall_stats = {
                "totalSeats": 0,
                "totalRegistrations": 0,
                "totalVerified": 0,
                "totalPendingVerifications": 0,
            }
            total_registrations = StudentDataEntry.objects.count()
            total_verified = StudentDataEntry.objects.filter(verified=True).count()
            total_pending = StudentDataEntry.objects.filter(verified=None).count()
            overall_stats["totalRegistrations"] = total_registrations
            overall_stats["totalVerified"] = total_verified
            overall_stats["totalPendingVerifications"] = total_pending
            for year_key, year_name in year_mapping.items():
                class_name = year_key
                frontend_year_key = {
                    "fy": "first-year",
                    "sy": "second-year",
                    "ty": "third-year",
                    "btech": "final-year",
                }[year_key]
                for gender in ["male", "female"]:
                    seats_query = Room.objects.filter(
                        floor__class_name=class_name,
                        floor__gender=gender
                    ).aggregate(
                        room_count=Count('id'),
                        total_capacity=Sum('floor__block__per_room_capacity')
                    )
                    room_count = seats_query["room_count"] or 0
                    total_capacity = seats_query["total_capacity"] or 0
                    if room_count > 0 and total_capacity > 0:
                        per_room_capacity = total_capacity // room_count
                        total_seats = room_count * per_room_capacity
                    else:
                        total_seats = 0
                    query = StudentDataEntry.objects.filter(
                        class_name=class_name,
                        gender=gender
                    )
                    registrations = query.count()
                    verified = query.filter(verified=True).count()
                    pending_verifications = query.filter(verified=None).count()
                    if registrations > 0 and verified == 0:
                        status_value = "registration"
                    elif verified > 0 and pending_verifications > 0:
                        status_value = "verification"
                    elif verified > 0 and pending_verifications == 0 and verified < registrations:
                        status_value = "selection"
                    else:
                        status_value = "completed"
                    year_data[frontend_year_key][gender] = {
                        "totalSeats": total_seats,
                        "registrations": registrations,
                        "verified": verified,
                        "pendingVerifications": pending_verifications,
                        "status": status_value,
                    }
                male_seats = year_data[frontend_year_key]["male"]["totalSeats"]
                female_seats = year_data[frontend_year_key]["female"]["totalSeats"]
                overall_stats["totalSeats"] += male_seats + female_seats
            return Response(
                {
                    "yearData": year_data,
                    "overallStats": overall_stats,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch dashboard data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
