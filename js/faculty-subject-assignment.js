let assignments =
JSON.parse(localStorage.getItem("assignments")) || [];

let editIndex = -1;

function loadDepartmentDropdown() {

    const departments =
        JSON.parse(localStorage.getItem("departments")) || [];

    const department =
        document.getElementById("facultyDepartment");

    department.innerHTML =
        '<option value="">Select Department</option>';

    departments.forEach(dept => {

        department.innerHTML += `
            <option value="${dept.code}">
                ${dept.code}
            </option>
        `;

    });

}
loadDepartmentDropdown();

function loadFacultyDropdown() {

    const faculties =
        JSON.parse(localStorage.getItem("faculties")) || [];

    const department =
        document.getElementById("facultyDepartment").value;

    const faculty =
        document.getElementById("assignmentFaculty");

    faculty.innerHTML =
        '<option value="">Select Faculty</option>';

    faculties.forEach(item => {

        if (item.department === department) {

            faculty.innerHTML += `
                <option value="${item.name}">
                    ${item.name}
                </option>
            `;

        }

    });

}
function loadSubjects() {

    const subjects =
        JSON.parse(localStorage.getItem("subjects")) || [];

    const department =
        document.getElementById("facultyDepartment").value;

    const semesterType =
        document.getElementById("semesterType").value;

    const container =
        document.getElementById("assignmentSubjects");

    container.innerHTML = "";

    subjects.forEach(subject => {

        const semester = parseInt(subject.semester);

        const isOdd = semester % 2 !== 0;
        const isEven = semester % 2 === 0;

        if (
            subject.department === department &&
            (
                (semesterType === "Odd" && isOdd) ||
                (semesterType === "Even" && isEven)
            )
        ) {

            container.innerHTML += `
                <div class="form-check">

                    <input
                        class="form-check-input"
                        type="checkbox"
                        value="${subject.code}">

                    <label class="form-check-label">

                        ${subject.code} - ${subject.name}

                    </label>

                </div>
            `;

        }

    });

    if (container.innerHTML === "") {

        container.innerHTML =
            "<small class='text-muted'>No subjects found.</small>";

    }

}

function saveAssignment() {

    const department =
        document.getElementById("facultyDepartment").value;

    const semesterType =
        document.getElementById("semesterType").value;

    const faculty =
        document.getElementById("assignmentFaculty").value;

    const subjects = [];

    document
        .querySelectorAll("#assignmentSubjects input:checked")
        .forEach(item => {

            subjects.push(item.value);

        });

    if (
        !department ||
        !semesterType ||
        !faculty ||
        subjects.length === 0
    ) {

        alert("Please fill all fields.");

        return;

    }

    const assignment = {

    id: editIndex === -1
        ? Date.now()
        : assignments[editIndex].id,

    department,

    semesterType,

    faculty,

    subjects

};

if (editIndex === -1) {

    assignments.push(assignment);

} else {

    assignments[editIndex] = assignment;

    editIndex = -1;

}

    localStorage.setItem(
        "assignments",
        JSON.stringify(assignments)
    );

    alert("Assignment Saved Successfully!");
    loadAssignments();

    document
    .getElementById("facultyModal")
    .querySelector(".btn-close")
    .click();

    document.getElementById("facultyDepartment").value = "";
    document.getElementById("semesterType").value = "";

    document.getElementById("assignmentFaculty").innerHTML =
        '<option value="">Select Faculty</option>';

    document.getElementById("assignmentSubjects").innerHTML =
        "<small class='text-muted'>Select Department and Semester Type to load subjects.</small>";

}
function loadAssignments() {

    const table =
        document.getElementById("assignmentTableBody");
    const search =
    document
        .getElementById("searchAssignment")
        .value
        .toLowerCase();

    table.innerHTML = "";

    assignments.forEach((assignment, index) => {

        if (

    !assignment.department.toLowerCase().includes(search) &&
    !assignment.semesterType.toLowerCase().includes(search) &&
    !assignment.faculty.toLowerCase().includes(search) &&
    !assignment.subjects.join(", ").toLowerCase().includes(search)

) {

    return;

}

        table.innerHTML += `

        <tr>

            <td>${index + 1}</td>

            <td>${assignment.department}</td>

            <td>${assignment.semesterType}</td>

            <td>${assignment.faculty}</td>

            <td>${assignment.subjects.join(", ")}</td>

            <td>

                <button
                  class="btn btn-warning btn-sm"
                  onclick="editAssignment(${index})"
                  data-bs-toggle="modal"
                  data-bs-target="#facultyModal">
                    <i class="bi bi-pencil"></i>
                <button class="btn btn-danger btn-sm" onclick="deleteAssignment(${index})">
                    
                    <i class="bi bi-trash"></i>
                </button>

            </td>

        </tr>

        `;

    });

}

function editAssignment(index) {

    const assignment = assignments[index];

    editIndex = index;

    document.getElementById("facultyDepartment").value =
        assignment.department;

    document.getElementById("semesterType").value =
        assignment.semesterType;

    loadFacultyDropdown();

    document.getElementById("assignmentFaculty").value =
        assignment.faculty;

    loadSubjects();

    assignment.subjects.forEach(subject => {

        const checkbox = document.querySelector(
            `#assignmentSubjects input[value="${subject}"]`
        );

        if (checkbox) {

            checkbox.checked = true;

        }

    });

}
function deleteAssignment(index) {

    if (!confirm("Are you sure you want to delete this assignment?")) {

        return;

    }

    assignments.splice(index, 1);

    localStorage.setItem(
        "assignments",
        JSON.stringify(assignments)
    );

    loadAssignments();

}
loadAssignments();
loadDepartmentDropdown();
document
    .getElementById("facultyDepartment")
    .addEventListener("change", loadFacultyDropdown);

document
    .getElementById("semesterType")
    .addEventListener("change", loadSubjects);

document
    .getElementById("facultyDepartment")
    .addEventListener("change", loadSubjects);
document
    .getElementById("searchAssignment")
    .addEventListener("keyup", loadAssignments);


