from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import StudentDataEntry
from .serializers import StudentDataEntrySerializer
from authentication.permissions import IsRector, IsWarden
from rest_framework.permissions import IsAuthenticated
from .models  import SelectDates
from rest_framework_simplejwt.authentication import JWTAuthentication

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

class setDatesView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        #fetching the dates from database 
        dates=SelectDates.objects.all().values('event_id','event','start_date','end_date')
    #mapping the dates for the dictionary in frontend 
        date_dict={
            'registrationStart': dates.filter(event='Registration Start').first().start_date.isoformat() if dates.filter(event='Registration Start').exists() else '',
                'registrationEnd': dates.filter(event='Registration End').first().end_date.isoformat() if dates.filter(event='Registration End').exists() else '',
                'resultDeclaration': dates.filter(event='Result Declaration').first().start_date.isoformat() if dates.filter(event='Result Declaration').exists() else '',
                'roommakingStart': dates.filter(event='Room Making Start').first().start_date.isoformat() if dates.filter(event='Room Making Start').exists() else '',
                'roommakingEnd': dates.filter(event='Room Making End').first().end_date.isoformat() if dates.filter(event='Room Making End').exists() else '',
                'finalAllotment': dates.filter(event='Final Allotment').first().start_date.isoformat() if dates.filter(event='Final Allotment').exists() else '',
                'verificationStart': dates.filter(event='Verification Start').first().start_date.isoformat() if dates.filter(event='Verification Start').exists() else '',
                'verificationEnd': dates.filter(event='Verification End').first().end_date.isoformat() if dates.filter(event='Verification End').exists() else '',
        }
        return Response(date_dict)
    def post(self,request):
        #save the dates or set new dates 
        data=request.data
        for event_key, date_value in data.items():
            if date_value:  # Only update if a date is provided
                event_name = event_key.replace('_', ' ').title()
                obj, created = SelectDates.objects.update_or_create(
                    event=event_name,
                    defaults={
                        'start_date': date_value if 'Start' in event_name or 'Declaration' in event_name or 'Allotment' in event_name else None,
                        'end_date': date_value if 'End' in event_name else None
                    }
                )
        return Response({"message": "Dates saved successfully"}, status=200)