from flask import Blueprint, jsonify
import mysql.connector

dashboard_api = Blueprint("dashboard_api", __name__)


def get_database_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )


@dashboard_api.route("/dashboard-stats", methods=["GET"])
def dashboard_stats():

    connection = get_database_connection()
    cursor = connection.cursor()

    try:

        # Departments
        cursor.execute("SELECT COUNT(*) FROM department")
        departments = cursor.fetchone()[0]

        # Schemes
        cursor.execute("SELECT COUNT(*) FROM scheme")
        schemes = cursor.fetchone()[0]

        # Subjects
        cursor.execute("SELECT COUNT(*) FROM subject")
        subjects = cursor.fetchone()[0]

        # Faculty
        cursor.execute("SELECT COUNT(*) FROM faculty")
        faculty = cursor.fetchone()[0]

        # Timetable records
        # Generated timetable sets
        cursor.execute("""
            SELECT COUNT(*)
            FROM (
                SELECT
                    department_id,
                    scheme_id,
                    academic_year,
                    semester_type,
                    semester_id,
                    created_at
                FROM timetable
                GROUP BY
                    department_id,
                    scheme_id,
                    academic_year,
                    semester_type,
                    semester_id,
                    created_at
            ) AS generated_timetables
        """)

        timetables = cursor.fetchone()[0]

        return jsonify({
            "departments": departments,
            "schemes": schemes,
            "subjects": subjects,
            "faculty": faculty,
            "timetables": timetables,
            "pending": 0
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        connection.close()