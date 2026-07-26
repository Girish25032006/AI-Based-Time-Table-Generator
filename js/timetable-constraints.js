let constraints =
JSON.parse(localStorage.getItem("constraints")) || [];

let editIndex = -1;
function init() {

    loadDepartmentDropdown();

    loadSchemeDropdown();

    loadSemesterDropdown();

    loadConstraints();

}
init();
function loadDepartmentDropdown() {

    const departmentDropdown =
        document.getElementById("constraintDepartment");

    departmentDropdown.innerHTML =
        '<option value="">Select Department</option>';

    const departments =
        JSON.parse(localStorage.getItem("departments")) || [];

    departments.forEach(department => {

        departmentDropdown.innerHTML += `
            <option value="${department.code}">
                ${department.code}
            </option>
        `;

    });

}
function loadSchemeDropdown() {

    const schemeDropdown =
        document.getElementById("constraintScheme");

    schemeDropdown.innerHTML =
        '<option value="">Select Scheme</option>';

    const schemes =
        JSON.parse(localStorage.getItem("schemes")) || [];

    schemes.forEach(scheme => {

        schemeDropdown.innerHTML += `
            <option value="${scheme.name}">
                ${scheme.name}
            </option>
        `;

    });

}
function loadSemesterDropdown() {

    const semesterDropdown =
        document.getElementById("constraintSemester");

    semesterDropdown.innerHTML = `
        <option value="">Select Semester</option>
        <option value="1">1st Semester</option>
        <option value="2">2nd Semester</option>
        <option value="3">3rd Semester</option>
        <option value="4">4th Semester</option>
        <option value="5">5th Semester</option>
        <option value="6">6th Semester</option>
        <option value="7">7th Semester</option>
        <option value="8">8th Semester</option>
    `;

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

    const constraint = {

        id: Date.now(),

        department,

        scheme,

        semester,

        workingDays,

        periodsPerDay,

        collegeStartTime,

        periodDuration,

        lunchAfterPeriod,

        shortBreakAfterPeriod,

        shortBreakDuration

    };

    if (editIndex == -1) {

        constraints.push(constraint);

    } else {

        constraint.id = constraints[editIndex].id;

        constraints[editIndex] = constraint;

        editIndex = -1;

    }

    localStorage.setItem(
        "constraints",
        JSON.stringify(constraints)
    );

    loadConstraints();

    document
    .querySelector("#facultyModal .btn-close")
    .click();

    document.getElementById("constraintForm").reset();
    editIndex = -1;
}
function loadConstraints() {

    const tableBody =
        document.getElementById("constraintTableBody");

    tableBody.innerHTML = "";

    constraints.forEach((constraint, index) => {

        tableBody.innerHTML += `

        <tr>

    <td>${index + 1}</td>
    <td>${constraint.department}</td>
    <td>${constraint.scheme}</td>
    <td>${constraint.semester}</td>
    <td>${constraint.workingDays.join(", ")}</td>
    <td>${constraint.periodsPerDay}</td>
    <td>${constraint.collegeStartTime}</td>
    <td>${constraint.periodDuration} Min</td>
    <td>After ${constraint.lunchAfterPeriod}</td>

    <td>

        <button
            class="btn btn-warning btn-sm"
            onclick="editConstraint(${index})">

            Edit

        </button>

        <button
            class="btn btn-danger btn-sm"
            onclick="deleteConstraint(${index})">

            Delete

        </button>

    </td>

</tr>

        `;

    });


}

function deleteConstraint(index) {

    if (confirm("Are you sure you want to delete this constraint?")) {

        constraints.splice(index, 1);

        localStorage.setItem(
            "constraints",
            JSON.stringify(constraints)
        );

        loadConstraints();

    }

}
function editConstraint(index) {

    const constraint = constraints[index];

    document.getElementById("constraintDepartment").value =
        constraint.department;

    document.getElementById("constraintScheme").value =
        constraint.scheme;

    document.getElementById("constraintSemester").value =
        constraint.semester;

    document.querySelectorAll(
        '#constraintForm input[type="checkbox"]'
    ).forEach(day => {

        day.checked = constraint.workingDays.includes(day.value);

    });

    document.getElementById("periodsPerDay").value =
        constraint.periodsPerDay;

    document.getElementById("collegeStartTime").value =
        constraint.collegeStartTime;

    document.getElementById("periodDuration").value =
        constraint.periodDuration;

    document.getElementById("lunchAfterPeriod").value =
        constraint.lunchAfterPeriod;

    document.getElementById("shortBreakAfterPeriod").value =
        constraint.shortBreakAfterPeriod;

    document.getElementById("shortBreakDuration").value =
        constraint.shortBreakDuration;

    editIndex = index;

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

    editIndex = -1;

}