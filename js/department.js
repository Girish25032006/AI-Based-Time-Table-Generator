const API_URL = "http://127.0.0.1:5000/departments";

let departments = [];
let editIndex = -1;
let updateMode = false;


// ==========================================
// LOAD DEPARTMENTS
// ==========================================

function loadDepartments() {

    const container = document.getElementById("departmentTableBody");

    container.innerHTML = "";

    departments.forEach((department, index) => {

        container.innerHTML += `

            <div class="department-box">

                <div class="department-icon">

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round">

                        <path d="M3 21h18"></path>
                        <path d="M5 21V5l7-3 7 3v16"></path>

                        <path d="M9 9h1"></path>
                        <path d="M14 9h1"></path>

                        <path d="M9 13h1"></path>
                        <path d="M14 13h1"></path>

                        <path d="M9 17h1"></path>
                        <path d="M14 17h1"></path>

                    </svg>

                </div>


                <div class="department-info">

                    <div class="department-code">
                        ${department.department_code}
                    </div>

                    <div class="department-name">
                        ${department.department_name}
                    </div>

                </div>


                <div class="department-actions">

                    <button
                        class="edit-btn"
                        onclick="editDepartment(${index})">

                        Edit

                    </button>


                    <button
                        class="delete-btn"
                        onclick="deleteDepartment(${index})">

                        Delete

                    </button>

                </div>

            </div>

        `;
    });

    updateDepartmentButtons();
}


// ==========================================
// FETCH DEPARTMENTS FROM DATABASE
// ==========================================

async function fetchDepartments() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load departments");
        }

        departments = await response.json();

        loadDepartments();

    } catch (error) {

        console.error("Error loading departments:", error);

    }

}


// ==========================================
// SEARCH DEPARTMENT
// ==========================================

document
    .getElementById("searchDepartment")
    .addEventListener("input", function () {

        const searchValue = this.value
            .toLowerCase()
            .trim();

        const boxes =
            document.querySelectorAll(".department-box");


        boxes.forEach(box => {

            const text =
                box.textContent.toLowerCase();

            if (text.includes(searchValue)) {

                box.style.display = "";

            } else {

                box.style.display = "none";

            }

        });

    });


// ==========================================
// UPDATE / SAVE MODE
// ==========================================

const updateDepartmentButton =
    document.getElementById("updateDepartment");


function updateDepartmentButtons() {

    const editButtons =
        document.querySelectorAll(".edit-btn");

    const deleteButtons =
        document.querySelectorAll(".delete-btn");


    editButtons.forEach(button => {

        button.style.display =
            updateMode ? "inline-flex" : "none";

    });


    deleteButtons.forEach(button => {

        button.style.display =
            updateMode ? "inline-flex" : "none";

    });

}


// ==========================================
// UPDATE BUTTON
// ==========================================

updateDepartmentButton.addEventListener(
    "click",
    function () {

        updateMode = !updateMode;


        if (updateMode) {

            this.textContent = "Save";

        } else {

            this.textContent = "Update";

        }


        updateDepartmentButtons();

    }
);


// ==========================================
// SAVE DEPARTMENT
// ==========================================

document
    .getElementById("saveDepartment")
    .addEventListener("click", async function () {

        const departmentCode =
            document
                .getElementById("departmentCode")
                .value
                .trim()
                .toUpperCase();


        const departmentName =
            document
                .getElementById("departmentName")
                .value
                .trim();


        if (
            departmentCode === "" ||
            departmentName === ""
        ) {

            alert("Please fill all fields.");

            return;
        }


        // Check duplicate
        const duplicate =
            departments.some((dept, index) => {

                return (

                    (
                        dept.department_code
                            ?.toLowerCase() ===
                        departmentCode.toLowerCase()

                    ||

                        dept.department_name
                            ?.toLowerCase() ===
                        departmentName.toLowerCase()
                    )

                    && index !== editIndex

                );

            });


        if (duplicate) {

            alert("Department already exists.");

            return;
        }


        try {

            // ==================================
            // ADD
            // ==================================

            if (editIndex === -1) {

                await fetch(API_URL, {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        department_code:
                            departmentCode,

                        department_name:
                            departmentName

                    })

                });

            }


            // ==================================
            // EDIT
            // ==================================

            else {

                await fetch(
                    `${API_URL}/${departments[editIndex].department_id}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            department_code:
                                departmentCode,

                            department_name:
                                departmentName

                        })

                    }
                );

            }


            // Reset
            editIndex = -1;


            // Reload database data
            await fetchDepartments();


            // Clear fields
            document
                .getElementById("departmentCode")
                .value = "";

            document
                .getElementById("departmentName")
                .value = "";


            // Close modal
            const modal =
                bootstrap.Modal.getInstance(
                    document.getElementById(
                        "departmentModal"
                    )
                );


            if (modal) {
                modal.hide();
            }


        } catch (error) {

            console.error(
                "Error saving department:",
                error
            );

            alert(
                "Unable to save department."
            );

        }

    });


// ==========================================
// EDIT DEPARTMENT
// ==========================================

function editDepartment(index) {

    editIndex = index;


    document
        .getElementById("departmentCode")
        .value =
        departments[index].department_code;


    document
        .getElementById("departmentName")
        .value =
        departments[index].department_name;


    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "departmentModal"
            )
        );


    modal.show();

}


// ==========================================
// DELETE DEPARTMENT
// ==========================================

async function deleteDepartment(index) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this department?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await fetch(
            `${API_URL}/${departments[index].department_id}`,
            {
                method: "DELETE"
            }
        );


        await fetchDepartments();


    } catch (error) {

        console.error(
            "Error deleting department:",
            error
        );

        alert(
            "Unable to delete department."
        );

    }

}


// ==========================================
// INITIAL LOAD
// ==========================================

fetchDepartments();