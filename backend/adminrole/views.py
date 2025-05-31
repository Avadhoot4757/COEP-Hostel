from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import StudentDataEntry
from .serializers import *
from authentication.permissions import *
from rest_framework.permissions import IsAuthenticated
from .models  import *
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone

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


# class PendingStudentsView(APIView):
#     """Handles listing and verifying/rejecting pending students."""

#     def get(self, request):
#         """Return students with verified=None (pending verification)."""
#         pending_students = StudentDataEntry.objects.filter(verified=None)
#         serializer = StudentDataEntrySerializer(pending_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Verify (True) or Reject (False) a student by roll_no."""
#         roll_no = request.data.get('roll_no')
#         verified = request.data.get('verified')  # Expecting True or False

#         if verified not in [True, False]:
#             return Response({"error": "Invalid value for 'verified' (must be True or False)."},
#                             status=status.HTTP_400_BAD_REQUEST)

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=None)
#             student.verified = verified
#             student.save()
#             return Response({"message": "Student status updated successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

# class VerifiedStudentsView(APIView):
#     """Handles listing and rejecting verified students."""

#     def get(self, request):
#         """Return students who are verified (verified=True)."""
#         verified_students = StudentDataEntry.objects.filter(verified=True)
#         serializer = StudentDataEntrySerializer(verified_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Reject a verified student (set verified=False) by roll_no."""
#         roll_no = request.data.get('roll_no')

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=True)
#             student.verified = False
#             student.save()
#             return Response({"message": "Student rejected successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

# class RejectedStudentsView(APIView):
#     """Handles listing and verifying rejected students."""

#     def get(self, request):
#         """Return students who are rejected (verified=False)."""
#         rejected_students = StudentDataEntry.objects.filter(verified=False)
#         serializer = StudentDataEntrySerializer(rejected_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Verify a rejected student (set verified=True) by roll_no."""
#         roll_no = request.data.get('roll_no')

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=False)
#             student.verified = True
#             student.save()
#             return Response({"message": "Student verified successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or not rejected."}, status=status.HTTP_404_NOT_FOUND)


class SetDatesView(APIView):
    permission_classes = [IsAuthenticated, IsRector]

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

# class setDatesView(APIView):
#     permission_classes=[IsAuthenticated]
#     def get(self,request):
#         #fetching the dates from database 
#         dates=SelectDates.objects.all().values('event_id','event','start_date','end_date')
#     #mapping the dates for the dictionary in frontend 
#         date_dict={
#             'registrationStart': dates.filter(event='Registration Start').first().start_date.isoformat() if dates.filter(event='Registration Start').exists() else '',
#                 'registrationEnd': dates.filter(event='Registration End').first().end_date.isoformat() if dates.filter(event='Registration End').exists() else '',
#                 'resultDeclaration': dates.filter(event='Result Declaration').first().start_date.isoformat() if dates.filter(event='Result Declaration').exists() else '',
#                 'roommakingStart': dates.filter(event='Room Making Start').first().start_date.isoformat() if dates.filter(event='Room Making Start').exists() else '',
#                 'roommakingEnd': dates.filter(event='Room Making End').first().end_date.isoformat() if dates.filter(event='Room Making End').exists() else '',
#                 'finalAllotment': dates.filter(event='Final Allotment').first().start_date.isoformat() if dates.filter(event='Final Allotment').exists() else '',
#                 'verificationStart': dates.filter(event='Verification Start').first().start_date.isoformat() if dates.filter(event='Verification Start').exists() else '',
#                 'verificationEnd': dates.filter(event='Verification End').first().end_date.isoformat() if dates.filter(event='Verification End').exists() else '',
#         }
#         return Response(date_dict)
#     def post(self,request):
#         #save the dates or set new dates 
#         data=request.data
#         print("printing the data like ",data)
#         return Response({"message": "Dates saved successfully"}, status=200)
#         #FOR TESTING 
#         for event_key, date_value in data.items():
#             if date_value:  # Only update if a date is provided
#                 event_name = event_key.replace('_', ' ').title()
#                 obj, created = SelectDates.objects.update_or_create(
#                     event=event_name,
#                     defaults={
#                         'start_date': date_value if 'Start' in event_name or 'Declaration' in event_name or 'Allotment' in event_name else None,
#                         'end_date': date_value if 'End' in event_name else None
#                     }
#                 



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import StudentDataEntry
from .serializers import StudentDataEntrySerializer, StudentDetailSerializer
from authentication.permissions import IsManager, IsWarden
from rest_framework.permissions import IsAuthenticated
from .models import SelectDates
from rest_framework_simplejwt.authentication import JWTAuthentication

# class PendingStudentsView(APIView):
#     """Handles listing and verifying/rejecting pending students."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsManager]

#     def get(self, request):
#         """Return students with verified=None (pending verification)."""
#         pending_students = StudentDataEntry.objects.filter(verified=None)
#         serializer = StudentDataEntrySerializer(pending_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Verify (True) or Reject (False) a student by roll_no."""
#         roll_no = request.data.get('roll_no')
#         verified = request.data.get('verified')  # Expecting True or False
#         reason = request.data.get('reason')  # Optional rejection reason

#         if verified not in [True, False]:
#             return Response({"error": "Invalid value for 'verified' (must be True or False)."},
#                             status=status.HTTP_400_BAD_REQUEST)

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=None)
#             student.verified = verified
#             # If we want to store rejection reasons, we would need to add a field to the model
#             # student.rejection_reason = reason if not verified and reason else None
#             student.save()
#             return Response({"message": "Student status updated successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

# class VerifiedStudentsView(APIView):
#     """Handles listing and rejecting verified students."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsManager]

#     def get(self, request):
#         """Return students who are verified (verified=True)."""
#         verified_students = StudentDataEntry.objects.filter(verified=True)
#         serializer = StudentDataEntrySerializer(verified_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Reject a verified student (set verified=False) by roll_no."""
#         roll_no = request.data.get('roll_no')
#         reason = request.data.get('reason')  # Optional rejection reason

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=True)
#             student.verified = False
#             # If we want to store rejection reasons, we would need to add a field to the model
#             # student.rejection_reason = reason if reason else None
#             student.save()
#             return Response({"message": "Student rejected successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

# class RejectedStudentsView(APIView):
#     """Handles listing and verifying rejected students."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsManager]

#     def get(self, request):
#         """Return students who are rejected (verified=False)."""
#         rejected_students = StudentDataEntry.objects.filter(verified=False)
#         serializer = StudentDataEntrySerializer(rejected_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Verify a rejected student (set verified=True) by roll_no."""
#         roll_no = request.data.get('roll_no')

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=False)
#             student.verified = True
#             # If we have a rejection_reason field, clear it
#             # student.rejection_reason = None
#             student.save()
#             return Response({"message": "Student verified successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or not rejected."}, status=status.HTTP_404_NOT_FOUND)

# class StudentDetailView(APIView):
#     """Handles retrieving detailed information for a specific student."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsManager]

#     def get(self, request, roll_no):
#         """Return detailed information for a specific student."""
#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no)
#             serializer = StudentDetailSerializer(student)
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

# class StudentsByYearView(APIView):
#     """Handles listing students filtered by year."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsManager]

#     def get(self, request, year):
#         """Return students filtered by year (class_name)."""
#         if year not in dict(StudentDataEntry.CLASS_CHOICES).keys():
#             return Response({"error": "Invalid year."}, status=status.HTTP_400_BAD_REQUEST)
            
#         students = StudentDataEntry.objects.filter(class_name=year)
#         serializer = StudentDataEntrySerializer(students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

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

class StudentsView(APIView):
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request):
        """List all students."""
        students = User.objects.filter(user_type="student")
        serializer = UserSerializer(students, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)
