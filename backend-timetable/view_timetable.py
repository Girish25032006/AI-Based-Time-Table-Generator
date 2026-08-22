# ============================================================
# VIEW TIMETABLE API
# ============================================================

from flask import Blueprint, jsonify, request
import mysql.connector


# ============================================================
# BLUEPRINT
# ============================================================

view_timetable_api = Blueprint(
    "view_timetable_api",
    __name__
)


# ============================================================
# DATABASE CONFIG
# ============================================================

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "timetable_db",
}


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


# ============================================================
# VIEW TIMETABLE API
# ============================================================

@view_timetable_api.route(
    "/view-timetable",
    methods=["POST", "OPTIONS"]
)
def view_timetable():

    # ========================================================
    # CORS PREFLIGHT
    # ========================================================

    if request.method == "OPTIONS":
        return jsonify({
            "success": True
        }), 200


    conn = None
    cur = None


    try:

        # ====================================================
        # READ REQUEST
        # ====================================================

        data = request.get_json(
            silent=True
        ) or {}


        print(
            "\n========== VIEW TIMETABLE REQUEST =========="
        )

        print(
            "REQUEST DATA:",
            data
        )


        # ====================================================
        # GET DEPARTMENT
        # ====================================================

        department = str(
            data.get("department")
            or data.get("department_code")
            or ""
        ).strip()


        # ====================================================
        # GET SCHEME
        # ====================================================

        scheme_id = (
            data.get("scheme")
            or data.get("scheme_id")
        )


        # ====================================================
        # GET ACADEMIC YEAR
        # ====================================================

        academic_year = str(
            data.get("academic_year")
            or data.get("academicYear")
            or ""
        ).strip()


        # ====================================================
        # GET SEMESTER TYPE
        # ====================================================

        semester_type = str(
            data.get("semester_type")
            or data.get("semesterType")
            or ""
        ).strip()


        # ====================================================
        # GET SEMESTER
        # ====================================================

        semester_id = (
            data.get("semester")
            or data.get("semester_id")
        )


        # ====================================================
        # VALIDATION
        # ====================================================

        if not department:

            return jsonify({
                "success": False,
                "message": "Department is required."
            }), 400


        if scheme_id in (None, ""):

            return jsonify({
                "success": False,
                "message": "Scheme is required."
            }), 400


        if not academic_year:

            return jsonify({
                "success": False,
                "message": "Academic year is required."
            }), 400


        if semester_type not in ("Odd", "Even"):

            return jsonify({
                "success": False,
                "message":
                    "Semester Type must be Odd or Even."
            }), 400


        if semester_id in (None, ""):

            return jsonify({
                "success": False,
                "message": "Semester is required."
            }), 400


        # ====================================================
        # CONVERT IDs
        # ====================================================

        try:

            scheme_id = int(scheme_id)
            semester_id = int(semester_id)

        except (TypeError, ValueError):

            return jsonify({
                "success": False,
                "message":
                    "Invalid scheme or semester."
            }), 400


        # ====================================================
        # CHECK ODD / EVEN
        # ====================================================

        if (
            semester_type == "Odd"
            and semester_id % 2 == 0
        ):

            return jsonify({
                "success": False,
                "message":
                    "Selected semester does not belong "
                    "to Odd semester type."
            }), 400


        if (
            semester_type == "Even"
            and semester_id % 2 != 0
        ):

            return jsonify({
                "success": False,
                "message":
                    "Selected semester does not belong "
                    "to Even semester type."
            }), 400


        # ====================================================
        # DATABASE CONNECTION
        # ====================================================

        conn = get_connection()

        cur = conn.cursor(
            dictionary=True
        )


        # ====================================================
        # FIND DEPARTMENT
        # ====================================================

        cur.execute(
            """
            SELECT
                department_id,
                department_code,
                department_name
            FROM department
            WHERE department_code = %s
            LIMIT 1
            """,
            (department,)
        )

        department_row = cur.fetchone()


        # ====================================================
        # IF CODE NOT FOUND, TRY DEPARTMENT ID
        # ====================================================

        if not department_row:

            try:

                department_id_value = int(
                    department
                )

            except (
                TypeError,
                ValueError
            ):

                department_id_value = None


            if department_id_value is not None:

                cur.execute(
                    """
                    SELECT
                        department_id,
                        department_code,
                        department_name
                    FROM department
                    WHERE department_id = %s
                    LIMIT 1
                    """,
                    (department_id_value,)
                )

                department_row = cur.fetchone()


        # ====================================================
        # DEPARTMENT NOT FOUND
        # ====================================================

        if not department_row:

            return jsonify({
                "success": False,
                "message":
                    f"Department '{department}' not found."
            }), 404


        department_id = int(
            department_row["department_id"]
        )

        department_code = (
            department_row["department_code"]
        )

        department_name = (
            department_row["department_name"]
        )


        # ====================================================
        # CHECK SCHEME
        # ====================================================

        cur.execute(
            """
            SELECT
                scheme_id
            FROM scheme
            WHERE scheme_id = %s
            LIMIT 1
            """,
            (scheme_id,)
        )

        scheme_row = cur.fetchone()


        if not scheme_row:

            return jsonify({
                "success": False,
                "message":
                    f"Scheme '{scheme_id}' not found."
            }), 404


        # ====================================================
        # LOAD TIMETABLE
        #
        # IMPORTANT:
        # We fetch:
        #
        #   1. Main Faculty
        #   2. Lab Faculty
        #
        # We DO NOT use:
        #
        #   lab_co_faculty_id
        #
        # ====================================================

        cur.execute(
            """
            SELECT

                t.timetable_id,

                t.department_id,

                t.scheme_id,

                t.academic_year,

                t.semester_type,

                t.semester_id,

                t.day,

                t.period,

                t.subject_id,

                t.faculty_id,

                s.subject_code,

                s.subject_name,

                s.credits,

                s.practical_hours,

                f.faculty_name,

                f.designation,

                fsa.lab_faculty_id,

                lf.faculty_name AS lab_faculty_name,

                lf.designation AS lab_faculty_designation

            FROM timetable t

            LEFT JOIN subject s
                ON s.subject_id = t.subject_id

            LEFT JOIN faculty f
                ON f.faculty_id = t.faculty_id

            LEFT JOIN faculty_subject_assignment fsa
                ON fsa.subject_id = t.subject_id

                AND fsa.academic_year =
                    t.academic_year

                AND fsa.status = 'Active'

            LEFT JOIN faculty lf
                ON lf.faculty_id =
                    fsa.lab_faculty_id

            WHERE

                t.department_id = %s

                AND t.scheme_id = %s

                AND t.academic_year = %s

                AND t.semester_type = %s

                AND t.semester_id = %s

            ORDER BY

                FIELD(
                    t.day,
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday'
                ),

                t.period
            """,
            (
                department_id,
                scheme_id,
                academic_year,
                semester_type,
                semester_id
            )
        )


        rows = cur.fetchall()


        # ====================================================
        # NO DATA
        # ====================================================

        if not rows:

            return jsonify({

                "success": True,

                "message":
                    "No saved timetable found "
                    "for the selected semester.",

                "department":
                    department_code,

                "department_name":
                    department_name,

                "department_id":
                    department_id,

                "scheme":
                    scheme_id,

                "academic_year":
                    academic_year,

                "semester_type":
                    semester_type,

                "semester":
                    semester_id,

                "timetable": {},

                "subjects": [],

                "faculty": []

            }), 200


        # ====================================================
        # TIMETABLE STRUCTURE
        # ====================================================

        timetable = {

            "Monday": {},
            "Tuesday": {},
            "Wednesday": {},
            "Thursday": {},
            "Friday": {},
            "Saturday": {}

        }


        # ====================================================
        # SUBJECTS
        # ====================================================

        subjects = {}


        # ====================================================
        # FACULTY DETAILS
        # ====================================================

        faculty = {}


        # ====================================================
        # PROCESS DATABASE ROWS
        # ====================================================

        for row in rows:

            day = row["day"]


            if day not in timetable:

                continue


            # =================================================
            # PERIOD
            # =================================================

            period = int(
                row["period"]
            )


            # =================================================
            # SUBJECT
            # =================================================

            subject_id = row["subject_id"]

            subject_code = (
                row["subject_code"] or ""
            )

            subject_name = (
                row["subject_name"] or ""
            )

            credits = row["credits"]


            # =================================================
            # PRACTICAL HOURS
            # =================================================

            practical_hours = (
                row["practical_hours"]
                or 0
            )


            try:

                practical_hours = float(
                    practical_hours
                )

            except (
                TypeError,
                ValueError
            ):

                practical_hours = 0


            # =================================================
            # LAB CHECK
            #
            # Actual lab:
            # practical_hours > 0
            # AND credits = 1
            #
            # This prevents normal 4-credit subjects
            # from being displayed as LAB.
            # =================================================

            try:

                credits_value = float(
                    credits
                )

            except (
                TypeError,
                ValueError
            ):

                credits_value = 0


            is_lab = (

                practical_hours > 0

                and credits_value == 1

            )


            # =================================================
            # MAIN FACULTY
            # =================================================

            faculty_id = (
                row["faculty_id"]
            )

            faculty_name = (
                row["faculty_name"]
                or ""
            )


            # =================================================
            # LAB FACULTY
            # =================================================

            lab_faculty_id = (
                row["lab_faculty_id"]
            )

            lab_faculty_name = (
                row["lab_faculty_name"]
                or ""
            )


            # =================================================
            # SUBJECT LIST
            # =================================================

            if subject_id is not None:

                sid = int(
                    subject_id
                )


                if sid not in subjects:

                    subjects[sid] = {

                        "subject_id":
                            sid,

                        "subject_code":
                            subject_code,

                        "subject_name":
                            subject_name,

                        "credits":
                            credits,

                        "practical_hours":
                            practical_hours,

                        "is_lab":
                            is_lab

                    }


            # =================================================
            # MAIN FACULTY LIST
            # =================================================

            if faculty_id is not None:

                fid = int(
                    faculty_id
                )


                if fid not in faculty:

                    faculty[fid] = {

                        "faculty_id":
                            fid,

                        "faculty_name":
                            faculty_name,

                        "designation":
                            row["designation"],

                        "role":
                            "Faculty"

                    }


            # =================================================
            # LAB FACULTY LIST
            #
            # Only add if a lab faculty exists.
            # =================================================

            if (

                lab_faculty_id is not None

                and lab_faculty_name

            ):

                lab_fid = int(
                    lab_faculty_id
                )


                # ---------------------------------------------
                # Use separate key so main faculty and
                # lab faculty can both appear.
                # ---------------------------------------------

                lab_key = (
                    f"lab_{lab_fid}"
                )


                if lab_key not in faculty:

                    faculty[lab_key] = {

                        "faculty_id":
                            lab_fid,

                        "faculty_name":
                            lab_faculty_name,

                        "designation":
                            row[
                                "lab_faculty_designation"
                            ],

                        "role":
                            "Lab Faculty"

                    }


            # =================================================
            # PERIOD DATA
            # =================================================

            timetable[day][
                f"P{period}"
            ] = {

                "timetable_id":
                    row["timetable_id"],

                "period":
                    period,

                "subject_id":
                    subject_id,

                "subject_code":
                    subject_code,

                "subject_name":
                    subject_name,

                "faculty_id":
                    faculty_id,

                "faculty_name":
                    faculty_name,

                "lab_faculty_id":
                    lab_faculty_id,

                "lab_faculty_name":
                    lab_faculty_name,

                "credits":
                    credits,

                "practical_hours":
                    practical_hours,

                "is_lab":
                    is_lab,

                "free":
                    False

            }


        # ====================================================
        # ADD FREE PERIODS
        # ====================================================

        for day in timetable:

            for period in range(1, 8):

                key = f"P{period}"


                if key not in timetable[day]:

                    timetable[day][key] = {

                        "period":
                            period,

                        "subject_id":
                            None,

                        "subject_code":
                            "",

                        "subject_name":
                            "",

                        "faculty_id":
                            None,

                        "faculty_name":
                            "",

                        "lab_faculty_id":
                            None,

                        "lab_faculty_name":
                            "",

                        "credits":
                            None,

                        "practical_hours":
                            0,

                        "is_lab":
                            False,

                        "free":
                            True

                    }


        # ====================================================
        # RESPONSE
        # ====================================================

        response = {

            "success":
                True,

            "message":
                "Timetable loaded successfully.",

            "department":
                department_code,

            "department_name":
                department_name,

            "department_id":
                department_id,

            "scheme":
                scheme_id,

            "academic_year":
                academic_year,

            "semester_type":
                semester_type,

            "semester":
                semester_id,

            "timetable":
                timetable,

            "subjects":
                list(
                    subjects.values()
                ),

            "faculty":
                list(
                    faculty.values()
                )

        }


        # ====================================================
        # DEBUG
        # ====================================================

        print(
            "\n========== VIEW TIMETABLE SUCCESS =========="
        )

        print(
            "Department:",
            department_code
        )

        print(
            "Department ID:",
            department_id
        )

        print(
            "Scheme:",
            scheme_id
        )

        print(
            "Academic Year:",
            academic_year
        )

        print(
            "Semester Type:",
            semester_type
        )

        print(
            "Semester:",
            semester_id
        )

        print(
            "Rows:",
            len(rows)
        )

        print(
            "Faculty:",
            len(faculty)
        )

        print(
            "Subjects:",
            len(subjects)
        )

        print(
            "============================================\n"
        )


        return jsonify(
            response
        ), 200


    # ========================================================
    # MYSQL ERROR
    # ========================================================

    except mysql.connector.Error as e:

        print(
            "\n========== MYSQL VIEW ERROR =========="
        )

        print(e)

        print(
            "=====================================\n"
        )


        return jsonify({

            "success":
                False,

            "message":
                f"MySQL error: {e}"

        }), 500


    # ========================================================
    # OTHER ERROR
    # ========================================================

    except Exception as e:

        import traceback


        print(
            "\n========== VIEW TIMETABLE ERROR =========="
        )


        traceback.print_exc()


        print(
            "==========================================\n"
        )


        return jsonify({

            "success":
                False,

            "message":
                str(e)

        }), 500


    # ========================================================
    # CLOSE DATABASE
    # ========================================================

    finally:

        if cur is not None:

            try:

                cur.close()

            except Exception:

                pass


        if conn is not None:

            try:

                conn.close()

            except Exception:

                pass


# ============================================================
# DIRECT RUN
# ============================================================

if __name__ == "__main__":

    print(
        "view_timetable.py loaded."
    )

    print(
        "Run app.py to start Flask."
    )