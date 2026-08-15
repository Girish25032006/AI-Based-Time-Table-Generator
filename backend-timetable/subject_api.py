from flask import Blueprint, jsonify, request
import mysql.connector

subject_api = Blueprint("subject_api", __name__)

@subject_api.route("/subjects", methods=["GET"])
def get_subjects():

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT
        s.subject_id,
        s.subject_code,
        s.subject_name,
        d.department_code,
        sem.semester_no,
        sc.scheme_year,
        s.credits,
        s.lecture_hours,
        s.tutorial_hours,
        s.practical_hours,
        s.cycle,
        s.is_optional
    FROM subject s
    JOIN department d
        ON s.department_id = d.department_id
    JOIN semester sem
        ON s.semester_id = sem.semester_id
    JOIN scheme sc
        ON s.scheme_id = sc.scheme_id
    """

    cursor.execute(query)

    subjects = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(subjects)

@subject_api.route("/subjects", methods=["POST"])
def add_subject():
    data = request.get_json()
    department = data.get("department")
    scheme = data.get("scheme")
    semester = data.get("semester")
    subject_code = data.get("subject_code")
    subject_name = data.get("subject_name")
    credits = data.get("credits")
    lecture_hours = data.get("lecture_hours")
    tutorial_hours = data.get("tutorial_hours")
    practical_hours = data.get("practical_hours")
    cycle = data.get("cycle")
    group_id = data.get("group_id")
    is_optional = data.get("is_optional")
    option_group_id = data.get("option_group_id")

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()

    query = """
    INSERT INTO subject (
        subject_code,
        subject_name,
        department_id,
        semester_id,
        scheme_id,
        credits,
        lecture_hours,
        tutorial_hours,
        practical_hours,
        cycle,
        group_id,
        is_optional,
        option_group_id
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    cursor.execute(
        "SELECT department_id FROM department WHERE department_code = %s",
        (department,)
    )
    department_id = cursor.fetchone()[0]

    cursor.execute(
        "SELECT scheme_id FROM scheme WHERE scheme_year = %s",
        (scheme,)
    )
    scheme_id = cursor.fetchone()[0]

    cursor.execute(
        "SELECT semester_id FROM semester WHERE semester_no = %s",
        (semester,)
    )
    semester_id = cursor.fetchone()[0]

    cursor.execute(
        query,
        (
            subject_code,
            subject_name,
            department_id,
            semester_id,
            scheme_id,
            credits,
            lecture_hours,
            tutorial_hours,
            practical_hours,
            cycle,
            group_id,
            is_optional,
            option_group_id
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Subject added successfully!"}), 201
@subject_api.route("/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="timetable_db"
    )

    cursor = connection.cursor()
    cursor.execute(
        "DELETE FROM subject WHERE subject_id = %s",
        (subject_id,)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Subject deleted successfully!"})
@subject_api.route("/subjects/<int:subject_id>", methods=["PUT"])
def update_subject(subject_id):
    try:
        data = request.get_json()

        department = data.get("department")
        scheme = data.get("scheme")
        semester = data.get("semester")
        subject_code = data.get("subject_code")
        subject_name = data.get("subject_name")
        credits = data.get("credits")
        lecture_hours = data.get("lecture_hours")
        tutorial_hours = data.get("tutorial_hours")
        practical_hours = data.get("practical_hours")
        cycle = data.get("cycle")
        group_id = data.get("group_id")
        is_optional = data.get("is_optional")
        option_group_id = data.get("option_group_id")

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

        cursor.execute(
            "SELECT scheme_id FROM scheme WHERE scheme_year=%s",
            (scheme,)
        )
        scheme_id = cursor.fetchone()[0]

        cursor.execute(
            "SELECT semester_id FROM semester WHERE semester_no=%s",
            (semester,)
        )
        semester_id = cursor.fetchone()[0]

        query = """
        UPDATE subject
        SET
            subject_code=%s,
            subject_name=%s,
            department_id=%s,
            semester_id=%s,
            scheme_id=%s,
            credits=%s,
            lecture_hours=%s,
            tutorial_hours=%s,
            practical_hours=%s,
            cycle=%s,
            group_id=%s,
            is_optional=%s,
            option_group_id=%s
        WHERE subject_id=%s
        """

        cursor.execute(
            query,
            (
                subject_code,
                subject_name,
                department_id,
                semester_id,
                scheme_id,
                credits,
                lecture_hours,
                tutorial_hours,
                practical_hours,
                cycle,
                group_id,
                is_optional,
                option_group_id,
                subject_id
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({"message": "Subject updated successfully!"})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500