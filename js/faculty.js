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

    dropdown.innerHTML = `
        <option value="">Select Department</option>
    `;

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

        if (selectedDepartmentCode) {

            displayDepartmentFaculty(
                selectedDepartmentCode
            );

        } else {

            displayDepartmentCards();

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

    const departmentView =
        document.getElementById("facultyDepartmentView");

    if (!container) {
        return;
    }

    selectedDepartmentCode = null;

    container.style.display = "";

    if (departmentView) {
        departmentView.style.display = "none";
    }

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

        const facultyCount =
            faculties.filter(
                faculty =>
                    faculty.department_code ===
                    department.department_code
            ).length;


        container.innerHTML += `

            <div class="col-md-6 col-lg-4">

                <div class="card h-100 shadow-sm border">

                    <div class="card-body">

                        <div class="d-flex align-items-center mb-3">

                            <div
                                class="rounded p-3 me-3"
                                style="
                                    background-color:#e8f5ee;
                                    color:#087f3f;
                                "
                            >

                                <i class="bi bi-building fs-3"></i>

                            </div>

                            <div>

                                <h5
                                    class="mb-1"
                                    style="color:#087f3f;"
                                >
                                    ${escapeHtml(
                                        department.department_code
                                    )}
                                </h5>

                                <small class="text-muted">
                                    ${escapeHtml(
                                        department.department_name
                                    )}
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
                            onclick="viewDepartmentFaculty(
                                '${escapeJs(
                                    department.department_code
                                )}'
                            )"
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
// VIEW PARTICULAR DEPARTMENT
// ============================================================

function viewDepartmentFaculty(departmentCode) {

    selectedDepartmentCode =
        departmentCode;

    displayDepartmentFaculty(
        departmentCode
    );

}


// ============================================================
// DISPLAY FACULTY OF SELECTED DEPARTMENT
// ============================================================

function displayDepartmentFaculty(departmentCode) {

    const cards =
        document.getElementById(
            "facultyDepartmentCards"
        );

    const departmentView =
        document.getElementById(
            "facultyDepartmentView"
        );

    if (!cards || !departmentView) {
        return;
    }


    const department =
        departments.find(
            dept =>
                dept.department_code ===
                departmentCode
        );


    if (!department) {
        return;
    }


    const departmentFaculty =
        faculties.filter(
            faculty =>
                faculty.department_code ===
                departmentCode
        );


    /*
     * Hide department cards.
     */
    cards.style.display = "none";


    /*
     * Show selected department view.
     */
    departmentView.style.display = "";


    /*
     * Update department information.
     */
    document.getElementById(
        "selectedDepartmentTitle"
    ).textContent =
        `${department.department_code} Faculty`;


    document.getElementById(
        "selectedDepartmentDescription"
    ).textContent =
        department.department_name;


    document.getElementById(
        "selectedFacultyCount"
    ).textContent =
        departmentFaculty.length;


    /*
     * Clear search.
     */
    const search =
        document.getElementById(
            "facultySearch"
        );

    if (search) {
        search.value = "";
    }


    renderDepartmentFacultyTable(
        departmentFaculty
    );

}


// ============================================================
// SHOW ALL DEPARTMENTS
// ============================================================

function showFacultyDepartments() {

    selectedDepartmentCode = null;

    const departmentView =
        document.getElementById(
            "facultyDepartmentView"
        );

    const cards =
        document.getElementById(
            "facultyDepartmentCards"
        );

    if (departmentView) {
        departmentView.style.display = "none";
    }

    if (cards) {
        cards.style.display = "";
    }

    displayDepartmentCards();

}


// ============================================================
// RENDER FACULTY TABLE
// ============================================================

function renderDepartmentFacultyTable(
    departmentFaculty
) {

    const tableBody =
        document.getElementById(
            "facultyTableBody"
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

                    No faculty found.

                </td>

            </tr>

        `;

        return;
    }


    departmentFaculty.forEach(faculty => {

        const originalIndex =
            faculties.findIndex(
                item =>
                    item.faculty_id ===
                    faculty.faculty_id
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
                    ${escapeHtml(
                        faculty.faculty_name
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        faculty.designation
                    )}
                </td>


                <td>
                    ${faculty.max_workload ?? 0}
                </td>


                <td>

                    <span class="badge ${statusClass}">
                        ${escapeHtml(
                            faculty.status || "Active"
                        )}
                    </span>

                </td>


                <td class="faculty-action-cell">

                    <div class="faculty-action-buttons">

                        <!-- EDIT -->

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-success"
                            onclick="editFaculty(${originalIndex})"
                        >

                            <i class="bi bi-pencil"></i>
                            Edit

                        </button>


                        <!-- DELETE -->

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            onclick="deleteFaculty(${originalIndex})"
                        >

                            <i class="bi bi-trash"></i>
                            Delete

                        </button>


                        <!-- VIEW DETAILS -->

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            onclick="viewFacultyDetails(
                                ${faculty.faculty_id}
                            )"
                        >

                            <i class="bi bi-eye"></i>
                            View Details

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}


// ============================================================
// SEARCH FACULTY
// ============================================================

function searchFaculty() {

    if (!selectedDepartmentCode) {
        return;
    }


    const searchInput =
        document.getElementById(
            "facultySearch"
        );


    if (!searchInput) {
        return;
    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const filteredFaculty =
        faculties.filter(faculty => {

            if (
                faculty.department_code !==
                selectedDepartmentCode
            ) {
                return false;
            }


            return (

                String(
                    faculty.faculty_id
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    faculty.faculty_name || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    faculty.designation || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    faculty.status || ""
                )
                .toLowerCase()
                .includes(search)

            );

        });


    renderDepartmentFacultyTable(
        filteredFaculty
    );

}


// ============================================================
// VIEW FACULTY DETAILS
// ============================================================

function viewFacultyDetails(facultyId) {

    if (!facultyId) {
        return;
    }


    window.location.href =
        `faculty-details.html?faculty_id=${facultyId}`;

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
     * Duplicate faculty name
     * within same department.
     */
    const duplicate =
        faculties.some(
            (faculty, index) =>

                faculty.faculty_name
                    .toLowerCase() ===
                name.toLowerCase()

                &&

                faculty.department_code ===
                department

                &&

                index !== editIndex
        );


    if (duplicate) {

        alert(
            "Faculty already exists in this department."
        );

        return;

    }


    const facultyData = {

        faculty_name: name,

        department: department,

        designation: designation,

        max_workload: Number(workload),

        status: status

    };


    try {

        let response;


        /*
         * ADD
         */

        if (editFacultyId === null) {

            response =
                await fetch(
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

            response =
                await fetch(
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


        editFacultyId = null;

        editIndex = -1;


        resetFacultyForm();


        const modal =
            bootstrap.Modal.getInstance(
                document.getElementById(
                    "facultyModal"
                )
            );


        if (modal) {
            modal.hide();
        }


        await fetchFaculties();


        /*
         * Stay on same department
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


    document.getElementById(
        "facultyName"
    ).value =
        faculty.faculty_name || "";


    document.getElementById(
        "facultyDepartment"
    ).value =
        faculty.department_code || "";


    document.getElementById(
        "facultyDesignation"
    ).value =
        faculty.designation || "";


    /*
     * Recalculate workload based
     * on designation.
     */
    updateFacultyWorkload();


    document.getElementById(
        "facultyStatus"
    ).value =
        faculty.status || "Active";


    const title =
        document.getElementById(
            "facultyModalTitle"
        );


    if (title) {

        title.textContent =
            "Edit Faculty";

    }


    const saveButton =
        document.querySelector(
            "#facultyModal .modal-footer .btn-primary"
        );


    if (saveButton) {

        saveButton.innerHTML = `
            <i class="bi bi-check-circle"></i>
            Update Faculty
        `;

    }


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


    const name =
        document.getElementById(
            "facultyName"
        );

    const department =
        document.getElementById(
            "facultyDepartment"
        );

    const designation =
        document.getElementById(
            "facultyDesignation"
        );

    const workload =
        document.getElementById(
            "facultyWorkload"
        );

    const status =
        document.getElementById(
            "facultyStatus"
        );


    if (name) {
        name.value = "";
    }

    if (department) {
        department.value = "";
    }

    if (designation) {
        designation.value = "";
    }

    if (workload) {
        workload.value = "";
    }

    if (status) {
        status.value = "Active";
    }


    const title =
        document.getElementById(
            "facultyModalTitle"
        );


    if (title) {

        title.textContent =
            "Add Faculty";

    }


    const saveButton =
        document.querySelector(
            "#facultyModal .modal-footer .btn-primary"
        );


    if (saveButton) {

        saveButton.innerHTML = `
            <i class="bi bi-check-circle"></i>
            Save Faculty
        `;

    }

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
// WORKLOAD CALCULATION
// ============================================================

function getWorkloadForDesignation(designation) {

    if (!designation) {
        return "";
    }

    const value = designation
        .toLowerCase()
        .trim();

    // Principal → 6 hours
    if (value.includes("principal")) {
        return 6;
    }

    // HOD / Head → 12 hours
    if (
        value.includes("hod") ||
        value.includes("head")
    ) {
        return 12;
    }

    // Assistant Professor → 18 hours
    if (value.includes("assistant professor")) {
        return 18;
    }

    // Associate Professor → 16 hours
    if (value.includes("associate professor")) {
        return 16;
    }

    // Professor → 16 hours
    if (value.includes("professor")) {
        return 16;
    }

    return "";
}


// ============================================================
// UPDATE WORKLOAD IN FORM
// ============================================================

function updateFacultyWorkload() {

    const designation =
        document.getElementById(
            "facultyDesignation"
        );


    const workload =
        document.getElementById(
            "facultyWorkload"
        );


    if (!designation || !workload) {
        return;
    }


    workload.value =
        getWorkloadForDesignation(
            designation.value
        );

}


// ============================================================
// DESIGNATION CHANGE
// ============================================================

const designationSelect =
    document.getElementById(
        "facultyDesignation"
    );


if (designationSelect) {

    designationSelect.addEventListener(
        "change",
        updateFacultyWorkload
    );

}


// ============================================================
// IMPORT FACULTY
// ============================================================

function openFacultyImport() {

    const fileInput =
        document.getElementById(
            "facultyImportFile"
        );


    if (!fileInput) {

        alert(
            "Faculty import input not found."
        );

        return;

    }


    fileInput.value = "";

    fileInput.click();

}


// ============================================================
// HANDLE FACULTY IMPORT
// ============================================================

async function handleFacultyImport(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    /*
     * Accepted file types
     */

    const allowedExtensions = [
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx"
    ];


    const fileName =
        file.name.toLowerCase();


    const validFile =
        allowedExtensions.some(
            extension =>
                fileName.endsWith(extension)
        );


    if (!validFile) {

        alert(
            "Please select a supported faculty file."
        );

        return;

    }


    /*
     * IMPORTANT:
     *
     * Backend import endpoint will be connected
     * when we update the backend.
     */

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    try {

        /*
         * Faculty import endpoint.
         *
         * We will verify/update this when
         * you send the backend file.
         */

        const response =
            await fetch(
                "http://127.0.0.1:5000/faculties/import",
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Faculty import failed."
            );

            return;

        }


        alert(
            result.message ||
            "Faculty imported successfully."
        );


        await fetchFaculties();


        if (selectedDepartmentCode) {

            displayDepartmentFaculty(
                selectedDepartmentCode
            );

        }

    }

    catch (error) {

        console.error(
            "Faculty import error:",
            error
        );


        alert(
            "Unable to import faculty. Backend import API will be connected after backend implementation."
        );

    }

}


// ============================================================
// HTML SAFETY
// ============================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// JAVASCRIPT STRING SAFETY
// ============================================================

function escapeJs(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');

}


// ============================================================
// INITIALIZE FACULTY PAGE
// ============================================================

async function initializeFacultyPage() {

    await fetchDepartments();

    await fetchFaculties();

}


// ============================================================
// START
// ============================================================

initializeFacultyPage();