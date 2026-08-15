from flask import Blueprint, request, jsonify
import mysql.connector
from timetable_generator import TimetableGenerator

generate_timetable_api = Blueprint(
    "generate_timetable_api",
    __name__
)


def get_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )
def get_department_for_semester(selected_department_id, semester):

    # First Year (Common SH Department)
    if semester in [1, 2]:
        return 9

    # Department selected by user
    return selected_department_id


@generate_timetable_api.route(
    "/generate-timetable/test",
    methods=["GET"]
)
def test():

    return jsonify({
        "message": "Generate Timetable API Working"
    })
@generate_timetable_api.route(
    "/generate-timetable",
    methods=["POST"]
)
def generate_timetable():

    data = request.json

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)
    cursor.execute(
        "SELECT department_id FROM department WHERE department_code=%s",
        (data["department"],)
    )

    department = cursor.fetchone()

    cursor.execute(
        "SELECT scheme_id FROM scheme WHERE scheme_year=%s",
        (data["scheme"],)
    )

    scheme = cursor.fetchone()
    cursor.execute(
        """
        SELECT *
        FROM timetable_constraints
        WHERE department_id=%s
        AND scheme_id=%s
        AND semester_type=%s
        ORDER BY semester_id
        LIMIT 1
        """,
        (
            department["department_id"],
            scheme["scheme_id"],
            data["semester_type"]
        )
    )


    constraints = cursor.fetchall()
    constraint = None

    for c in constraints:

        if c["academic_year"] == data["academic_year"]:
            constraint = c
            break
    print("Department ID:", department["department_id"])
    print("Scheme ID:", scheme["scheme_id"])
    print("Academic Year:", data["academic_year"])
    print("Semester Type:", data["semester_type"])


    if constraint:
        constraint["college_start_time"] = str(
            constraint["college_start_time"]
        )

        constraint["created_at"] = str(
            constraint["created_at"]
        )
    if data["semester_type"] == "Odd":

        semester_list = (1, 3, 5, 7)

    else:

        semester_list = (2, 4, 6, 8)
    subjects = []

    for sem in semester_list:
        department_id = get_department_for_semester(
            department["department_id"],
            sem
        )

        cursor.execute(
            """
            SELECT
                s.subject_id,
                s.subject_code,
                s.subject_name,
                s.semester_id,
                s.lecture_hours,
                s.tutorial_hours,
                s.practical_hours
            FROM faculty_subject_assignment fsa
            JOIN subject s
                ON fsa.subject_id = s.subject_id
            WHERE
                fsa.academic_year = %s
                AND fsa.status = 'Active'
                AND s.department_id = %s
                AND s.scheme_id = %s
                AND s.semester_id = %s
            ORDER BY
                s.subject_code
            """,
            (
                data["academic_year"],
                department_id,
                scheme["scheme_id"],
                sem
            )
        )

        subjects.extend(cursor.fetchall())


    total_subjects = len(subjects)

    print("Subjects Count:", total_subjects)
    print("Total Subjects:", total_subjects)





    print("Subjects:")
    for subject in subjects:
        print(subject)
    print("\nSubject Hours\n")

    for subject in subjects:
        total_hours = (
                subject["lecture_hours"] +
                subject["tutorial_hours"] +
                subject["practical_hours"]
        )

        print(
            subject["subject_code"],
            "Semester:", subject["semester_id"],
            "Hours:", total_hours
        )
    assignments = []

    for sem in semester_list:
        department_id = get_department_for_semester(
            department["department_id"],
            sem
        )

        cursor.execute(
            """
            SELECT
                fsa.subject_id,
                fsa.faculty_id,
                f.faculty_name,
                s.subject_code,
                s.semester_id
            FROM faculty_subject_assignment fsa
            JOIN faculty f
                ON fsa.faculty_id = f.faculty_id
            JOIN subject s
                ON fsa.subject_id = s.subject_id
            WHERE
                fsa.academic_year = %s
                AND fsa.status = 'Active'
                AND s.department_id = %s
                AND s.scheme_id = %s
                AND s.semester_id = %s
            ORDER BY
                s.subject_code
            """,
            (
                data["academic_year"],
                department_id,
                scheme["scheme_id"],
                sem
            )
        )

        assignments.extend(cursor.fetchall())
    faculty_assigned = len(assignments)
    print("Assignments Count:", faculty_assigned)
    print("Faculty Assignments:")

    for assignment in assignments:
        print(assignment)
    # Create Empty Timetable

    days = constraint["working_days"].split(",")

    periods = constraint["periods_per_day"]

    timetable = {}

    for sem in semester_list:

        timetable[sem] = {}

        for day in days:

            timetable[sem][day] = []

            for period in range(1, periods + 1):
                timetable[sem][day].append("Empty")
    print("\nEmpty Timetable Created\n")

    for sem in timetable:

        print(f"Semester {sem}")

        for day in timetable[sem]:
            print(day, timetable[sem][day])

        print()
    # Group subjects semester-wise

    semester_subjects = {}

    for sem in semester_list:
        semester_subjects[sem] = []

    for subject in subjects:
        semester_subjects[subject["semester_id"]].append(subject)

    print("\nSemester-wise Subjects\n")

    for sem in semester_subjects:
        print(f"Semester {sem}")

        for subject in semester_subjects[sem]:
            print(
                subject["subject_code"],
                subject["lecture_hours"] +
                subject["tutorial_hours"] +
                subject["practical_hours"]
            )

        print()
    # Allocate first subject to Monday P1


    print("Received Data:", data)
    print("Department:", department)
    print("Scheme:", scheme)
    print("Constraint:", constraint)
    cursor.close()

    connection.close()

    if not constraint:
        cursor.close()
        connection.close()

        return jsonify({
            "message": "No timetable constraint found for the selected combination."
        }), 404

    cursor.close()
    connection.close()
    generator = TimetableGenerator(
        constraint,
        subjects,
        assignments,
        semester_list
    )

    timetable = generator.generate()
    subject_faculty = generator.build_subject_faculty_map()
    print("\nSubject Faculty Map\n")

    for subject_id, faculty in subject_faculty.items():
        print(subject_id, faculty)

    constraint["total_subjects"] = total_subjects
    constraint["faculty_assigned"] = faculty_assigned
    constraint["timetable"] = timetable

    return jsonify(constraint)
@generate_timetable_api.route(
    "/academic-years",
    methods=["GET"]
)
def get_academic_years():

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT DISTINCT academic_year
        FROM faculty_subject_assignment
        ORDER BY academic_year
    """)

    years = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(years)
@generate_timetable_api.route(
    "/save-timetable",
    methods=["POST"]
)
def save_timetable():
    data = request.json

    timetable = data["timetable"]

    department = data["department"]

    scheme = data["scheme"]

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        "SELECT department_id FROM department WHERE department_code=%s",
        (department,)
    )

    department_id = cursor.fetchone()["department_id"]
    print("Department ID =", department_id)

    cursor.execute(
        "SELECT scheme_id FROM scheme WHERE scheme_year=%s",
        (scheme,)
    )

    scheme_id = cursor.fetchone()["scheme_id"]
    print("Scheme ID =", scheme_id)
    cursor.execute(
        """
        DELETE FROM timetable
        WHERE department_id = %s
          AND scheme_id = %s
          AND academic_year = %s
          AND semester_type = %s
        """,
        (
            department_id,
            scheme_id,
            data["academic_year"],
            data["semester_type"]
        )
    )

    print("Old timetable deleted.")


    for semester in timetable:

        for day in timetable[semester]:

            periods = timetable[semester][day]

            for period_number, slot in enumerate(periods, start=1):

                if slot == "Empty":

                    subject_id = None
                    faculty_id = None

                else:

                    subject_id = slot["subject_id"]
                    faculty_id = slot["faculty_id"]
                print("Inserting Semester:", semester)

                cursor.execute(
                    """
                    INSERT INTO timetable
                    (
                        department_id,
                        scheme_id,
                        academic_year,
                        semester_type,
                        semester_id,
                        day,
                        period,
                        subject_id,
                        faculty_id
                    )
                    VALUES
                    (
                        %s,%s,%s,%s,%s,%s,%s,%s,%s
                    )
                    """,
                    (
                        department_id,
                        scheme_id,
                        data["academic_year"],
                        data["semester_type"],
                        int(semester),
                        day,
                        period_number,
                        subject_id,
                        faculty_id
                    )
                )

    connection.commit()

    print("Save Timetable API Called")
    print(timetable.keys())
    for semester in timetable:

        print("Semester :", semester)

        for day in timetable[semester]:
            print("Day :", day)

            print(timetable[semester][day])
    cursor.close()

    connection.close()

    return jsonify({
        "message": "Database Connected Successfully"
    })


@generate_timetable_api.route(
    "/view-timetable",
    methods=["POST"]
)
def view_timetable():

    data = request.json

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    department = data["department"]

    scheme = data["scheme"]

    academic_year = data["academic_year"]

    semester_type = data["semester_type"]

    view_type = data["view_type"]

    semester = data["semester"]
    cursor.execute(
        """
        SELECT department_id
        FROM department
        WHERE department_code = %s
        """,
        (department,)
    )

    department_id = cursor.fetchone()["department_id"]
    cursor.execute(
        """
        SELECT scheme_id
        FROM scheme
        WHERE scheme_year = %s
        """,
        (scheme,)
    )

    scheme_id = cursor.fetchone()["scheme_id"]
    cursor.execute(
        """
        SELECT *
        FROM timetable
        WHERE department_id = %s
          AND scheme_id = %s
          AND academic_year = %s
          AND semester_type = %s
          AND semester_id = %s
        ORDER BY
            FIELD(day,
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday'
            ),
            period
        """,
        (
            department_id,
            scheme_id,
            academic_year,
            semester_type,
            semester
        )
    )

    rows = cursor.fetchall()

    timetable = {}
    if semester not in timetable:
        timetable[semester] = {

            "Monday": ["Empty"] * 7,
            "Tuesday": ["Empty"] * 7,
            "Wednesday": ["Empty"] * 7,
            "Thursday": ["Empty"] * 7,
            "Friday": ["Empty"] * 7

        }
        for row in rows:

            day = row["day"]

            period = row["period"] - 1

            if row["subject_id"] is None:
                timetable[semester][day][period] = "Empty"

                continue

            cursor.execute(
                """
                SELECT
                    subject_code,
                    lecture_hours,
                    tutorial_hours,
                    practical_hours
                FROM subject
                WHERE subject_id = %s
                """,
                (row["subject_id"],)
            )

            subject = cursor.fetchone()
            if subject["practical_hours"] > 0:

                if subject["lecture_hours"] > 0:

                    subject_type = "Integrated"

                else:

                    subject_type = "Lab"

            else:

                subject_type = "Theory"

            cursor.execute(
                """
                SELECT
                    faculty_name
                FROM faculty
                WHERE faculty_id = %s
                """,
                (row["faculty_id"],)
            )

            faculty = cursor.fetchone()

            timetable[semester][day][period] = {

                "subject_id": row["subject_id"],

                "subject_code": subject["subject_code"],


                "subject_type": subject_type,
                "faculty_id": row["faculty_id"],

                "faculty_name": faculty["faculty_name"]

            }


    cursor.execute(
        """
        SELECT department_name
        FROM department
        WHERE department_id = %s
        """,
        (department_id,)
    )

    department_details = cursor.fetchone()
    cursor.close()
    connection.close()

    return jsonify({

        "department": department_details["department_name"],

        "semester": semester,

        "academic_year": academic_year,

        "scheme": scheme,

        "timetable": timetable

    })
@generate_timetable_api.route(
    "/view-subject-details",
    methods=["POST"]
)
def view_subject_details():

    data = request.json

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT department_id
        FROM department
        WHERE department_code = %s
        """,
        (data["department"],)
    )

    department_id = cursor.fetchone()["department_id"]

    cursor.execute(
        """
        SELECT scheme_id
        FROM scheme
        WHERE scheme_year = %s
        """,
        (data["scheme"],)
    )

    scheme_id = cursor.fetchone()["scheme_id"]

    cursor.execute(
        """
        SELECT DISTINCT
            s.subject_code,
            s.subject_name,
            s.credits
        FROM timetable t
        JOIN subject s
            ON t.subject_id = s.subject_id
        WHERE t.department_id = %s
          AND t.scheme_id = %s
          AND t.semester_id = %s
          AND t.academic_year = %s
          AND t.semester_type = %s
        ORDER BY s.subject_code
        """,
        (
            department_id,
            scheme_id,
            data["semester"],
            data["academic_year"],
            data["semester_type"]
        )
    )

    subjects = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(subjects)
@generate_timetable_api.route(
    "/view-faculty-details",
    methods=["POST"]
)
def view_faculty_details():

    data = request.json

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT department_id
        FROM department
        WHERE department_code = %s
        """,
        (data["department"],)
    )

    department_id = cursor.fetchone()["department_id"]

    cursor.execute(
        """
        SELECT scheme_id
        FROM scheme
        WHERE scheme_year = %s
        """,
        (data["scheme"],)
    )

    scheme_id = cursor.fetchone()["scheme_id"]

    cursor.execute(
        """
        SELECT DISTINCT
            f.faculty_name,
            s.subject_code
        FROM timetable t
        JOIN faculty f
            ON t.faculty_id = f.faculty_id
        JOIN subject s
            ON t.subject_id = s.subject_id
        WHERE t.department_id = %s
          AND t.scheme_id = %s
          AND t.semester_id = %s
          AND t.academic_year = %s
          AND t.semester_type = %s
        ORDER BY f.faculty_name
        """,
        (
            department_id,
            scheme_id,
            data["semester"],
            data["academic_year"],
            data["semester_type"]
        )
    )

    faculty = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(faculty)
def is_lab_already_allocated(
        self,
        semester,
        day
):

    for slot in self.timetable[semester][day]:

        if slot == "Empty":
            continue

        if slot["subject_type"] in ["Lab", "Integrated"]:
            return True

    return False
