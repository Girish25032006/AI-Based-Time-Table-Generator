import json
from collections import defaultdict

from flask import Blueprint, jsonify, request
import mysql.connector

from timetable_generator import TimetableGenerator


# ============================================================
# BLUEPRINT
# ============================================================

generate_timetable_api = Blueprint(
    "generate_timetable_api",
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


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


# ============================================================
# JSON HELPER
# ============================================================

def parse_json(value, default):

    if value is None:
        return default

    if isinstance(value, (dict, list)):
        return value

    try:
        return json.loads(value)

    except Exception:
        return default


# ============================================================
# NORMALIZE CONSTRAINT
# ============================================================

def normalize_constraint(row):

    # --------------------------------------------------------
    # Working days
    # --------------------------------------------------------

    working_days = parse_json(
        row.get("working_days"),
        []
    )

    if isinstance(working_days, str):

        working_days = [
            x.strip()
            for x in working_days.split(",")
            if x.strip()
        ]

    if not working_days:

        working_days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ]


    # --------------------------------------------------------
    # Periods
    # --------------------------------------------------------

    periods = parse_json(
        row.get("periods"),
        []
    )

    if not isinstance(periods, list):

        periods = []


    # --------------------------------------------------------
    # Add generator-compatible fields
    # --------------------------------------------------------

    row["working_days"] = working_days

    row["periods"] = periods

    row["periods_per_day"] = len(periods)

    return row


# ============================================================
# LOAD CONSTRAINT
# ============================================================

def load_constraint(
    conn,
    department_code,
    scheme_id,
    academic_year
):

    cur = conn.cursor(
        dictionary=True
    )

    cur.execute(
        """
        SELECT
            id,
            academic_year,
            department_code,
            scheme_id,
            working_days,
            periods,
            break_data,
            faculty_daily_limit,
            student_daily_limit,
            lab_consecutive,
            faculty_clash,
            semester_clash,
            cycle_constraint
        FROM timetable_constraints
        WHERE academic_year = %s
          AND department_code = %s
          AND scheme_id = %s
        ORDER BY id DESC
        LIMIT 1
        """,
        (
            academic_year,
            department_code,
            scheme_id
        )
    )

    row = cur.fetchone()

    cur.close()

    if not row:

        raise ValueError(
            "No timetable constraint found for "
            f"{department_code}, "
            f"scheme {scheme_id}, "
            f"{academic_year}"
        )

    return normalize_constraint(row)


# ============================================================
# LOAD SUBJECTS
# ============================================================

def load_subjects(conn, department_code, scheme_id, semesters, academic_year=None):
    if not semesters:
        return []

    cur = conn.cursor(dictionary=True)

    placeholders = ",".join(["%s"] * len(semesters))

    sql = f"""
        SELECT
            s.subject_id,
            s.subject_code,
            s.subject_name,
            s.semester_id,
            s.scheme_id,
            s.department_id,
            s.credits,
            s.lecture_hours,
            s.tutorial_hours,
            s.practical_hours,
            s.cycle,

            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM faculty_subject_assignment fsa
                    WHERE fsa.subject_id = s.subject_id
                      AND fsa.academic_year = %s
                      AND fsa.status = 'Active'
                )
                THEN 1
                ELSE 0
            END AS has_active_assignment

        FROM subject s

        JOIN department d
            ON d.department_id = s.department_id

        WHERE
            s.scheme_id = %s

            AND s.semester_id IN ({placeholders})

            AND
            (
                (
                    s.semester_id IN (1, 2)
                    AND d.department_code = 'SH'
                )

                OR

                (
                    s.semester_id NOT IN (1, 2)
                    AND d.department_code = %s
                )
            )

        ORDER BY
            s.semester_id,
            s.subject_code,

            /*
             * VERY IMPORTANT:
             * If duplicate subject rows exist,
             * choose the row that actually has
             * an active faculty assignment.
             */
            has_active_assignment DESC,

            /*
             * If both have assignments,
             * use the latest/highest subject_id.
             */
            s.subject_id DESC
    """

    params = (
        [academic_year]
        + [scheme_id]
        + [int(x) for x in semesters]
        + [department_code]
    )

    cur.execute(sql, params)

    rows = cur.fetchall()

    cur.close()

    # ---------------------------------------------------------
    # Remove duplicate subject codes.
    #
    # Because SQL already puts assigned rows first,
    # the selected row will be the assigned subject_id.
    # ---------------------------------------------------------

    unique = {}

    for row in rows:

        key = (
            int(row["semester_id"]),
            str(
                row["subject_code"]
            ).strip().upper()
        )

        if key not in unique:
            unique[key] = row

    result = list(unique.values())

    print(
        "LOADED SUBJECTS:",
        {
            sem: [
                (
                    s["subject_code"],
                    s["subject_id"],
                    s["has_active_assignment"]
                )
                for s in result
                if int(s["semester_id"]) == sem
            ]
            for sem in semesters
        }
    )

    return result
# ============================================================
# LOAD FACULTY ASSIGNMENTS
# ============================================================

def load_assignments(
    conn,
    subject_ids,
    academic_year
):

    if not subject_ids:
        return []


    cur = conn.cursor(
        dictionary=True
    )

    placeholders = ",".join(
        ["%s"] * len(subject_ids)
    )


    # IMPORTANT:
    #
    # faculty table has:
    #
    # faculty_id
    # faculty_name
    # department_id
    # designation
    # max_workload
    # status
    #
    # There is NO first_name / last_name.
    # --------------------------------------------------------

    sql = f"""
        SELECT

            fsa.subject_id,

            fsa.faculty_id,

            fsa.lab_faculty_id,

            fsa.lab_co_faculty_id,

            f.faculty_name,

            f.designation,

            f.max_workload,

            f.status AS faculty_status,

            lf.faculty_name
                AS lab_faculty_name,

            cf.faculty_name
                AS lab_co_faculty_name

        FROM faculty_subject_assignment fsa

        JOIN faculty f
          ON f.faculty_id =
             fsa.faculty_id

        LEFT JOIN faculty lf
          ON lf.faculty_id =
             fsa.lab_faculty_id

        LEFT JOIN faculty cf
          ON cf.faculty_id =
             fsa.lab_co_faculty_id

        WHERE
            fsa.subject_id
            IN ({placeholders})

          AND fsa.academic_year = %s

          AND fsa.status = 'Active'

          AND f.status = 'Active'
    """


    params = (
        [int(x) for x in subject_ids]
        +
        [academic_year]
    )


    cur.execute(
        sql,
        params
    )

    rows = cur.fetchall()

    cur.close()


    # --------------------------------------------------------
    # One active assignment per subject
    # --------------------------------------------------------

    result = {}

    for row in rows:

        subject_id = int(
            row["subject_id"]
        )

        if subject_id not in result:

            result[subject_id] = row


    return list(
        result.values()
    )


# ============================================================
# CONVERT RESULT TO JSON SAFE FORMAT
# ============================================================

def make_json_safe(value):

    if isinstance(value, dict):

        return {
            str(k):
                make_json_safe(v)
            for k, v in value.items()
        }


    if isinstance(value, list):

        return [
            make_json_safe(v)
            for v in value
        ]


    return value


# ============================================================
# GENERATE TIMETABLE API
# ============================================================

@generate_timetable_api.route(
    "/generate-timetable",
    methods=["POST", "OPTIONS"]
)
def generate_timetable_api_route():

    # --------------------------------------------------------
    # CORS preflight
    # --------------------------------------------------------

    if request.method == "OPTIONS":

        return jsonify({
            "ok": True
        }), 200


    conn = None


    try:

        # ====================================================
        # READ FRONTEND REQUEST
        # ====================================================

        data = request.get_json(
            silent=True
        ) or {}


        print(
            "\n========== GENERATE REQUEST =========="
        )

        print(
            "REQUEST DATA:",
            data
        )


        # ====================================================
        # DEPARTMENT
        # ====================================================

        department = str(
            data.get("department")
            or data.get("department_code")
            or ""
        ).strip()


        # ====================================================
        # SCHEME
        # ====================================================

        scheme_id = (
            data.get("scheme")
            or data.get("scheme_id")
        )


        # ====================================================
        # ACADEMIC YEAR
        # ====================================================

        academic_year = str(
            data.get("academic_year")
            or data.get("academicYear")
            or ""
        ).strip()


        # ====================================================
        # SEMESTER TYPE
        # ====================================================

        semester_type = str(
            data.get("semester_type")
            or data.get("semesterType")
            or ""
        ).strip().lower()


        # ====================================================
        # VALIDATE BASIC INPUT
        # ====================================================

        if not department:

            return jsonify({
                "success": False,
                "message":
                    "Department is required."
            }), 400


        if scheme_id in (
            None,
            ""
        ):

            return jsonify({
                "success": False,
                "message":
                    "Scheme is required."
            }), 400


        if not academic_year:

            return jsonify({
                "success": False,
                "message":
                    "Academic year is required."
            }), 400


        try:

            scheme_id = int(
                scheme_id
            )

        except Exception:

            return jsonify({
                "success": False,
                "message":
                    "Invalid scheme."
            }), 400


        # ====================================================
        # SEMESTERS
        # ====================================================

        selected = data.get(
            "semesters"
        )


        if selected:

            semesters = [
                int(x)
                for x in selected
            ]


        elif semester_type == "odd":

            semesters = [
                1,
                3,
                5,
                7
            ]


        elif semester_type == "even":

            semesters = [
                2,
                4,
                6,
                8
            ]


        else:

            return jsonify({
                "success": False,
                "message":
                    "Semester Type must be Odd or Even."
            }), 400


        # ====================================================
        # ENFORCE ODD / EVEN
        # ====================================================

        if semester_type == "odd":

            semesters = [
                s
                for s in semesters
                if s % 2 == 1
            ]


        elif semester_type == "even":

            semesters = [
                s
                for s in semesters
                if s % 2 == 0
            ]


        # Remove duplicates
        semesters = list(
            dict.fromkeys(
                semesters
            )
        )


        if not semesters:

            return jsonify({
                "success": False,
                "message":
                    "No valid semesters selected."
            }), 400


        # ====================================================
        # CONNECT DATABASE
        # ====================================================

        conn = get_connection()


        # ====================================================
        # LOAD CONSTRAINT
        # ====================================================

        constraint = load_constraint(
            conn,
            department,
            scheme_id,
            academic_year
        )


        # ====================================================
        # LOAD SUBJECTS
        # ====================================================

        subjects = load_subjects(
            conn,
            department,
            scheme_id,
            semesters
        )


        if not subjects:

            return jsonify({
                "success": False,
                "message":
                    "No subjects found for the selected semesters.",
                "department":
                    department,
                "scheme":
                    scheme_id,
                "academic_year":
                    academic_year,
                "semesters":
                    semesters
            }), 409


        # ====================================================
        # LOAD FACULTY ASSIGNMENTS
        # ====================================================

        subject_ids = [
            int(
                s["subject_id"]
            )
            for s in subjects
        ]


        assignments = load_assignments(
            conn,
            subject_ids,
            academic_year
        )


        # ====================================================
        # ONLY ASSIGNED SUBJECTS
        # ====================================================

        assigned_ids = {
            int(
                a["subject_id"]
            )
            for a in assignments
        }


        unassigned = defaultdict(
            list
        )


        for subject in subjects:

            sid = int(
                subject["subject_id"]
            )

            if sid not in assigned_ids:

                unassigned[
                    int(
                        subject["semester_id"]
                    )
                ].append(
                    subject[
                        "subject_code"
                    ]
                )


        subjects = [
            s
            for s in subjects
            if int(
                s["subject_id"]
            ) in assigned_ids
        ]


        if unassigned:

            print(
                "SKIPPING UNASSIGNED SUBJECTS:",
                dict(unassigned)
            )


        # ====================================================
        # DATA SUMMARY
        # ====================================================

        subjects_by_semester = defaultdict(
            int
        )


        for subject in subjects:

            subjects_by_semester[
                int(
                    subject["semester_id"]
                )
            ] += 1


        print(
            "GENERATION DATA:",
            "selected_semesters=",
            semesters,
            "subjects=",
            len(subjects),
            "assignments=",
            len(assignments),
            "subjects_by_semester=",
            dict(
                subjects_by_semester
            )
        )


        if not subjects:

            return jsonify({
                "success": False,
                "message":
                    "No Active faculty assignments found for the selected semesters.",
                "unassigned_subjects":
                    dict(unassigned)
            }), 409


        # ====================================================
        # CREATE GENERATOR
        # ====================================================

        print(
            "\n========== STARTING GENERATOR =========="
        )


        generator = TimetableGenerator(
            constraint=constraint,
            subjects=subjects,
            assignments=assignments,
            semester_list=semesters
        )


        # ====================================================
        # ONE GENERATION
        #
        # IMPORTANT:
        # NO 50 / 100 / 120 ATTEMPT LOOP.
        #
        # The generator is executed once.
        # ====================================================

        timetable = generator.generate()


        # ====================================================
        # CHECK RESULT
        # ====================================================

        if timetable is None:

            return jsonify({
                "success": False,
                "message":
                    "Could not generate a valid timetable with the selected assignments and constraints.",
                "semesters":
                    semesters,
                "unassigned_subjects":
                    dict(unassigned)
            }), 409


        # ====================================================
        # JSON SAFE TIMETABLE
        # ====================================================

        timetable_json = (
            make_json_safe(
                timetable
            )
        )


        # ====================================================
        # FINAL RESPONSE
        # ====================================================

        response = {

            "success": True,

            "message":
                "TIMETABLE GENERATED SUCCESSFULLY.",

            "department":
                department,

            "scheme":
                scheme_id,

            "academic_year":
                academic_year,

            "semester_type":
                semester_type,

            "semesters":
                semesters,

            "working_days":
                constraint[
                    "working_days"
                ],

            "periods":
                constraint[
                    "periods"
                ],

            "timetable":
                timetable_json,

            "subjects":
                make_json_safe(
                    subjects
                ),

            "assignments":
                make_json_safe(
                    assignments
                ),

            "unassigned_subjects":
                dict(
                    unassigned
                ),

            "generation_options":
                1
        }


        print(
            "\n========== GENERATION SUCCESS =========="
        )

        print(
            "TIMETABLE GENERATED SUCCESSFULLY"
        )

        print(
            "Semesters:",
            semesters
        )

        print(
            "Subjects:",
            len(subjects)
        )

        print(
            "Assignments:",
            len(assignments)
        )

        print(
            "========================================\n"
        )


        return jsonify(
            response
        ), 200


    # ========================================================
    # MYSQL ERROR
    # ========================================================

    except mysql.connector.Error as e:

        print(
            "MYSQL ERROR:",
            e
        )


        return jsonify({

            "success": False,

            "message":
                f"MySQL error: {e}"

        }), 500


    # ========================================================
    # OTHER ERROR
    # ========================================================

    except Exception as e:

        import traceback

        print(
            "\n========== GENERATION ERROR =========="
        )

        traceback.print_exc()

        print(
            "======================================\n"
        )


        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    # ========================================================
    # CLOSE DATABASE
    # ========================================================

    finally:

        if conn is not None:

            try:

                conn.close()

            except Exception:

                pass

# ============================================================
# SAVE GENERATED TIMETABLE
# ============================================================

@generate_timetable_api.route(
    "/save-timetable",
    methods=["POST", "OPTIONS"]
)
def save_timetable():

    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    conn = None

    try:

        data = request.get_json(
            silent=True
        ) or {}

        print(
            "\n========== SAVE TIMETABLE =========="
        )

        print(
            "SAVE DATA:",
            data
        )

        department_id = data.get(
            "department_id"
        )

        scheme_id = data.get(
            "scheme_id"
        )

        academic_year = data.get(
            "academic_year"
        )

        semester_type = data.get(
            "semester_type"
        )

        timetable = data.get(
            "timetable"
        )

        if not department_id:
            return jsonify({
                "success": False,
                "message":
                    "department_id is required."
            }), 400

        if not scheme_id:
            return jsonify({
                "success": False,
                "message":
                    "scheme_id is required."
            }), 400

        if not academic_year:
            return jsonify({
                "success": False,
                "message":
                    "academic_year is required."
            }), 400

        if semester_type not in (
            "Odd",
            "Even"
        ):
            return jsonify({
                "success": False,
                "message":
                    "semester_type must be Odd or Even."
            }), 400

        if not isinstance(
            timetable,
            dict
        ):
            return jsonify({
                "success": False,
                "message":
                    "Invalid timetable data."
            }), 400

        conn = get_connection()

        cur = conn.cursor()

        # ----------------------------------------------------
        # DELETE OLD DATA FOR SAME VERSION
        # ----------------------------------------------------

        for semester_id, days in timetable.items():

            try:
                semester_id = int(
                    semester_id
                )
            except Exception:
                continue

            cur.execute(
                """
                DELETE FROM timetable
                WHERE department_id = %s
                  AND scheme_id = %s
                  AND academic_year = %s
                  AND semester_type = %s
                  AND semester_id = %s
                """,
                (
                    int(department_id),
                    int(scheme_id),
                    academic_year,
                    semester_type,
                    semester_id
                )
            )

        # ----------------------------------------------------
        # INSERT GENERATED TIMETABLE
        # ----------------------------------------------------

        inserted_rows = 0

        for semester_id, days in timetable.items():

            try:
                semester_id = int(
                    semester_id
                )
            except Exception:
                continue

            if not isinstance(
                days,
                dict
            ):
                continue

            for day, periods in days.items():

                if not isinstance(
                    periods,
                    list
                ):
                    continue

                for period_index, slot in enumerate(
                    periods
                ):

                    if (
                        slot is None
                        or slot == "Empty"
                        or slot == "FREE"
                    ):
                        continue

                    period = (
                        period_index + 1
                    )

                    subject_id = None
                    faculty_id = None

                    # ----------------------------------------
                    # SLOT IS DICTIONARY
                    # ----------------------------------------

                    if isinstance(
                        slot,
                        dict
                    ):

                        subject_id = (
                            slot.get(
                                "subject_id"
                            )
                        )

                        faculty_id = (
                            slot.get(
                                "faculty_id"
                            )
                        )

                    # ----------------------------------------
                    # INSERT
                    # ----------------------------------------

                    cur.execute(
                        """
                        INSERT INTO timetable
                        (
                            department_id,
                            scheme_id,
                            academic_year,
                            semester_type,
                            semester_id,
                            day,
                            period,
                            subject_id,
                            faculty_id
                        )
                        VALUES
                        (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        """,
                        (
                            int(department_id),
                            int(scheme_id),
                            academic_year,
                            semester_type,
                            semester_id,
                            day,
                            period,
                            subject_id,
                            faculty_id
                        )
                    )

                    inserted_rows += 1

        conn.commit()

        cur.close()

        print(
            "TIMETABLE SAVED SUCCESSFULLY"
        )

        print(
            "Rows inserted:",
            inserted_rows
        )

        print(
            "====================================\n"
        )

        return jsonify({
            "success": True,
            "message":
                "Timetable saved successfully.",
            "rows_inserted":
                inserted_rows
        }), 200

    except mysql.connector.Error as e:

        if conn:
            conn.rollback()

        print(
            "MYSQL SAVE ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                f"MySQL error: {e}"
        }), 500

    except Exception as e:

        if conn:
            conn.rollback()

        import traceback

        traceback.print_exc()

        return jsonify({
            "success": False,
            "message":
                str(e)
        }), 500

    finally:

        if conn:

            try:
                conn.close()
            except Exception:
                pass
# ============================================================
# DIRECT RUN
# ============================================================

if __name__ == "__main__":

    print(
        "generate_timetable_api loaded."
    )

    print(
        "Run app.py to start Flask."
    )

