let faculties = JSON.parse(localStorage.getItem("faculties")) || [];
let editIndex = -1;
function loadDepartmentDropdown() {

    const departments =
        JSON.parse(localStorage.getItem("departments")) || [];

    const dropdown =
        document.getElementById("facultyDepartment");

    dropdown.innerHTML =
        '<option value="">Select Department</option>';

    departments.forEach(department => {

        dropdown.innerHTML += `
            <option value="${department.code}">
                ${department.code}
            </option>
        `;

    });

}
function loadSubjects() {

    const department =
        document.getElementById("facultyDepartment").value;

    const subjects =
        JSON.parse(localStorage.getItem("subjects")) || [];

    const container =
        document.getElementById("facultySubjects");

    container.innerHTML = "";

    const filteredSubjects =
        subjects.filter(subject =>
            subject.department === department
        );

    if (filteredSubjects.length === 0) {

        container.innerHTML =
            "<small class='text-muted'>No subjects found.</small>";

        return;

    }

    filteredSubjects.forEach(subject => {

        container.innerHTML += `

            <div class="form-check">

                <input
                    class="form-check-input"
                    type="checkbox"
                    value="${subject.code}"
                    id="${subject.code}">

                <label
                    class="form-check-label"
                    for="${subject.code}">

                    ${subject.code} - ${subject.name}

                </label>

            </div>

        `;

    });

}
loadDepartmentDropdown();

document
    .getElementById("facultyDepartment")
    .addEventListener("change", loadSubjects);


function loadFaculties() {
    const table = document.getElementById("facultyTableBody");
    const search = document
        .getElementById("searchFaculty")
        .value
        .toLowerCase();

    

    table.innerHTML = "";

    if (faculties.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    No Faculty Found
                </td>
            </tr>
        `;

        return;
    }

    faculties.forEach((faculty, index) => {
        if (
        !faculty.name.toLowerCase().includes(search) &&
        !faculty.department.toLowerCase().includes(search) &&
        !faculty.designation.toLowerCase().includes(search) &&
        !faculty.subjects.join(", ").toLowerCase().includes(search)
    ) {

        return;

    }

        table.innerHTML += `
            <tr>

                <td>${faculty.id}</td>

                <td>${faculty.name}</td>

                <td>${faculty.department}</td>

                <td>${faculty.designation}</td>

                <td>${faculty.subjects.join(", ")}</td>

                <td>${faculty.workload}</td>

                <td>${faculty.morningPreference}</td>

                <td>
                    <span class="badge bg-success">
                        ${faculty.status}
                    </span>
                </td>

                <td>

                    <button
                        class="btn btn-warning btn-sm"
                        onclick="editFaculty(${index})">

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="deleteFaculty(${index})">

                        <i class="bi bi-trash"></i>

                    </button>

                </td>

            </tr>
        `;

    });

}
loadDepartmentDropdown();
loadFaculties();

function saveFaculty() {

    const name = document.getElementById("facultyName").value.trim();
    const department = document.getElementById("facultyDepartment").value;
    const designation = document.getElementById("facultyDesignation").value;
    const workload = document.getElementById("facultyWorkload").value;
    const morningPreference = document.getElementById("facultyMorningPreference").value;
    const status = document.getElementById("facultyStatus").value;

    const subjects = [];

document
    .querySelectorAll("#facultySubjects input[type='checkbox']:checked")
    .forEach(subject => {

        subjects.push(subject.value);

    });

    console.log(name);
    console.log(department);
    console.log(designation);
    console.log(workload);
    console.log(morningPreference);
    console.log(status);
    console.log(subjects);

    if (
        name === "" ||
        department === "" ||
        designation === "" ||
        workload === "" ||
        morningPreference === "" ||
        subjects=== ''
    ) {

        alert("Please fill all fields.");

        return;
    }

    const duplicate = faculties.some((faculty, index) =>

        faculty.name.toLowerCase() === name.toLowerCase() &&
        index !== editIndex

    );

    if (duplicate) {

        alert("Faculty already exists.");

        return;

    }

    if (editIndex === -1) {

        const newId =
            faculties.length > 0
                ? faculties[faculties.length - 1].id + 1
                : 1;

        faculties.push({

            id: newId,
            name,
            department,
            designation,
            workload,
            morningPreference,
            status,
            subjects

        });

    } else {

        faculties[editIndex] = {

            ...faculties[editIndex],

            name,
            department,
            designation,
            workload,
            morningPreference,
            status,
            subjects

        };

        editIndex = -1;

    }

    localStorage.setItem(
        "faculties",
        JSON.stringify(faculties)
    );

    loadFaculties();

    document.getElementById("facultyName").value = "";
    document.getElementById("facultyDepartment").value = "";
    document.getElementById("facultyDesignation").value = "";
    document.getElementById("facultyWorkload").value = "";
    document.getElementById("facultyMorningPreference").value = "";
    document.getElementById("facultyStatus").value = "Active";
    document.getElementById("facultySubjects").innerHTML = "";
    document.querySelector("#facultyModal .btn-primary").textContent =
    "Save Faculty";
    const modal =
        bootstrap.Modal.getInstance(
            document.getElementById("facultyModal")
        );



    modal.hide();

}
function editFaculty(index) {

    editIndex = index;

    const faculty = faculties[index];

    document.getElementById("facultyName").value = faculty.name;

    document.getElementById("facultyDepartment").value = faculty.department;

    loadSubjects();

    setTimeout(() => {

        document
            .querySelectorAll("#facultySubjects input[type='checkbox']")
            .forEach(checkbox => {

                checkbox.checked =
                    faculty.subjects.includes(checkbox.value);

            });

    }, 100);

    document.getElementById("facultyDesignation").value =
        faculty.designation;

    document.getElementById("facultyWorkload").value =
        faculty.workload;

    document.getElementById("facultyMorningPreference").value =
        faculty.morningPreference;

    document.getElementById("facultyStatus").value =
        faculty.status;

    document.querySelector("#facultyModal .btn-primary").textContent =
    "Update Faculty";

    const modal = new bootstrap.Modal(
        document.getElementById("facultyModal")

    );

    modal.show();

}

function resetFacultyForm() {

    editIndex = -1;

    document.getElementById("facultyName").value = "";
    document.getElementById("facultyDepartment").value = "";
    document.getElementById("facultyDesignation").value = "";
    document.getElementById("facultyWorkload").value = "";
    document.getElementById("facultyMorningPreference").value = "";
    document.getElementById("facultyStatus").value = "Active";

    document.getElementById("facultySubjects").innerHTML =
        "<small class='text-muted'>Select Department to load subjects.</small>";

    document.querySelector("#facultyModal .btn-primary").textContent =
        "Save Faculty";

}

function deleteFaculty(index) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this faculty?"
    );

    if (!confirmDelete) {

        return;

    }

    faculties.splice(index, 1);

    localStorage.setItem(
        "faculties",
        JSON.stringify(faculties)
    );

    loadFaculties();

}
document
    .getElementById("searchFaculty")
    .addEventListener("keyup", loadFaculties);

document
    .getElementById("facultyDepartment")
    .addEventListener("change", loadSubjects);