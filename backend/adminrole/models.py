from django.db import models

class SelectDates(models.Model):
    EVENT_CHOICES = (
        ("Open Registrations", "Open Registrations"),
        ("Open Room Preferences", "Open Room Preferences"),
    )
    YEAR_CHOICES = (
        ("fy", "First Year"),
        ("sy", "Second Year"),
        ("ty", "Third Year"),
        ("btech", "Fourth Year"),
    )

    event = models.CharField(max_length=100, choices=EVENT_CHOICES)
    year = models.CharField(max_length=20, choices=YEAR_CHOICES, default="fy")
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.event} - {self.year} (ID: {self.start_date} - {self.end_date or 'N/A'})"

class ReservedSeat(models.Model):
    JandK = models.IntegerField(default=0)
    GULFNPIPIOFN = models.IntegerField(default=0)
    PWD=models.IntegerField(default=0)

    def __str__(self):
        return f"Reserved Seats: GOI & J&K: {self.goi_jk_seats}, NRI/FN/PIO/Gulf: {self.nri_fn_pio_gulf_seats}"

class SeatMatrix(models.Model):
    YEAR_CHOICES = (
        ("fy", "First Year"),
        ("sy", "Second Year"),
        ("ty", "Third Year"),
        ("btech", "Fourth Year"),
    )
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
    ]

    year = models.CharField(max_length=10, choices=YEAR_CHOICES)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    total_seats = models.IntegerField()
    ews_seats = models.IntegerField()
    all_india_seats = models.IntegerField()
    branch_seats = models.JSONField()  # Stores seat matrix as JSON
    reserved_seats = models.ForeignKey('ReservedSeat', on_delete=models.CASCADE, null=True)

    class Meta:
        unique_together = ('year', 'gender')

    def __str__(self):
        return f"{self.year} - {self.gender} Seat Matrix"

class AllotmentHistory(models.Model):
    year = models.CharField(max_length=10)  # e.g., 'ty'
    gender = models.CharField(max_length=10)  # e.g., 'male'
    allotment_date = models.DateTimeField(auto_now_add=True)
    is_manual_override = models.BooleanField(default=False)  # Allows manual re-allocation

    class Meta:
        unique_together = ('year', 'gender')

    def __str__(self):
        return f"Allotment for {self.year} - {self.gender}"