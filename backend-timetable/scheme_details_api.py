from flask import Blueprint, jsonify
import mysql.connector


scheme_details_api = Blueprint(
    "scheme_details_api",
    __name__
)


def get_database_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )


@scheme_details_api.route(
    "/api/scheme-details/<int:scheme_id>",
    methods=["GET"]
)
def get_scheme_details(scheme_id):

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Get scheme
        cursor.execute("""
            SELECT
                scheme_id,
                scheme_year
            FROM scheme
            WHERE scheme_id = %s
        """, (scheme_id,))

        scheme = cursor.fetchone()

        if not scheme:

            return jsonify({
                "error": "Scheme not found"
            }), 404


        # Get all departments for this scheme
        cursor.execute("""
            SELECT
                sd.id,
                d.department_id,
                d.department_code,
                d.department_name,
                sd.pdf_path

            FROM department d

            LEFT JOIN scheme_department sd
                ON sd.department_id = d.department_id
                AND sd.scheme_id = %s

            ORDER BY d.department_id
        """, (scheme_id,))

        departments = cursor.fetchall()


        # Get multiple PDFs for each department
        for department in departments:

            cursor.execute("""
                SELECT
                    id,
                    pdf_name,
                    pdf_path

                FROM scheme_department_pdf

                WHERE scheme_department_id = %s

                ORDER BY id
            """, (department["id"],))

            multiple_pdfs = cursor.fetchall()


            # If multiple PDFs exist, use them
            if multiple_pdfs:

                department["pdfs"] = multiple_pdfs

            else:

                department["pdfs"] = []


        return jsonify({

            "scheme_id":
                scheme["scheme_id"],

            "scheme_year":
                scheme["scheme_year"],

            "departments":
                departments

        })


    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


    finally:

        cursor.close()
        connection.close()