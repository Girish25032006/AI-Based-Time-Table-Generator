const API_URL = "http://127.0.0.1:5000/faculties";
const DEPARTMENT_API = "http://127.0.0.1:5000/departments";

let departments = [];
let faculties = [];

let editFacultyId = null;
let editIndex = -1;

let selectedDepartmentCode = null;


// ============================================================
// LOAD DEPARTMENTS
// ============================================================

async function fetchDepartments() {

    try {

        const response = await fetch(DEPARTMENT_API);

        if (!response.ok) {
            throw new Error("Failed to load departments");
        }

        departments = await response.json();

        loadDepartmentDropdown();
        displayDepartmentCards();

    } catch (error) {

        console.error("Department loading error:", error);

        alert("Unable to load departments.");

    }

}


// ============================================================
// DEPARTMENT DROPDOWN
// ============================================================

function loadDepartmentDropdown() {

    const dropdown =
        document.getElementById("facultyDepartment");

    if (!dropdown) {
        return;
    }

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


// ============================================================
// LOAD FACULTIES
// ============================================================

async function fetchFaculties() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load faculty");
        }

        faculties = await response.json();

        /*
         * If user is currently viewing a department,
         * refresh that department.
         */
        if (selectedDepartmentCode) {

            displayDepartmentFaculty(selectedDepartmentCode);

        }

    } catch (error) {

        console.error("Faculty loading error:", error);

        alert("Unable to load faculty.");

    }

}


// ============================================================
// DISPLAY DEPARTMENT CARDS
// ============================================================

function displayDepartmentCards() {

    const container =
        document.getElementById("facultyDepartmentCards");

    if (!container) {
        return;
    }

    selectedDepartmentCode = null;

    container.innerHTML = "";

    if (departments.length === 0) {

        container.innerHTML = `
            <div class="col-12">

                <div class="alert alert-info text-center">
                    No departments found.
                </div>

            </div>
        `;

        return;
    }


    departments.forEach(department => {

        /*
         * Count faculty belonging to this department
         */
        const facultyCount = faculties.filter(
            faculty =>
                faculty.department_code === department.department_code
        ).length;


        container.innerHTML += `

            <div class="col-md-6 col-lg-4">

                <div class="card h-100 shadow-sm border">

                    <div class="card-body">

                        <div class="d-flex align-items-center mb-3">

                            <div
                                class="rounded p-3 me-3"
                                style="
                                    background-color: #e8f5ee;
                                    color: #087f3f;
                                "
                            >

                                <i class="bi bi-building fs-3"></i>

                            </div>

                            <div>

                                <h5
                                    class="mb-1"
                                    style="color:#087f3f;"
                                >
                                    ${department.department_code}
                                </h5>

                                <small class="text-muted">
                                    ${department.department_name}
                                </small>

                            </div>

                        </div>


                        <div class="mb-3">

                            <span class="text-muted">
                                Faculty:
                            </span>

                            <strong>
                                ${facultyCount}
                            </strong>

                        </div>


                        <button
                            type="button"
                            class="btn btn-success w-100"
                            style="color: white !important;"
                            onclick="viewDepartmentFaculty('${department.department_code}')"
                        >
                            <i class="bi bi-eye me-1"></i>
                            View Details
                        </button>

                    </div>

                </div>

            </div>

        `;

    });

}


// ============================================================
// VIEW PARTICULAR DEPARTMENT FACULTY
// ============================================================

function viewDepartmentFaculty(departmentCode) {

    selectedDepartmentCode = departmentCode;

    displayDepartmentFaculty(departmentCode);

}


// ============================================================
// DISPLAY FACULTY OF SELECTED DEPARTMENT
// ============================================================

function displayDepartmentFaculty(departmentCode) {

    const container =
        document.getElementById("facultyDepartmentCards");

    if (!container) {
        return;
    }


    const department = departments.find(
        dept =>
            dept.department_code === departmentCode
    );


    if (!department) {
        return;
    }


    /*
     * Get only faculty belonging to selected department
     */
    const departmentFaculty = faculties.filter(
        faculty =>
            faculty.department_code === departmentCode
    );


    container.innerHTML = `

        <div class="col-12">

            <div class="d-flex justify-content-between align-items-center mb-3">

                <div>

                    <button
                        type="button"
                        class="btn btn-success btn-sm mb-2"
                        style="color: white !important;"
                        onclick="displayDepartmentCards()"
                    >
                        <i class="bi bi-arrow-left"></i>
                        Back to Departments
                    </button>

                    <h5 class="mb-1">

                        ${department.department_code}
                        Faculty

                    </h5>

                    <p class="text-muted mb-0">

                        ${department.department_name}

                    </p>

                </div>

            </div>


            <div class="card shadow-sm">

                <div class="card-body">

                    <div
                        class="d-flex justify-content-between align-items-center mb-3"
                    >

                        <div>

                            <strong>
                                Faculty Members
                            </strong>

                            <span class="badge bg-success ms-2">
                                ${departmentFaculty.length}
                            </span>

                        </div>


                        <input
                            type="text"
                            id="departmentFacultySearch"
                            class="form-control"
                            style="max-width:300px;"
                            placeholder="Search Faculty"
                            onkeyup="searchDepartmentFaculty()"
                        >

                    </div>


                    <div class="table-responsive">

                        <table class="table table-hover table-bordered">

                            <thead class="table-success">

                                <tr>

                                    <th>ID</th>
                                    <th>Faculty Name</th>
                                    <th>Designation</th>
                                    <th>Workload</th>
                                    <th>Status</th>
                                    <th style="width:150px;">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody id="departmentFacultyTableBody">

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>

    `;


    renderDepartmentFacultyTable(
        departmentCode,
        departmentFaculty
    );

}


// ============================================================
// RENDER SELECTED DEPARTMENT FACULTY TABLE
// ============================================================

function renderDepartmentFacultyTable(
    departmentCode,
    departmentFaculty
) {

    const tableBody =
        document.getElementById(
            "departmentFacultyTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (departmentFaculty.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center text-muted py-4"
                >

                    No faculty found for
                    ${departmentCode}.

                </td>

            </tr>

        `;

        return;

    }


    departmentFaculty.forEach(faculty => {

        /*
         * Find original index from global faculties array.
         * This is important for Edit/Delete.
         */
        const originalIndex =
            faculties.findIndex(
                item =>
                    item.faculty_id === faculty.faculty_id
            );


        const statusClass =
            faculty.status === "Active"
                ? "bg-success"
                : "bg-secondary";


        tableBody.innerHTML += `

            <tr>

                <td>
                    ${faculty.faculty_id}
                </td>


                <td>
                    ${faculty.faculty_name}
                </td>


                <td>
                    ${faculty.designation}
                </td>


                <td>
                    ${faculty.max_workload}
                </td>


                <td>

                    <span class="badge ${statusClass}">
                        ${faculty.status}
                    </span>

                </td>


                <td>
                    <div class="faculty-action-buttons">

                        <button
                            type="button"
                            class="btn-edit"
                            onclick="editFaculty(${originalIndex})"
                        >
                            <i class="bi bi-pencil"></i> Edit
                        </button>

                        <button
                            type="button"
                            class="btn-delete"
                            onclick="deleteFaculty(${originalIndex})"
                        >
                            <i class="bi bi-trash"></i> Delete
                        </button>

                    </div>
                </td>

            </tr>

        `;

    });

}


// ============================================================
// SEARCH FACULTY INSIDE SELECTED DEPARTMENT
// ============================================================

function searchDepartmentFaculty() {

    const searchInput =
        document.getElementById(
            "departmentFacultySearch"
        );


    if (!searchInput) {
        return;
    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const departmentFaculty =
        faculties.filter(faculty =>

            faculty.department_code ===
                selectedDepartmentCode &&

            (
                faculty.faculty_name
                    .toLowerCase()
                    .includes(search)

                ||

                faculty.designation
                    .toLowerCase()
                    .includes(search)

                ||

                faculty.status
                    .toLowerCase()
                    .includes(search)
            )

        );


    renderDepartmentFacultyTable(
        selectedDepartmentCode,
        departmentFaculty
    );

}


// ============================================================
// SAVE FACULTY
// ============================================================

async function saveFaculty() {

    const name =
        document
            .getElementById("facultyName")
            .value
            .trim();


    const department =
        document
            .getElementById("facultyDepartment")
            .value;


    const designation =
        document
            .getElementById("facultyDesignation")
            .value;


    const workload =
        document
            .getElementById("facultyWorkload")
            .value;


    const status =
        document
            .getElementById("facultyStatus")
            .value;


    /*
     * Validation
     */
    if (
        name === "" ||
        department === "" ||
        designation === "" ||
        workload === ""
    ) {

        alert("Please fill all fields.");

        return;

    }


    /*
     * Duplicate faculty name check
     */
    const duplicate =
        faculties.some(
            (faculty, index) =>

                faculty.faculty_name
                    .toLowerCase() ===
                    name.toLowerCase()

                &&

                index !== editIndex

        );


    if (duplicate) {

        alert("Faculty already exists.");

        return;

    }


    const facultyData = {

        faculty_name: name,

        department: department,

        designation: designation,

        max_workload: workload,

        status: status

    };


    try {

        let response;


        /*
         * ADD
         */
        if (editFacultyId === null) {

            response = await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            facultyData
                        )
                }
            );

        }

        /*
         * UPDATE
         */
        else {

            response = await fetch(
                `${API_URL}/${editFacultyId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            facultyData
                        )
                }
            );

        }


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Operation failed."
            );

            return;

        }


        alert(
            result.message ||
            "Faculty saved successfully."
        );


        /*
         * Reload faculty
         */
        await fetchFaculties();


        editFacultyId = null;
        editIndex = -1;


        resetFacultyForm();


        /*
         * Close modal
         */
        const modal =
            bootstrap.Modal.getInstance(
                document.getElementById(
                    "facultyModal"
                )
            );


        if (modal) {

            modal.hide();

        }


        /*
         * If viewing a department,
         * stay on that department.
         */
        if (selectedDepartmentCode) {

            displayDepartmentFaculty(
                selectedDepartmentCode
            );

        }

    }

    catch (error) {

        console.error(
            "Save faculty error:",
            error
        );

        alert(
            "Unable to save faculty."
        );

    }

}


// ============================================================
// EDIT FACULTY
// ============================================================

function editFaculty(index) {

    const faculty =
        faculties[index];


    if (!faculty) {

        alert("Faculty not found.");

        return;

    }


    editIndex = index;

    editFacultyId =
        faculty.faculty_id;


    document
        .getElementById("facultyName")
        .value =
        faculty.faculty_name;


    document
        .getElementById("facultyDepartment")
        .value =
        faculty.department_code;


    document
        .getElementById("facultyDesignation")
        .value =
        faculty.designation;


    document
        .getElementById("facultyWorkload")
        .value =
        faculty.max_workload;


    document
        .getElementById("facultyStatus")
        .value =
        faculty.status;


    document
        .querySelector(
            "#facultyModal .btn-primary"
        )
        .textContent =
        "Update Faculty";


    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "facultyModal"
            )
        );


    modal.show();

}


// ============================================================
// RESET FACULTY FORM
// ============================================================

function resetFacultyForm() {

    editFacultyId = null;

    editIndex = -1;


    document
        .getElementById("facultyName")
        .value = "";


    document
        .getElementById("facultyDepartment")
        .value = "";


    document
        .getElementById("facultyDesignation")
        .value = "";


    document
        .getElementById("facultyWorkload")
        .value = "";


    document
        .getElementById("facultyStatus")
        .value =
        "Active";


    document
        .querySelector(
            "#facultyModal .btn-primary"
        )
        .textContent =
        "Save Faculty";

}


// ============================================================
// DELETE FACULTY
// ============================================================

async function deleteFaculty(index) {

    const faculty =
        faculties[index];


    if (!faculty) {

        alert("Faculty not found.");

        return;

    }


    const confirmDelete =
        confirm(
            `Are you sure you want to delete ${faculty.faculty_name}?`
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/${faculty.faculty_id}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Unable to delete faculty."
            );

            return;

        }


        alert(
            result.message ||
            "Faculty deleted successfully."
        );


        await fetchFaculties();


        /*
         * Stay inside selected department
         */
        if (selectedDepartmentCode) {

            displayDepartmentFaculty(
                selectedDepartmentCode
            );

        }

    }

    catch (error) {

        console.error(
            "Delete faculty error:",
            error
        );

        alert(
            "Unable to delete faculty."
        );

    }

}


// ============================================================
// AUTOMATIC WORKLOAD
// ============================================================

document
    .getElementById("facultyDesignation")
    .addEventListener(
        "change",
        function () {

            const designation =
                this.value;


            const workload =
                document.getElementById(
                    "facultyWorkload"
                );


            switch (designation) {

                case "Assistant Professor":

                    workload.value = 18;

                    break;


                case "Associate Professor":

                    workload.value = 16;

                    break;


                case "Professor":

                    workload.value = 16;

                    break;


                case "HOD":

                    workload.value = 12;

                    break;


                case "Principal":

                    workload.value = 6;

                    break;


                default:

                    workload.value = "";

            }

        }
    );


// ============================================================
// INITIAL LOAD
// ============================================================

async function initializeFacultyPage() {

    await fetchDepartments();

    await fetchFaculties();

}


// Start page

initializeFacultyPage();