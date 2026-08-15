from flask import Blueprint, request, jsonify
import mysql.connector

timetable_constraints_api = Blueprint(
    "timetable_constraints_api",
    __name__
)
def get_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )
@timetable_constraints_api.route(
    "/timetable-constraints/test",
    methods=["GET"]
)

def test():

    return jsonify({
        "message": "Timetable Constraints API Working"
    })


@timetable_constraints_api.route(
    "/timetable-constraints",
    methods=["POST"]
)
def save_constraint():

    data = request.json

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    # Get Department ID
    cursor.execute(
        "SELECT department_id FROM department WHERE department_code = %s",
        (data["department"],)
    )
    department = cursor.fetchone()

    # Get Scheme ID
    cursor.execute(
        "SELECT scheme_id FROM scheme WHERE scheme_year = %s",
        (data["scheme"],)
    )
    scheme = cursor.fetchone()

    query = """
    INSERT INTO timetable_constraints
    (
        department_id,
        scheme_id,
        academic_year,
        semester_type,
        semester_id,
        working_days,
        periods_per_day,
        college_start_time,
        period_duration,
        lunch_after_period,
        short_break_after_period,
        short_break_duration,
        max_periods_per_day,
        max_periods_per_week,
        lab_duration
    )
    VALUES
    (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    cursor.execute(
        query,
        (
            department["department_id"],
            scheme["scheme_id"],
            data["academic_year"],
            data["semester_type"],
            data["semester"],
            ",".join(data["working_days"]),
            data["periods_per_day"],
            data["college_start_time"],
            data["period_duration"],
            data["lunch_after_period"],
            data["short_break_after_period"] if data["short_break_after_period"] else None,
            data["short_break_duration"] if data["short_break_duration"] else None,
            data["max_periods_per_day"],
            data["max_periods_per_week"],
            data["lab_duration"]
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Constraint Saved Successfully"
    })
@timetable_constraints_api.route(
    "/timetable-constraints",
    methods=["GET"]
)
def get_constraints():

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT
        tc.constraint_id,
        d.department_code,
        s.scheme_year,
        tc.academic_year,
        tc.semester_type,
        tc.semester_id,
        tc.working_days,
        tc.periods_per_day,
        tc.college_start_time,
        tc.period_duration,
        tc.lunch_after_period,
        tc.short_break_after_period,
        tc.short_break_duration
    FROM timetable_constraints tc
    JOIN department d
        ON tc.department_id = d.department_id
    JOIN scheme s
        ON tc.scheme_id = s.scheme_id
    ORDER BY tc.constraint_id;
    """

    cursor.execute(query)

    constraints = cursor.fetchall()
    for constraint in constraints:
        constraint["college_start_time"] = str(
            constraint["college_start_time"]
        )

    cursor.close()

    connection.close()

    return jsonify(constraints)
@timetable_constraints_api.route(
    "/timetable-constraints/<int:constraint_id>",
    methods=["GET"]
)
def get_constraint(constraint_id):

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT *
    FROM timetable_constraints
    WHERE constraint_id = %s
    """

    cursor.execute(query, (constraint_id,))

    constraint = cursor.fetchone()
    if constraint:
        constraint["college_start_time"] = str(
            constraint["college_start_time"]
        )

    cursor.close()

    connection.close()

    return jsonify(constraint)
@timetable_constraints_api.route(
    "/timetable-constraints/<int:constraint_id>",
    methods=["PUT"]
)
def update_constraint(constraint_id):

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
    query = """
    UPDATE timetable_constraints
    SET
        department_id=%s,
        scheme_id=%s,
        academic_year=%s,
        semester_type=%s,
        semester_id=%s,
        working_days=%s,
        periods_per_day=%s,
        college_start_time=%s,
        period_duration=%s,
        lunch_after_period=%s,
        short_break_after_period=%s,
        short_break_duration=%s,
        max_periods_per_day=%s,
        max_periods_per_week=%s,
        lab_duration=%s
    WHERE constraint_id=%s
    """
    cursor.execute(
        query,
        (
            department["department_id"],
            scheme["scheme_id"],
            data["academic_year"],
            data["semester_type"],
            data["semester"],
            ",".join(data["working_days"]),
            data["periods_per_day"],
            data["college_start_time"],
            data["period_duration"],
            data["lunch_after_period"],
            data["short_break_after_period"],
            data["short_break_duration"],
            data["max_periods_per_day"],
            data["max_periods_per_week"],
            data["lab_duration"],
            constraint_id
        )
    )

    connection.commit()

    cursor.close()

    connection.close()

    return jsonify({
        "message": "Constraint Updated Successfully"
    })
@timetable_constraints_api.route(
    "/timetable-constraints/<int:constraint_id>",
    methods=["DELETE"]
)
def delete_constraint(constraint_id):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM timetable_constraints WHERE constraint_id = %s",
        (constraint_id,)
    )

    connection.commit()

    cursor.close()

    connection.close()

    return jsonify({
        "message": "Constraint Deleted Successfully"
    })