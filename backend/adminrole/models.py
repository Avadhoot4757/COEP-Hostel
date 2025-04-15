from django.db import models


class SelectDates(models.Model):
    EVENT_CHOICES = (
        ("Registration", "Registration"),
        ("Student Data Verification", "Student Data Verification"),
        ("Result Declaration", "Result Declaration"),
        ("Roommaking", "Roommaking"),
        ("Final Allotment", "Final Allotment"),
        ("Verification", "Verification"),
    )
    YEAR_CHOICES = (
        ("fy", "First Year"),
        ("sy", "Second Year"),
        ("ty", "Third Year"),
        ("btech", "Fourth Year"),
    )

    event_id = models.IntegerField()
    event = models.CharField(max_length=100, choices=EVENT_CHOICES)
    year = models.CharField(max_length=20, choices=YEAR_CHOICES, default="first_year")
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.event} - {self.year} (ID: {self.event_id}, {self.start_date} - {self.end_date or 'N/A'})"

    class Meta:
        ordering = ["year", "event_id"]
        unique_together = ["event_id", "year"]
