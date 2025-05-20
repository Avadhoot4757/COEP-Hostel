# allotment/cron.py
from authentication.models import StudentDataEntry, Branch
import math
import logging

logger = logging.getLogger(__name__)

def assign_branch_ranks():
    logger.info("Starting branch rank assignment...")

    # Get all branches, genders, and years
    branches = Branch.objects.all()
    genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
    years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]

    for year in years:
        for branch in branches:
            for gender in genders:
                # Filter students by year, branch, and gender
                students = StudentDataEntry.objects.filter(
                    class_name=year,
                    branch=branch,
                    gender=gender
                )

                if not students.exists():
                    logger.info(f"No students for year {year}, branch {branch}, gender {gender}")
                    continue

                ranked_students = []

                if year in ['sy', 'ty', 'btech']:
                    # Order by CGPA descending for sy, ty, btech
                    ranked_students = list(students.order_by('-cgpa'))
                else:
                    # FY: separate MHT-CET and JEE, interleave by proportion
                    cet_students = students.filter(entrance_exam='mht_cet').order_by('rank')
                    jee_students = students.filter(entrance_exam='jee_mains').order_by('rank')

                    cet_count = cet_students.count()
                    jee_count = jee_students.count()

                    if cet_count == 0 and jee_count == 0:
                        continue
                    elif cet_count == 0:
                        ranked_students = list(jee_students)
                    elif jee_count == 0:
                        ranked_students = list(cet_students)
                    else:
                        # Calculate interleaving interval (e.g., 10:1 → 10 CET per JEE)
                        interval = math.ceil(cet_count / jee_count) if jee_count > 0 else cet_count
                        cet_list = list(cet_students)
                        jee_list = list(jee_students)
                        cet_idx = 0
                        jee_idx = 0
                        fy_ranked = []

                        while cet_idx < len(cet_list) or jee_idx < len(jee_list):
                            # Add up to `interval` CET students
                            for _ in range(interval):
                                if cet_idx < len(cet_list):
                                    fy_ranked.append(cet_list[cet_idx])
                                    cet_idx += 1
                            # Add 1 JEE student
                            if jee_idx < len(jee_list):
                                fy_ranked.append(jee_list[jee_idx])
                                jee_idx += 1
                            # If no JEE left, add remaining CET
                            if jee_idx >= len(jee_list) and cet_idx < len(cet_list):
                                fy_ranked.extend(cet_list[cet_idx:])
                                cet_idx = len(cet_list)

                        ranked_students = fy_ranked

                # Assign branch_rank
                for rank, student in enumerate(ranked_students, 1):
                    if student.branch_rank != rank:
                        student.branch_rank = rank
                        student.save(update_fields=['branch_rank'])

                logger.info(
                    f"Assigned ranks for year {year}, branch {branch}, gender {gender}: "
                    f"{len(ranked_students)} students"
                )

    logger.info("Branch rank assignment completed")
