from flask import Blueprint, jsonify, request
import mysql.connector

department_api = Blueprint("department_api", __name__)

# GET API
@department_api.route("/departments", methods=["GET"])
def get_departments():

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM department")

    departments = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(departments)


# POST API
@department_api.route("/departments", methods=["POST"])
def add_department():

    data = request.json

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    query = """
    INSERT INTO department (department_code, department_name)
    VALUES (%s, %s)
    """

    values = (
        data["department_code"],
        data["department_name"]
    )

    cursor.execute(query, values)
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Department Added Successfully"})
@department_api.route("/departments/<int:id>", methods=["PUT"])
def update_department(id):

    data = request.json

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    query = """
    UPDATE department
    SET department_code=%s,
        department_name=%s
    WHERE department_id=%s
    """

    values = (
        data["department_code"],
        data["department_name"],
        id
    )

    cursor.execute(query, values)
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Department Updated Successfully"})
@department_api.route("/departments/<int:id>", methods=["DELETE"])
def delete_department(id):

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM department WHERE department_id = %s",
        (id,)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Department Deleted Successfully"})