const DEPARTMENT_API =
    "http://127.0.0.1:5000/departments";

const SCHEME_API =
    "http://127.0.0.1:5000/schemes";

const CONSTRAINT_API =
    "http://127.0.0.1:5000/timetable-constraints";

let editId = null;
function init() {

    loadDepartmentDropdown();

    loadSchemeDropdown();

}
init();
async function loadDepartmentDropdown() {

    const response =
        await fetch(DEPARTMENT_API);

    const departments =
        await response.json();

    const dropdown =
        document.getElementById("constraintDepartment");

    dropdown.innerHTML =
        '<option value="">Select Department</option>';

    departments.forEach(department => {

        dropdown.innerHTML += `
            <option value="${department.department_code}">
                ${department.department_code}
            </option>
        `;

    });

}
async function loadSchemeDropdown() {

    const response =
        await fetch(SCHEME_API);

    const schemes =
        await response.json();

    const dropdown =
        document.getElementById("constraintScheme");

    dropdown.innerHTML =
        '<option value="">Select Scheme</option>';

    schemes.forEach(scheme => {

        dropdown.innerHTML += `
            <option value="${scheme.scheme_year}">
                ${scheme.scheme_year}
            </option>
        `;

    });

}
function loadSemesterDropdown() {

    const semesterType =
        document.getElementById("constraintSemesterType").value;

    const semesterDropdown =
        document.getElementById("constraintSemester");

    semesterDropdown.innerHTML =
        '<option value="">Select Semester</option>';

    let semesters = [];

    if (semesterType === "Odd") {

        semesters = [1, 3, 5, 7];

    } else if (semesterType === "Even") {

        semesters = [2, 4, 6, 8];

    }

    semesters.forEach(semester => {

        semesterDropdown.innerHTML += `
            <option value="${semester}">
                Semester ${semester}
            </option>
        `;

    });

}
function saveConstraint() {

    const department =
        document.getElementById("constraintDepartment").value;

    const scheme =
        document.getElementById("constraintScheme").value;

    const semester =
        document.getElementById("constraintSemester").value;

    const workingDays = [];

    document.querySelectorAll(
        '#constraintForm input[type="checkbox"]:checked'
    ).forEach(day => {
        workingDays.push(day.value);
    });

    const periodsPerDay =
        document.getElementById("periodsPerDay").value;

    const collegeStartTime =
        document.getElementById("collegeStartTime").value;

    const periodDuration =
        document.getElementById("periodDuration").value;

    const lunchAfterPeriod =
        document.getElementById("lunchAfterPeriod").value;

    const shortBreakAfterPeriod =
        document.getElementById("shortBreakAfterPeriod").value;

    const shortBreakDuration =
        document.getElementById("shortBreakDuration").value;

    if (
        !department ||
        !scheme ||
        !semester ||
        workingDays.length === 0 ||
        !periodsPerDay ||
        !collegeStartTime ||
        !periodDuration ||
        !lunchAfterPeriod
    ) {
        alert("Please fill all required fields.");
        return;
    }

    const data = {

        department,

        scheme,

        academic_year:
            document.getElementById("constraintAcademicYear").value,

        semester_type:
            document.getElementById("constraintSemesterType").value,

        semester,

        working_days: workingDays,

        periods_per_day: periodsPerDay,

        college_start_time: collegeStartTime,

        period_duration: periodDuration,

        lunch_after_period: lunchAfterPeriod,

        short_break_after_period: shortBreakAfterPeriod,

        short_break_duration: shortBreakDuration,

        max_periods_per_day:
            document.getElementById("maxPeriodsPerDay").value,

        max_periods_per_week:
            document.getElementById("maxPeriodsPerWeek").value,

        lab_duration:
            document.getElementById("labDuration").value

    };

    const url = editId
        ? `${CONSTRAINT_API}/${editId}`
        : CONSTRAINT_API;

    const method = editId
        ? "PUT"
        : "POST";

    fetch(url, {

        method: method,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(data)

    })
    .then(response => response.json())
    .then(result => {

        alert(result.message);
        loadConstraints();

        document
            .querySelector("#facultyModal .btn-close")
            .click();

        document.getElementById("constraintForm").reset();

        editId = null;

    })
    
    .catch(error => {

        console.error(error);

        alert("Error while saving constraint.");

    });

}
async function loadConstraints() {

    const response = await fetch(CONSTRAINT_API);

    const constraints = await response.json();

    const tableBody =
        document.getElementById("constraintTableBody");

    tableBody.innerHTML = "";

    constraints.forEach((constraint, index) => {

        tableBody.innerHTML += `

        <tr>

            <td>${index + 1}</td>

                <td>${constraint.department_code}</td>

                <td>${constraint.scheme_year}</td>

                <td>${constraint.academic_year}</td>

                <td>${constraint.semester_type} - ${constraint.semester_id}</td>

                <td>${constraint.working_days}</td>

                <td>${constraint.periods_per_day}</td>

                <td>${constraint.college_start_time}</td>

                <td>${constraint.period_duration} Min</td>

                <td>After ${constraint.lunch_after_period}</td>

                <td>
                    After ${constraint.short_break_after_period}
                    (${constraint.short_break_duration} Min)
                </td>

                <td>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="editConstraint(${constraint.constraint_id})">

                    Edit

                </button>
                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteConstraint(${constraint.constraint_id})">

                    Delete
                </button>

            </td>

        </tr>

        `;

    });

}
async function deleteConstraint(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this constraint?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${CONSTRAINT_API}/${id}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        alert(result.message);

        loadConstraints();

    } catch (error) {

        console.error(error);

        alert("Error deleting constraint.");

    }

}
async function editConstraint(id) {

    editId = id;

    const response =
        await fetch(`${CONSTRAINT_API}/${id}`);

    const constraint =
        await response.json();

    document.getElementById("constraintDepartment").value =
        constraint.department_code;

    document.getElementById("constraintScheme").value =
        constraint.scheme_year;

    document.getElementById("constraintAcademicYear").value =
        constraint.academic_year;

    document.getElementById("constraintSemesterType").value =
        constraint.semester_type;

    loadSemesterDropdown();

    document.getElementById("constraintSemester").value =
        constraint.semester_id;

    document.getElementById("periodsPerDay").value =
        constraint.periods_per_day;

    document.getElementById("collegeStartTime").value =
        constraint.college_start_time;

    document.getElementById("periodDuration").value =
        constraint.period_duration;

    document.getElementById("lunchAfterPeriod").value =
        constraint.lunch_after_period;

    document.getElementById("shortBreakAfterPeriod").value =
        constraint.short_break_after_period;

    document.getElementById("shortBreakDuration").value =
        constraint.short_break_duration;

    document.getElementById("maxPeriodsPerDay").value =
        constraint.max_periods_per_day;

    document.getElementById("maxPeriodsPerWeek").value =
        constraint.max_periods_per_week;

    document.getElementById("labDuration").value =
        constraint.lab_duration;

    document.querySelectorAll(
        '#constraintForm input[type="checkbox"]'
    ).forEach(day => {

        day.checked = false;

    });

    constraint.working_days
        .split(",")
        .forEach(day => {

            const checkbox = document.querySelector(
                `input[value="${day}"]`
            );

            if (checkbox) {

                checkbox.checked = true;

            }

        });

    const modal = new bootstrap.Modal(
        document.getElementById("facultyModal")
    );

    modal.show();

}
function resetConstraintForm() {

    document.getElementById("constraintForm").reset();

    document.querySelectorAll(
        '#constraintForm input[type="checkbox"]'
    ).forEach(day => day.checked = false);

    editId = null;

}

document
    .getElementById("constraintSemesterType")
    .addEventListener("change", loadSemesterDropdown);
loadConstraints();