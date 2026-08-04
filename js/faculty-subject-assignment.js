const API_URL = "http://127.0.0.1:5000/faculty-subject-assignments";
const SUBJECT_API = "http://127.0.0.1:5000/assignment-subjects";
const FACULTY_API = "http://127.0.0.1:5000/assignment-faculties";
const DEPARTMENT_API = "http://127.0.0.1:5000/departments";
const SCHEME_API = "http://127.0.0.1:5000/schemes";
const DEPARTMENT_ASSIGNMENT_API = "http://127.0.0.1:5000/assignment-departments";
const ACADEMIC_YEAR_API = "http://127.0.0.1:5000/academic-years";

async function loadDepartments() {

    const response = await fetch(DEPARTMENT_API);

    const departments = await response.json();

    const departmentDropdown =
        document.getElementById("assignmentDepartment");

    departmentDropdown.innerHTML =
        '<option value="">Select Department</option>';

    departments.forEach(department => {

        departmentDropdown.innerHTML += `

            <option value="${department.department_code}">
                ${department.department_code}
            </option>

        `;

    });

}

async function loadSchemes() {

    const response = await fetch(SCHEME_API);

    const schemes = await response.json();

    const schemeDropdown =
        document.getElementById("assignmentScheme");

    schemeDropdown.innerHTML =
        '<option value="">Select Scheme</option>';

    schemes.forEach(scheme => {

        schemeDropdown.innerHTML += `

            <option value="${scheme.scheme_year}">
                ${scheme.scheme_year}
            </option>

        `;

    });

}
loadDepartments();
loadSchemes();
loadAcademicYears();

async function loadSubjects() {

    const department =
        document.getElementById("assignmentDepartment").value;

    const scheme =
        document.getElementById("assignmentScheme").value;

    const semester =
        document.getElementById("assignmentSemester").value;
    const cycle =
    document.getElementById("assignmentCycle").value;

    if (!department || !scheme || !semester) {
        return;
    }

    if ((semester === "1" || semester === "2") && !cycle) {
        return;
    }

    let url = "";

    if (semester === "1" || semester === "2") {

        url = `${SUBJECT_API}/${department}/${scheme}/${semester}/${cycle}`;

    } else {

        url = `${SUBJECT_API}/${department}/${scheme}/${semester}/NA`;
    }

const subjectResponse = await fetch(url);

    const subjects = await subjectResponse.json();

    const departmentResponse =
    await fetch(DEPARTMENT_ASSIGNMENT_API);

    const departments = await departmentResponse.json();

    const facultyResponse =
        await fetch(`${FACULTY_API}/${department}`);

    const faculties = await facultyResponse.json();

    const table =
        document.getElementById("assignmentSubjectsTable");

    table.innerHTML = "";

    subjects.forEach(subject => {

        let facultyOptions =
            '<option value="">Select Faculty</option>';

        faculties.forEach(faculty => {

            facultyOptions += `
                <option value="${faculty.faculty_id}">
                    ${faculty.faculty_name}
                </option>
            `;

        });
        let departmentOptions = "";

        departments.forEach(dep => {

            departmentOptions += `
                <option value="${dep.department_code}"
                    ${dep.department_code === department ? "selected" : ""}>
                    ${dep.department_code}
                </option>
            `;

        });

        table.innerHTML += `
            <tr>

                <td>${subject.subject_code}</td>

                <td>${subject.subject_name}</td>

                <td>
                    <select
                        class="form-select department-select"
                        data-subject-id="${subject.subject_id}">
                        ${departmentOptions}
                    </select>
                </td>

                <td>
                    <select
                        class="form-select faculty-select"
                        data-subject-id="${subject.subject_id}">
                        ${facultyOptions}
                    </select>
                </td>

            </tr>
        `;

    });
    document.querySelectorAll(".department-select").forEach(select => {

    select.addEventListener("change", async function () {

        const selectedDepartment = this.value;

        const row = this.closest("tr");

        const facultySelect =
            row.querySelector(".faculty-select");

        const response =
            await fetch(`${FACULTY_API}/${selectedDepartment}`);

        const faculties = await response.json();

        facultySelect.innerHTML =
            '<option value="">Select Faculty</option>';

        faculties.forEach(faculty => {

            facultySelect.innerHTML += `
                <option value="${faculty.faculty_id}">
                    ${faculty.faculty_name}
                </option>
            `;

        });

    });

});

}


document.getElementById("assignmentDepartment")
    .addEventListener("change", loadSubjects);

document.getElementById("assignmentScheme")
    .addEventListener("change", loadSubjects);

document.getElementById("assignmentSemester")
    .addEventListener("change", loadSubjects);
document.getElementById("assignmentCycle")
    .addEventListener("change", loadSubjects);
async function saveAssignments() {

    const academicYear =
        document.getElementById("academicYear").value;

    const assignments = [];

    document.querySelectorAll("#assignmentSubjectsTable tr").forEach(row => {

        const facultySelect =
            row.querySelector(".faculty-select");

        const subjectId =
            facultySelect.dataset.subjectId;

        const facultyId =
            facultySelect.value;

        if (facultyId !== "") {

            assignments.push({

                subject_id: subjectId,
                faculty_id: facultyId,
                academic_year: academicYear

            });

        }

    });

    const response = await fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(assignments)

    });

    const result = await response.json();

    alert(result.message);
    location.reload();
}
async function loadAcademicYears() {

    const response =
        await fetch(ACADEMIC_YEAR_API);

    const years =
        await response.json();

    const dropdown =
        document.getElementById("filterAcademicYear");

    dropdown.innerHTML =
        '<option value="">Select Academic Year</option>';

    years.forEach(year => {

        dropdown.innerHTML += `
            <option value="${year.academic_year}">
                ${year.academic_year}
            </option>
        `;

    });

}
async function loadAssignments() {

    const academicYear =
        document.getElementById("filterAcademicYear").value;
    const semesterType =
    document.getElementById("filterSemesterType").value;
    

    if (!academicYear || !semesterType) {
        return;
    }

    const response =
        
        await fetch(`${API_URL}/${academicYear}/${semesterType}`);

    const assignments = await response.json();
    document.getElementById("summaryAcademicYear").innerText =
        academicYear;

    document.getElementById("summarySemesterType").innerText =
        semesterType;

    document.getElementById("summaryTotal").innerText =
        assignments.length;
    const table =
        document.getElementById("assignmentTableBody");

    table.innerHTML = "";
    if (assignments.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger fw-bold">
                    No Assignments Found
                </td>
            </tr>
        `;

        return;

    }
    let currentSemester = "";

    assignments.forEach((assignment, index) => {
        if (currentSemester !== assignment.semester_id) {

            currentSemester = assignment.semester_id;

            table.innerHTML += `
                <tr class="table-primary">
                    <td colspan="6" class="fw-bold fs-5 text-center">
                        📘 Semester ${currentSemester}
                    </td>
                </tr>
            `;
        }

        table.innerHTML += `
        <tr>
            

            <td>${index + 1}</td>

            <td>${assignment.department_code}</td>

            <td>Semester ${assignment.semester_id}</td>

            <td>${assignment.faculty_name}</td>

            <td>
                ${assignment.subject_code} - ${assignment.subject_name}
            </td>
            <td>

                

                <button
                    class="btn btn-sm btn-danger"
                    onclick="deleteAssignment(${assignment.assignment_id})">
                    Delete
                </button>

            </td>

        </tr>
    `;

    });

}

async function deleteAssignment(assignmentId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this assignment?"
    );

    if (!confirmDelete) {
        return;
    }

    const response = await fetch(
        `${API_URL}/${assignmentId}`,
        {
            method: "DELETE"
        }
    );

    const result = await response.json();

    alert(result.message);

    loadAssignments();

}

document
    .getElementById("searchAssignment")
    .addEventListener("keyup", searchAssignments);

function searchAssignments() {

    const searchText =
        document
            .getElementById("searchAssignment")
            .value
            .toLowerCase();

    const rows =
        document.querySelectorAll("#assignmentTableBody tr");

    rows.forEach(row => {

        const rowText =
            row.innerText.toLowerCase();

        if (rowText.includes(searchText)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

}
document
    .getElementById("filterAcademicYear")
    .addEventListener("change", loadAssignments);
document
    .getElementById("filterSemesterType")
    .addEventListener("change", loadAssignments);

function loadSemesterOptions() {

    const semesterType =
        document.getElementById("assignmentSemesterType").value;

    const semester =
        document.getElementById("assignmentSemester");

    semester.innerHTML =
        '<option value="">Select Semester</option>';

    let semesters = [];

    if (semesterType === "Odd") {

        semesters = [1, 3, 5, 7];

    }
    else if (semesterType === "Even") {

        semesters = [2, 4, 6, 8];

    }

    semesters.forEach(sem => {

        semester.innerHTML += `
            <option value="${sem}">
                Semester ${sem}
            </option>
        `;

    });
    semester.value = "";
    document.getElementById("assignmentSubjectsTable").innerHTML = "";

}
document
    .getElementById("assignmentSemesterType")
    .addEventListener("change", loadSemesterOptions);

const assignmentCycle =
    document.getElementById("assignmentCycle");

const cycleDiv =
    document.getElementById("cycleDiv");

document
    .getElementById("assignmentSemester")
    .addEventListener("change", function () {

        if (this.value === "1" || this.value === "2") {

            cycleDiv.style.display = "block";

        } else {

            cycleDiv.style.display = "none";

            assignmentCycle.value = "";

        }

    });

document
    .getElementById("facultyModal")
    .addEventListener("shown.bs.modal", function () {

        document.getElementById("assignmentDepartment").value = "";

        document.getElementById("assignmentScheme").value = "";

        document.getElementById("assignmentSemesterType").value = "";

        document.getElementById("assignmentSemester").innerHTML =
            '<option value="">Select Semester Type First</option>';

        document.getElementById("assignmentSubjectsTable").innerHTML = "";
        document.getElementById("subjectSearch").value = "";

    });
document
    .getElementById("subjectSearch")
    .addEventListener("keyup", function () {

        const searchText =
            this.value.toLowerCase();

        const rows =
            document.querySelectorAll(
                "#assignmentSubjectsTable tr"
            );

        rows.forEach(row => {

            const rowText =
                row.innerText.toLowerCase();

            if (rowText.includes(searchText)) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });
