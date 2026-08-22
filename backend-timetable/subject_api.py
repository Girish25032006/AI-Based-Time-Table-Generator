from flask import Blueprint, jsonify, request
import mysql.connector
import os
import re
import pdfplumber
import hashlib
from werkzeug.utils import secure_filename

subject_api = Blueprint("subject_api", __name__)

# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "timetable_db"
}

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection(dictionary=False):
    return mysql.connector.connect(
        **DB_CONFIG
    )


# ============================================================
# BASIC HELPERS
# ============================================================

def clean(value):
    if value is None:
        return ""

    return str(value).replace("\n", " ").strip()


def to_int(value, default=0):
    try:
        value = clean(value)

        if not value:
            return default

        return int(value)

    except (TypeError, ValueError):
        return default


def normalize_optional(value):
    if isinstance(value, bool):
        return 1 if value else 0

    value = clean(value).lower()

    if value in ("1", "yes", "y", "true"):
        return 1

    return 0


# ============================================================
# SEMESTER
# ============================================================

ROMAN_SEMESTERS = {
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4,
    "V": 5,
    "VI": 6,
    "VII": 7,
    "VIII": 8
}


def roman_semester(value):
    value = clean(value).upper()

    return ROMAN_SEMESTERS.get(value)


def semester_from_code(code):
    """
    Examples:

        BCS301  -> 3
        BCS515A -> 5
        1BCV605A -> 6
        1BCV801A -> 8
    """

    code = clean(code).upper()

    match = re.search(r"(\d{3})", code)

    if not match:
        return None

    number = match.group(1)

    semester = int(number[0])

    if 1 <= semester <= 8:
        return semester

    return None


# ============================================================
# COURSE CODE
# ============================================================

OLD_CODE_PATTERN = re.compile(
    r"^[A-Z][A-Z0-9]{2,10}\d{3}[A-Z]?$",
    re.IGNORECASE
)

NEW_CODE_PATTERN = re.compile(
    r"^1[A-Z][A-Z0-9]{2,10}\d{3}[A-Z]?$",
    re.IGNORECASE
)


def is_course_code(value):
    value = clean(value)

    if not value:
        return False

    return bool(
        OLD_CODE_PATTERN.fullmatch(value)
        or NEW_CODE_PATTERN.fullmatch(value)
    )


def is_placeholder_code(code):
    """
    x/X placeholders are not inserted.

    Examples:

        BCS306x
        BCS515x
        1BCVL307x
        1BCV605x
    """

    return clean(code).upper().endswith("X")


# ============================================================
# GET SCHEME FROM PDF
# ============================================================

def get_scheme_from_pdf_text(pdf_text):

    # Keep the original text
    text = str(pdf_text or "").lower()

    # Normalize different PDF spacing formats
    text = re.sub(r"\s+", " ", text).strip()

    patterns = [

        # Handles:
        # Scheme of Teaching and Examinations-2022
        # Scheme of Teaching and Examinations - 2022
        # SchemeofTeaching and examinations-2022
        r"scheme\s*of\s*teaching\s*and\s*examinations?\s*[-:()]?\s*(20\d{2})",

        # Handles:
        # 2022 Scheme
        # 2025 Scheme
        r"\b(20\d{2})\s+scheme\b",

        # Handles:
        # Scheme: 2022
        # Scheme-2022
        r"\bscheme\s*[:\-]?\s*(20\d{2})\b"
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            year = int(match.group(1))

            if year in (2022, 2025):

                print(
                    "PDF Scheme:",
                    year
                )

                return year

    print("Scheme not detected")

    return None


# ============================================================
# DEPARTMENT DETECTION
# ============================================================

DEPARTMENT_PATTERNS = [

    (
        "vlsi design & technology",
        "VLSI"
    ),

    (
        "vlsi design and technology",
        "VLSI"
    ),

    (
        "artificial intelligence and machine learning",
        "AIML"
    ),

    (
        "computer science and engineering - a",
        "CSE"
    ),

    (
        "computer science and engineering - b",
        "CSE"
    ),

    (
        "computer science and engineering",
        "CSE"
    ),

    (
        "electronics and communication engineering",
        "EC"
    ),

    (
        "electronics engineering",
        "EC"
    ),

    (
        "information science and engineering",
        "ISE"
    ),

    (
        "mechanical engineering",
        "ME"
    ),

    (
        "civil engineering",
        "CIV"
    ),

    (
        "science and humanities",
        "SH"
    )
]


def get_department_from_pdf_text(pdf_text):

    header = clean(pdf_text[:15000]).lower()

    detected_code = None

    for keyword, code in DEPARTMENT_PATTERNS:

        if keyword in header:

            detected_code = code

            break

    if not detected_code:

        print(
            "Department not detected"
        )

        return None

    return get_department_by_code(
        detected_code
    )


# ============================================================
# DATABASE LOOKUPS
# ============================================================

def get_department_by_code(code):

    connection = get_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT
            department_id,
            department_code,
            department_name
        FROM department
        WHERE UPPER(department_code)
              = UPPER(%s)
        LIMIT 1
        """,
        (code,)
    )

    row = cursor.fetchone()

    cursor.close()

    connection.close()

    return row


def get_scheme_id(scheme_year):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT scheme_id
        FROM scheme
        WHERE scheme_year = %s
        LIMIT 1
        """,
        (scheme_year,)
    )

    row = cursor.fetchone()

    cursor.close()

    connection.close()

    return row[0] if row else None


def get_semester_id(semester_no):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT semester_id
        FROM semester
        WHERE semester_no = %s
        LIMIT 1
        """,
        (semester_no,)
    )

    row = cursor.fetchone()

    cursor.close()

    connection.close()

    return row[0] if row else None


# ============================================================
# CYCLE DETECTION
# ============================================================

def detect_cycle_from_text(text):

    upper = clean(text).upper()

    if (
        "CHEMISTRY GROUP" in upper
        or "CHEMISTRY-GROUP" in upper
    ):
        return "C"

    if (
        "PHYSICS GROUP" in upper
        or "PHYSIC GROUP" in upper
        or "PHYSICS-GROUP" in upper
    ):
        return "P"

    return None


# ============================================================
# COURSE TYPE
# ============================================================

COURSE_TYPES = [
    "PCCL",
    "IPCC",
    "PCC",
    "BSC",
    "ASC",
    "ESC-II",
    "ESC-I",
    "ESC",
    "ETC-II",
    "ETC-I",
    "ETC",
    "PLC-II",
    "PLC-I",
    "PLC",
    "UHV",
    "HSMC",
    "HSMS",
    "AEC",
    "SEC",
    "SDC",
    "PEC",
    "OEC",
    "PROJ",
    "INT",
    "IKS",
    "MC"
]


def detect_course_type(text):

    upper = f" {clean(text).upper()} "

    # Long/specific values first
    for course_type in sorted(
        COURSE_TYPES,
        key=len,
        reverse=True
    ):

        if f" {course_type} " in upper:

            return course_type

    return None


# ============================================================
# ELECTIVE SECTION DETECTION
# ============================================================

def detect_elective_type(text):

    upper = clean(text).upper()

    # 2025 PEC
    if (
        "PROFESSIONAL ELECTIVE COURSE" in upper
        or "PROFESSIONAL ELECTIVE" in upper
    ):
        return "PEC"

    # 2025 OEC
    if (
        "OPEN ELECTIVE COURSE" in upper
        or "OPEN ELECTIVE" in upper
    ):
        return "OEC"

    # AEC
    if (
        "ABILITY ENHANCEMENT COURSE" in upper
        or "ABILITY ENHANCEMENT" in upper
    ):
        return "AEC"

    # SDC
    if (
        "SKILL DEVELOPMENT COURSE" in upper
        or "SKILL DEVELOPMENT" in upper
    ):
        return "SDC"

    # ESC/ETC/PLC section
    if (
        "ESC/ETC/PLC" in upper
        or "ENGINEERING SCIENCE COURSE" in upper
    ):
        return "ESC"

    # Direct course-type notation
    if re.search(r"\bPEC\b", upper):
        return "PEC"

    if re.search(r"\bOEC\b", upper):
        return "OEC"

    if re.search(r"\bAEC\b", upper):
        return "AEC"

    if re.search(r"\bSDC\b", upper):
        return "SDC"

    return None


# ============================================================
# OPTIONAL DETECTION
# ============================================================

def is_alternative_code(code):

    code = clean(code).upper()

    return bool(
        re.search(
            r"[A-H]$",
            code
        )
    )


def is_optional_subject(
    course_type,
    subject_code,
    scheme_year
):

    course_type = clean(
        course_type
    ).upper()

    code = clean(
        subject_code
    ).upper()

    # 2025 PEC / OEC
    if course_type in {
        "PEC",
        "OEC"
    }:
        return True

    # A/B/C/D alternatives
    if (
        course_type in {
            "AEC",
            "ESC",
            "ETC",
            "PLC"
        }
        and is_alternative_code(code)
    ):
        return True

    # 2022 elective alternatives
    if scheme_year == 2022:

        if re.match(
            r"^(BESCK|BETCK|BPLCK)\d{3}[A-H]$",
            code
        ):
            return True

        if (
            course_type in {
                "ESC",
                "ETC",
                "PLC",
                "AEC",
                "PEC",
                "OEC"
            }
            and is_alternative_code(code)
        ):
            return True

    return False


# ============================================================
# SUBJECT NAME
# ============================================================

IGNORE_NAME_VALUES = {
    "COURSE TITLE",
    "COURSE NAME",
    "SUBJECT NAME",
    "SUBJECT TITLE",
    "TD",
    "PSB",
    "ECE",
    "EE(VDT)",
    "ECE/VDT",
    "ANY DEPARTMENT",
    "ANY DEPT",
    "ANY DEPARTMENT/TD",
    "L",
    "T",
    "P",
    "S",
    "C",
    "CREDITS",
    "CREDIT",
    "IA",
    "SEE",
    "TOTAL"
}


def find_subject_name(
    row,
    code_index
):

    name_parts = []

    for j in range(
        code_index + 1,
        len(row)
    ):

        value = clean(row[j])

        if not value:
            continue

        if is_course_code(value):
            continue

        upper = value.upper()

        if upper in IGNORE_NAME_VALUES:
            continue

        if value.isdigit():
            continue

        if re.fullmatch(
            r"\d+(\.\d+)?",
            value
        ):
            continue

        # Stop when table numeric columns start.
        if re.fullmatch(
            r"[0-9 ]+",
            value
        ):
            break

        name_parts.append(value)

        # Usually subject title ends before
        # numeric L/T/P columns.
        if len(name_parts) >= 4:
            break

    name = " ".join(name_parts)

    name = re.sub(
        r"\s+",
        " ",
        name
    ).strip()

    return name


# ============================================================
# NUMBERS AFTER COURSE CODE
# ============================================================

def extract_numbers_after_code(row, code_index):
    """
    Extract only the teaching-hour values and credits from the
    flattened VTU PDF row.

    In the 2025 Civil PDF, teaching hours are commonly stored as
    semester totals:

        L = 42  -> 3 hours/week
        T = 0   -> 0 hours/week
        P = 28  -> 2 hours/week

    The examination marks appear after these values, so we must
    NOT treat all numbers after the subject code as L/T/P.
    """

    numbers = []

    for value in row[code_index + 1:]:

        value = clean(value)

        if not value:
            continue

        # Only accept a cell containing a single integer.
        if re.fullmatch(r"\d+", value):
            numbers.append(int(value))

    return numbers
def extract_2022_numbers_after_code(row, code_index):
    """
    Extract L/T/P/C for the 2022 VTU scheme.

    2022 PDF rows contain direct L/T/P values, but examination
    marks can also appear later in the flattened row.

    We therefore:
      1. Read numeric cells after the subject code.
      2. Use the first three relevant small values as L/T/P.
      3. Ignore examination marks such as 50, 60, etc.
      4. Find credits separately.
    """

    numbers = []

    for value in row[code_index + 1:]:

        value = clean(value)

        if not value:
            continue

        # Accept only a single integer cell.
        if re.fullmatch(r"\d+", value):
            numbers.append(int(value))

    if not numbers:
        return []

    # ---------------------------------------------------------
    # 2022 L / T / P
    #
    # Teaching-hour values should normally be small:
    # L = 0,1,2,3,4,5,6
    # T = 0,1,2,3...
    # P = 0,1,2,3...
    #
    # Examination marks such as 50, 60, 70 etc. are ignored.
    # ---------------------------------------------------------

    teaching_values = [
        value
        for value in numbers
        if 0 <= value <= 6
    ]

    if len(teaching_values) >= 3:

        lecture = teaching_values[0]
        tutorial = teaching_values[1]
        practical = teaching_values[2]

    else:

        lecture = 0
        tutorial = 0
        practical = 0

    # ---------------------------------------------------------
    # Credits
    #
    # Credits are normally small values such as 1, 2, 3, 4.
    # Use the last suitable small value.
    # ---------------------------------------------------------

    credits = 0

    for value in reversed(numbers):

        if 1 <= value <= 6:
            credits = value
            break

    return [
        lecture,
        tutorial,
        practical,
        credits
    ]

# ============================================================
# HOURS / CREDITS
# ============================================================

def extract_hours_and_credits(
    numbers,
    scheme_year=2025
):
    """
    Extract L/T/P and credits.

    2025:
        PDF contains semester totals.
        Example:
            42 0 28
        becomes:
            L=3, T=0, P=2
        because 42/14=3 and 28/14=2.

    2022:
        PDF contains direct weekly L/T/P values.
        Example:
            3 0 0
        stays:
            L=3, T=0, P=0
    """

    if len(numbers) < 3:
        return 0, 0, 0, 0

    raw_l = numbers[0]
    raw_t = numbers[1]
    raw_p = numbers[2]

    # --------------------------------------------------------
    # 2022 SCHEME
    # Direct L/T/P values
    # --------------------------------------------------------

    if scheme_year == 2022:

        lecture = raw_l
        tutorial = raw_t
        practical = raw_p

    # --------------------------------------------------------
    # 2025 SCHEME
    # Semester totals → weekly hours
    # --------------------------------------------------------

    else:

        lecture = round(raw_l / 14)
        tutorial = round(raw_t / 14)
        practical = round(raw_p / 14)

    # --------------------------------------------------------
    # Credits
    # --------------------------------------------------------

    credits = 0

    for value in reversed(numbers):

        if 1 <= value <= 10:

            credits = value
            break

    return (
        lecture,
        tutorial,
        practical,
        credits
    )

# ============================================================
# PLACEHOLDER KEY
# ============================================================

def placeholder_key_from_code(
    code,
    semester
):

    code = clean(code).upper()

    match = re.search(
        r"(\d{3})X$",
        code
    )

    if not match:
        return None

    return (
        semester,
        match.group(1)
    )


# ============================================================
# OPTION KEY
# ============================================================

def option_key_from_code(
    code,
    semester
):

    code = clean(code).upper()

    match = re.search(
        r"(\d{3})[A-H]$",
        code
    )

    if not match:
        return None

    return (
        semester,
        match.group(1)
    )


# ============================================================
# FIRST YEAR COMMON
# ============================================================

def looks_like_first_year_common(pdf_text):

    upper = clean(pdf_text).upper()

    first_year_keywords = [
        "COMMON TO ALL ENGINEERING PROGRAMMES",
        "COMMON TO ALL ENGINEERING PROGRAMS",
        "FIRST YEAR",
        "FIRST-YEAR",
        "I SEMESTER",
        "II SEMESTER",
        "BESCK",
        "BETCK",
        "BPLCK"
    ]

    # 2022 scheme first-year common subjects
    # are handled as Science & Humanities (SH).

    return any(
        keyword in upper
        for keyword in first_year_keywords
    )

# ============================================================
# EXTRACT SUBJECTS FROM PDF
# ============================================================

def extract_subjects_from_pdf(
    file_path
):

    subjects = []

    placeholder_hours = {}

    current_semester = None

    current_cycle = None

    current_elective_type = None
    current_scheme_section = None

    with pdfplumber.open(
        file_path
    ) as pdf:

        # --------------------------------------------------------
        # Complete PDF text
        # --------------------------------------------------------

        full_text = "\n".join(
            page.extract_text() or ""
            for page in pdf.pages
        )

        # --------------------------------------------------------
        # Scheme
        # --------------------------------------------------------

        scheme_year = (
            get_scheme_from_pdf_text(
                full_text
            )
        )

        if scheme_year not in (
            2022,
            2025
        ):

            raise ValueError(
                "Only 2022 and 2025 schemes are supported."
            )

        # --------------------------------------------------------
        # Department
        # --------------------------------------------------------

        department = (
            get_department_from_pdf_text(
                full_text
            )
        )

        if not department:

            # First-year common PDFs
            if looks_like_first_year_common(
                full_text
            ):

                department = (
                    get_department_by_code(
                        "SH"
                    )
                )

        if not department:

            raise ValueError(
                "Department could not be detected from PDF."
            )

        department_id = department[
            "department_id"
        ]

        department_code = department[
            "department_code"
        ]

        print(
            "PDF Department:",
            department_code
        )

        # ========================================================
        # PAGE LOOP
        # ========================================================

        for page_number, page in enumerate(
            pdf.pages,
            start=1
        ):

            page_text = (
                page.extract_text()
                or ""
            )

            page_upper = page_text.upper()
            # ----------------------------------------------------
            # Scheme-A / Scheme-B detection
            # ----------------------------------------------------

            if "SCHEME-A" in page_upper or "SCHEME A" in page_upper:
                current_scheme_section = "A"

            elif "SCHEME-B" in page_upper or "SCHEME B" in page_upper:
                current_scheme_section = "B"
            # ----------------------------------------------------
            # We import Scheme-A only
            # ----------------------------------------------------

            if current_scheme_section == "B":
                continue

            # ----------------------------------------------------
            # Semester heading
            # ----------------------------------------------------

            semester_matches = re.findall(
                r"\b(I|II|III|IV|V|VI|VII|VIII)\s+SEMESTER\b",
                page_upper
            )

            if semester_matches:

                current_semester = (
                    roman_semester(
                        semester_matches[-1]
                    )
                )

            # ----------------------------------------------------
            # Cycle
            # ----------------------------------------------------

            detected_cycle = (
                detect_cycle_from_text(
                    page_text
                )
            )

            if detected_cycle:

                current_cycle = detected_cycle

            # ----------------------------------------------------
            # Elective section
            # ----------------------------------------------------

            detected_elective = (
                detect_elective_type(
                    page_text
                )
            )

            if detected_elective:

                current_elective_type = (
                    detected_elective
                )

            # ----------------------------------------------------
            # Tables
            # ----------------------------------------------------

            tables = page.extract_tables()

            for table in tables:

                if not table:
                    continue

                for row in table:

                    if not row:
                        continue

                    row = [
                        clean(cell)
                        for cell in row
                    ]

                    if not any(row):
                        continue

                    row_text = " ".join(
                        cell
                        for cell in row
                        if cell
                    )

                    row_upper = (
                        row_text.upper()
                    )

                    # ------------------------------------------------
                    # Row semester
                    # ------------------------------------------------

                    row_semester_match = re.search(
                        r"\b(I|II|III|IV|V|VI|VII|VIII)\s+SEMESTER\b",
                        row_upper
                    )

                    if row_semester_match:

                        current_semester = (
                            roman_semester(
                                row_semester_match.group(1)
                            )
                        )

                    # ------------------------------------------------
                    # Row elective type
                    # ------------------------------------------------

                    row_elective = (
                        detect_elective_type(
                            row_text
                        )
                    )

                    if row_elective:

                        current_elective_type = (
                            row_elective
                        )

                    # ------------------------------------------------
                    # Find ALL course codes in this row
                    # ------------------------------------------------

                    course_codes_in_row = []

                    for index, cell in enumerate(row):

                        if is_course_code(cell):
                            course_codes_in_row.append(
                                (
                                    index,
                                    cell.upper()
                                )
                            )

                    if not course_codes_in_row:
                        continue

                    # ------------------------------------------------
                    # Process every course code in this row
                    # ------------------------------------------------

                    for code_index, subject_code in course_codes_in_row:
                        # ------------------------------------------------
                        # Semester
                        # ------------------------------------------------

                        subject_semester = (
                            semester_from_code(
                                subject_code
                            )
                        )

                        if subject_semester is None:
                            subject_semester = (
                                current_semester
                            )

                        if subject_semester is None:
                            continue
                        # ------------------------------------------------
                        # Placeholder x
                        # ------------------------------------------------

                        if is_placeholder_code(
                            subject_code
                        ):

                            if scheme_year == 2022:
                                numbers = extract_2022_numbers_after_code(
                                    row,
                                    code_index
                                )
                            else:
                                numbers = extract_numbers_after_code(
                                    row,
                                    code_index
                                )

                            (
                                lecture,
                                tutorial,
                                practical,
                                credits
                            ) = extract_hours_and_credits(
                                numbers,
                                scheme_year
                            )

                            key = (
                                placeholder_key_from_code(
                                    subject_code,
                                    subject_semester
                                )
                            )
                            # ------------------------------------------------
                            # Special VIII semester courses
                            # 801 = Online PEC
                            # 802 = Online OEC
                            # 803 = Internship
                            # ------------------------------------------------

                            if (
                                    subject_semester == 8
                                    and key
                                    and key[1] == "801"
                            ):
                                lecture = 0
                                tutorial = 0
                                practical = 0
                                credits = 3

                            elif (
                                    subject_semester == 8
                                    and key
                                    and key[1] == "802"
                            ):
                                lecture = 0
                                tutorial = 0
                                practical = 0
                                credits = 3

                            elif (
                                    subject_semester == 8
                                    and key
                                    and key[1] == "803"
                            ):
                                lecture = 0
                                tutorial = 0
                                practical = 0
                                credits = 9

                            if key:

                                # Keep the first valid occurrence.
                                # The 2025 Civil PDF contains both
                                # Scheme-A and Scheme-B, so codes such
                                # as 702/703/704/801/802/803 appear
                                # more than once.

                                if key not in placeholder_hours:

                                    placeholder_hours[key] = {

                                        "lecture_hours":
                                            lecture,

                                        "tutorial_hours":
                                            tutorial,

                                        "practical_hours":
                                            practical,

                                        "credits":
                                            credits
                                    }

                                    print(
                                        "Saved placeholder:",
                                        key,
                                        placeholder_hours[key]
                                    )

                                else:

                                    print(
                                        "Ignored duplicate placeholder:",
                                        key
                                    )

                            continue

                        # ------------------------------------------------
                        # Course type
                        # ------------------------------------------------

                        row_course_type = (
                            detect_course_type(
                                row_text
                            )
                        )

                        course_type = (
                            row_course_type
                            or current_elective_type
                            or ""
                        )

                        # ------------------------------------------------
                        # Subject name
                        # ------------------------------------------------

                        subject_name = (
                            find_subject_name(
                                row,
                                code_index
                            )
                        )

                        if not subject_name:

                            continue

                        # ------------------------------------------------
                        # Optional
                        # ------------------------------------------------

                        optional = (
                            is_optional_subject(
                                course_type,
                                subject_code,
                                scheme_year
                            )
                        )

                        # ------------------------------------------------
                        # Hours / credits
                        # ------------------------------------------------

                        if scheme_year == 2022:
                            numbers = extract_2022_numbers_after_code(
                                row,
                                code_index
                            )
                        else:
                            numbers = extract_numbers_after_code(
                                row,
                                code_index
                            )

                        (
                            lecture,
                            tutorial,
                            practical,
                            credits
                        ) = extract_hours_and_credits(
                                numbers,
                                scheme_year
                            )

                        # ------------------------------------------------
                        # Apply placeholder values
                        # ------------------------------------------------

                        option_key = (
                            option_key_from_code(
                                subject_code,
                                subject_semester
                            )
                        )

                        if option_key in placeholder_hours:

                            values = (
                                placeholder_hours[
                                    option_key
                                ]
                            )

                            lecture = values[
                                "lecture_hours"
                            ]

                            tutorial = values[
                                "tutorial_hours"
                            ]

                            practical = values[
                                "practical_hours"
                            ]

                            credits = values[
                                "credits"
                            ]

                            print(
                                "Applied placeholder:",
                                subject_code,
                                "->",
                                option_key,
                                values
                            )

                        # ------------------------------------------------
                        # Cycle
                        # ------------------------------------------------

                        cycle = current_cycle

                        if subject_semester not in (
                            1,
                            2
                        ):

                            cycle = None

                        # ------------------------------------------------
                        # First-year common
                        # ------------------------------------------------

                        subject_department_id = (
                            department_id
                        )

                        subject_department_code = (
                            department_code
                        )

                        if subject_semester in (1, 2):

                            sh = get_department_by_code("SH")

                            if sh:
                                subject_department_id = sh["department_id"]

                                subject_department_code = sh["department_code"]

                            sh = (
                                get_department_by_code(
                                    "SH"
                                )
                            )

                            if sh:

                                subject_department_id = (
                                    sh["department_id"]
                                )

                                subject_department_code = (
                                    sh["department_code"]
                                )

                        # ------------------------------------------------
                        # Build subject
                        # ------------------------------------------------

                        subject = {

                            "subject_code":
                                subject_code,

                            "subject_name":
                                subject_name,

                            "department_id":
                                subject_department_id,

                            "department_code":
                                subject_department_code,

                            "teaching_department_id":
                                None,

                            "scheme":
                                scheme_year,

                            "scheme_id":
                                1 if scheme_year == 2022
                                else 2,

                            "semester":
                                subject_semester,

                            "course_type":
                                course_type
                                if course_type
                                else "CORE",

                            "lecture_hours":
                                lecture,

                            "tutorial_hours":
                                tutorial,

                            "practical_hours":
                                practical,

                            "credits":
                                credits,

                            "cycle":
                                cycle,

                            "is_optional":
                                1 if optional else 0
                        }

                        # ------------------------------------------------
                        # Duplicate inside preview
                        # ------------------------------------------------

                        duplicate = False

                        for existing in subjects:

                            if (
                                existing["subject_code"]
                                == subject["subject_code"]
                                and
                                existing["department_id"]
                                == subject["department_id"]
                                and
                                existing["scheme"]
                                == subject["scheme"]
                                and
                                existing["semester"]
                                == subject["semester"]
                                and
                                existing.get("cycle")
                                == subject.get("cycle")
                            ):

                                duplicate = True

                                break

                        if not duplicate:

                            subjects.append(
                                subject
                            )

# ============================================================
    # SORT
    # ============================================================

    subjects.sort(
        key=lambda item: (
            item.get("semester") or 0,
            item.get("subject_code") or ""
        )
    )

    print(
        "\n========== EXTRACTION RESULT =========="
    )

    print(
        "Scheme:",
        scheme_year
    )

    print(
        "Department:",
        department_code
    )

    print(
        "Total:",
        len(subjects)
    )

    print(
        "========================================"
    )

    return subjects


# ============================================================
# GET SUBJECTS
# ============================================================

@subject_api.route(
    "/subjects",
    methods=["GET"]
)
def get_subjects():

    try:

        connection = get_connection(
            dictionary=True
        )

        cursor = connection.cursor()

        cursor.execute(
            """
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
                ON s.department_id =
                   d.department_id

            JOIN semester sem
                ON s.semester_id =
                   sem.semester_id

            JOIN scheme sc
                ON s.scheme_id =
                   sc.scheme_id

            ORDER BY
                sc.scheme_year,
                d.department_code,
                sem.semester_no,
                s.subject_code
            """
        )

        subjects = cursor.fetchall()

        cursor.close()

        connection.close()

        return jsonify(
            subjects
        )

    except Exception as e:

        print(
            "GET SUBJECTS ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# ADD SUBJECT
# ============================================================

@subject_api.route(
    "/subjects",
    methods=["POST"]
)
def add_subject():

    connection = None
    cursor = None

    try:

        data = (
            request.get_json()
            or {}
        )

        department_code = (
            data.get("department")
        )

        scheme_year = to_int(
            data.get("scheme")
        )

        semester_no = to_int(
            data.get("semester")
        )

        if not department_code:

            raise ValueError(
                "Department is required."
            )

        if not scheme_year:

            raise ValueError(
                "Scheme is required."
            )

        if not semester_no:

            raise ValueError(
                "Semester is required."
            )

        department = (
            get_department_by_code(
                department_code
            )
        )

        if not department:

            raise ValueError(
                "Department not found: "
                + str(department_code)
            )

        scheme_id = (
            get_scheme_id(
                scheme_year
            )
        )

        if scheme_id is None:

            raise ValueError(
                "Scheme not found: "
                + str(scheme_year)
            )

        semester_id = (
            get_semester_id(
                semester_no
            )
        )

        if semester_id is None:

            raise ValueError(
                "Semester not found: "
                + str(semester_no)
            )

        optional = normalize_optional(
            data.get("is_optional")
        )

        cycle = (
            data.get("cycle")
            or None
        )

        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO subject (
                subject_code,
                subject_name,
                department_id,
                teaching_department_id,
                semester_id,
                scheme_id,
                cycle,
                is_optional,
                lecture_hours,
                tutorial_hours,
                practical_hours,
                credits
            )
            VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
            """,
            (
                data.get(
                    "subject_code"
                ),
                data.get(
                    "subject_name"
                ),
                department[
                    "department_id"
                ],
                data.get(
                    "teaching_department_id"
                ),
                semester_id,
                scheme_id,
                cycle,
                optional,
                to_int(
                    data.get(
                        "lecture_hours"
                    )
                ),
                to_int(
                    data.get(
                        "tutorial_hours"
                    )
                ),
                to_int(
                    data.get(
                        "practical_hours"
                    )
                ),
                to_int(
                    data.get(
                        "credits"
                    )
                )
            )
        )

        connection.commit()

        return jsonify({
            "message":
                "Subject added successfully!"
        }), 201

    except Exception as e:

        if connection:

            connection.rollback()

        print(
            "ADD SUBJECT ERROR:",
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


# ============================================================
# UPDATE SUBJECT
# ============================================================

@subject_api.route(
    "/subjects/<int:subject_id>",
    methods=["PUT"]
)
def update_subject(subject_id):

    connection = None
    cursor = None

    try:

        data = (
            request.get_json()
            or {}
        )

        department = (
            get_department_by_code(
                data.get(
                    "department"
                )
            )
        )

        if not department:

            raise ValueError(
                "Department not found."
            )

        scheme_id = (
            get_scheme_id(
                to_int(
                    data.get(
                        "scheme"
                    )
                )
            )
        )

        if scheme_id is None:

            raise ValueError(
                "Scheme not found."
            )

        semester_id = (
            get_semester_id(
                to_int(
                    data.get(
                        "semester"
                    )
                )
            )
        )

        if semester_id is None:

            raise ValueError(
                "Semester not found."
            )

        optional = normalize_optional(
            data.get(
                "is_optional"
            )
        )

        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE subject
            SET
                subject_code = %s,
                subject_name = %s,
                department_id = %s,
                teaching_department_id = %s,
                semester_id = %s,
                scheme_id = %s,
                cycle = %s,
                is_optional = %s,
                lecture_hours = %s,
                tutorial_hours = %s,
                practical_hours = %s,
                credits = %s

            WHERE subject_id = %s
            """,
            (
                data.get(
                    "subject_code"
                ),
                data.get(
                    "subject_name"
                ),
                department[
                    "department_id"
                ],
                data.get(
                    "teaching_department_id"
                ),
                semester_id,
                scheme_id,
                data.get(
                    "cycle"
                ) or None,
                optional,
                to_int(
                    data.get(
                        "lecture_hours"
                    )
                ),
                to_int(
                    data.get(
                        "tutorial_hours"
                    )
                ),
                to_int(
                    data.get(
                        "practical_hours"
                    )
                ),
                to_int(
                    data.get(
                        "credits"
                    )
                ),
                subject_id
            )
        )

        connection.commit()

        return jsonify({
            "message":
                "Subject updated successfully!"
        })

    except Exception as e:

        if connection:

            connection.rollback()

        print(
            "UPDATE SUBJECT ERROR:",
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


# ============================================================
# DELETE SUBJECT
# ============================================================

@subject_api.route(
    "/subjects/<int:subject_id>",
    methods=["DELETE"]
)
def delete_subject(subject_id):

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM subject
            WHERE subject_id = %s
            """,
            (subject_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:

            return jsonify({
                "error":
                    "Subject not found."
            }), 404

        return jsonify({
            "message":
                "Subject deleted successfully!"
        })

    except Exception as e:

        if connection:

            connection.rollback()

        print(
            "DELETE SUBJECT ERROR:",
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


# ============================================================
# PREVIEW PDF
# ============================================================

@subject_api.route(
    "/subjects/import-pdf",
    methods=["POST"]
)
def preview_subject_pdf():

    try:

        if "file" not in request.files:

            return jsonify({
                "error":
                    "No PDF file uploaded."
            }), 400

        file = request.files["file"]

        if not file.filename:

            return jsonify({
                "error":
                    "No file selected."
            }), 400

        if not file.filename.lower().endswith(
            ".pdf"
        ):

            return jsonify({
                "error":
                    "Only PDF files are allowed."
            }), 400

        filename = secure_filename(
            file.filename
        )

        file_path = os.path.join(
            UPLOAD_FOLDER,
            filename
        )

        file.save(
            file_path
        )

        subjects = (
            extract_subjects_from_pdf(
                file_path
            )
        )

        if not subjects:

            return jsonify({
                "error":
                    "No subjects were extracted."
            }), 400

        # --------------------------------------------------------
        # Preview only.
        #
        # NOTHING IS INSERTED INTO MYSQL HERE.
        # --------------------------------------------------------

        print(
            "Preview generated:",
            len(subjects),
            "subjects"
        )

        return jsonify({
            "message":
                "PDF extracted successfully.",
            "subjects":
                subjects,
            "total_subjects":
                len(subjects)
        })

    except Exception as e:

        print(
            "\n========== PDF PREVIEW ERROR =========="
        )

        print(
            str(e)
        )

        print(
            "=======================================\n"
        )

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# CONFIRM PDF IMPORT
# ============================================================

@subject_api.route(
    "/subjects/import-pdf/confirm",
    methods=["POST"]
)
def confirm_subject_import():

    connection = None
    cursor = None

    try:

        data = (
            request.get_json()
            or {}
        )

        subjects = (
            data.get(
                "subjects"
            )
        )

        if not isinstance(
            subjects,
            list
        ):

            return jsonify({
                "error":
                    "Invalid subjects data."
            }), 400

        if not subjects:

            return jsonify({
                "error":
                    "No subjects to import."
            }), 400

        connection = get_connection()

        cursor = connection.cursor()

        inserted_count = 0

        skipped_count = 0

        errors = []

        for subject in subjects:

            try:

                scheme_year = to_int(
                    subject.get(
                        "scheme"
                    )
                )

                semester_no = to_int(
                    subject.get(
                        "semester"
                    )
                )

                department_id = to_int(
                    subject.get(
                        "department_id"
                    )
                )

                if not scheme_year:

                    raise ValueError(
                        "Missing scheme."
                    )

                if not semester_no:

                    raise ValueError(
                        "Missing semester."
                    )

                if not department_id:

                    raise ValueError(
                        "Missing department."
                    )

                scheme_id = (
                    get_scheme_id(
                        scheme_year
                    )
                )

                semester_id = (
                    get_semester_id(
                        semester_no
                    )
                )

                if scheme_id is None:

                    raise ValueError(
                        f"Scheme not found: "
                        f"{scheme_year}"
                    )

                if semester_id is None:

                    raise ValueError(
                        f"Semester not found: "
                        f"{semester_no}"
                    )

                subject_code = clean(
                    subject.get(
                        "subject_code"
                    )
                )

                subject_name = clean(
                    subject.get(
                        "subject_name"
                    )
                )

                if not subject_code:

                    raise ValueError(
                        "Subject code missing."
                    )

                if not subject_name:

                    raise ValueError(
                        "Subject name missing."
                    )

                cycle = (
                    subject.get(
                        "cycle"
                    )
                    or None
                )

                # ------------------------------------------------
                # Duplicate check
                # ------------------------------------------------

                cursor.execute(
                    """
                    SELECT subject_id
                    FROM subject

                    WHERE subject_code = %s

                      AND department_id = %s

                      AND scheme_id = %s

                      AND semester_id = %s

                      AND (
                          cycle = %s

                          OR (
                              cycle IS NULL
                              AND %s IS NULL
                          )
                      )

                    LIMIT 1
                    """,
                    (
                        subject_code,
                        department_id,
                        scheme_id,
                        semester_id,
                        cycle,
                        cycle
                    )
                )

                existing = (
                    cursor.fetchone()
                )

                if existing:

                    print(
                        "Skipping duplicate:",
                        subject_code
                    )

                    skipped_count += 1

                    continue

                # ------------------------------------------------
                # Insert
                # ------------------------------------------------

                cursor.execute(
                    """
                    INSERT INTO subject (

                        subject_code,
                        subject_name,

                        department_id,
                        teaching_department_id,

                        semester_id,
                        scheme_id,

                        cycle,
                        is_optional,

                        lecture_hours,
                        tutorial_hours,
                        practical_hours,
                        credits

                    )

                    VALUES (

                        %s, %s,

                        %s, %s,

                        %s, %s,

                        %s, %s,

                        %s, %s, %s, %s
                    )
                    """,
                    (

                        subject_code,

                        subject_name,

                        department_id,

                        subject.get(
                            "teaching_department_id"
                        ),

                        semester_id,

                        scheme_id,

                        cycle,

                        normalize_optional(
                            subject.get(
                                "is_optional"
                            )
                        ),

                        to_int(
                            subject.get(
                                "lecture_hours"
                            )
                        ),

                        to_int(
                            subject.get(
                                "tutorial_hours"
                            )
                        ),

                        to_int(
                            subject.get(
                                "practical_hours"
                            )
                        ),

                        to_int(
                            subject.get(
                                "credits"
                            )
                        )
                    )
                )

                inserted_count += 1

            except Exception as subject_error:

                errors.append({
                    "subject_code":
                        subject.get(
                            "subject_code"
                        ),
                    "error":
                        str(subject_error)
                })

        # --------------------------------------------------------
        # Commit
        # --------------------------------------------------------

        connection.commit()

        print(
            "\n========== IMPORT RESULT =========="
        )

        print(
            "Inserted:",
            inserted_count
        )

        print(
            "Skipped:",
            skipped_count
        )

        print(
            "Errors:",
            len(errors)
        )

        print(
            "===================================\n"
        )

        return jsonify({

            "message":
                "Subjects imported successfully.",

            "inserted_subjects":
                inserted_count,

            "skipped_subjects":
                skipped_count,

            "error_count":
                len(errors),

            "errors":
                errors

        })

    except Exception as e:

        if connection:

            connection.rollback()

        print(
            "\n========== CONFIRM IMPORT ERROR =========="
        )

        print(
            str(e)
        )

        print(
            "==========================================\n"
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()