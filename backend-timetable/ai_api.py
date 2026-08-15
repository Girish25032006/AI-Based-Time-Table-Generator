from flask import Blueprint, request, jsonify
import mysql.connector
import re


ai_api = Blueprint("ai_api", __name__)


def get_database_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )


@ai_api.route("/ai-chat", methods=["POST"])
def ai_chat():

    data = request.get_json()

    message = data.get("message", "").strip().lower()

    if not message:
        return jsonify({
            "response": "Please enter a question."
        })


    connection = get_database_connection()
    cursor = connection.cursor()


    try:

        # ==========================================
        # COUNT DEPARTMENTS
        # ==========================================

        if "department" in message and (
            "how many" in message or
            "count" in message
        ):

            cursor.execute(
                "SELECT COUNT(*) FROM department"
            )

            count = cursor.fetchone()[0]

            response = (
                f"There are {count} departments "
                "in the system."
            )


        # ==========================================
        # COUNT SUBJECTS
        # ==========================================

        elif (
            "subject" in message
            and "how many" in message
            and not any(
                word in message
                for word in ["aiml", "cse", "mechanical",
                             "civil", "electronics", "ise",
                             "vlsi"]
            )
        ):

            cursor.execute(
                "SELECT COUNT(*) FROM subject"
            )

            count = cursor.fetchone()[0]

            response = (
                f"There are {count} subjects "
                "in the system."
            )


        # ==========================================
        # COUNT FACULTY
        # ==========================================

        elif "faculty" in message and (
            "how many" in message or
            "count" in message
        ):

            cursor.execute(
                "SELECT COUNT(*) FROM faculty"
            )

            count = cursor.fetchone()[0]

            response = (
                f"There are {count} faculty members "
                "in the system."
            )


        # ==========================================
        # COUNT SCHEMES
        # ==========================================

        elif "scheme" in message and (
            "how many" in message or
            "count" in message
        ):

            cursor.execute(
                "SELECT COUNT(*) FROM scheme"
            )

            count = cursor.fetchone()[0]

            response = (
                f"There are {count} schemes "
                "in the system."
            )


        # ==========================================
        # COUNT SEMESTERS
        # ==========================================

        elif "semester" in message and (
            "how many" in message or
            "count" in message
        ) and not re.search(
            r"\b[1-8](st|nd|rd|th)?\b",
            message
        ):

            cursor.execute(
                "SELECT COUNT(*) FROM semester"
            )

            count = cursor.fetchone()[0]

            response = (
                f"There are {count} semesters "
                "in the system."
            )


        # ==========================================
        # DEPARTMENT + SEMESTER SUBJECTS
        # ==========================================

        elif "subject" in message and re.search(
            r"\b[1-8](st|nd|rd|th)?\b",
            message
        ):

            # --------------------------------------
            # Find semester number
            # --------------------------------------

            semester_match = re.search(
                r"\b([1-8])(?:st|nd|rd|th)?\b",
                message
            )

            if semester_match:

                semester_no = int(
                    semester_match.group(1)
                )

            else:

                semester_no = None


            # --------------------------------------
            # Find department
            # --------------------------------------

            cursor.execute("""
                SELECT
                    department_id,
                    department_name,
                    department_code
                FROM department
            """)

            departments = cursor.fetchall()

            selected_department = None

            # --------------------------------------
            # Find department safely
            # --------------------------------------

            # First check exact department code
            for department_id, department_name, department_code in departments:

                code_pattern = r"\b" + re.escape(
                    department_code.lower()
                ) + r"\b"

                if re.search(code_pattern, message):
                    selected_department = (
                        department_id,
                        department_name,
                        department_code
                    )

                    break

            # If code was not found, check department name
            if selected_department is None:

                for department_id, department_name, department_code in departments:

                    name_pattern = r"\b" + re.escape(
                        department_name.lower()
                    ) + r"\b"

                    if re.search(name_pattern, message):
                        selected_department = (
                            department_id,
                            department_name,
                            department_code
                        )

                        break


            # --------------------------------------
            # Department not found
            # --------------------------------------

            if selected_department is None:

                response = (
                    "I could not identify the department. "
                    "Please mention the department name or "
                    "code, for example AIML, CSE-A, ISE, "
                    "Mechanical or Civil."
                )


            # --------------------------------------
            # Semester not found
            # --------------------------------------

            elif semester_no is None:

                response = (
                    "Please mention the semester number."
                )


            else:

                department_id = selected_department[0]
                department_name = selected_department[1]
                department_code = selected_department[2]

                cursor.execute("""
                    SELECT
                        s.cycle,
                        s.subject_code,
                        s.subject_name
                    FROM subject s
                    JOIN semester sem
                        ON s.semester_id = sem.semester_id
                    WHERE sem.semester_no = %s
                      AND (
                          s.department_id = %s
                          OR (
                              %s = 1
                              AND s.department_id = 9
                          )
                      )
                    ORDER BY
                        CASE
                            WHEN s.cycle = 'P' THEN 1
                            WHEN s.cycle = 'C' THEN 2
                            ELSE 3
                        END,
                        s.subject_code
                """, (
                    semester_no,
                    department_id,
                    semester_no
                ))

                subjects = cursor.fetchall()


                if subjects:

                    subject_data = [
                        {
                            "cycle": cycle,
                            "code": code,
                            "name": name
                        }
                        for cycle, code, name in subjects
                    ]

                    response = (
                        f"{department_code} - "
                        f"{semester_no}th Semester Subjects"
                    )
                else:

                    if semester_no == 1:
                        semester_text = "1st"
                    elif semester_no == 2:
                        semester_text = "2nd"
                    elif semester_no == 3:
                        semester_text = "3rd"
                    else:
                        semester_text = f"{semester_no}th"

                    response = (
                        f"{department_code} - "
                        f"{semester_text} Semester Subjects"
                    )


        # ==========================================
        # GENERAL RESPONSE
        # ==========================================

        else:

            response = (
                "I can help you with departments, "
                "subjects, faculty, schemes, semesters, "
                "and department-wise semester subjects."
            )

        return jsonify({
            "response": response,
            "subjects": subject_data if "subject_data" in locals() else []
        })


    except Exception as e:

        return jsonify({
            "response": "Sorry, I could not access the database.",
            "error": str(e)
        }), 500


    finally:

        cursor.close()
        connection.close()