from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import StudentDataEntry
from .serializers import StudentDataEntrySerializer

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

