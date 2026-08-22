from flask import Blueprint, request, jsonify
import mysql.connector
import json


# ============================================================
# BLUEPRINT
# ============================================================

timetable_constraints_api = Blueprint(
    "timetable_constraints_api",
    __name__
)


# ============================================================
# DATABASE CONFIGURATION
# Same configuration used in faculty_subject_assignment.py
# ============================================================

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "timetable_db"
}


def get_connection(dictionary=True):
    return mysql.connector.connect(**DB_CONFIG)


# ============================================================
# HELPER
# ============================================================

def json_to_text(value, default):
    """
    Convert Python list/dict into JSON text
    for MySQL TEXT columns.
    """

    if value is None:
        value = default

    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return json.dumps(default)


def text_to_json(value, default):
    """
    Convert JSON text from MySQL TEXT column
    back into Python list/dict.
    """

    if value is None or value == "":
        return default

    try:
        return json.loads(value)
    except (TypeError, ValueError, json.JSONDecodeError):
        return default


# ============================================================
# GET CONSTRAINTS
# ============================================================

@timetable_constraints_api.route(
    "/timetable-constraints",
    methods=["GET"]
)
def get_timetable_constraints():

    academic_year = request.args.get(
        "academic_year"
    )

    department_code = request.args.get(
        "department"
    )

    scheme_id = request.args.get(
        "scheme"
    )

    # --------------------------------------------------------
    # Validate parameters
    # --------------------------------------------------------

    if not academic_year:
        return jsonify({
            "success": False,
            "message": "Academic year is required."
        }), 400

    if not department_code:
        return jsonify({
            "success": False,
            "message": "Department is required."
        }), 400

    if not scheme_id:
        return jsonify({
            "success": False,
            "message": "Scheme is required."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_connection(
            dictionary=True
        )

        cursor = connection.cursor(
            dictionary=True
        )

        # ----------------------------------------------------
        # Find constraints
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                academic_year,
                department_code,
                scheme_id,
                working_days,
                periods,
                break_data,
                faculty_daily_limit,
                student_daily_limit,
                lab_consecutive,
                faculty_clash,
                semester_clash,
                cycle_constraint,
                created_at,
                updated_at
            FROM timetable_constraints
            WHERE
                academic_year = %s
                AND department_code = %s
                AND scheme_id = %s
            LIMIT 1
            """,
            (
                academic_year,
                department_code,
                scheme_id
            )
        )

        row = cursor.fetchone()

        # ----------------------------------------------------
        # No record
        # ----------------------------------------------------

        if not row:

            return jsonify({
                "success": True,
                "exists": False,
                "message": "No constraints saved yet."
            }), 200

        # ----------------------------------------------------
        # Convert TEXT -> JSON
        # ----------------------------------------------------

        row["working_days"] = text_to_json(
            row.get("working_days"),
            []
        )

        row["periods"] = text_to_json(
            row.get("periods"),
            []
        )

        row["break"] = text_to_json(
            row.get("break_data"),
            {}
        )

        # ----------------------------------------------------
        # Convert TINYINT -> boolean
        # ----------------------------------------------------

        row["lab_consecutive"] = bool(
            row.get("lab_consecutive", 0)
        )

        row["faculty_clash"] = bool(
            row.get("faculty_clash", 1)
        )

        row["semester_clash"] = bool(
            row.get("semester_clash", 1)
        )

        row["cycle_constraint"] = bool(
            row.get("cycle_constraint", 1)
        )

        # ----------------------------------------------------
        # Convert limits
        # ----------------------------------------------------

        row["faculty_daily_limit"] = int(
            row.get(
                "faculty_daily_limit",
                4
            ) or 4
        )

        row["student_daily_limit"] = int(
            row.get(
                "student_daily_limit",
                6
            ) or 6
        )

        return jsonify({
            "success": True,
            "exists": True,
            "data": row
        }), 200

    except Exception as error:

        print(
            "GET timetable constraints error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to load timetable constraints.",
            "error": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# SAVE / UPDATE CONSTRAINTS
# ============================================================

@timetable_constraints_api.route(
    "/timetable-constraints",
    methods=["POST"]
)
def save_timetable_constraints():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "success": False,
            "message": "No constraint data received."
        }), 400

    # --------------------------------------------------------
    # Get values
    # --------------------------------------------------------

    academic_year = data.get(
        "academic_year"
    )

    department_code = data.get(
        "department"
    )

    scheme_id = data.get(
        "scheme"
    )

    # --------------------------------------------------------
    # Validate
    # --------------------------------------------------------

    if not academic_year:

        return jsonify({
            "success": False,
            "message": "Academic year is required."
        }), 400

    if not department_code:

        return jsonify({
            "success": False,
            "message": "Department is required."
        }), 400

    if not scheme_id:

        return jsonify({
            "success": False,
            "message": "Scheme is required."
        }), 400

    # --------------------------------------------------------
    # Prepare JSON TEXT values
    # --------------------------------------------------------

    working_days = json_to_text(
        data.get("working_days"),
        []
    )

    periods = json_to_text(
        data.get("periods"),
        []
    )

    break_data = json_to_text(
        data.get("break"),
        {}
    )

    # --------------------------------------------------------
    # Prepare numeric values
    # --------------------------------------------------------

    try:

        faculty_daily_limit = int(
            data.get(
                "faculty_daily_limit",
                4
            )
        )

    except (TypeError, ValueError):

        faculty_daily_limit = 4


    try:

        student_daily_limit = int(
            data.get(
                "student_daily_limit",
                6
            )
        )

    except (TypeError, ValueError):

        student_daily_limit = 6


    lab_consecutive = (
        1
        if data.get(
            "lab_consecutive",
            False
        )
        else 0
    )

    faculty_clash = (
        1
        if data.get(
            "faculty_clash",
            True
        )
        else 0
    )

    semester_clash = (
        1
        if data.get(
            "semester_clash",
            True
        )
        else 0
    )

    cycle_constraint = (
        1
        if data.get(
            "cycle_constraint",
            True
        )
        else 0
    )

    connection = None
    cursor = None

    try:

        connection = get_connection(
            dictionary=True
        )

        cursor = connection.cursor(
            dictionary=True
        )

        # ====================================================
        # CHECK EXISTING RECORD
        # ====================================================

        cursor.execute(
            """
            SELECT id
            FROM timetable_constraints
            WHERE
                academic_year = %s
                AND department_code = %s
                AND scheme_id = %s
            LIMIT 1
            """,
            (
                academic_year,
                department_code,
                scheme_id
            )
        )

        existing = cursor.fetchone()

        # ====================================================
        # UPDATE EXISTING
        # ====================================================

        if existing:

            constraint_id = existing["id"]

            cursor.execute(
                """
                UPDATE timetable_constraints
                SET
                    working_days = %s,
                    periods = %s,
                    break_data = %s,
                    faculty_daily_limit = %s,
                    student_daily_limit = %s,
                    lab_consecutive = %s,
                    faculty_clash = %s,
                    semester_clash = %s,
                    cycle_constraint = %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (
                    working_days,
                    periods,
                    break_data,
                    faculty_daily_limit,
                    student_daily_limit,
                    lab_consecutive,
                    faculty_clash,
                    semester_clash,
                    cycle_constraint,
                    constraint_id
                )
            )

            message = (
                "Timetable constraints updated successfully."
            )

        # ====================================================
        # INSERT NEW
        # ====================================================

        else:

            cursor.execute(
                """
                INSERT INTO timetable_constraints
                (
                    academic_year,
                    department_code,
                    scheme_id,
                    working_days,
                    periods,
                    break_data,
                    faculty_daily_limit,
                    student_daily_limit,
                    lab_consecutive,
                    faculty_clash,
                    semester_clash,
                    cycle_constraint,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    NOW(),
                    NOW()
                )
                """,
                (
                    academic_year,
                    department_code,
                    scheme_id,
                    working_days,
                    periods,
                    break_data,
                    faculty_daily_limit,
                    student_daily_limit,
                    lab_consecutive,
                    faculty_clash,
                    semester_clash,
                    cycle_constraint
                )
            )

            message = (
                "Timetable constraints saved successfully."
            )

        # ----------------------------------------------------
        # Commit
        # ----------------------------------------------------

        connection.commit()

        return jsonify({
            "success": True,
            "message": message
        }), 200

    except Exception as error:

        if connection:
            connection.rollback()

        print(
            "SAVE timetable constraints error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to save timetable constraints.",
            "error": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# DELETE CONSTRAINTS
# ============================================================

@timetable_constraints_api.route(
    "/timetable-constraints",
    methods=["DELETE"]
)
def delete_timetable_constraints():

    academic_year = request.args.get(
        "academic_year"
    )

    department_code = request.args.get(
        "department"
    )

    scheme_id = request.args.get(
        "scheme"
    )

    if not academic_year:
        return jsonify({
            "success": False,
            "message": "Academic year is required."
        }), 400

    if not department_code:
        return jsonify({
            "success": False,
            "message": "Department is required."
        }), 400

    if not scheme_id:
        return jsonify({
            "success": False,
            "message": "Scheme is required."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM timetable_constraints
            WHERE
                academic_year = %s
                AND department_code = %s
                AND scheme_id = %s
            """,
            (
                academic_year,
                department_code,
                scheme_id
            )
        )

        deleted_count = cursor.rowcount

        connection.commit()

        return jsonify({
            "success": True,
            "message": (
                "Timetable constraints deleted successfully."
            ),
            "deleted": deleted_count
        }), 200

    except Exception as error:

        if connection:
            connection.rollback()

        print(
            "DELETE timetable constraints error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to delete timetable constraints.",
            "error": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()