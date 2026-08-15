from flask import Blueprint, request, jsonify
import mysql.connector
faculty_api = Blueprint("faculty_api", __name__)
@faculty_api.route("/faculties", methods=["GET"])
def get_faculties():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )
    cursor = connection.cursor(dictionary=True)
    cursor.execute("""
    SELECT
        f.faculty_id,
        f.faculty_name,
        d.department_code,
        f.designation,
        f.max_workload,
        f.status
    FROM faculty f
    JOIN department d
    ON f.department_id = d.department_id
    ORDER BY f.faculty_id;
    """)
    faculties = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(faculties)
@faculty_api.route("/faculties", methods=["POST"])
def add_faculty():

    data = request.get_json()

    faculty_name = data.get("faculty_name")
    department = data.get("department")
    designation = data.get("designation")
    max_workload = data.get("max_workload")
    status = data.get("status")

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    cursor.execute(
        "SELECT department_id FROM department WHERE department_code=%s",
        (department,)
    )

    department_id = cursor.fetchone()[0]

    query = """
    INSERT INTO faculty(
        faculty_name,
        department_id,
        designation,
        max_workload,
        status
    )
    VALUES(%s,%s,%s,%s,%s)
    """

    cursor.execute(
        query,
        (
            faculty_name,
            department_id,
            designation,
            max_workload,
            status
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message":"Faculty added successfully!"}),201
@faculty_api.route("/faculties/<int:faculty_id>", methods=["PUT"])
def update_faculty(faculty_id):

    data = request.get_json()

    faculty_name = data.get("faculty_name")
    department = data.get("department")
    designation = data.get("designation")
    max_workload = data.get("max_workload")
    status = data.get("status")

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    cursor.execute(
        "SELECT department_id FROM department WHERE department_code=%s",
        (department,)
    )

    department_id = cursor.fetchone()[0]

    query = """
    UPDATE faculty
    SET
        faculty_name=%s,
        department_id=%s,
        designation=%s,
        max_workload=%s,
        status=%s
    WHERE faculty_id=%s
    """

    cursor.execute(
        query,
        (
            faculty_name,
            department_id,
            designation,
            max_workload,
            status,
            faculty_id
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Faculty updated successfully!"})
@faculty_api.route("/faculties/<int:faculty_id>", methods=["DELETE"])
def delete_faculty(faculty_id):

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM faculty WHERE faculty_id=%s",
        (faculty_id,)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Faculty deleted successfully!"})