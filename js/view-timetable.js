// ============================================================
// VIEW TIMETABLE JAVASCRIPT
// ============================================================

const API = "http://127.0.0.1:5000";

const DEPARTMENT_API = `${API}/assignment-departments`;
const SCHEME_API = `${API}/schemes`;
const ACADEMIC_YEAR_API = `${API}/academic-years`;


// ============================================================
// ELEMENTS
// ============================================================

const departmentSelect =
    document.getElementById("viewDepartment");

const schemeSelect =
    document.getElementById("viewScheme");

const academicYearSelect =
    document.getElementById("viewAcademicYear");

const semesterTypeSelect =
    document.getElementById("viewSemesterType");

const semesterBoxes =
    document.getElementById("semesterBoxes");

const viewSemester =
    document.getElementById("viewSemester");

const viewType =
    document.getElementById("viewType");

const selectedSemesterText =
    document.getElementById("selectedSemesterText");

const viewTimetableBtn =
    document.getElementById("viewTimetableBtn");

const saveTimetableBtn =
    document.getElementById("saveTimetableBtn");

const printTimetableBtn =
    document.getElementById("printTimetableBtn");

const exportPdfBtn =
    document.getElementById("exportPdfBtn");

const exportExcelBtn =
    document.getElementById("exportExcelBtn");


// ============================================================
// INITIAL LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    loadDepartments();
    loadSchemes();
    loadAcademicYears();

    if (semesterBoxes) {
        semesterBoxes.innerHTML = "";
    }

    if (selectedSemesterText) {
        selectedSemesterText.textContent =
            "Select semester type first.";
    }

});


// ============================================================
// SEMESTER TYPE
// ============================================================

if (semesterTypeSelect) {

    semesterTypeSelect.addEventListener(
        "change",
        function () {
            createSemesterBoxes(this.value);
        }
    );

}


// ============================================================
// CREATE SEMESTER BOXES
// ============================================================

function createSemesterBoxes(type) {

    if (!semesterBoxes) {
        return;
    }

    semesterBoxes.innerHTML = "";

    if (viewSemester) {
        viewSemester.value = "";
    }

    if (selectedSemesterText) {
        selectedSemesterText.textContent =
            "Select a semester.";
    }

    let semesters = [];

    if (type === "Odd") {

        semesters = [
            1,
            3,
            5,
            7
        ];

    }

    else if (type === "Even") {

        semesters = [
            2,
            4,
            6,
            8
        ];

    }

    else {

        if (selectedSemesterText) {
            selectedSemesterText.textContent =
                "Select semester type first.";
        }

        return;
    }


    semesters.forEach(function (semester) {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "semester-box";

        button.textContent =
            `Semester ${semester}`;


        button.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(".semester-box")
                    .forEach(function (btn) {

                        btn.classList.remove(
                            "selected"
                        );

                    });


                button.classList.add(
                    "selected"
                );


                if (viewSemester) {

                    viewSemester.value =
                        semester;

                }


                if (viewType) {

                    viewType.value =
                        "single";

                }


                if (selectedSemesterText) {

                    selectedSemesterText.textContent =
                        `Semester ${semester}`;

                }

            }
        );


        semesterBoxes.appendChild(button);

    });

}


// ============================================================
// VIEW TIMETABLE BUTTON
// ============================================================

if (viewTimetableBtn) {

    viewTimetableBtn.addEventListener(
        "click",
        viewTimetable
    );

}


// ============================================================
// VIEW TIMETABLE
// ============================================================

async function viewTimetable() {

    try {

        const department =
            getValue("viewDepartment");

        const scheme =
            getValue("viewScheme");

        const academicYear =
            getValue("viewAcademicYear");

        const semesterType =
            getValue("viewSemesterType");

        const semester =
            getValue("viewSemester");


        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!department) {

            alert(
                "Please select Department."
            );

            return;
        }


        if (!scheme) {

            alert(
                "Please select Scheme."
            );

            return;
        }


        if (!academicYear) {

            alert(
                "Please select Academic Year."
            );

            return;
        }


        if (!semesterType) {

            alert(
                "Please select Semester Type."
            );

            return;
        }


        if (!semester) {

            alert(
                "Please select a Semester."
            );

            return;
        }


        // ----------------------------------------------------
        // BUTTON LOADING
        // ----------------------------------------------------

        const oldButtonText =
            viewTimetableBtn.innerHTML;

        viewTimetableBtn.disabled = true;

        viewTimetableBtn.innerHTML =
            `<i class="bi bi-hourglass-split"></i> Loading...`;


        // ----------------------------------------------------
        // API REQUEST
        // ----------------------------------------------------

        const response = await fetch(
            `${API}/view-timetable`,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    department:
                        department,

                    scheme:
                        scheme,

                    academic_year:
                        academicYear,

                    semester_type:
                        semesterType,

                    semester:
                        semester,

                    view_type:
                        "single"

                })

            }
        );


        // ----------------------------------------------------
        // SERVER ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            let message =
                `Server error: ${response.status}`;

            try {

                const errorData =
                    await response.json();

                message =
                    errorData.message ||
                    errorData.error ||
                    message;

            }

            catch (error) {}

            throw new Error(message);

        }


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        const result =
            await response.json();


        console.log(
            "View Timetable Response:",
            result
        );


        // ----------------------------------------------------
        // HEADER DETAILS
        // ----------------------------------------------------

        setText(
            "displayDepartment",
            result.department || department
        );


        setText(
            "displaySemester",
            result.semester ||
            `Semester ${semester}`
        );


        setText(
            "displayBranch",
            result.branch ||
            department
        );


        setText(
            "displayScheme",
            result.scheme ||
            scheme
        );


        setText(
            "displayAcademicYear",
            result.academic_year ||
            academicYear
        );


        // ----------------------------------------------------
        // TIMETABLE
        // ----------------------------------------------------

        displayTimetable(
            result.timetable
        );


        // ----------------------------------------------------
        // SUBJECT DETAILS
        // ----------------------------------------------------

        displaySubjectDetails(
            result.subjects || []
        );


        // ----------------------------------------------------
        // FACULTY DETAILS
        // ----------------------------------------------------

        displayFacultyDetails(
            result
        );

    }

    catch (error) {

        console.error(
            "VIEW TIMETABLE ERROR:",
            error
        );

        alert(
            "Unable to load timetable.\n\n" +
            error.message
        );

    }

    finally {

        if (viewTimetableBtn) {

            viewTimetableBtn.disabled =
                false;

            viewTimetableBtn.innerHTML =
                `<i class="bi bi-search"></i> View Timetable`;

        }

    }

}


// ============================================================
// SET TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? "-";

    }

}


// ============================================================
// GET VALUE
// ============================================================

function getValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value;

}


// ============================================================
// DISPLAY TIMETABLE
// ============================================================

function displayTimetable(
    timetable
) {

    const container =
        document.getElementById(
            "professionalTimetable"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!timetable) {

        showEmptyTimetable(
            "No timetable found."
        );

        return;

    }


    const selectedSemester =
        getValue("viewSemester");


    let semesterData =
        timetable;


    // ========================================================
    // SEMESTER DATA
    // ========================================================

    if (

        typeof timetable === "object" &&

        !Array.isArray(timetable)

    ) {

        if (

            selectedSemester &&

            timetable[selectedSemester]

        ) {

            semesterData =
                timetable[selectedSemester];

        }

        else {

            const keys =
                Object.keys(timetable);


            if (keys.length === 1) {

                semesterData =
                    timetable[keys[0]];

            }

        }

    }


    // ========================================================
    // TABLE
    // ========================================================

    container.innerHTML = `

        <div class="table-responsive">

            <table
                class="table table-bordered
                       text-center align-middle">

                <thead>

                    <tr>

                        <th rowspan="2">
                            Day
                        </th>


                        <th>
                            P1
                        </th>


                        <th>
                            P2
                        </th>


                        <th
                            class="break-header"
                            rowspan="2">

                            Tea Break

                            <br>

                            <small>
                                11:00 - 11:15
                            </small>

                        </th>


                        <th>
                            P3
                        </th>


                        <th>
                            P4
                        </th>


                        <th
                            class="break-header"
                            rowspan="2">

                            Lunch Break

                            <br>

                            <small>
                                1:05 - 1:45
                            </small>

                        </th>


                        <th>
                            P5
                        </th>


                        <th>
                            P6
                        </th>


                        <th>
                            P7
                        </th>

                    </tr>


                    <tr>

                        <th>
                            9:10 - 10:05
                        </th>


                        <th>
                            10:05 - 11:00
                        </th>


                        <th>
                            11:15 - 12:10
                        </th>


                        <th>
                            12:10 - 1:05
                        </th>


                        <th>
                            1:45 - 2:40
                        </th>


                        <th>
                            2:40 - 3:35
                        </th>


                        <th>
                            3:35 - 4:30
                        </th>

                    </tr>

                </thead>


                <tbody
                    id="professionalBody">

                </tbody>

            </table>

        </div>

    `;


    const tbody =
        document.getElementById(
            "professionalBody"
        );


    if (!tbody) {
        return;
    }


    const days = [

        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ];


    days.forEach(function (day) {

        const dayData =
            semesterData?.[day];


        if (!dayData) {
            return;
        }


        const periods =
            Array.isArray(dayData)

                ? dayData

                : getPeriodsFromObject(
                    dayData
                );


        let row = `

            <tr>

                <td>

                    <strong>
                        ${escapeHTML(day)}
                    </strong>

                </td>

        `;


        // ====================================================
        // P1 + P2
        // ====================================================

        row += buildPeriodSection(
            periods,
            0,
            2
        );


        // ====================================================
        // TEA BREAK
        // ====================================================

        row += `

            <td class="break-cell">

                <strong>
                    Tea Break
                </strong>

                <br>

                <small>
                    11:00 - 11:15
                </small>

            </td>

        `;


        // ====================================================
        // P3 + P4
        // ====================================================

        row += buildPeriodSection(
            periods,
            2,
            2
        );


        // ====================================================
        // LUNCH BREAK
        // ====================================================

        row += `

            <td class="break-cell">

                <strong>
                    Lunch Break
                </strong>

                <br>

                <small>
                    1:05 - 1:45
                </small>

            </td>

        `;


        // ====================================================
        // P5 + P6 + P7
        // ====================================================

        row += buildPeriodSection(
            periods,
            4,
            3
        );


        row += `

            </tr>

        `;


        tbody.innerHTML += row;

    });


    if (!tbody.innerHTML.trim()) {

        showEmptyTimetable(
            "No timetable data available for this semester."
        );

    }

}


// ============================================================
// BUILD PERIOD SECTION
// ============================================================

function buildPeriodSection(
    periods,
    startIndex,
    count
) {

    let html = "";

    let i =
        startIndex;


    const end =
        startIndex + count;


    while (i < end) {

        const currentSlot =
            periods[i];


        const nextSlot =
            periods[i + 1];


        // ====================================================
        // LAB MERGING
        // ====================================================

        if (

            i + 1 < end &&

            isLabSlot(currentSlot) &&

            isLabSlot(nextSlot) &&

            isSameSubject(
                currentSlot,
                nextSlot
            )

        ) {

            html += createPeriodCell(
                currentSlot,
                2
            );


            i += 2;

            continue;

        }


        // ====================================================
        // NORMAL CELL
        // ====================================================

        html += createPeriodCell(
            currentSlot,
            1
        );


        i++;

    }


    return html;

}


// ============================================================
// GET PERIODS
// ============================================================

function getPeriodsFromObject(
    dayData
) {

    const periods = [];


    for (
        let i = 1;
        i <= 7;
        i++
    ) {

        periods.push(

            dayData[`P${i}`] ??

            dayData[`p${i}`] ??

            dayData[i - 1] ??

            null

        );

    }


    return periods;

}


// ============================================================
// CREATE PERIOD CELL
// ============================================================

function createPeriodCell(
    slot,
    colspan = 1
) {

    // ========================================================
    // FREE
    // ========================================================

    if (

        slot === null ||

        slot === undefined ||

        slot === "" ||

        slot === "Free" ||

        slot === "FREE"

    ) {

        return `

            <td

                ${
                    colspan > 1
                        ? `colspan="${colspan}"`
                        : ""
                }

                class="text-muted">

                Free

            </td>

        `;

    }


    // ========================================================
    // STRING
    // ========================================================

    if (
        typeof slot === "string"
    ) {

        return `

            <td

                ${
                    colspan > 1
                        ? `colspan="${colspan}"`
                        : ""
                }>

                ${escapeHTML(slot)}

            </td>

        `;

    }


    // ========================================================
    // OBJECT
    // ========================================================

    const code =
        slot.subject_code ||

        slot.code ||

        slot.subjectCode ||

        "";


    const subjectName =
        slot.subject_name ||

        slot.subjectName ||

        slot.name ||

        "";


    const faculty =
        slot.faculty_name ||

        slot.faculty ||

        slot.facultyName ||

        "";


    const isLab =
        isLabSlot(slot);


    let html = `

        <td

            ${
                colspan > 1
                    ? `colspan="${colspan}"`
                    : ""
            }

            class="${
                isLab
                    ? "lab-cell"
                    : ""
            }">

    `;


    // ========================================================
    // SUBJECT CODE
    // ========================================================

    if (code) {

        html += `

            <strong>
                ${escapeHTML(code)}
            </strong>

        `;

    }


    // ========================================================
    // SUBJECT NAME
    // ========================================================

    if (subjectName) {

        html += `

            <br>

            <small>
                ${escapeHTML(subjectName)}
            </small>

        `;

    }


    // ========================================================
    // LAB TAG REMOVED
    // ========================================================


    // ========================================================
    // FACULTY
    // ========================================================

    if (faculty) {

        html += `

            <br>

            <small>
                ${escapeHTML(faculty)}
            </small>

        `;

    }


    html += `

        </td>

    `;


    return html;

}


// ============================================================
// LAB CHECK
// ============================================================

function isLabSlot(slot) {

    if (

        !slot ||

        typeof slot !== "object"

    ) {

        return false;

    }


    if (
        slot.is_lab === true
    ) {

        return true;

    }


    if (
        slot.lab === true
    ) {

        return true;

    }


    const practicalHours =
        Number(

            slot.practical_hours ||

            slot.practicalHours ||

            0

        );


    const credits =
        Number(

            slot.credits ||

            0

        );


    return (

        practicalHours > 0 &&

        credits === 1

    );

}


// ============================================================
// SAME SUBJECT
// ============================================================

function isSameSubject(
    first,
    second
) {

    if (

        !first ||

        !second ||

        typeof first !== "object" ||

        typeof second !== "object"

    ) {

        return false;

    }


    const firstCode =
        String(

            first.subject_code ||

            first.code ||

            first.subjectCode ||

            ""

        )
        .trim()
        .toLowerCase();


    const secondCode =
        String(

            second.subject_code ||

            second.code ||

            second.subjectCode ||

            ""

        )
        .trim()
        .toLowerCase();


    if (

        firstCode &&

        secondCode &&

        firstCode === secondCode

    ) {

        return true;

    }


    if (

        first.subject_id != null &&

        second.subject_id != null

    ) {

        return (

            String(first.subject_id) ===

            String(second.subject_id)

        );

    }


    const firstName =
        String(

            first.subject_name ||

            first.subjectName ||

            first.name ||

            ""

        )
        .trim()
        .toLowerCase();


    const secondName =
        String(

            second.subject_name ||

            second.subjectName ||

            second.name ||

            ""

        )
        .trim()
        .toLowerCase();


    return (

        firstName &&

        secondName &&

        firstName === secondName

    );

}


// ============================================================
// SUBJECT DETAILS
// ============================================================

function displaySubjectDetails(
    subjects
) {

    const tbody =
        document.getElementById(
            "subjectDetailsBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (

        !Array.isArray(subjects) ||

        subjects.length === 0

    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="text-muted">

                    No subject details available.

                </td>

            </tr>

        `;

        return;

    }


    subjects.forEach(
        function (subject) {

            tbody.innerHTML += `

                <tr>

                    <td>

                        ${escapeHTML(
                            subject.subject_code ||
                            ""
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            subject.subject_name ||
                            ""
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            subject.credits ??
                            ""
                        )}

                    </td>

                </tr>

            `;

        }
    );

}


// ============================================================
// FACULTY DETAILS
//
// ONLY TWO COLUMNS:
//
// Faculty | Subject
//
// Theory:
// Main Faculty
//
// Lab:
// Main Faculty
// Lab Faculty
//
// Co-Faculty is completely ignored.
// ============================================================
// ============================================================
// FACULTY DETAILS
//
// ONE ROW PER SUBJECT
//
// Theory:
// Faculty
//
// Lab:
// Faculty / Lab Faculty
//
// Co-Faculty is completely ignored.
// ============================================================

function displayFacultyDetails(result) {

    const tbody =
        document.getElementById(
            "facultyDetailsBody"
        );

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    const timetable =
        result.timetable || {};

    const subjectFacultyMap = new Map();

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];


    // ========================================================
    // READ EVERY DAY
    // ========================================================

    days.forEach(function (day) {

        const dayData =
            timetable[day];

        if (!dayData) {
            return;
        }


        // ====================================================
        // READ P1 - P7
        // ====================================================

        for (
            let period = 1;
            period <= 7;
            period++
        ) {

            const slot =
                dayData[`P${period}`];

            if (
                !slot ||
                slot.free
            ) {
                continue;
            }


            const subjectId =
                slot.subject_id;

            const subjectCode =
                slot.subject_code || "";

            const subjectName =
                slot.subject_name || "";


            // =================================================
            // UNIQUE SUBJECT KEY
            // =================================================

            const subjectKey =
                subjectId != null
                    ? String(subjectId)
                    : subjectCode.toLowerCase();


            // =================================================
            // CREATE SUBJECT
            // =================================================

            if (
                !subjectFacultyMap.has(subjectKey)
            ) {

                subjectFacultyMap.set(
                    subjectKey,
                    {
                        subjectCode:
                            subjectCode,

                        subjectName:
                            subjectName,

                        faculty: [],

                        labFaculty: []
                    }
                );

            }


            const subject =
                subjectFacultyMap.get(
                    subjectKey
                );


            // =================================================
            // MAIN FACULTY
            // =================================================

            const facultyName =
                (
                    slot.faculty_name ||
                    ""
                ).trim();


            if (
                facultyName &&
                !subject.faculty.includes(
                    facultyName
                )
            ) {

                subject.faculty.push(
                    facultyName
                );

            }


            // =================================================
            // LAB FACULTY
            //
            // ONLY FOR LAB
            // =================================================

            const labFacultyName =
                (
                    slot.lab_faculty_name ||
                    ""
                ).trim();


            if (

                labFacultyName &&

                isLabSlot(slot) &&

                !subject.labFaculty.includes(
                    labFacultyName
                )

            ) {

                subject.labFaculty.push(
                    labFacultyName
                );

            }

        }

    });


    // ========================================================
    // NO DATA
    // ========================================================

    if (
        subjectFacultyMap.size === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="2"
                    class="text-muted">

                    No faculty details available.

                </td>

            </tr>

        `;

        return;
    }


    // ========================================================
    // DISPLAY ONE ROW PER SUBJECT
    // ========================================================

    subjectFacultyMap.forEach(
        function (subject) {

            let facultyNames = [];


            // ------------------------------------------------
            // MAIN FACULTY
            // ------------------------------------------------

            facultyNames.push(
                ...subject.faculty
            );


            // ------------------------------------------------
            // LAB FACULTY
            // ------------------------------------------------

            facultyNames.push(
                ...subject.labFaculty
            );


            // ------------------------------------------------
            // REMOVE DUPLICATES
            // ------------------------------------------------

            facultyNames =
                [...new Set(
                    facultyNames
                )];


            // ------------------------------------------------
            // JOIN WITH /
            // ------------------------------------------------

            const facultyText =
                facultyNames.join(
                    " / "
                );


            // ------------------------------------------------
            // ADD ROW
            // ------------------------------------------------

            tbody.innerHTML += `

                <tr>

                    <td>

                        ${escapeHTML(
                            facultyText
                        )}

                    </td>

                    <td>

                        ${escapeHTML(
                            subject.subjectCode
                        )}

                        <br>

                        <small>

                            ${escapeHTML(
                                subject.subjectName
                            )}

                        </small>

                    </td>

                </tr>

            `;

        }
    );

}


// ============================================================
// EMPTY TIMETABLE
// ============================================================

function showEmptyTimetable(
    message
) {

    const container =
        document.getElementById(
            "professionalTimetable"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-timetable">

            <i class="bi bi-calendar3"></i>

            <p>

                ${escapeHTML(message)}

            </p>

        </div>

    `;

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// LOAD DEPARTMENTS
// ============================================================

async function loadDepartments() {

    if (!departmentSelect) {
        return;
    }


    try {

        const response =
            await fetch(
                DEPARTMENT_API
            );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const data =
            await response.json();


        departmentSelect.innerHTML = `

            <option value="">
                Select Department
            </option>

        `;


        const departments =
            Array.isArray(data)

                ? data

                : data.departments || [];


        departments.forEach(
            function (department) {

                const option =
                    document.createElement(
                        "option"
                    );


                const id =
                    department.department_id ??

                    department.id ??

                    department.department_code ??

                    department.code ??

                    "";


                const code =
                    department.department_code ??

                    department.code ??

                    "";


                const name =
                    department.department_name ??

                    department.name ??

                    "";


                option.value =
                    id;


                option.textContent =
                    code && name

                        ? `${code} - ${name}`

                        : name ||

                          code ||

                          id;


                departmentSelect.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Department loading error:",
            error
        );

    }

}


// ============================================================
// LOAD SCHEMES
// ============================================================

async function loadSchemes() {

    if (!schemeSelect) {
        return;
    }


    try {

        const response =
            await fetch(
                SCHEME_API
            );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const data =
            await response.json();


        schemeSelect.innerHTML = `

            <option value="">
                Select Scheme
            </option>

        `;


        const schemes =
            Array.isArray(data)

                ? data

                : data.schemes || [];


        schemes.forEach(
            function (scheme) {

                const option =
                    document.createElement(
                        "option"
                    );


                const id =
                    scheme.scheme_id ??

                    scheme.id ??

                    scheme.scheme_year ??

                    scheme.year ??

                    "";


                const name =
                    scheme.scheme_year ??

                    scheme.year ??

                    scheme.scheme_name ??

                    scheme.name ??

                    id;


                option.value =
                    id;


                option.textContent =
                    name;


                schemeSelect.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Scheme loading error:",
            error
        );

    }

}


// ============================================================
// LOAD ACADEMIC YEARS
// ============================================================

async function loadAcademicYears() {

    if (!academicYearSelect) {
        return;
    }


    try {

        const response =
            await fetch(
                ACADEMIC_YEAR_API
            );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const data =
            await response.json();


        academicYearSelect.innerHTML = `

            <option value="">
                Select Academic Year
            </option>

        `;


        const years =
            Array.isArray(data)

                ? data

                : data.academic_years || [];


        years.forEach(
            function (year) {

                const option =
                    document.createElement(
                        "option"
                    );


                const value =
                    year.academic_year ??

                    year.year ??

                    year.id ??

                    year;


                option.value =
                    value;


                option.textContent =
                    value;


                academicYearSelect.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Academic year loading error:",
            error
        );

    }

}


// ============================================================
// SAVE TIMETABLE
// ============================================================

if (saveTimetableBtn) {

    saveTimetableBtn.addEventListener(
        "click",
        saveTimetable
    );

}


async function saveTimetable() {

    try {

        const data = {

            department:
                getValue("viewDepartment"),

            scheme:
                getValue("viewScheme"),

            academic_year:
                getValue("viewAcademicYear"),

            semester_type:
                getValue("viewSemesterType"),

            semester:
                getValue("viewSemester"),

            view_type:
                "single"

        };


        if (!data.department) {

            alert(
                "Please select Department."
            );

            return;

        }


        if (!data.scheme) {

            alert(
                "Please select Scheme."
            );

            return;

        }


        if (!data.academic_year) {

            alert(
                "Please select Academic Year."
            );

            return;

        }


        if (!data.semester_type) {

            alert(
                "Please select Semester Type."
            );

            return;

        }


        if (!data.semester) {

            alert(
                "Please select Semester."
            );

            return;

        }


        const oldText =
            saveTimetableBtn.innerHTML;


        saveTimetableBtn.disabled =
            true;


        saveTimetableBtn.innerHTML =
            `<i class="bi bi-hourglass-split"></i>
             Saving...`;


        const response =
            await fetch(
                `${API}/save-timetable`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(data)

                }
            );


        let result = {};


        try {

            result =
                await response.json();

        }

        catch (error) {}


        if (!response.ok) {

            throw new Error(

                result.message ||

                result.error ||

                `Server error: ${response.status}`

            );

        }


        alert(

            result.message ||

            "Timetable saved successfully."

        );


        saveTimetableBtn.innerHTML =
            `<i class="bi bi-check-circle"></i>
             Saved`;


        setTimeout(
            function () {

                saveTimetableBtn.innerHTML =
                    oldText;

                saveTimetableBtn.disabled =
                    false;

            },
            2000
        );

    }

    catch (error) {

        console.error(
            "SAVE TIMETABLE ERROR:",
            error
        );


        alert(
            "Failed to save timetable.\n\n" +
            error.message
        );


        saveTimetableBtn.disabled =
            false;


        saveTimetableBtn.innerHTML =
            `<i class="bi bi-database-check"></i>
             Save Timetable`;

    }

}


// ============================================================
// PRINT
// ============================================================

if (printTimetableBtn) {

    printTimetableBtn.addEventListener(
        "click",
        function () {

            window.print();

        }
    );

}


// ============================================================
// EXPORT PDF
// ============================================================

if (exportPdfBtn) {

    exportPdfBtn.addEventListener(
        "click",
        exportPDF
    );

}


function exportPDF() {

    const element =
        document.getElementById(
            "printArea"
        );


    if (!element) {

        alert(
            "Timetable area not found."
        );

        return;

    }


    if (
        typeof html2pdf ===
        "undefined"
    ) {

        alert(
            "PDF library is not loaded."
        );

        return;

    }


    const options = {

        margin: 5,

        filename:
            "Timetable.pdf",

        image: {

            type: "jpeg",

            quality: 0.98

        },

        html2canvas: {

            scale: 1,

            useCORS: true,

            scrollY: 0

        },

        jsPDF: {

            unit: "mm",

            format: "a4",

            orientation: "landscape"

        }

    };


    html2pdf()

        .set(options)

        .from(element)

        .save();

}


// ============================================================
// EXPORT EXCEL
// ============================================================

if (exportExcelBtn) {

    exportExcelBtn.addEventListener(
        "click",
        exportExcel
    );

}


function exportExcel() {

    if (
        typeof XLSX ===
        "undefined"
    ) {

        alert(
            "Excel library is not loaded."
        );

        return;

    }


    const table =
        document.querySelector(
            "#professionalTimetable table"
        );


    if (!table) {

        alert(
            "Please view the timetable first."
        );

        return;

    }


    const workbook =
        XLSX.utils.book_new();


    const worksheet =
        XLSX.utils.table_to_sheet(
            table
        );


    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        "Timetable"

    );


    XLSX.writeFile(

        workbook,

        "Timetable.xlsx"

    );

}