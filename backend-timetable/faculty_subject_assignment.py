from flask import Blueprint, request, jsonify
import mysql.connector

faculty_subject_assignment_api = Blueprint(
    "faculty_subject_assignment_api",
    __name__
)
@faculty_subject_assignment_api.route(
    "/faculty-subject-assignments/<academic_year>/<semester_type>",
    methods=["GET"]
)
def get_faculty_subject_assignments(academic_year, semester_type):
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor(dictionary=True)
    if semester_type == "Odd":

        semester_condition = "AND s.semester_id IN (1,3,5,7)"

    else:

        semester_condition = "AND s.semester_id IN (2,4,6,8)"
    query = f"""
    SELECT
        fsa.assignment_id,
        d.department_code,
        s.semester_id,
        f.faculty_name,
        s.subject_code,
        s.subject_name,
        fsa.academic_year,
        fsa.status
    FROM faculty_subject_assignment fsa

    JOIN faculty f
        ON fsa.faculty_id = f.faculty_id

    JOIN subject s
        ON fsa.subject_id = s.subject_id

    JOIN department d
        ON s.department_id = d.department_id

    WHERE fsa.academic_year = %s

    {semester_condition}

    ORDER BY
        s.semester_id,
        fsa.assignment_id;
    """

    cursor.execute(query, (academic_year,))

    assignments = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(assignments)
@faculty_subject_assignment_api.route(
    "/assignment-subjects/<department>/<scheme>/<int:semester>/<cycle>",
    methods=["GET"]
)
def get_assignment_subjects(department, scheme, semester, cycle):

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor(dictionary=True)

    if semester == 1 or semester == 2:

        query = """
        SELECT
            s.subject_id,
            s.subject_code,
            s.subject_name
        FROM subject s
        JOIN scheme sc
            ON s.scheme_id = sc.scheme_id
        WHERE
            sc.scheme_year = %s
            AND s.semester_id = %s
           AND (s.cycle = %s OR s.cycle IS NULL)
        ORDER BY
        CASE
            WHEN s.cycle IS NOT NULL THEN 1
            ELSE 2
        END,
        s.subject_code;
        """

        cursor.execute(
            query,
            (scheme, semester, cycle)
        )

    else:

        query = """
        SELECT
            s.subject_id,
            s.subject_code,
            s.subject_name
        FROM subject s
        JOIN department d
            ON s.department_id = d.department_id
        JOIN scheme sc
            ON s.scheme_id = sc.scheme_id
        WHERE
            d.department_code = %s
            AND sc.scheme_year = %s
            AND s.semester_id = %s
        ORDER BY s.subject_code;
        """

        cursor.execute(
            query,
            (department, scheme, semester)
        )



    subjects = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(subjects)
@faculty_subject_assignment_api.route(
    "/assignment-faculties/<department>",
    methods=["GET"]
)
def get_assignment_faculties(department):

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT
        f.faculty_id,
        f.faculty_name
    FROM faculty f
    JOIN department d
        ON f.department_id = d.department_id
    WHERE
        d.department_code = %s
        AND f.status = 'Active'
    ORDER BY
        f.faculty_name;
    """

    cursor.execute(query, (department,))

    faculties = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(faculties)

@faculty_subject_assignment_api.route("/assignment-departments", methods=["GET"])
def get_assignment_departments():

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
    SELECT
        department_id,
        department_code,
        department_name
    FROM department
    ORDER BY department_name;
    """)

    departments = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(departments)
@faculty_subject_assignment_api.route("/faculty-subject-assignments", methods=["POST"])
def save_faculty_subject_assignments():

    data = request.get_json()
    saved_count = 0
    duplicate_count = 0

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    for assignment in data:
        cursor.execute(
            """
            SELECT assignment_id
            FROM faculty_subject_assignment
            WHERE subject_id = %s
              AND academic_year = %s
            """,
            (
                assignment["subject_id"],
                assignment["academic_year"]
            )
        )

        existing_assignment = cursor.fetchone()

        if existing_assignment:
            duplicate_count += 1
            continue
        query = """
        INSERT INTO faculty_subject_assignment
        (
            faculty_id,
            subject_id,
            academic_year,
            status
        )
        VALUES
        (
            %s,
            %s,
            %s,
            %s
        )
        """

        cursor.execute(
            query,
            (
                assignment["faculty_id"],
                assignment["subject_id"],
                assignment["academic_year"],
                "Active"
            )
        )
        saved_count += 1

    connection.commit()

    cursor.close()
    connection.close()

    if saved_count == 0:

        message = "All assignments already exist."

    elif duplicate_count == 0:

        message = f"{saved_count} assignments saved successfully."

    else:

        message = (
            f"{saved_count} assignments saved. "
            f"{duplicate_count} duplicate assignments skipped."
        )

    return jsonify({"message": message}), 201
@faculty_subject_assignment_api.route(
    "/faculty-subject-assignments/<int:assignment_id>",
    methods=["DELETE"]
)
def delete_assignment(assignment_id):

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM faculty_subject_assignment
        WHERE assignment_id = %s
        """,
        (assignment_id,)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Assignment deleted successfully!"
    })



@faculty_subject_assignment_api.route(
    "/academic-years",
    methods=["GET"]
)
def get_academic_years():

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT DISTINCT academic_year
        FROM faculty_subject_assignment
        ORDER BY academic_year;
    """)

    years = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(years)