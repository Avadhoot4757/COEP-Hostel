from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import *
from allotment.models import *
from .serializers import *
from authentication.permissions import *
from rest_framework.permissions import IsAuthenticated
from .models  import *
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from django.db.models import Count, Sum
from django.db.models import Q

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
                # Delete the existing entry and its associated ReservedSeat
                if existing_matrix.reserved_seats:
                    existing_matrix.reserved_seats.delete()
                existing_matrix.delete()
            except SeatMatrix.DoesNotExist:
                pass  # No existing entry, proceed with creation

        serializer = SeatMatrixSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OpenRegistrationView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        year = request.query_params.get("year")
        if year:
            dates = SelectDates.objects.filter(year=year.lower().replace(" ", "_"))
        else:
            dates = SelectDates.objects.all()
        serializer = SelectDatesSerializer(dates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response(
                {"error": "Request data must be a list of events."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        required_events = {
            "Registration",
            "Student Data Verification",
            "Result Declaration",
            "Roommaking",
            "Final Allotment",
            "Verification",
        }
        provided_events = {item.get("event") for item in data}
        if provided_events != required_events:
            return Response(
                {"error": f"All events must be provided: {', '.join(required_events)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            year = request.data[0].get('year')
            
            # Save new dates
            for event_data in data:
                SelectDates.objects.create(
                    year=year,
                    event=event_data.get('event'),
                    start_date=event_data.get('start_date'),
                    end_date=event_data.get('end_date')
                )
                
            return Response(
                {"message": "Registration dates saved successfully"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to save dates: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PendingStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        """Return students with verified=None (pending verification)."""
        pending_students = StudentDataEntry.objects.filter(verified=None)
        
        # Filter by year (class_name)
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            pending_students = pending_students.filter(class_name=year)
            
        serializer = StudentDataEntrySerializer(pending_students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        """Verify (True) or Reject (False) a pending student by roll_no."""
        roll_no = request.data.get('roll_no')
        verified = request.data.get('verified')  # True or False

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
        """Return students with verified=True."""
        verified_students = StudentDataEntry.objects.filter(verified=True)
        
        # Filter by year
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            verified_students = verified_students.filter(class_name=year)
            
        serializer = StudentDataEntrySerializer(verified_students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        """Reject a verified student (set verified=False) by roll_no."""
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
        """Return students with verified=False."""
        rejected_students = StudentDataEntry.objects.filter(verified=False)
        
        # Filter by year
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            rejected_students = rejected_students.filter(class_name=year)
            
        serializer = StudentDataEntrySerializer(rejected_students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        """Verify a rejected student (set verified=True) by roll_no."""
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
        """Return detailed information for a specific student."""
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
        """Return students filtered by year (class_name)."""
        year = request.query_params.get('class_name')
        if year not in dict(StudentDataEntry.CLASS_CHOICES).keys():
            return Response(
                {"error": "Invalid year."},
                status=status.HTTP_400_BAD_REQUEST
            )

        students = StudentDataEntry.objects.filter(class_name=year)
        serializer = StudentDataEntrySerializer(students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)



User = get_user_model()

class WardensView(APIView):
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request):
        """List all wardens."""
        wardens = User.objects.filter(user_type="warden")
        serializer = UserSerializer(wardens, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        """Add a new warden."""
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
        """Delete a warden."""
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
        """List all managers."""
        managers = User.objects.filter(user_type="manager")
        serializer = UserSerializer(managers, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        """Add a new manager."""
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
        """Delete a manager."""
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
        

class AllotBranchRanksView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request):
        """Assign branch ranks to students of the specified year based on CGPA, then select students."""
        try:
            # Step 1: Extract the year from the request data
            year = request.data.get('year')
            gender = request.data.get('gender', 'male')  # Default to male if not specified
            
            # Validate the year against CLASS_CHOICES
            valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
            if not year or year not in valid_years:
                return Response(
                    {"error": f"Invalid year. Must be one of: {', '.join(valid_years)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate the gender
            valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
            if gender not in valid_genders:
                return Response(
                    {"error": f"Invalid gender. Must be one of: {', '.join(valid_genders)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Step 2: Filter students with the specified class_name and gender
            students = StudentDataEntry.objects.filter(class_name=year, gender=gender).select_related('branch')

            if not students.exists():
                return Response(
                    {"message": f"No {year} {gender} students found."},
                    status=status.HTTP_200_OK
                )

            # Step 3: Group students by branch
            branch_groups = {}
            for student in students:
                branch_id = student.branch_id  # Use the foreign key value (e.g., an integer)
                if branch_id not in branch_groups:
                    branch_groups[branch_id] = []
                branch_groups[branch_id].append(student)

            # Step 4: Assign branch ranks within each branch
            total_updated = 0
            for branch_id, students in branch_groups.items():
                # Sort students by CGPA in descending order (higher CGPA gets lower rank number)
                sorted_students = sorted(students, key=lambda s: (s.cgpa if s.cgpa is not None else 0), reverse=True)

                # Assign ranks
                for rank, student in enumerate(sorted_students, start=1):
                    if student.branch_rank != rank:
                        student.branch_rank = rank
                        student.save(update_fields=['branch_rank'])
                        total_updated += 1

            # Step 5: After allotting ranks, call SelectStudentsView to select students
            select_view = SelectStudentsView()
            select_response = select_view.post(request)

            if select_response.status_code != 200:
                return select_response  # Return any error from SelectStudentsView

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
        """List all students."""
        students = User.objects.filter(user_type="student")
        serializer = UserSerializer(students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)




class GetStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsManager]
    def get(self, request):
        """Fetch verified students for a given year, gender, and category."""
        try:
            year = request.query_params.get('year')
            gender = request.query_params.get('gender', 'male')
            category = request.query_params.get('category', 'all')

            # Validate the year
            valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
            if not year or year not in valid_years:
                return Response(
                    {"error": f"Invalid year. Must be one of: {', '.join(valid_years)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate the gender
            valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
            if gender not in valid_genders:
                return Response(
                    {"error": f"Invalid gender. Must be one of: {', '.join(valid_genders)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Build the query
            query = Q(class_name=year, gender=gender, verified=True)
            if category != 'all':
                query &= Q(caste__caste__iexact=category)

            students = StudentDataEntry.objects.filter(query).select_related('branch', 'caste', 'admission_category')

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
        """Manually select a student."""
        try:
            roll_no = request.data.get('roll_no')
            if not roll_no:
                return Response(
                    {"error": "Roll number is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            student = StudentDataEntry.objects.get(roll_no=roll_no)
            student.selected = True
            student.save(update_fields=['selected'])
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
        """Manually remove a student from selection."""
        try:
            roll_no = request.data.get('roll_no')
            if not roll_no:
                return Response(
                    {"error": "Roll number is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            student = StudentDataEntry.objects.get(roll_no=roll_no)
            student.selected = False
            student.save(update_fields=['selected'])
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
        """Select students for hostel allocation based on seat matrix."""
        try:
            # Step 1: Extract year and gender from the request
            year = request.data.get('year')
            gender = request.data.get('gender', 'male')  # Default to male if not specified

            # Validate the year
            valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
            if not year or year not in valid_years:
                return Response(
                    {"error": f"Invalid year. Must be one of: {', '.join(valid_years)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate the gender
            valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
            if gender not in valid_genders:
                return Response(
                    {"error": f"Invalid gender. Must be one of: {', '.join(valid_genders)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Step 2: Fetch the seat matrix for the given year and gender
            try:
                seat_matrix = SeatMatrix.objects.get(year=year, gender=gender)
            except SeatMatrix.DoesNotExist:
                return Response(
                    {"error": f"No seat matrix found for year {year} and gender {gender}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Step 3: Reset the selected flag for students of this year and gender
            StudentDataEntry.objects.filter(class_name=year, gender=gender).update(
                selected=False,
                last_selection_year=year
            )

            # Step 4: Fetch verified students for the given year and gender
            students = StudentDataEntry.objects.filter(
                class_name=year,
                gender=gender,
                verified=True
            ).select_related('branch', 'caste').order_by('branch_rank')

            if not students.exists():
                return Response(
                    {"message": f"No verified {year} {gender} students found to select."},
                    status=status.HTTP_200_OK
                )

            # Step 5: Parse the seat matrix
            branch_seats = seat_matrix.branch_seats  # JSON field with branch-wise seats
            # Example structure of branch_seats:
            # {
            #   "Computer Science": {"Open": 10, "SC": 3, "ST": 2, "OBC": 5, ...},
            #   "Mechanical": {"Open": 8, "SC": 2, "ST": 1, "OBC": 4, ...},
            #   ...
            # }

            # Step 6: Group students by branch
            branch_groups = {}
            for student in students:
                branch_name = student.branch.branch  # e.g., "Computer Science"
                if branch_name not in branch_groups:
                    branch_groups[branch_name] = []
                branch_groups[branch_name].append(student)

            # Step 7: Allocate seats for each branch
            total_selected = 0
            for branch_name, branch_students in branch_groups.items():
                if branch_name not in branch_seats:
                    continue  # Skip if the branch isn't in the seat matrix

                branch_seat_info = branch_seats[branch_name]
                open_seats = branch_seat_info.get("Open", 0)

                # Step 7.1: Allocate Open seats (any category can take them)
                remaining_students = branch_students.copy()
                open_selected = []
                for student in remaining_students:
                    if open_seats <= 0:
                        break
                    open_selected.append(student)
                    open_seats -= 1
                    total_selected += 1

                # Remove students who got Open seats from remaining_students
                remaining_students = [s for s in remaining_students if s not in open_selected]

                # Step 7.2: Allocate reserved seats (category-specific)
                reserved_categories = {k: v for k, v in branch_seat_info.items() if k != "Open"}
                for category, seats in reserved_categories.items():
                    # Find students of this category
                    category_students = [
                        s for s in remaining_students
                        if s.caste.caste.upper() == category.upper()
                    ]
                    # Sort by branch_rank to prioritize higher-ranked students
                    category_students.sort(key=lambda s: s.branch_rank or float('inf'))

                    # Allocate seats
                    for student in category_students:
                        if seats <= 0:
                            break
                        open_selected.append(student)
                        seats -= 1
                        total_selected += 1

                    # Remove selected students from remaining_students
                    remaining_students = [s for s in remaining_students if s not in open_selected]

                # Step 7.3: Update the selected students
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
        
class DashboardView(APIView):
    def get(self, request):
        try:
            # Define year mappings
            year_mapping = {
                "fy": "First Year",
                "sy": "Second Year",
                "ty": "Third Year",
                "btech": "Final Year",
            }

            # Initialize yearData structure
            year_data = {
                "first-year": {"name": "First Year", "male": {}, "female": {}},
                "second-year": {"name": "Second Year", "male": {}, "female": {}},
                "third-year": {"name": "Third Year", "male": {}, "female": {}},
                "final-year": {"name": "Final Year", "male": {}, "female": {}},
            }

            # Initialize overall stats
            overall_stats = {
                "totalSeats": 0,
                "totalRegistrations": 0,
                "totalVerified": 0,
                "totalPendingVerifications": 0,
            }

            # Calculate total registrations, verified, and pending verifications
            total_registrations = StudentDataEntry.objects.count()
            total_verified = StudentDataEntry.objects.filter(verified=True).count()
            total_pending = StudentDataEntry.objects.filter(verified=None).count()

            overall_stats["totalRegistrations"] = total_registrations
            overall_stats["totalVerified"] = total_verified
            overall_stats["totalPendingVerifications"] = total_pending

            # Calculate total seats per year and gender
            for year_key, year_name in year_mapping.items():
                class_name = year_key
                frontend_year_key = {
                    "fy": "first-year",
                    "sy": "second-year",
                    "ty": "third-year",
                    "btech": "final-year",
                }[year_key]

                for gender in ["male", "female"]:
                    # Calculate total seats: Count rooms and multiply by per_room_capacity
                    seats_query = Room.objects.filter(
                        floor__class_name=class_name,
                        floor__gender=gender
                    ).aggregate(
                        room_count=Count('id'),
                        total_capacity=Sum('floor__block__per_room_capacity')
                    )
                    room_count = seats_query["room_count"] or 0
                    total_capacity = seats_query["total_capacity"] or 0

                    # Calculate seats: rooms * per_room_capacity (avoid overcounting)
                    if room_count > 0 and total_capacity > 0:
                        per_room_capacity = total_capacity // room_count
                        total_seats = room_count * per_room_capacity
                    else:
                        total_seats = 0

                    # Get stats for registrations, verified, and pending
                    query = StudentDataEntry.objects.filter(
                        class_name=class_name,
                        gender=gender
                    )
                    registrations = query.count()
                    verified = query.filter(verified=True).count()
                    pending_verifications = query.filter(verified=None).count()

                    # Determine status
                    if registrations > 0 and verified == 0:
                        status_value = "registration"
                    elif verified > 0 and pending_verifications > 0:
                        status_value = "verification"
                    elif verified > 0 and pending_verifications == 0 and verified < registrations:
                        status_value = "selection"
                    else:
                        status_value = "completed"

                    # Populate yearData
                    year_data[frontend_year_key][gender] = {
                        "totalSeats": total_seats,
                        "registrations": registrations,
                        "verified": verified,
                        "pendingVerifications": pending_verifications,
                        "status": status_value,
                    }

                # Update total seats
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

