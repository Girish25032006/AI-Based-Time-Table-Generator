from flask import Blueprint, request, jsonify
import mysql.connector
import os
from werkzeug.utils import secure_filename


scheme_pdf_api = Blueprint(
    "scheme_pdf_api",
    __name__
)


PDF_FOLDER = r"C:\Users\Hi\OneDrive\Desktop\frontend_timetable\scheme-pdfs"


def get_database_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )


@scheme_pdf_api.route(
    "/api/scheme-pdf/reupload",
    methods=["POST"]
)
def reupload_scheme_pdf():

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        pdf_type = request.form.get("pdf_type")

        pdf_id = request.form.get("pdf_id")

        scheme_department_id = request.form.get(
            "scheme_department_id"
        )

        # Accept both names
        uploaded_file = request.files.get("file")

        if not uploaded_file:
            uploaded_file = request.files.get("pdf")


        # ==========================================
        # VALIDATE FILE
        # ==========================================

        if not uploaded_file:

            return jsonify({
                "error": "No PDF file selected."
            }), 400


        if not uploaded_file.filename.lower().endswith(".pdf"):

            return jsonify({
                "error": "Only PDF files are allowed."
            }), 400


        # ==========================================
        # SECURE FILE NAME
        # ==========================================

        filename = secure_filename(
            uploaded_file.filename
        )


        if not filename:

            return jsonify({
                "error": "Invalid PDF file name."
            }), 400


        # ==========================================
        # NORMAL DEPARTMENT PDF
        # scheme_department
        # ==========================================

        # ==========================================
        # NORMAL DEPARTMENT PDF
        # scheme_department
        # ==========================================

        if pdf_type == "main":

            scheme_id = request.form.get("scheme_id")

            department_id = request.form.get("department_id")

            scheme_department_id = request.form.get(
                "scheme_department_id"
            )

            # ======================================
            # VALIDATE SCHEME + DEPARTMENT
            # ======================================

            if not scheme_id or not department_id:
                return jsonify({
                    "error":
                        "Scheme or department information not found."
                }), 400

            # ======================================
            # CHECK WHETHER RECORD ALREADY EXISTS
            # ======================================

            if scheme_department_id:

                cursor.execute("""
                    SELECT
                        id,
                        scheme_id,
                        department_id,
                        pdf_path
                    FROM scheme_department
                    WHERE id = %s
                """, (
                    scheme_department_id,
                ))

            else:

                cursor.execute("""
                    SELECT
                        id,
                        scheme_id,
                        department_id,
                        pdf_path
                    FROM scheme_department
                    WHERE scheme_id = %s
                    AND department_id = %s
                """, (
                    scheme_id,
                    department_id
                ))

            pdf_record = cursor.fetchone()

            # ======================================
            # GET SCHEME YEAR
            # ======================================

            cursor.execute("""
                SELECT scheme_year
                FROM scheme
                WHERE scheme_id = %s
            """, (
                scheme_id,
            ))

            scheme = cursor.fetchone()

            if not scheme:
                return jsonify({
                    "error": "Scheme not found."
                }), 404

            scheme_year = scheme["scheme_year"]

            # ======================================
            # CREATE DIRECTORY
            # ======================================

            relative_directory = str(
                scheme_year
            )

            target_directory = os.path.join(
                PDF_FOLDER,
                relative_directory
            )

            os.makedirs(
                target_directory,
                exist_ok=True
            )

            # ======================================
            # NEW FILE PATH
            # ======================================

            new_file_path = os.path.join(
                target_directory,
                filename
            )

            # Save uploaded PDF
            uploaded_file.save(
                new_file_path
            )

            # ======================================
            # DATABASE PATH
            # ======================================

            new_database_path = (
                    "scheme-pdfs/"
                    + relative_directory
                    + "/"
                    + filename
            )

            # ======================================
            # RECORD EXISTS → UPDATE
            # ======================================

            if pdf_record:
                cursor.execute("""
                    UPDATE scheme_department
                    SET pdf_path = %s
                    WHERE id = %s
                """, (
                    new_database_path,
                    pdf_record["id"]
                ))

                connection.commit()

                return jsonify({

                    "message":
                        "Department PDF uploaded successfully.",

                    "scheme_department_id":
                        pdf_record["id"],

                    "pdf_path":
                        new_database_path

                })

            # ======================================
            # RECORD DOES NOT EXIST → INSERT
            # ======================================

            cursor.execute("""
                INSERT INTO scheme_department
                (
                    scheme_id,
                    department_id,
                    pdf_path
                )
                VALUES
                (
                    %s,
                    %s,
                    %s
                )
            """, (
                scheme_id,
                department_id,
                new_database_path
            ))

            new_scheme_department_id = cursor.lastrowid

            connection.commit()

            return jsonify({

                "message":
                    "Department PDF uploaded successfully.",

                "scheme_department_id":
                    new_scheme_department_id,

                "pdf_path":
                    new_database_path

            })
        elif pdf_type == "additional":

            if not pdf_id:

                return jsonify({
                    "error":
                    "PDF information not found."
                }), 400


            cursor.execute("""
                SELECT
                    id,
                    pdf_name,
                    pdf_path
                FROM scheme_department_pdf
                WHERE id = %s
            """, (
                pdf_id,
            ))


            pdf_record = cursor.fetchone()


            if not pdf_record:

                return jsonify({
                    "error":
                    "PDF record not found."
                }), 404


            old_path = pdf_record["pdf_path"]


            if not old_path:

                return jsonify({
                    "error":
                    "Existing PDF path not found."
                }), 404


            relative_path = old_path.replace(
                "scheme-pdfs/",
                "",
                1
            )


            relative_directory = os.path.dirname(
                relative_path.replace(
                    "/",
                    os.sep
                )
            )


            target_directory = os.path.join(
                PDF_FOLDER,
                relative_directory
            )


            os.makedirs(
                target_directory,
                exist_ok=True
            )


            new_file_path = os.path.join(
                target_directory,
                filename
            )


            uploaded_file.save(
                new_file_path
            )


            new_database_path = (
                "scheme-pdfs/"
                + relative_directory.replace(
                    "\\",
                    "/"
                )
                + "/"
                + filename
            )


            cursor.execute("""
                UPDATE scheme_department_pdf
                SET
                    pdf_path = %s,
                    pdf_name = %s
                WHERE id = %s
            """, (
                new_database_path,
                filename,
                pdf_id
            ))


            connection.commit()


            return jsonify({

                "message":
                "Additional PDF re-uploaded successfully.",

                "pdf_id":
                pdf_id,

                "pdf_path":
                new_database_path

            })


        # ==========================================
        # INVALID PDF TYPE
        # ==========================================

        else:

            return jsonify({
                "error":
                "Invalid PDF type."
            }), 400


    except Exception as e:

        connection.rollback()

        return jsonify({
            "error": str(e)
        }), 500


    finally:

        cursor.close()
        connection.close()