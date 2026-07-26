from flask import Blueprint, jsonify, request
import mysql.connector

scheme_api = Blueprint("scheme_api", __name__)

@scheme_api.route("/schemes", methods=["GET"])
def get_schemes():

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM scheme")

    schemes = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(schemes)
@scheme_api.route("/schemes", methods=["POST"])
def add_scheme():

    data = request.json

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    query = """
    INSERT INTO scheme (scheme_year)
    VALUES (%s)
    """

    values = (
        data["scheme_year"],
    )

    cursor.execute(query, values)
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Scheme Added Successfully"})

@scheme_api.route("/schemes/<int:id>", methods=["PUT"])
def update_scheme(id):

    data = request.json

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    query = """
    UPDATE scheme
    SET scheme_year=%s
    WHERE scheme_id=%s
    """

    values = (
        data["scheme_year"],
        id
    )

    cursor.execute(query, values)
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Scheme Updated Successfully"})
@scheme_api.route("/schemes/<int:id>", methods=["DELETE"])
def delete_scheme(id):

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM scheme WHERE scheme_id = %s",
        (id,)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Scheme Deleted Successfully"})