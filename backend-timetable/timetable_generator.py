import random
class TimetableGenerator:


    def __init__(
        self,
        constraint,
        subjects,
        assignments,
        semester_list
    ):

        self.constraint = constraint
        self.subjects = subjects
        self.assignments = assignments
        self.semester_list = semester_list

        self.days = constraint["working_days"].split(",")

        self.periods = constraint["periods_per_day"]

        self.timetable = {}
        self.subject_faculty = {}
        self.faculty_schedule = {}
        self.faculty_morning_count = {}

    def create_empty_timetable(self):

        for sem in self.semester_list:

            self.timetable[sem] = {}

            for day in self.days:

                self.timetable[sem][day] = []

                for period in range(self.periods):
                    self.timetable[sem][day].append("Empty")

        return self.timetable

    def build_subject_faculty_map(self):

        for assignment in self.assignments:
            self.subject_faculty[assignment["subject_id"]] = {

                "faculty_id": assignment["faculty_id"],
                "faculty_name": assignment["faculty_name"]

            }

        return self.subject_faculty

    def initialize_faculty_schedule(self):

        for assignment in self.assignments:

            faculty_id = assignment["faculty_id"]

            if faculty_id not in self.faculty_schedule:

                self.faculty_schedule[faculty_id] = {}

                for day in self.days:

                    self.faculty_schedule[faculty_id][day] = []

                    for period in range(self.periods):
                        self.faculty_schedule[faculty_id][day].append(None)
                self.faculty_morning_count[faculty_id] = 0

        return self.faculty_schedule

    def is_faculty_available(
            self,
            faculty_id,
            day,
            period
    ):

        return self.faculty_schedule[faculty_id][day][period] is None

    def faculty_daily_workload(self, faculty_id, day):

        count = 0

        for period in range(self.periods):

            if self.faculty_schedule[faculty_id][day][period] is not None:
                count += 1

        return count

    def is_morning_period(self, period):
        return period < 3

    def assign_subject(
            self,
            semester,
            day,
            period,
            subject,
            faculty
    ):

        # 1. Put subject into timetable
        self.timetable[semester][day][period] = {

            "subject_id": subject["subject_id"],

            "subject_code": subject["subject_code"],

            "subject_type": subject["subject_type"],

            "faculty_id": faculty["faculty_id"],

            "faculty_name": faculty["faculty_name"]

        }

        # 2. Mark faculty as busy
        self.faculty_schedule[
            faculty["faculty_id"]
        ][day][period] = semester
        # Count morning periods (P1, P2, P3)
        if period < 3:
            self.faculty_morning_count[
                faculty["faculty_id"]
            ] += 1

    def generate(self):

        self.create_empty_timetable()

        self.build_subject_faculty_map()

        self.initialize_faculty_schedule()

        self.classify_subjects()

        self.allocate_lab_subjects()

        self.allocate_integrated_subjects()

        self.allocate_theory_subjects()
        self.validate_timetable()
        self.validate_faculty_clashes()
        self.validate_one_lab_per_day()
        print("\n========== FINAL TIMETABLE ==========")

        for semester in sorted(self.timetable.keys()):

            print(f"\nSemester {semester}")

            for day in self.days:

                print(day)

                for period, slot in enumerate(self.timetable[semester][day], start=1):

                    if slot == "Empty":
                        print(f"  P{period}: Empty")
                    else:
                        print(
                            f"  P{period}: "
                            f"{slot['subject_code']} "
                            f"({slot['faculty_name']})"
                        )

        return self.timetable

    def classify_subjects(self):

        self.theory_subjects = []
        self.lab_subjects = []
        self.integrated_subjects = []

        for subject in self.subjects:

            theory_hours = (
                    subject["lecture_hours"] +
                    subject["tutorial_hours"]
            )

            practical_hours = subject["practical_hours"]

            if theory_hours > 0 and practical_hours > 0:

                subject["subject_type"] = "Integrated"

                self.integrated_subjects.append(subject)

            elif practical_hours > 0:

                subject["subject_type"] = "Lab"

                self.lab_subjects.append(subject)

            else:

                subject["subject_type"] = "Theory"

                self.theory_subjects.append(subject)
    def is_subject_already_allocated(
            self,
            semester,
            day,
            subject_id
    ):

        for slot in self.timetable[semester][day]:

            if slot == "Empty":
                continue

            if slot["subject_id"] == subject_id:
                return True

        return False

    def is_lab_already_allocated(
            self,
            semester,
            day
    ):

        for period in range(self.periods - 1):

            current = self.timetable[semester][day][period]
            nxt = self.timetable[semester][day][period + 1]

            if current == "Empty" or nxt == "Empty":
                continue

            # Dedicated Lab
            if (
                    current["subject_type"] == "Lab" and
                    current["subject_id"] == nxt["subject_id"]
            ):
                return True

            # Integrated Practical
            if (
                    current["subject_type"] == "Integrated" and
                    current["subject_id"] == nxt["subject_id"]
            ):
                return True

        return False

    def allocate_theory_subjects(self):

        print("\n===== ALLOCATING THEORY SUBJECTS =====")

        for subject in self.theory_subjects:

            # Skip if no faculty assigned
            if subject["subject_id"] not in self.subject_faculty:
                continue

            faculty = self.subject_faculty[subject["subject_id"]]

            required_hours = (
                    subject["lecture_hours"] +
                    subject["tutorial_hours"]
            )

            allocated_hours = 0

            while allocated_hours < required_hours:
                valid_slots = []
                days = self.days.copy()
                for day in days:
                    # Stop when required hours are completed
                    if allocated_hours >= required_hours:
                        break

                    periods = list(range(self.periods))

                    # Prefer morning periods for faculty having fewer morning classes
                    periods = [0, 1, 2, 3, 4, 5, 6]

                    for period in periods:

                        # Slot already occupied
                        if self.timetable[subject["semester_id"]][day][period] != "Empty":
                            continue

                        # Same subject only once per day
                        if self.is_subject_already_allocated(
                                subject["semester_id"],
                                day,
                                subject["subject_id"]):
                            continue

                        # Faculty busy
                        if not self.is_faculty_available(
                                faculty["faculty_id"],
                                day,
                                period):
                            continue
                        # Maximum 4 theory periods per day
                        if self.faculty_daily_workload(
                                faculty["faculty_id"],
                                day) >= 4:
                            continue

                        # Allocate
                        valid_slots.append((day, period))
                if not valid_slots:
                    break
                valid_slots.sort(
                    key=lambda slot: (
                        slot[1],  # P1 → P7
                        self.days.index(slot[0])  # Monday → Friday
                    )
                )

                day, period = valid_slots[0]
                self.assign_subject(
                    subject["semester_id"],
                    day,
                    period,
                    subject,
                    faculty
                )
                allocated_hours += 1
                print(
                    f"{subject['subject_code']} -> "
                    f"{day} P{period + 1} "
                    f"({allocated_hours}/{required_hours})"
                )
                valid_slots.clear()

    def allocate_lab_subjects(self):

        print("\n===== ALLOCATING LAB SUBJECTS =====")

        for subject in self.lab_subjects:

            # Skip if no faculty assigned
            if subject["subject_id"] not in self.subject_faculty:
                continue

            faculty = self.subject_faculty[subject["subject_id"]]

            required_hours = subject["practical_hours"]
            allocated_hours = 0

            while allocated_hours < required_hours:

                valid_slots = []

                days = self.days.copy()
                for day in days:

                    # Only one lab per day
                    if self.is_lab_already_allocated(
                            subject["semester_id"],
                            day,

                    ):
                        continue

                    # Allowed Lab Slots
                    # P1-P2, P2-P3, P3-P4, P5-P6
                    allowed_start_periods = [0, 2, 4]
                    random.shuffle(allowed_start_periods)

                    for period in allowed_start_periods:

                        # Both periods must be empty
                        if self.timetable[subject["semester_id"]][day][period] != "Empty":
                            continue

                        if self.timetable[subject["semester_id"]][day][period + 1] != "Empty":
                            continue

                        # Faculty must be free
                        if not self.is_faculty_available(
                                faculty["faculty_id"],
                                day,
                                period):
                            continue

                        if not self.is_faculty_available(
                                faculty["faculty_id"],
                                day,
                                period + 1):
                            continue

                        # Subject should not already exist on the same day
                        if self.is_subject_already_allocated(
                                subject["semester_id"],
                                day,
                                subject["subject_id"]):
                            continue

                        valid_slots.append((day, period))

                # No valid slot found
                if not valid_slots:
                    print(
                        f"WARNING: Could not allocate "
                        f"{subject['subject_code']}"
                    )

                    break

                # Randomly choose one of the valid slots
                valid_slots.sort(
                    key=lambda slot: (
                        self.days.index(slot[0]),
                        slot[1]
                    )
                )

                # Choose randomly from the best available slots
                top_slots = valid_slots[:3] if len(valid_slots) >= 3 else valid_slots

                day, period = random.choice(top_slots)
                # Allocate first period
                print(
                    "LAB START:",
                    subject["subject_code"],
                    day,
                    "P", period + 1
                )
                self.assign_subject(
                    subject["semester_id"],
                    day,
                    period,
                    subject,
                    faculty
                )

                # Allocate second period
                self.assign_subject(
                    subject["semester_id"],
                    day,
                    period + 1,
                    subject,
                    faculty
                )

                allocated_hours += 2

                print(
                    f"{subject['subject_code']} -> "
                    f"{day} P{period + 1}-P{period + 2} "
                    f"({allocated_hours}/{required_hours})"
                )

    def allocate_integrated_subjects(self):

        print("\n===== ALLOCATING INTEGRATED SUBJECTS =====")

        for subject in self.integrated_subjects:

            if subject["subject_id"] not in self.subject_faculty:
                continue

            faculty = self.subject_faculty[subject["subject_id"]]

            theory_hours = (
                    subject["lecture_hours"] +
                    subject["tutorial_hours"]
            )

            practical_hours = subject["practical_hours"]

            print(f"\n{subject['subject_code']}")
            print(f"Theory Hours : {theory_hours}")
            print(f"Practical Hours : {practical_hours}")

            # ======================================
            # THEORY ALLOCATION
            # ======================================

            allocated_hours = 0

            while allocated_hours < theory_hours:

                valid_slots = []

                days = self.days.copy()

                for day in days:

                    periods = list(range(self.periods))

                    for period in periods:

                        # Slot must be empty
                        if self.timetable[subject["semester_id"]][day][period] != "Empty":
                            continue

                        # Subject only once per day
                        if self.is_subject_already_allocated(
                                subject["semester_id"],
                                day,
                                subject["subject_id"]):
                            continue

                        # Faculty must be free
                        if not self.is_faculty_available(
                                faculty["faculty_id"],
                                day,
                                period):
                            continue

                        valid_slots.append((day, period))

                if not valid_slots:
                    print(
                        f"WARNING: Could not allocate all theory hours for "
                        f"{subject['subject_code']}"
                    )

                    break

                valid_slots.sort(
                    key=lambda slot: (
                        self.days.index(slot[0]),
                        slot[1]
                    )
                )

                # Choose randomly from the best available slots
                top_slots = valid_slots[:3] if len(valid_slots) >= 3 else valid_slots

                day, period = random.choice(top_slots)
                print(
                    "INTEGRATED START:",
                    subject["subject_code"],
                    day,
                    "P", period + 1
                )

                self.assign_subject(
                    subject["semester_id"],
                    day,
                    period,
                    subject,
                    faculty
                )

                allocated_hours += 1

                print(
                    f"{subject['subject_code']} Theory -> "
                    f"{day} P{period + 1} "
                    f"({allocated_hours}/{theory_hours})"
                )

            # ======================================
            # PRACTICAL ALLOCATION
            # ======================================

            if practical_hours <= 0:
                continue

            allocated_practical = 0

            while allocated_practical < practical_hours:

                valid_slots = []
                practical_days = []

                for day in self.days:

                    for slot in self.timetable[subject["semester_id"]][day]:

                        if (
                                slot != "Empty" and
                                slot["subject_id"] == subject["subject_id"] and
                                slot["subject_type"] == "Integrated"
                        ):
                            practical_days.append(day)
                            break

                days = self.days.copy()
                random.shuffle(days)

                for day in days:
                    if day in practical_days:
                        continue

                    # Only one practical/lab per day
                    if self.is_lab_already_allocated(
                            subject["semester_id"],
                            day
                    ):
                        continue

                    allowed_start_periods = [0,2, 4]
                    random.shuffle(allowed_start_periods)

                    for period in allowed_start_periods:



                        # Both periods must be empty
                        if self.timetable[subject["semester_id"]][day][period] != "Empty":
                            continue

                        if self.timetable[subject["semester_id"]][day][period + 1] != "Empty":
                            continue

                        # Faculty must be free
                        if not self.is_faculty_available(
                                faculty["faculty_id"],
                                day,
                                period):
                            continue

                        if not self.is_faculty_available(
                                faculty["faculty_id"],
                                day,
                                period + 1):
                            continue

                        valid_slots.append((day, period))

                if not valid_slots:
                    print(
                        f"WARNING: Could not allocate practical for "
                        f"{subject['subject_code']}"
                    )

                    break

                valid_slots.sort(
                    key=lambda slot: (
                        self.days.index(slot[0]),
                        slot[1]
                    )
                )

                # Choose randomly from the best available slots
                top_slots = valid_slots[:3] if len(valid_slots) >= 3 else valid_slots

                day, period = random.choice(top_slots)
                self.assign_subject(
                    subject["semester_id"],
                    day,
                    period,
                    subject,
                    faculty
                )

                self.assign_subject(
                    subject["semester_id"],
                    day,
                    period + 1,
                    subject,
                    faculty
                )

                allocated_practical += 2

                print(
                    f"{subject['subject_code']} Practical -> "
                    f"{day} P{period + 1}-P{period + 2} "
                    f"({allocated_practical}/{practical_hours})"
                )
    def validate_timetable(self):

        print("\n========== VALIDATING TIMETABLE ==========")
        print("Checking subject hours...")

        allocated_hours = {}

        # Count allocated hours
        for semester in self.timetable:

            for day in self.days:

                for slot in self.timetable[semester][day]:

                    if slot == "Empty":
                        continue

                    subject_id = slot["subject_id"]

                    allocated_hours[subject_id] = (
                            allocated_hours.get(subject_id, 0) + 1
                    )

        # Compare allocated vs required
        for subject in self.subjects:

            required = (
                    subject["lecture_hours"] +
                    subject["tutorial_hours"] +
                    subject["practical_hours"]
            )

            allocated = allocated_hours.get(
                subject["subject_id"],
                0
            )

            if allocated == required:

                print(
                    f"✓ {subject['subject_code']} "
                    f"{allocated}/{required}"
                )

            else:

                print(
                    f"✗ {subject['subject_code']} "
                    f"{allocated}/{required}"
                )

    def validate_faculty_clashes(self):

        print("\n========== FACULTY CLASH VALIDATION ==========")

        faculty_slots = {}

        # Collect all faculty allocations
        for semester in self.timetable:

            for day in self.days:

                for period, slot in enumerate(self.timetable[semester][day]):

                    if slot == "Empty":
                        continue

                    faculty_id = slot["faculty_id"]

                    key = (faculty_id, day, period)

                    if key not in faculty_slots:
                        faculty_slots[key] = []

                    faculty_slots[key].append(
                        (
                            semester,
                            slot["subject_code"]
                        )
                    )

        # Check for clashes
        clash_found = False

        for key, classes in faculty_slots.items():

            if len(classes) > 1:

                clash_found = True

                faculty_id, day, period = key

                print(
                    f"CLASH -> Faculty {faculty_id} "
                    f"{day} P{period + 1}"
                )

                for sem, sub in classes:
                    print(
                        f"   Semester {sem} : {sub}"
                    )

        if not clash_found:
            print("✓ No Faculty Clashes Found")

    def validate_one_lab_per_day(self):

        print("\n========== ONE LAB PER DAY VALIDATION ==========")

        violation_found = False

        for semester in self.timetable:

            for day in self.days:

                lab_count = 0
                counted_subjects = set()

                for period in range(self.periods):
                    slot = self.timetable[semester][day][period]

                    if slot == "Empty":
                        continue

                    # Dedicated Lab
                    if slot["subject_type"] == "Lab":

                        if slot["subject_id"] not in counted_subjects:
                            counted_subjects.add(slot["subject_id"])
                            lab_count += 1

                    # Integrated Practical (only if it occupies two consecutive periods)
                    elif slot["subject_type"] == "Integrated":

                        if (
                                period < self.periods - 1
                                and self.timetable[semester][day][period + 1] != "Empty"
                                and self.timetable[semester][day][period + 1]["subject_id"] == slot["subject_id"]
                        ):

                            if slot["subject_id"] not in counted_subjects:
                                counted_subjects.add(slot["subject_id"])
                                lab_count += 1

                if lab_count > 1:

                    violation_found = True

                    print(
                        f"❌ Semester {semester} {day} "
                        f"has {lab_count} practicals"
                    )

                else:

                    print(
                        f"✓ Semester {semester} {day}"
                    )

        if not violation_found:
            print("\n✓ One Lab Per Day Rule Satisfied")