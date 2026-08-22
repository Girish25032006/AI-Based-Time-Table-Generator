import json
import random
from collections import defaultdict


class TimetableGenerator:
    """
    Constraint-based timetable generator.

    RULES
    -----
    1. 0-credit subjects -> Saturday only.
    2. Normal credit subjects -> Monday-Friday only.
    3. 1-credit subject -> 1 theory period/week.
    4. 2/3/4+ credit subject -> 4 theory periods/week.
    5. Any practical subject -> exactly ONE lab session/week.
    6. Every lab occupies exactly 2 consecutive periods.
    7. Valid lab blocks ONLY:
          P1-P2
          P3-P4
          P5-P6
    8. Maximum ONE lab per semester per day.
    9. Same subject cannot occur twice on the same day.
    10. No FREE period is allowed between two classes.
    11. FREE periods are allowed only before the first class
        or after the last class of a day.
    12. Faculty cannot teach two semesters at the same time.
    13. Faculty daily workload is respected.
    14. Faculty weekly max workload is respected.
    15. Semester cannot have two subjects in one period.
    """

    def __init__(self, constraint, subjects, assignments, semester_list):

        self.constraint = constraint or {}

        self.subjects = self._dedupe_subjects(subjects or [])
        self.assignments = assignments or []

        self.semester_list = [
            int(x) for x in semester_list
        ]

        self.days = self._parse_days(
            self.constraint.get(
                "working_days",
                [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ],
            )
        )

        self.periods = self._parse_periods(
            self.constraint.get("periods", 7)
        )

        self.faculty_daily_limit = int(
            self.constraint.get(
                "faculty_daily_limit"
            ) or 4
        )

        self.subject_map = {}
        self.subject_code_map = {}

        self.assignment_map = {}
        self.assignment_code_map = {}

        self.faculty_max = {}

        self.grid = {}
        self.faculty_grid = {}

        self.faculty_week_load = defaultdict(int)

        self.subject_day = defaultdict(set)

        self.semester_lab_days = defaultdict(set)

        self.failed_subjects = []

        self.nodes = 0

    # =========================================================
    # BASIC HELPERS
    # =========================================================

    @staticmethod
    def _int(value, default=0):
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _float(value, default=0.0):
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _dedupe_subjects(subjects):

        unique = {}

        for subject in subjects:

            semester = int(
                subject.get("semester_id") or 0
            )

            code = str(
                subject.get("subject_code") or ""
            ).strip().upper()

            subject_id = subject.get(
                "subject_id"
            )

            key = (
                semester,
                code if code else subject_id
            )

            if key not in unique:
                unique[key] = dict(subject)

        return list(unique.values())

    @staticmethod
    def _parse_days(value):

        if isinstance(value, list):

            return [
                str(x).strip()
                for x in value
                if str(x).strip()
            ]

        if isinstance(value, str):

            text = value.strip()

            if text.startswith("["):

                try:

                    parsed = json.loads(text)

                    return [
                        str(x).strip()
                        for x in parsed
                        if str(x).strip()
                    ]

                except Exception:
                    pass

            return [
                x.strip()
                for x in text.split(",")
                if x.strip()
            ]

        return [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ]

    @staticmethod
    def _parse_periods(value):

        if isinstance(value, list):

            return len(value) or 7

        try:
            return int(value)

        except (TypeError, ValueError):
            return 7

    # =========================================================
    # SUBJECT TYPE
    # =========================================================

    def _type(self, subject):

        practical = self._int(
            subject.get("practical_hours")
        )

        lecture = self._int(
            subject.get("lecture_hours")
        )

        tutorial = self._int(
            subject.get("tutorial_hours")
        )

        explicit = str(
            subject.get("subject_type") or ""
        ).lower()

        if (
            "lab" in explicit
            or "practical" in explicit
        ):
            return "Lab"

        if "integrated" in explicit:
            return "Integrated"

        if "theory" in explicit:
            return "Theory"

        if (
            practical > 0
            and (
                lecture > 0
                or tutorial > 0
            )
        ):
            return "Integrated"

        if practical > 0:
            return "Lab"

        return "Theory"

    def _is_zero_credit(self, subject):

        return (
            self._float(
                subject.get("credits")
            ) == 0
        )

    # =========================================================
    # ALLOWED DAYS
    # =========================================================

    def _allowed_days(self, subject):

        # 0-credit -> Saturday only
        if self._is_zero_credit(subject):

            return [
                d for d in self.days
                if d.lower() == "saturday"
            ]

        # Normal subjects -> Monday-Friday
        return [
            d for d in self.days
            if d.lower() != "saturday"
        ]

    # =========================================================
    # THEORY OCCURRENCES
    # =========================================================

    def _theory_occurrences(self, subject):

        credits = self._float(
            subject.get("credits")
        )

        if credits <= 0:
            return 0

        if credits == 1:
            return 1

        # 2, 3, 4+ credits
        return 4

    # =========================================================
    # LAB
    # =========================================================

    def _practical_blocks(self, subject):

        practical = self._int(
            subject.get("practical_hours")
        )

        if practical <= 0:
            return []

        # EXACTLY ONE lab session.
        # EXACTLY TWO periods.
        return [2]

    # =========================================================
    # BUILD TASKS
    # =========================================================

    def _build_tasks(self):

        tasks = []

        seen_subjects = set()

        for subject in self.subjects:

            subject_id = int(
                subject["subject_id"]
            )

            semester = int(
                subject["semester_id"]
            )

            code = str(
                subject.get("subject_code") or ""
            ).strip().upper()

            unique_key = (
                semester,
                code if code else subject_id
            )

            if unique_key in seen_subjects:
                continue

            seen_subjects.add(unique_key)

            if subject_id not in self.assignment_map:
                continue

            # -------------------------------------------------
            # ZERO CREDIT
            # -------------------------------------------------

            if self._is_zero_credit(subject):

                tasks.append({
                    "subject": subject,
                    "semester": semester,
                    "kind": "zero",
                    "length": 1,
                    "block_index": None,
                    "priority": 0,
                })

                continue

            # -------------------------------------------------
            # LAB
            # -------------------------------------------------

            for block_index, length in enumerate(
                self._practical_blocks(subject)
            ):

                tasks.append({
                    "subject": subject,
                    "semester": semester,
                    "kind": "lab",
                    "length": length,
                    "block_index": block_index,
                    "priority": 0,
                })

            # -------------------------------------------------
            # THEORY
            # -------------------------------------------------

            theory_count = self._theory_occurrences(
                subject
            )

            for _ in range(theory_count):

                tasks.append({
                    "subject": subject,
                    "semester": semester,
                    "kind": "theory",
                    "length": 1,
                    "block_index": None,
                    "priority": 1,
                })

        # -----------------------------------------------------
        # SORT MOST CONSTRAINED FIRST
        # -----------------------------------------------------

        counts = defaultdict(int)

        for task in tasks:

            key = (
                int(task["semester"]),
                str(
                    task["subject"].get(
                        "subject_code"
                    ) or ""
                ).upper(),
            )

            counts[key] += 1

        tasks.sort(
            key=lambda task: (
                task["priority"],
                -task["length"],
                -counts[
                    (
                        int(task["semester"]),
                        str(
                            task["subject"].get(
                                "subject_code"
                            ) or ""
                        ).upper(),
                    )
                ],
                -self._float(
                    task["subject"].get(
                        "credits"
                    )
                ),
                random.random(),
            )
        )

        print(
            "TASK COUNTS:",
            {
                "lab": sum(
                    t["kind"] == "lab"
                    for t in tasks
                ),
                "theory": sum(
                    t["kind"] == "theory"
                    for t in tasks
                ),
                "zero": sum(
                    t["kind"] == "zero"
                    for t in tasks
                ),
            },
        )

        return tasks

    # =========================================================
    # BUILD DATABASE MAPS
    # =========================================================

    def _build_maps(self):

        self.subject_map = {
            int(s["subject_id"]): s
            for s in self.subjects
        }

        self.subject_code_map = {
            str(
                s.get("subject_code") or ""
            ).strip().upper(): s
            for s in self.subjects
            if str(
                s.get("subject_code") or ""
            ).strip()
        }

        self.assignment_map = {}
        self.assignment_code_map = {}

        for assignment in self.assignments:

            subject_id = int(
                assignment["subject_id"]
            )

            if subject_id not in self.assignment_map:

                self.assignment_map[
                    subject_id
                ] = assignment

            code = str(
                assignment.get(
                    "subject_code"
                ) or ""
            ).strip().upper()

            if code:

                if code not in self.assignment_code_map:

                    self.assignment_code_map[
                        code
                    ] = assignment

        # Match assignments by subject code
        for code, assignment in (
            self.assignment_code_map.items()
        ):

            subject = self.subject_code_map.get(
                code
            )

            if subject:

                self.assignment_map[
                    int(subject["subject_id"])
                ] = assignment

        # -----------------------------------------------------
        # FACULTY MAX WORKLOAD
        # -----------------------------------------------------

        self.faculty_max = {}

        for assignment in self.assignments:

            for key in (
                "faculty_id",
                "lab_faculty_id",
                "lab_co_faculty_id",
            ):

                faculty_id = assignment.get(
                    key
                )

                if faculty_id is None:
                    continue

                try:
                    faculty_id = int(faculty_id)
                except (
                    TypeError,
                    ValueError,
                ):
                    continue

                maximum = self._int(
                    assignment.get(
                        "max_workload"
                    ),
                    18,
                )

                self.faculty_max[
                    faculty_id
                ] = maximum

    # =========================================================
    # FACULTY
    # =========================================================

    def _faculty_ids_for_task(
        self,
        subject,
        kind,
    ):

        subject_id = int(
            subject["subject_id"]
        )

        assignment = self.assignment_map.get(
            subject_id,
            self.assignment_code_map.get(
                str(
                    subject.get(
                        "subject_code"
                    ) or ""
                ).strip().upper(),
                {},
            ),
        )

        faculty_ids = []

        # 0-credit subjects don't consume
        # normal faculty workload.
        if kind == "zero":
            return faculty_ids

        if kind == "lab":

            lab_faculty_id = assignment.get(
                "lab_faculty_id"
            )

            co_faculty_id = assignment.get(
                "lab_co_faculty_id"
            )

            normal_faculty_id = assignment.get(
                "faculty_id"
            )

            for value in (
                lab_faculty_id,
                co_faculty_id,
            ):

                if value is None:
                    continue

                try:
                    faculty_id = int(value)
                except (
                    TypeError,
                    ValueError,
                ):
                    continue

                if faculty_id not in faculty_ids:

                    faculty_ids.append(
                        faculty_id
                    )

            # Fallback to normal faculty
            if (
                not faculty_ids
                and normal_faculty_id is not None
            ):

                faculty_ids.append(
                    int(normal_faculty_id)
                )

        else:

            faculty_id = assignment.get(
                "faculty_id"
            )

            if faculty_id is not None:

                faculty_ids.append(
                    int(faculty_id)
                )

        return faculty_ids

    # =========================================================
    # RESET GRID
    # =========================================================

    def _reset(self):

        self.grid = {
            semester: {
                day: ["Empty"] * self.periods
                for day in self.days
            }
            for semester in self.semester_list
        }

        faculty_ids = set()

        for assignment in self.assignment_map.values():

            for key in (
                "faculty_id",
                "lab_faculty_id",
                "lab_co_faculty_id",
            ):

                value = assignment.get(key)

                if value is not None:

                    try:
                        faculty_ids.add(
                            int(value)
                        )
                    except (
                        TypeError,
                        ValueError,
                    ):
                        pass

        self.faculty_grid = {
            faculty_id: {
                day: [None] * self.periods
                for day in self.days
            }
            for faculty_id in faculty_ids
        }

        self.faculty_week_load = defaultdict(
            int
        )

        self.subject_day = defaultdict(
            set
        )

        self.semester_lab_days = defaultdict(
            set
        )

        self.failed_subjects = []

        self.nodes = 0

    # =========================================================
    # GRID HELPERS
    # =========================================================

    def _faculty_available(
        self,
        faculty_id,
        day,
        period,
    ):

        return (
            faculty_id in self.faculty_grid
            and self.faculty_grid[
                faculty_id
            ][day][period] is None
        )

    def _semester_free(
        self,
        semester,
        day,
        period,
    ):

        return (
            self.grid[
                semester
            ][day][period] == "Empty"
        )

    def _faculty_daily_load(
        self,
        faculty_id,
        day,
    ):

        if faculty_id not in self.faculty_grid:
            return 0

        return sum(
            value is not None
            for value in self.faculty_grid[
                faculty_id
            ][day]
        )

    # =========================================================
    # NO-GAP CHECK
    # =========================================================

    def _no_gap_after_placement(
        self,
        semester,
        day,
        start,
        length,
    ):
        """
        HARD RULE:

        A timetable day cannot contain:

            CLASS CLASS FREE CLASS

        or:

            CLASS FREE CLASS

        Once classes start, all periods until the
        last class must be continuously occupied.

        Allowed:

            FREE FREE CLASS CLASS CLASS FREE FREE

        Also allowed:

            CLASS CLASS CLASS FREE FREE FREE

        The rule is checked BEFORE placing a task.
        """

        occupied = set()

        # Existing classes
        for period, value in enumerate(
            self.grid[semester][day]
        ):

            if value != "Empty":

                occupied.add(period)

        # New task
        for period in range(
            start,
            start + length,
        ):

            occupied.add(period)

        if not occupied:
            return True

        first_period = min(
            occupied
        )

        last_period = max(
            occupied
        )

        # Every period between first
        # and last MUST be occupied.
        for period in range(
            first_period,
            last_period + 1,
        ):

            if period not in occupied:

                return False

        return True

    # =========================================================
    # CAN PLACE
    # =========================================================

    def _can_place(
        self,
        task,
        day,
        start,
    ):

        subject = task["subject"]

        semester = int(
            task["semester"]
        )

        length = int(
            task["length"]
        )

        kind = task["kind"]

        # Period range
        if (
            start < 0
            or start + length > self.periods
        ):

            return False

        # Allowed day
        if day not in self._allowed_days(
            subject
        ):

            return False

        subject_id = int(
            subject["subject_id"]
        )

        # -----------------------------------------------------
        # ZERO CREDIT
        # -----------------------------------------------------

        if kind == "zero":

            return all(
                self._semester_free(
                    semester,
                    day,
                    period,
                )
                for period in range(
                    start,
                    start + length,
                )
            )

        # -----------------------------------------------------
        # SAME SUBJECT SAME DAY
        # -----------------------------------------------------

        if day in self.subject_day[
            subject_id
        ]:

            return False

        # -----------------------------------------------------
        # ONE LAB PER DAY
        # -----------------------------------------------------

        if (
            kind == "lab"
            and day in self.semester_lab_days[
                semester
            ]
        ):

            return False

        # -----------------------------------------------------
        # LAB BLOCK RULE
        # -----------------------------------------------------

        if kind == "lab":

            if start not in (
                0,
                2,
                4,
            ):

                return False

            if length != 2:
                return False

        # -----------------------------------------------------
        # SEMESTER SLOT CHECK
        # -----------------------------------------------------

        for period in range(
            start,
            start + length,
        ):

            if not self._semester_free(
                semester,
                day,
                period,
            ):

                return False

        # -----------------------------------------------------
        # NO FREE BETWEEN CLASSES
        # -----------------------------------------------------

        if not self._no_gap_after_placement(
            semester,
            day,
            start,
            length,
        ):

            return False

        # -----------------------------------------------------
        # FACULTY
        # -----------------------------------------------------

        faculty_ids = (
            self._faculty_ids_for_task(
                subject,
                kind,
            )
        )

        if not faculty_ids:

            return False

        for faculty_id in faculty_ids:

            if faculty_id not in self.faculty_grid:

                return False

            maximum = self.faculty_max.get(
                faculty_id,
                18,
            )

            daily_load = (
                self._faculty_daily_load(
                    faculty_id,
                    day,
                )
            )

            if (
                daily_load + length
                > self.faculty_daily_limit
            ):

                return False

            if (
                self.faculty_week_load[
                    faculty_id
                ] + length
                > maximum
            ):

                return False

            for period in range(
                start,
                start + length,
            ):

                if not self._faculty_available(
                    faculty_id,
                    day,
                    period,
                ):

                    return False

        return True

    # =========================================================
    # ENTRY
    # =========================================================

    def _entry(self, task):

        subject = task["subject"]

        assignment = self.assignment_map[
            int(subject["subject_id"])
        ]

        if task["kind"] == "lab":

            faculty_id = assignment.get(
                "lab_faculty_id"
            )

            faculty_name = (
                assignment.get(
                    "lab_faculty_name"
                )
                or assignment.get(
                    "faculty_name",
                    "",
                )
            )

        else:

            faculty_id = assignment.get(
                "faculty_id"
            )

            faculty_name = assignment.get(
                "faculty_name",
                "",
            )

        return {
            "subject_id": int(
                subject["subject_id"]
            ),
            "subject_code": subject.get(
                "subject_code",
                "",
            ),
            "subject_name": subject.get(
                "subject_name",
                "",
            ),
            "subject_type": (
                "Lab"
                if task["kind"] == "lab"
                else "Theory"
            ),
            "is_lab": (
                task["kind"] == "lab"
            ),
            "faculty_id": faculty_id,
            "faculty_name": faculty_name,
        }

    # =========================================================
    # PLACE
    # =========================================================

    def _place(
        self,
        task,
        day,
        start,
    ):

        entry = self._entry(task)

        semester = int(
            task["semester"]
        )

        subject = task["subject"]

        subject_id = int(
            subject["subject_id"]
        )

        faculty_ids = (
            self._faculty_ids_for_task(
                subject,
                task["kind"],
            )
        )

        length = int(
            task["length"]
        )

        for period in range(
            start,
            start + length,
        ):

            self.grid[
                semester
            ][day][period] = dict(
                entry
            )

            for faculty_id in faculty_ids:

                self.faculty_grid[
                    faculty_id
                ][day][period] = semester

                self.faculty_week_load[
                    faculty_id
                ] += 1

        self.subject_day[
            subject_id
        ].add(day)

        if task["kind"] == "lab":

            self.semester_lab_days[
                semester
            ].add(day)

    # =========================================================
    # REMOVE
    # =========================================================

    def _remove(
        self,
        task,
        day,
        start,
    ):

        semester = int(
            task["semester"]
        )

        subject = task["subject"]

        subject_id = int(
            subject["subject_id"]
        )

        faculty_ids = (
            self._faculty_ids_for_task(
                subject,
                task["kind"],
            )
        )

        length = int(
            task["length"]
        )

        for period in range(
            start,
            start + length,
        ):

            self.grid[
                semester
            ][day][period] = "Empty"

            for faculty_id in faculty_ids:

                self.faculty_grid[
                    faculty_id
                ][day][period] = None

                self.faculty_week_load[
                    faculty_id
                ] -= 1

        self.subject_day[
            subject_id
        ].discard(day)

        if task["kind"] == "lab":

            still_has_lab = any(
                value != "Empty"
                and value.get("is_lab")
                for value in self.grid[
                    semester
                ][day]
            )

            if not still_has_lab:

                self.semester_lab_days[
                    semester
                ].discard(day)

    # =========================================================
    # LAB BLOCK COUNTS
    # =========================================================

    def _lab_block_counts(
        self,
        semester,
    ):

        counts = {
            0: 0,
            2: 0,
            4: 0,
        }

        for day in self.days:

            slots = self.grid[
                semester
            ][day]

            for start in (
                0,
                2,
                4,
            ):

                if start + 1 >= len(slots):
                    continue

                first = slots[start]
                second = slots[start + 1]

                if (
                    first != "Empty"
                    and second != "Empty"
                    and first.get("is_lab")
                    and second.get("is_lab")
                    and int(
                        first["subject_id"]
                    )
                    == int(
                        second["subject_id"]
                    )
                ):

                    counts[start] += 1

        return counts

    # =========================================================
    # CANDIDATES
    # =========================================================

    def _candidates(self, task):

        candidates = []

        subject = task["subject"]

        semester = int(
            task["semester"]
        )

        allowed_days = (
            self._allowed_days(subject)
        )

        # -----------------------------------------------------
        # LAB
        # -----------------------------------------------------

        if task["kind"] == "lab":

            valid_starts = [
                0,
                2,
                4,
            ]

            lab_counts = (
                self._lab_block_counts(
                    semester
                )
            )

            ordered_starts = sorted(
                valid_starts,
                key=lambda start: (
                    lab_counts[start],
                    random.random(),
                ),
            )

            starts_by_day = {
                day: list(
                    ordered_starts
                )
                for day in allowed_days
            }

        # -----------------------------------------------------
        # THEORY / ZERO CREDIT
        # -----------------------------------------------------

        else:

            starts_by_day = {}

            max_start = (
                self.periods
                - task["length"]
            )

            for day in allowed_days:

                starts = list(
                    range(
                        max_start + 1
                    )
                )

                random.shuffle(
                    starts
                )

                starts_by_day[
                    day
                ] = starts

        # -----------------------------------------------------
        # BUILD CANDIDATES
        # -----------------------------------------------------

        for day in allowed_days:

            for start in starts_by_day.get(
                day,
                [],
            ):

                # Lab ONLY P1-P2 / P3-P4 / P5-P6
                if (
                    task["kind"] == "lab"
                    and start not in (
                        0,
                        2,
                        4,
                    )
                ):

                    continue

                if not self._can_place(
                    task,
                    day,
                    start,
                ):

                    continue

                # -------------------------------------------------
                # COMPACTNESS
                # -------------------------------------------------

                occupied = set()

                for period, value in enumerate(
                    self.grid[
                        semester
                    ][day]
                ):

                    if value != "Empty":

                        occupied.add(
                            period
                        )

                for period in range(
                    start,
                    start + task["length"],
                ):

                    occupied.add(
                        period
                    )

                if occupied:

                    first = min(
                        occupied
                    )

                    last = max(
                        occupied
                    )

                    internal_gaps = sum(
                        1
                        for period in range(
                            first,
                            last + 1,
                        )
                        if period not in occupied
                    )

                    leading_gap = first
                    ending = last

                else:

                    internal_gaps = 0
                    leading_gap = 0
                    ending = 0

                faculty_ids = (
                    self._faculty_ids_for_task(
                        subject,
                        task["kind"],
                    )
                )

                faculty_daily = sum(
                    self._faculty_daily_load(
                        faculty_id,
                        day,
                    )
                    for faculty_id
                    in faculty_ids
                )

                faculty_weekly = sum(
                    self.faculty_week_load[
                        faculty_id
                    ]
                    for faculty_id
                    in faculty_ids
                )

                # -------------------------------------------------
                # LAB DISTRIBUTION SCORE
                # -------------------------------------------------

                if task["kind"] == "lab":

                    block_count = (
                        lab_counts.get(
                            start,
                            0,
                        )
                    )

                    score = (
                        block_count,
                        internal_gaps,
                        leading_gap,
                        ending,
                        faculty_daily,
                        faculty_weekly,
                        random.random(),
                    )

                else:

                    score = (
                        internal_gaps,
                        leading_gap,
                        ending,
                        faculty_daily,
                        faculty_weekly,
                        random.random(),
                    )

                candidates.append(
                    (
                        score,
                        day,
                        start,
                    )
                )

        candidates.sort(
            key=lambda x: x[0]
        )

        return candidates

    # =========================================================
    # BACKTRACKING SOLVER
    # =========================================================

    def _solve(
        self,
        tasks,
        index=0,
        max_nodes=500000,
    ):

        if index >= len(tasks):

            return True

        self.nodes += 1

        if self.nodes > max_nodes:

            return False

        # -----------------------------------------------------
        # Find most constrained task
        # -----------------------------------------------------

        best_index = index
        best_candidates = None

        end = min(
            len(tasks),
            index + 15,
        )

        for i in range(
            index,
            end,
        ):

            candidates = (
                self._candidates(
                    tasks[i]
                )
            )

            if not candidates:
                continue

            if (
                best_candidates is None
                or len(candidates)
                < len(best_candidates)
            ):

                best_index = i
                best_candidates = (
                    candidates
                )

                if len(candidates) == 1:
                    break

        # -----------------------------------------------------
        # No task can be placed
        # -----------------------------------------------------

        if best_candidates is None:

            task = tasks[index]

            self.failed_subjects.append({
                "subject_code": task[
                    "subject"
                ].get(
                    "subject_code"
                ),
                "semester": task[
                    "semester"
                ],
                "kind": task[
                    "kind"
                ],
            })

            return False

        # Move selected task to current index
        tasks[
            index
        ], tasks[
            best_index
        ] = (
            tasks[best_index],
            tasks[index],
        )

        task = tasks[index]

        # -----------------------------------------------------
        # Try candidates
        # -----------------------------------------------------

        for _, day, start in (
            best_candidates
        ):

            self._place(
                task,
                day,
                start,
            )

            if self._solve(
                tasks,
                index + 1,
                max_nodes,
            ):

                return True

            self._remove(
                task,
                day,
                start,
            )

        # Restore order
        tasks[
            index
        ], tasks[
            best_index
        ] = (
            tasks[best_index],
            tasks[index],
        )

        return False

    # =========================================================
    # VALIDATION
    # =========================================================

    def validate(self):

        errors = []

        # =====================================================
        # 1. NO SUBJECT TWICE SAME DAY
        # =====================================================

        for semester in self.grid:

            for day in self.days:

                seen_subjects = set()

                period = 0

                while period < self.periods:

                    slot = self.grid[
                        semester
                    ][day][period]

                    if slot == "Empty":

                        period += 1
                        continue

                    subject_id = int(
                        slot["subject_id"]
                    )

                    is_lab = bool(
                        slot.get(
                            "is_lab"
                        )
                    )

                    # -----------------------------------------
                    # LAB
                    # -----------------------------------------

                    if is_lab:

                        previous_same = (
                            period > 0
                            and self.grid[
                                semester
                            ][day][
                                period - 1
                            ] != "Empty"
                            and int(
                                self.grid[
                                    semester
                                ][day][
                                    period - 1
                                ][
                                    "subject_id"
                                ]
                            )
                            == subject_id
                        )

                        if not previous_same:

                            if (
                                subject_id
                                in seen_subjects
                            ):

                                errors.append(
                                    f"{slot['subject_code']} "
                                    f"appears more than once "
                                    f"on {day} in semester "
                                    f"{semester}"
                                )

                            seen_subjects.add(
                                subject_id
                            )

                        period += 1
                        continue

                    # -----------------------------------------
                    # THEORY
                    # -----------------------------------------

                    if (
                        subject_id
                        in seen_subjects
                    ):

                        errors.append(
                            f"{slot['subject_code']} "
                            f"appears more than once "
                            f"on {day} in semester "
                            f"{semester}"
                        )

                    seen_subjects.add(
                        subject_id
                    )

                    period += 1

        # =====================================================
        # 2. NO FREE BETWEEN CLASSES
        # =====================================================

        for semester in self.grid:

            for day in self.days:

                slots = self.grid[
                    semester
                ][day]

                occupied = [
                    i
                    for i, value in enumerate(
                        slots
                    )
                    if value != "Empty"
                ]

                if not occupied:
                    continue

                first = min(
                    occupied
                )

                last = max(
                    occupied
                )

                for period in range(
                    first,
                    last + 1,
                ):

                    if slots[
                        period
                    ] == "Empty":

                        errors.append(
                            f"FREE gap found on "
                            f"{day} in semester "
                            f"{semester} at P"
                            f"{period + 1}"
                        )

        # =====================================================
        # 3. LAB VALIDATION
        # =====================================================

        for semester in self.grid:

            for day in self.days:

                slots = self.grid[
                    semester
                ][day]

                lab_subjects = set()

                period = 0

                while period < self.periods:

                    slot = slots[
                        period
                    ]

                    if slot == "Empty":

                        period += 1
                        continue

                    if not slot.get(
                        "is_lab"
                    ):

                        period += 1
                        continue

                    subject_id = int(
                        slot["subject_id"]
                    )

                    code = slot[
                        "subject_code"
                    ]

                    # -------------------------------------------------
                    # Lab can ONLY start at P1, P3 or P5
                    # -------------------------------------------------

                    if period not in (
                        0,
                        2,
                        4,
                    ):

                        errors.append(
                            f"{code} lab starts "
                            f"at invalid P"
                            f"{period + 1} on "
                            f"{day}, semester "
                            f"{semester}"
                        )

                    # -------------------------------------------------
                    # Count consecutive lab periods
                    # -------------------------------------------------

                    length = 0

                    q = period

                    while (
                        q < self.periods
                        and slots[q] != "Empty"
                        and slots[q].get(
                            "is_lab"
                        )
                        and int(
                            slots[q][
                                "subject_id"
                            ]
                        ) == subject_id
                    ):

                        length += 1
                        q += 1

                    # Exactly 2 periods
                    if length != 2:

                        errors.append(
                            f"{code} lab must "
                            f"occupy exactly "
                            f"2 consecutive "
                            f"periods on "
                            f"{day}, semester "
                            f"{semester}; "
                            f"found {length}"
                        )

                    # One lab subject per day
                    if subject_id in lab_subjects:

                        errors.append(
                            f"{code} has more than "
                            f"one lab block on "
                            f"{day}, semester "
                            f"{semester}"
                        )

                    lab_subjects.add(
                        subject_id
                    )

                    period = q

        # =====================================================
        # 4. ZERO CREDIT -> SATURDAY
        # =====================================================

        for semester in self.grid:

            for day in self.days:

                for slot in self.grid[
                    semester
                ][day]:

                    if slot == "Empty":
                        continue

                    subject_id = int(
                        slot["subject_id"]
                    )

                    subject = (
                        self.subject_map.get(
                            subject_id,
                            {},
                        )
                    )

                    if (
                        self._is_zero_credit(
                            subject
                        )
                        and day.lower()
                        != "saturday"
                    ):

                        errors.append(
                            f"{slot['subject_code']} "
                            f"must be scheduled "
                            f"on Saturday"
                        )

        # =====================================================
        # 5. FACULTY DAILY / WEEKLY WORKLOAD
        # =====================================================

        for faculty_id, days in (
            self.faculty_grid.items()
        ):

            weekly = 0

            maximum = self.faculty_max.get(
                faculty_id,
                18,
            )

            for day, slots in (
                days.items()
            ):

                daily = sum(
                    value is not None
                    for value in slots
                )

                weekly += daily

                if (
                    daily
                    > self.faculty_daily_limit
                ):

                    errors.append(
                        f"Faculty {faculty_id} "
                        f"exceeds daily limit "
                        f"on {day}: "
                        f"{daily}/"
                        f"{self.faculty_daily_limit}"
                    )

            if weekly > maximum:

                errors.append(
                    f"Faculty {faculty_id} "
                    f"exceeds weekly workload "
                    f"{weekly}/{maximum}"
                )

        # =====================================================
        # 6. FACULTY CLASH
        # =====================================================

        for faculty_id, days in (
            self.faculty_grid.items()
        ):

            for day, slots in (
                days.items()
            ):

                seen = {}

                for period, semester in (
                    enumerate(slots)
                ):

                    if semester is None:
                        continue

                    key = period

                    if key in seen:

                        if (
                            seen[key]
                            != semester
                        ):

                            errors.append(
                                f"Faculty "
                                f"{faculty_id} "
                                f"clash on "
                                f"{day} P"
                                f"{period + 1}"
                            )

                    else:

                        seen[key] = semester

        # =====================================================
        # RETURN ERRORS
        # =====================================================

        return errors

    # =========================================================
    # PRINT TIMETABLE
    # =========================================================

    def _print_timetable(self):

        print(
            "\n============================================================"
        )

        print(
            "              GENERATED TIMETABLE"
        )

        print(
            "============================================================"
        )

        for semester in self.semester_list:

            print(
                f"\n\n================ "
                f"SEMESTER {semester}"
                f" ================\n"
            )

            header = (
                "Period     "
            )

            for day in self.days:

                header += (
                    f"{day:<18}"
                )

            print(header)

            print(
                "-" * len(header)
            )

            for period in range(
                self.periods
            ):

                row = (
                    f"P{period + 1:<9}"
                )

                for day in self.days:

                    slot = self.grid[
                        semester
                    ][day][period]

                    if slot == "Empty":

                        text = "FREE"

                    else:

                        code = slot.get(
                            "subject_code",
                            "UNKNOWN",
                        )

                        if slot.get(
                            "is_lab"
                        ):

                            text = (
                                f"{code} (LAB)"
                            )

                        else:

                            text = code

                    row += (
                        f"{text:<18}"
                    )

                print(row)

        print(
            "\n============================================================"
        )

        print(
            "TIMETABLE GENERATED SUCCESSFULLY."
        )

        print(
            f"nodes = {self.nodes}"
        )

        print(
            "============================================================\n"
        )

    # =========================================================
    # GENERATE
    # =========================================================

    def generate(self):

        self._build_maps()

        self._reset()

        tasks = self._build_tasks()

        print(
            "GREEDY + REPAIR:",
            "subjects=",
            len(self.subjects),
            "tasks=",
            len(tasks),
            "semesters=",
            self.semester_list,
            "days=",
            self.days,
            "periods=",
            self.periods,
        )

        # -----------------------------------------------------
        # SOLVE
        # -----------------------------------------------------

        success = self._solve(
            tasks,
            0,
            max_nodes=500000,
        )

        if not success:

            print(
                "GENERATION FAILED."
            )

            print(
                "nodes=",
                self.nodes,
            )

            print(
                "failed=",
                self.failed_subjects[
                    :10
                ],
            )

            return None

        # -----------------------------------------------------
        # VALIDATE
        # -----------------------------------------------------

        errors = self.validate()

        if errors:

            print(
                "VALIDATION FAILED:"
            )

            for error in errors[:30]:

                print(
                    " -",
                    error,
                )

            return None

        # -----------------------------------------------------
        # PRINT
        # -----------------------------------------------------

        self._print_timetable()

        return self.grid