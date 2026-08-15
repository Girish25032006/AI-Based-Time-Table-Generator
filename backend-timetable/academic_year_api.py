from flask import Blueprint, request, jsonify
import mysql.connector

academic_year_api = Blueprint(
    "academic_year_api",
    __name__
)


# =========================================
# DATABASE CONNECTION
# =========================================

def get_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )


# =========================================
# GET ALL ACADEMIC YEARS
# =========================================

@academic_year_api.route(
    "/api/academic-years",
    methods=["GET"]
)
def get_academic_years():

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute("""
            SELECT
                academic_year_id,
                academic_year,
                status
            FROM academic_year
            ORDER BY academic_year_id ASC
        """)

        years = cursor.fetchall()

        return jsonify(years), 200

    except Exception as e:

        print("Error loading academic years:", e)

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# ADD ACADEMIC YEAR
# =========================================

@academic_year_api.route(
    "/api/academic-years",
    methods=["POST"]
)
def add_academic_year():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        academic_year = (
            data.get("academic_year", "")
            .strip()
        )

        if not academic_year:

            return jsonify({
                "error":
                "Academic year is required."
            }), 400


        connection = get_connection()

        cursor = connection.cursor(
            dictionary=True
        )


        # Check duplicate

        cursor.execute("""
            SELECT academic_year_id
            FROM academic_year
            WHERE academic_year = %s
        """, (
            academic_year,
        ))

        existing = cursor.fetchone()


        if existing:

            return jsonify({
                "error":
                "Academic year already exists."
            }), 409


        # Insert

        cursor.execute("""
            INSERT INTO academic_year
            (
                academic_year,
                status
            )
            VALUES
            (
                %s,
                'Active'
            )
        """, (
            academic_year,
        ))


        connection.commit()

        new_id = cursor.lastrowid


        return jsonify({

            "message":
            "Academic year added successfully.",

            "academic_year_id":
            new_id,

            "academic_year":
            academic_year,

            "status":
            "Active"

        }), 201


    except Exception as e:

        if connection:
            connection.rollback()

        print(
            "Error adding academic year:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# UPDATE ACADEMIC YEAR
# =========================================

@academic_year_api.route(
    "/api/academic-years/<int:academic_year_id>",
    methods=["PUT"]
)
def update_academic_year(
    academic_year_id
):

    connection = None
    cursor = None

    try:

        data = request.get_json()

        academic_year = (
            data.get("academic_year", "")
            .strip()
        )

        status = data.get(
            "status",
            "Active"
        )


        if not academic_year:

            return jsonify({
                "error":
                "Academic year is required."
            }), 400


        connection = get_connection()

        cursor = connection.cursor(
            dictionary=True
        )


        # Check record

        cursor.execute("""
            SELECT academic_year_id
            FROM academic_year
            WHERE academic_year_id = %s
        """, (
            academic_year_id,
        ))

        existing = cursor.fetchone()


        if not existing:

            return jsonify({
                "error":
                "Academic year not found."
            }), 404


        # Check duplicate name

        cursor.execute("""
            SELECT academic_year_id
            FROM academic_year
            WHERE academic_year = %s
            AND academic_year_id != %s
        """, (
            academic_year,
            academic_year_id
        ))

        duplicate = cursor.fetchone()


        if duplicate:

            return jsonify({
                "error":
                "Academic year already exists."
            }), 409


        # Update

        cursor.execute("""
            UPDATE academic_year
            SET
                academic_year = %s,
                status = %s
            WHERE academic_year_id = %s
        """, (
            academic_year,
            status,
            academic_year_id
        ))


        connection.commit()


        return jsonify({

            "message":
            "Academic year updated successfully."

        }), 200


    except Exception as e:

        if connection:
            connection.rollback()

        print(
            "Error updating academic year:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# DELETE ACADEMIC YEAR
# =========================================

@academic_year_api.route(
    "/api/academic-years/<int:academic_year_id>",
    methods=["DELETE"]
)
def delete_academic_year(
    academic_year_id
):

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor(
            dictionary=True
        )


        # Check record

        cursor.execute("""
            SELECT
                academic_year_id,
                academic_year
            FROM academic_year
            WHERE academic_year_id = %s
        """, (
            academic_year_id,
        ))

        existing = cursor.fetchone()


        if not existing:

            return jsonify({
                "error":
                "Academic year not found."
            }), 404


        # Delete

        cursor.execute("""
            DELETE FROM academic_year
            WHERE academic_year_id = %s
        """, (
            academic_year_id,
        ))


        connection.commit()


        return jsonify({

            "message":
            "Academic year deleted successfully."

        }), 200


    except Exception as e:

        if connection:
            connection.rollback()

        print(
            "Error deleting academic year:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()