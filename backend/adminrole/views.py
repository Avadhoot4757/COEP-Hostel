from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import StudentDataEntry
from .serializers import *
from authentication.permissions import IsRector, IsWarden
from rest_framework.permissions import IsAuthenticated
from .models  import *
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone

class PendingStudentsView(APIView):
    """Handles listing and verifying/rejecting pending students."""

    def get(self, request):
        """Return students with verified=None (pending verification)."""
        pending_students = StudentDataEntry.objects.filter(verified=None)
        serializer = StudentDataEntrySerializer(pending_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Verify (True) or Reject (False) a student by roll_no."""
        roll_no = request.data.get('roll_no')
        verified = request.data.get('verified')  # Expecting True or False

        if verified not in [True, False]:
            return Response({"error": "Invalid value for 'verified' (must be True or False)."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=None)
            student.verified = verified
            student.save()
            return Response({"message": "Student status updated successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

class VerifiedStudentsView(APIView):
    """Handles listing and rejecting verified students."""

    def get(self, request):
        """Return students who are verified (verified=True)."""
        verified_students = StudentDataEntry.objects.filter(verified=True)
        serializer = StudentDataEntrySerializer(verified_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Reject a verified student (set verified=False) by roll_no."""
        roll_no = request.data.get('roll_no')

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=True)
            student.verified = False
            student.save()
            return Response({"message": "Student rejected successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

class RejectedStudentsView(APIView):
    """Handles listing and verifying rejected students."""

    def get(self, request):
        """Return students who are rejected (verified=False)."""
        rejected_students = StudentDataEntry.objects.filter(verified=False)
        serializer = StudentDataEntrySerializer(rejected_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Verify a rejected student (set verified=True) by roll_no."""
        roll_no = request.data.get('roll_no')

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=False)
            student.verified = True
            student.save()
            return Response({"message": "Student verified successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or not rejected."}, status=status.HTTP_404_NOT_FOUND)


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

        results = []
        errors = []

        # Validate years
        all_years = {item.get("years", []) for item in data}
        if len(all_years) > 1:
            return Response(
                {"error": "All events must apply to the same years."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        years = all_years.pop() if all_years else []

        # Clear existing dates for unselected years (optional, if cleanup needed)
        # SelectDates.objects.exclude(year__in=years).delete()

        for item in data:
            serializer = SelectDatesSerializer(data=item, context={"request": request})
            if serializer.is_valid():
                serializer.save()
                results.append({"event": item["event"], "status": "success"})
            else:
                errors.append({"event": item.get("event"), "errors": serializer.errors})

        if errors:
            return Response(
                {"results": results, "errors": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Dates saved successfully", "results": results},
            status=status.HTTP_200_OK,
        )
