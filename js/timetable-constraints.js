// ============================================================
// TIMETABLE CONSTRAINTS
// ============================================================

const API_BASE = "http://127.0.0.1:5000";


// ============================================================
// GLOBAL DATA
// ============================================================

let periods = [];

let periodCounter = 0;


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    loadAcademicYears();

    loadDepartments();

    loadSchemes();

    initializePeriods();

    setupEventListeners();

});


// ============================================================
// API HELPER
// ============================================================

async function fetchJSON(url, options = {}) {

    const response = await fetch(
        API_BASE + url,
        options
    );

    if (!response.ok) {

        let message =
            `Request failed: ${response.status}`;

        try {

            const data = await response.json();

            if (data.message) {
                message = data.message;
            }

        } catch (error) {
            // Ignore JSON parsing error
        }

        throw new Error(message);
    }

    return response.json();
}


// ============================================================
// ACADEMIC YEARS
// ============================================================

async function loadAcademicYears() {

    const select =
        document.getElementById("academicYear");

    if (!select) return;

    try {

        const data =
            await fetchJSON("/academic-years");

        select.innerHTML = `
            <option value="">
                Select Academic Year
            </option>
        `;

        data.forEach(item => {

            const year =
                typeof item === "string"
                    ? item
                    : item.academic_year;

            if (!year) return;

            const option =
                document.createElement("option");

            option.value = year;

            option.textContent = year;

            select.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Academic year error:",
            error
        );

        alert(
            "Unable to load academic years.\n\n" +
            error.message
        );

    }
}


// ============================================================
// DEPARTMENTS
// ============================================================

async function loadDepartments() {

    const select =
        document.getElementById("department");

    if (!select) return;

    try {

        const data =
            await fetchJSON(
                "/assignment-departments"
            );

        select.innerHTML = `
            <option value="">
                Select Department
            </option>
        `;

        data.forEach(item => {

            let id;
            let code;
            let name;

            if (Array.isArray(item)) {

                id = item[0];

                code = item[1];

                name = item[2];

            } else {

                id =
                    item.department_id;

                code =
                    item.department_code;

                name =
                    item.department_name;

            }

            const option =
                document.createElement("option");

            option.value =
                code || id;

            option.textContent =
                name
                    ? `${code} - ${name}`
                    : code;

            option.dataset.departmentId =
                id || "";

            option.dataset.departmentCode =
                code || "";

            select.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Department error:",
            error
        );

        alert(
            "Unable to load departments.\n\n" +
            error.message
        );

    }
}


// ============================================================
// SCHEMES
// ============================================================

async function loadSchemes() {

    const select =
        document.getElementById("scheme");

    if (!select) return;

    try {

        const data =
            await fetchJSON("/schemes");

        select.innerHTML = `
            <option value="">
                Select Scheme
            </option>
        `;

        data.forEach(item => {

            let value;
            let text;

            if (Array.isArray(item)) {

                value = item[0];

                text =
                    item[1] ??
                    item[0];

            } else {

                value =
                    item.scheme_id ??
                    item.scheme_year ??
                    item.scheme;

                text =
                    item.scheme_name ??
                    item.scheme_year ??
                    item.scheme ??
                    value;

            }

            if (
                value === undefined ||
                value === null
            ) {
                return;
            }

            const option =
                document.createElement("option");

            option.value = value;

            option.textContent = text;

            select.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Scheme error:",
            error
        );

        alert(
            "Unable to load schemes.\n\n" +
            error.message
        );

    }
}


// ============================================================
// PERIODS
// ============================================================

function initializePeriods() {

    periods = [];

    periodCounter = 0;


    addPeriod("09:00", "10:00");

    addPeriod("10:00", "11:00");

    addPeriod("11:15", "12:15");

    addPeriod("12:15", "13:15");

    addPeriod("14:00", "15:00");

    addPeriod("15:00", "16:00");

}


// ============================================================
// ADD PERIOD
// ============================================================

function addPeriod(
    startTime = "",
    endTime = ""
) {

    periodCounter++;

    const period = {

        id: periodCounter,

        period_number: periodCounter,

        start_time: startTime,

        end_time: endTime

    };

    periods.push(period);

    renderPeriods();

}


// ============================================================
// RENDER PERIODS
// ============================================================

function renderPeriods() {

    const container =
        document.getElementById(
            "periodContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    periods.forEach(
        (period, index) => {

            const div =
                document.createElement("div");

            div.className =
                "period-row";

            div.innerHTML = `

                <div class="row g-3 align-items-center">

                    <div class="col-md-1">

                        <div class="period-number">

                            ${index + 1}

                        </div>

                    </div>


                    <div class="col-md-4">

                        <label class="form-label">

                            Start Time

                        </label>

                        <input
                            type="time"
                            class="form-control period-start"
                            value="${period.start_time}"
                            data-id="${period.id}"
                        >

                    </div>


                    <div class="col-md-4">

                        <label class="form-label">

                            End Time

                        </label>

                        <input
                            type="time"
                            class="form-control period-end"
                            value="${period.end_time}"
                            data-id="${period.id}"
                        >

                    </div>


                    <div class="col-md-3">

                        <label class="form-label d-block">

                            Action

                        </label>

                        <button
                            type="button"
                            class="btn btn-outline-danger"
                            onclick="removePeriod(${period.id})"
                        >

                            <i class="bi bi-trash"></i>

                            Remove

                        </button>

                    </div>

                </div>

            `;

            container.appendChild(div);

        }
    );

}


// ============================================================
// REMOVE PERIOD
// ============================================================

function removePeriod(id) {

    if (periods.length <= 1) {

        alert(
            "At least one period is required."
        );

        return;
    }

    periods =
        periods.filter(
            period =>
                period.id !== id
        );

    periods.forEach(
        (period, index) => {

            period.period_number =
                index + 1;

        }
    );

    renderPeriods();

}


// ============================================================
// READ PERIODS FROM UI
// ============================================================

function readPeriods() {

    const result = [];

    document
        .querySelectorAll(".period-row")
        .forEach(
            (row, index) => {

                const start =
                    row.querySelector(
                        ".period-start"
                    )?.value || "";

                const end =
                    row.querySelector(
                        ".period-end"
                    )?.value || "";

                result.push({

                    period_number:
                        index + 1,

                    start_time:
                        start,

                    end_time:
                        end

                });

            }
        );

    return result;
}


// ============================================================
// WORKING DAYS
// ============================================================

function getWorkingDays() {

    const selected = [];

    document
        .querySelectorAll(
            "#workingDays .day-btn.active"
        )
        .forEach(
            button => {

                selected.push(
                    button.dataset.day
                );

            }
        );

    return selected;
}


// ============================================================
// DAY BUTTONS
// ============================================================

function setupDayButtons() {

    document
        .querySelectorAll(
            "#workingDays .day-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        button.classList.toggle(
                            "active"
                        );

                    }
                );

            }
        );

}


// ============================================================
// VALIDATE PERIODS
// ============================================================

function validatePeriods() {

    const currentPeriods =
        readPeriods();

    if (
        currentPeriods.length === 0
    ) {

        return (
            "At least one period is required."
        );

    }

    for (
        let i = 0;
        i < currentPeriods.length;
        i++
    ) {

        const period =
            currentPeriods[i];

        if (
            !period.start_time ||
            !period.end_time
        ) {

            return `
                Period ${i + 1}
                must have both start and end time.
            `;

        }

        if (
            period.start_time >=
            period.end_time
        ) {

            return `
                Period ${i + 1}
                has an invalid time range.
            `;

        }

    }

    for (
        let i = 1;
        i < currentPeriods.length;
        i++
    ) {

        const previous =
            currentPeriods[i - 1];

        const current =
            currentPeriods[i];

        if (
            current.start_time <
            previous.end_time
        ) {

            return (
                `Period ${i + 1} overlaps ` +
                `Period ${i}.`
            );

        }

    }

    return null;
}


// ============================================================
// VALIDATE BREAK
// ============================================================

function validateBreak() {

    const start =
        document.getElementById(
            "breakStart"
        )?.value;

    const end =
        document.getElementById(
            "breakEnd"
        )?.value;

    if (!start || !end) {

        return null;

    }

    if (start >= end) {

        return (
            "Break start time must be before end time."
        );

    }

    return null;
}


// ============================================================
// COLLECT CONSTRAINT DATA
// ============================================================

function collectConstraintData() {

    return {

        academic_year:
            document.getElementById(
                "academicYear"
            )?.value || null,

        department:
            document.getElementById(
                "department"
            )?.value || null,

        scheme:
            document.getElementById(
                "scheme"
            )?.value || null,

        working_days:
            getWorkingDays(),

        periods:
            readPeriods(),

        break: {

            type:
                document.getElementById(
                    "breakType"
                )?.value || "Lunch",

            start_time:
                document.getElementById(
                    "breakStart"
                )?.value || null,

            end_time:
                document.getElementById(
                    "breakEnd"
                )?.value || null

        },

        faculty_daily_limit:
            Number(
                document.getElementById(
                    "facultyDailyLimit"
                )?.value || 0
            ),

        student_daily_limit:
            Number(
                document.getElementById(
                    "studentDailyLimit"
                )?.value || 0
            ),

        lab_consecutive:
            document.getElementById(
                "labConsecutive"
            )?.checked || false,

        faculty_clash:
            document.getElementById(
                "facultyClash"
            )?.checked || false,

        semester_clash:
            document.getElementById(
                "semesterClash"
            )?.checked || false,

        cycle_constraint:
            document.getElementById(
                "cycleConstraint"
            )?.checked || false

    };

}


// ============================================================
// VALIDATE CONSTRAINTS
// ============================================================

function validateConstraints() {

    const academicYear =
        document.getElementById(
            "academicYear"
        )?.value;

    const department =
        document.getElementById(
            "department"
        )?.value;

    const scheme =
        document.getElementById(
            "scheme"
        )?.value;

    if (!academicYear) {

        alert(
            "Please select Academic Year."
        );

        return false;

    }

    if (!department) {

        alert(
            "Please select Department."
        );

        return false;

    }

    if (!scheme) {

        alert(
            "Please select Scheme."
        );

        return false;

    }

    const workingDays =
        getWorkingDays();

    if (
        workingDays.length === 0
    ) {

        alert(
            "Please select at least one working day."
        );

        return false;

    }

    const periodError =
        validatePeriods();

    if (periodError) {

        alert(periodError);

        return false;

    }

    const breakError =
        validateBreak();

    if (breakError) {

        alert(breakError);

        return false;

    }

    const facultyLimit =
        Number(
            document.getElementById(
                "facultyDailyLimit"
            )?.value || 0
        );

    if (
        facultyLimit <= 0
    ) {

        alert(
            "Faculty daily limit must be greater than 0."
        );

        return false;

    }

    const studentLimit =
        Number(
            document.getElementById(
                "studentDailyLimit"
            )?.value || 0
        );

    if (
        studentLimit <= 0
    ) {

        alert(
            "Semester/student daily limit must be greater than 0."
        );

        return false;

    }

    return true;

}


// ============================================================
// SAVE CONSTRAINTS
// ============================================================

async function saveConstraints() {

    if (
        !validateConstraints()
    ) {

        return;

    }

    const data =
        collectConstraintData();

    const button =
        document.getElementById(
            "saveConstraintsBtn"
        );

    const originalHTML =
        button.innerHTML;

    button.disabled = true;

    button.innerHTML = `

        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        Saving...

    `;

    try {

        const result =
            await fetchJSON(
                "/timetable-constraints",
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

        alert(
            result.message ||
            "Timetable constraints saved successfully."
        );

    } catch (error) {

        console.error(
            "Constraint save error:",
            error
        );

        alert(
            "Unable to save timetable constraints.\n\n" +
            error.message
        );

    } finally {

        button.disabled = false;

        button.innerHTML =
            originalHTML;

    }

}


// ============================================================
// LOAD EXISTING CONSTRAINTS
// ============================================================

async function loadConstraints() {

    const academicYear =
        document.getElementById(
            "academicYear"
        )?.value;

    const department =
        document.getElementById(
            "department"
        )?.value;

    const scheme =
        document.getElementById(
            "scheme"
        )?.value;

    if (
        !academicYear ||
        !department ||
        !scheme
    ) {

        return;

    }

    try {

        const query =
            `?academic_year=${encodeURIComponent(
                academicYear
            )}` +

            `&department=${encodeURIComponent(
                department
            )}` +

            `&scheme=${encodeURIComponent(
                scheme
            )}`;

        const result =
            await fetchJSON(
                `/timetable-constraints${query}`
            );

        if (
            !result ||
            result.exists === false
        ) {

            return;

        }

        /*
         * Backend returns:
         *
         * {
         *     success: true,
         *     exists: true,
         *     data: {...}
         * }
         *
         * So use result.data.
         */

        const data =
            result.data || result;

        applyConstraintData(
            data
        );

    } catch (error) {

        console.log(
            "No existing constraints loaded:",
            error.message
        );

    }

}


// ============================================================
// APPLY EXISTING CONSTRAINTS
// ============================================================

function applyConstraintData(data) {

    if (!data) {
        return;
    }


    // --------------------------------------------------------
    // WORKING DAYS
    // --------------------------------------------------------

    if (
        Array.isArray(
            data.working_days
        )
    ) {

        document
            .querySelectorAll(
                "#workingDays .day-btn"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        data.working_days.includes(
                            button.dataset.day
                        )
                    );

                }
            );

    }


    // --------------------------------------------------------
    // PERIODS
    // --------------------------------------------------------

    if (
        Array.isArray(
            data.periods
        ) &&
        data.periods.length > 0
    ) {

        periods =
            data.periods.map(
                (period, index) => ({

                    id:
                        index + 1,

                    period_number:
                        period.period_number ||
                        index + 1,

                    start_time:
                        period.start_time ||
                        "",

                    end_time:
                        period.end_time ||
                        ""

                })
            );

        periodCounter =
            periods.length;

        renderPeriods();

    }


    // --------------------------------------------------------
    // BREAK
    // --------------------------------------------------------

    if (data.break) {

        const type =
            document.getElementById(
                "breakType"
            );

        const start =
            document.getElementById(
                "breakStart"
            );

        const end =
            document.getElementById(
                "breakEnd"
            );

        if (type) {

            type.value =
                data.break.type ||
                "Lunch";

        }

        if (start) {

            start.value =
                data.break.start_time ||
                "";

        }

        if (end) {

            end.value =
                data.break.end_time ||
                "";

        }

    }


    // --------------------------------------------------------
    // FACULTY DAILY LIMIT
    // --------------------------------------------------------

    if (
        data.faculty_daily_limit !==
        undefined &&
        data.faculty_daily_limit !==
        null
    ) {

        document.getElementById(
            "facultyDailyLimit"
        ).value =
            data.faculty_daily_limit;

    }


    // --------------------------------------------------------
    // STUDENT DAILY LIMIT
    // --------------------------------------------------------

    if (
        data.student_daily_limit !==
        undefined &&
        data.student_daily_limit !==
        null
    ) {

        document.getElementById(
            "studentDailyLimit"
        ).value =
            data.student_daily_limit;

    }


    // --------------------------------------------------------
    // LAB CONSECUTIVE
    // --------------------------------------------------------

    if (
        data.lab_consecutive !==
        undefined
    ) {

        document.getElementById(
            "labConsecutive"
        ).checked =
            Boolean(
                data.lab_consecutive
            );

    }


    // --------------------------------------------------------
    // FACULTY CLASH
    // --------------------------------------------------------

    if (
        data.faculty_clash !==
        undefined
    ) {

        document.getElementById(
            "facultyClash"
        ).checked =
            Boolean(
                data.faculty_clash
            );

    }


    // --------------------------------------------------------
    // SEMESTER CLASH
    // --------------------------------------------------------

    if (
        data.semester_clash !==
        undefined
    ) {

        document.getElementById(
            "semesterClash"
        ).checked =
            Boolean(
                data.semester_clash
            );

    }


    // --------------------------------------------------------
    // P / C CYCLE
    // --------------------------------------------------------

    if (
        data.cycle_constraint !==
        undefined
    ) {

        document.getElementById(
            "cycleConstraint"
        ).checked =
            Boolean(
                data.cycle_constraint
            );

    }

}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    // --------------------------------------------------------
    // Working day buttons
    // --------------------------------------------------------

    setupDayButtons();


    // --------------------------------------------------------
    // Add period
    // --------------------------------------------------------

    const addPeriodBtn =
        document.getElementById(
            "addPeriodBtn"
        );

    if (addPeriodBtn) {

        addPeriodBtn.addEventListener(
            "click",
            () => {

                addPeriod();

            }
        );

    }


    // --------------------------------------------------------
    // Save button
    // --------------------------------------------------------

    const saveBtn =
        document.getElementById(
            "saveConstraintsBtn"
        );

    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            saveConstraints
        );

    }


    // --------------------------------------------------------
    // Department change
    // --------------------------------------------------------

    const department =
        document.getElementById(
            "department"
        );

    if (department) {

        department.addEventListener(
            "change",
            async () => {

                await loadConstraints();

            }
        );

    }


    // --------------------------------------------------------
    // Academic year change
    // --------------------------------------------------------

    const academicYear =
        document.getElementById(
            "academicYear"
        );

    if (academicYear) {

        academicYear.addEventListener(
            "change",
            async () => {

                await loadConstraints();

            }
        );

    }


    // --------------------------------------------------------
    // Scheme change
    // --------------------------------------------------------

    const scheme =
        document.getElementById(
            "scheme"
        );

    if (scheme) {

        scheme.addEventListener(
            "change",
            async () => {

                await loadConstraints();

            }
        );

    }

}


// ============================================================
// EXPORT
// ============================================================

window.removePeriod =
    removePeriod;