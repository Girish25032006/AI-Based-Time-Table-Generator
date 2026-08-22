from flask import Blueprint, request, jsonify
import mysql.connector

faculty_subject_assignment_api = Blueprint(
    "faculty_subject_assignment_api",
    __name__
)

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "timetable_db"
}


def get_connection(dictionary=True):
    return mysql.connector.connect(**DB_CONFIG)


# ============================================================
# WORKLOAD RULE
# ============================================================

def theory_workload_from_credits(credits):
    try:
        credits = int(credits or 0)
    except (TypeError, ValueError):
        credits = 0

    if credits <= 0:
        return 0
    if credits == 1:
        return 2
    return 4


def faculty_subject_workload(subject):
    """Theory faculty workload.

    Theory only: 1 credit = 2h, 2+ credits = 4h.
    Theory + lab: theory workload + practical hours.
    Lab only: theory faculty gets 0h.
    """
    theory_hours = theory_workload_from_credits(
        subject.get("credits")
    )
    practical_hours = int(
        subject.get("practical_hours") or 0
    )
    lecture_hours = int(
        subject.get("lecture_hours") or 0
    )
    tutorial_hours = int(
        subject.get("tutorial_hours") or 0
    )

    # Lab-only subject: only lab/co-lab gets practical workload.
    if (
        practical_hours > 0
        and lecture_hours == 0
        and tutorial_hours == 0
    ):
        return 0

    # Theory-only or theory + lab.
    return theory_hours + practical_hours


def lab_faculty_workload(subject):
    """Co-lab/lab faculty gets practical hours only."""
    return int(subject.get("practical_hours") or 0)


# ============================================================
# DEPARTMENTS
# ============================================================

@faculty_subject_assignment_api.route(
    "/assignment-departments",
    methods=["GET"]
)
def get_assignment_departments():

    connection = get_connection(dictionary=True)
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                department_id,
                department_code,
                department_name
            FROM department
            ORDER BY department_name
        """)

        return jsonify(cursor.fetchall())

    finally:
        cursor.close()
        connection.close()


# ============================================================
# FACULTY
# ============================================================

@faculty_subject_assignment_api.route(
    "/assignment-faculties/<department>",
    methods=["GET"]
)
def get_assignment_faculties(department):

    academic_year = request.args.get("academic_year", "")
    semester = request.args.get("semester", "")

    connection = get_connection(dictionary=True)
    cursor = connection.cursor(dictionary=True)

    try:
        # Semester 1 and 2 are common semesters, so use SH faculty.
        faculty_department = (
            "SH" if semester in ("1", "2") else department
        )

        cursor.execute("""
            SELECT
                f.faculty_id,
                f.faculty_name,
                f.department_id,
                d.department_code,
                d.department_name,
                f.designation,
                f.max_workload,
                f.status
            FROM faculty f
            JOIN department d
                ON f.department_id = d.department_id
            WHERE
                d.department_code = %s
                AND f.status = 'Active'
            ORDER BY f.faculty_name
        """, (faculty_department,))

        faculties = cursor.fetchall()

        workload = {
            int(f["faculty_id"]): 0
            for f in faculties
        }

        if academic_year and faculties:
            cursor.execute("""
                SELECT
                    fsa.faculty_id,
                    fsa.lab_faculty_id,
                    s.credits,
                    s.lecture_hours,
                    s.tutorial_hours,
                    s.practical_hours
                FROM faculty_subject_assignment fsa
                JOIN subject s
                    ON fsa.subject_id = s.subject_id
                WHERE
                    fsa.academic_year = %s
                    AND fsa.status = 'Active'
            """, (academic_year,))

            for row in cursor.fetchall():
                theory_id = row.get("faculty_id")
                lab_id = row.get("lab_faculty_id")

                if theory_id is not None:
                    theory_id = int(theory_id)
                    if theory_id in workload:
                        workload[theory_id] += (
                            faculty_subject_workload(row)
                        )

                if lab_id is not None:
                    lab_id = int(lab_id)
                    if lab_id in workload:
                        workload[lab_id] += (
                            lab_faculty_workload(row)
                        )

        for faculty in faculties:
            faculty_id = int(faculty["faculty_id"])
            max_workload = int(
                faculty.get("max_workload") or 0
            )
            assigned = int(
                workload.get(faculty_id, 0)
            )

            faculty["max_workload"] = max_workload
            faculty["assigned_workload"] = assigned
            faculty["remaining_workload"] = max(
                0,
                max_workload - assigned
            )

        return jsonify(faculties)

    finally:
        cursor.close()
        connection.close()


# ============================================================
# SUBJECTS
# ============================================================

@faculty_subject_assignment_api.route(
    "/assignment-subjects/<department>/<scheme>/<int:semester>/<cycle>",
    methods=["GET"]
)
def get_assignment_subjects(
    department,
    scheme,
    semester,
    cycle
):

    connection = get_connection(dictionary=True)
    cursor = connection.cursor(dictionary=True)

    try:
        if semester in (1, 2):
            params = [scheme, semester]
            cycle_condition = ""

            if cycle in ("P", "C"):
                cycle_condition = """
                    AND (
                        s.cycle = %s
                        OR s.cycle IS NULL
                    )
                """
                params.append(cycle)

            query = f"""
                SELECT
                    s.subject_id,
                    s.subject_code,
                    s.subject_name,
                    s.semester_id,
                    s.credits,
                    s.lecture_hours,
                    s.tutorial_hours,
                    s.practical_hours,
                    s.cycle,
                    d.department_code,
                    s.teaching_department_id
                FROM subject s
                JOIN scheme sc
                    ON s.scheme_id = sc.scheme_id
                LEFT JOIN department d
                    ON s.department_id = d.department_id
                WHERE
                    sc.scheme_year = %s
                    AND s.semester_id = %s
                    {cycle_condition}
                ORDER BY s.subject_code
            """

            cursor.execute(query, tuple(params))

        else:
            cursor.execute("""
                SELECT
                    s.subject_id,
                    s.subject_code,
                    s.subject_name,
                    s.semester_id,
                    s.credits,
                    s.lecture_hours,
                    s.tutorial_hours,
                    s.practical_hours,
                    s.cycle,
                    d.department_code,
                    s.teaching_department_id
                FROM subject s
                JOIN department d
                    ON s.department_id = d.department_id
                JOIN scheme sc
                    ON s.scheme_id = sc.scheme_id
                WHERE
                    d.department_code = %s
                    AND sc.scheme_year = %s
                    AND s.semester_id = %s
                ORDER BY s.subject_code
            """, (
                department,
                scheme,
                semester
            ))

        subjects = cursor.fetchall()

        for subject in subjects:
            subject["theory_workload"] = (
                faculty_subject_workload(subject)
            )
            subject["lab_workload"] = (
                lab_faculty_workload(subject)
            )

        return jsonify(subjects)

    finally:
        cursor.close()
        connection.close()


# ============================================================
# EXISTING ASSIGNMENTS FOR CURRENT CONTEXT
# ============================================================

@faculty_subject_assignment_api.route(
    "/faculty-subject-assignments/context",
    methods=["GET"]
)
def get_assignment_context():

    academic_year = request.args.get("academic_year")
    department = request.args.get("department")
    scheme = request.args.get("scheme")
    semester = request.args.get("semester")
    cycle = request.args.get("cycle")

    if not academic_year or not department or not scheme:
        return jsonify({
            "error": (
                "Academic year, department and scheme "
                "are required."
            )
        }), 400

    connection = get_connection(dictionary=True)
    cursor = connection.cursor(dictionary=True)

    try:
        params = [academic_year, scheme]
        conditions = [
            "fsa.academic_year = %s",
            "sc.scheme_year = %s",
            "fsa.status = 'Active'"
        ]

        if semester:
            conditions.append(
                "s.semester_id = %s"
            )
            params.append(int(semester))

        if semester and int(semester) in (1, 2):
            if cycle in ("P", "C"):
                conditions.append("""
                    (
                        s.cycle = %s
                        OR s.cycle IS NULL
                    )
                """)
                params.append(cycle)
        else:
            conditions.append("""
                (
                    d.department_code = %s
                    OR s.teaching_department_id = (
                        SELECT department_id
                        FROM department
                        WHERE department_code = %s
                        LIMIT 1
                    )
                )
            """)
            params.extend([department, department])

        query = f"""
            SELECT
                fsa.assignment_id,
                fsa.subject_id,
                fsa.faculty_id,
                fsa.lab_faculty_id,
                fsa.lab_co_faculty_id,
                fsa.academic_year,
                fsa.status,
                s.subject_code,
                s.subject_name,
                s.semester_id,
                s.cycle,
                f.faculty_name AS theory_faculty_name,
                lf.faculty_name AS lab_faculty_name
            FROM faculty_subject_assignment fsa
            JOIN subject s
                ON fsa.subject_id = s.subject_id
            LEFT JOIN department d
                ON s.department_id = d.department_id
            JOIN scheme sc
                ON s.scheme_id = sc.scheme_id
            LEFT JOIN faculty f
                ON fsa.faculty_id = f.faculty_id
            LEFT JOIN faculty lf
                ON fsa.lab_faculty_id = lf.faculty_id
            WHERE
                {' AND '.join(conditions)}
            ORDER BY
                s.semester_id,
                s.subject_code
        """

        cursor.execute(query, tuple(params))
        return jsonify(cursor.fetchall())

    finally:
        cursor.close()
        connection.close()


# ============================================================
# SAVE / RE-ASSIGN
# ============================================================

@faculty_subject_assignment_api.route(
    "/faculty-subject-assignments",
    methods=["POST"]
)
def save_faculty_subject_assignments():

    data = request.get_json() or {}

    academic_year = data.get("academic_year")
    department = data.get("department")
    scheme = data.get("scheme")
    semester = data.get("semester")
    cycle = data.get("cycle")
    mode = data.get("mode", "save")
    assignments = data.get("assignments", [])

    if not academic_year:
        return jsonify({
            "message": "Academic year is required."
        }), 400

    if not department:
        return jsonify({
            "message": "Department is required."
        }), 400

    if not scheme:
        return jsonify({
            "message": "Scheme is required."
        }), 400

    if not isinstance(assignments, list):
        return jsonify({
            "message": "Assignments must be a list."
        }), 400

    if (
        semester
        and int(semester) in (1, 2)
        and cycle not in ("P", "C")
    ):
        return jsonify({
            "message": (
                "P-Cycle or C-Cycle is required "
                "for Semester 1 and 2."
            )
        }), 400

    connection = get_connection(dictionary=True)
    cursor = connection.cursor(dictionary=True)

    try:
        saved_count = 0
        reassigned_count = 0
        skipped_count = 0

        for assignment in assignments:
            subject_id = assignment.get("subject_id")

            if not subject_id:
                continue

            faculty_id = assignment.get("faculty_id")
            lab_faculty_id = assignment.get("lab_faculty_id")

            faculty_id = (
                int(faculty_id)
                if faculty_id not in (None, "", 0, "0")
                else None
            )

            lab_faculty_id = (
                int(lab_faculty_id)
                if lab_faculty_id not in (None, "", 0, "0")
                else None
            )

            # Verify selected faculty.
            for selected_id in (
                faculty_id,
                lab_faculty_id
            ):
                if selected_id is None:
                    continue

                cursor.execute("""
                    SELECT faculty_id
                    FROM faculty
                    WHERE
                        faculty_id = %s
                        AND status = 'Active'
                    LIMIT 1
                """, (selected_id,))

                if not cursor.fetchone():
                    raise ValueError(
                        f"Faculty {selected_id} is not active "
                        "or does not exist."
                    )

            # Verify subject belongs to selected scheme/context.
            cursor.execute("""
                SELECT
                    s.subject_id,
                    s.semester_id,
                    s.cycle
                FROM subject s
                JOIN scheme sc
                    ON s.scheme_id = sc.scheme_id
                LEFT JOIN department d
                    ON s.department_id = d.department_id
                WHERE
                    s.subject_id = %s
                    AND sc.scheme_year = %s
                    AND (
                        d.department_code = %s
                        OR s.semester_id IN (1, 2)
                    )
                LIMIT 1
            """, (
                subject_id,
                scheme,
                department
            ))

            if not cursor.fetchone():
                raise ValueError(
                    f"Subject {subject_id} does not belong "
                    "to the selected scheme/context."
                )

            # Existing assignment is checked ONLY inside the
            # selected academic year. Other years are untouched.
            cursor.execute("""
                SELECT
                    fsa.assignment_id
                FROM faculty_subject_assignment fsa
                JOIN subject s
                    ON fsa.subject_id = s.subject_id
                JOIN scheme sc
                    ON s.scheme_id = sc.scheme_id
                LEFT JOIN department d
                    ON s.department_id = d.department_id
                WHERE
                    fsa.subject_id = %s
                    AND fsa.academic_year = %s
                    AND sc.scheme_year = %s
                    AND (
                        d.department_code = %s
                        OR s.semester_id IN (1, 2)
                    )
                    AND fsa.status = 'Active'
                LIMIT 1
            """, (
                subject_id,
                academic_year,
                scheme,
                department
            ))

            existing = cursor.fetchone()

            # SAVE: keep existing assignment unchanged.
            if mode != "reassign":

                if existing:
                    skipped_count += 1
                    continue

                if (
                    faculty_id is None
                    and lab_faculty_id is None
                ):
                    continue

                cursor.execute("""
                    INSERT INTO faculty_subject_assignment
                    (
                        faculty_id,
                        lab_faculty_id,
                        lab_co_faculty_id,
                        subject_id,
                        academic_year,
                        status,
                        updated_at
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        NULL,
                        %s,
                        %s,
                        'Active',
                        NOW()
                    )
                """, (
                    faculty_id,
                    lab_faculty_id,
                    subject_id,
                    academic_year
                ))

                saved_count += 1

            # RE-ASSIGN: delete only selected academic year's
            # old assignment, then insert the new one.
            else:

                if existing:
                    cursor.execute("""
                        DELETE FROM faculty_subject_assignment
                        WHERE assignment_id = %s
                    """, (
                        existing["assignment_id"],
                    ))

                if (
                    faculty_id is None
                    and lab_faculty_id is None
                ):
                    reassigned_count += 1
                    continue

                cursor.execute("""
                    INSERT INTO faculty_subject_assignment
                    (
                        faculty_id,
                        lab_faculty_id,
                        lab_co_faculty_id,
                        subject_id,
                        academic_year,
                        status,
                        updated_at
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        NULL,
                        %s,
                        %s,
                        'Active',
                        NOW()
                    )
                """, (
                    faculty_id,
                    lab_faculty_id,
                    subject_id,
                    academic_year
                ))

                reassigned_count += 1

        connection.commit()

        if mode == "reassign":
            message = (
                f"{reassigned_count} assignment(s) "
                "re-assigned successfully. "
                "Only the selected academic year's "
                "old assignment(s) were replaced."
            )
        else:
            message = (
                f"{saved_count} assignment(s) "
                "saved successfully."
            )

            if skipped_count:
                message += (
                    f" {skipped_count} existing "
                    "assignment(s) were skipped. "
                    "Use Re-Assign to replace them."
                )

        return jsonify({
            "message": message,
            "saved": saved_count,
            "reassigned": reassigned_count,
            "skipped": skipped_count
        }), 201

    except Exception as error:
        connection.rollback()

        print(
            "FACULTY ASSIGNMENT ERROR:",
            error
        )

        return jsonify({
            "message": str(error)
        }), 500

    finally:
        cursor.close()
        connection.close()


# ============================================================
# OLD / EXISTING LIST ENDPOINT
# ============================================================

@faculty_subject_assignment_api.route(
    "/faculty-subject-assignments/<academic_year>/<semester_type>",
    methods=["GET"]
)
def get_faculty_subject_assignments(
    academic_year,
    semester_type
):

    if semester_type.lower() == "odd":
        semester_condition = """
            AND s.semester_id IN (1, 3, 5, 7)
        """
    else:
        semester_condition = """
            AND s.semester_id IN (2, 4, 6, 8)
        """

    connection = get_connection(dictionary=True)
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            f"""
            SELECT
                fsa.assignment_id,
                d.department_code,
                s.semester_id,
                COALESCE(
                    f.faculty_name,
                    lf.faculty_name
                ) AS faculty_name,
                s.subject_code,
                s.subject_name,
                fsa.faculty_id,
                fsa.lab_faculty_id,
                fsa.academic_year,
                fsa.status
            FROM faculty_subject_assignment fsa
            LEFT JOIN faculty f
                ON fsa.faculty_id = f.faculty_id
            LEFT JOIN faculty lf
                ON fsa.lab_faculty_id = lf.faculty_id
            JOIN subject s
                ON fsa.subject_id = s.subject_id
            LEFT JOIN department d
                ON s.department_id = d.department_id
            WHERE
                fsa.academic_year = %s
                {semester_condition}
            ORDER BY
                s.semester_id,
                fsa.assignment_id
            """,
            (academic_year,)
        )

        return jsonify(cursor.fetchall())

    finally:
        cursor.close()
        connection.close()


# ============================================================
# DELETE
# ============================================================

@faculty_subject_assignment_api.route(
    "/faculty-subject-assignments/<int:assignment_id>",
    methods=["DELETE"]
)
def delete_assignment(assignment_id):

    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            DELETE FROM faculty_subject_assignment
            WHERE assignment_id = %s
        """, (assignment_id,))

        connection.commit()

        return jsonify({
            "message": "Assignment deleted successfully!"
        })

    except Exception as error:
        connection.rollback()

        return jsonify({
            "message": str(error)
        }), 500

    finally:
        cursor.close()
        connection.close()


# ============================================================
# ACADEMIC YEARS
# ============================================================

@faculty_subject_assignment_api.route(
    "/academic-years",
    methods=["GET"]
)
def get_academic_years():

    connection = get_connection(dictionary=True)
    cursor = connection.cursor(dictionary=True)

    try:
        # Load academic years from the academic_year table.
        cursor.execute("""
            SELECT DISTINCT
                academic_year
            FROM academic_year
            WHERE
                academic_year IS NOT NULL
                AND academic_year <> ''
            ORDER BY academic_year
        """)

        return jsonify(cursor.fetchall())

    finally:
        cursor.close()
        connection.close()
