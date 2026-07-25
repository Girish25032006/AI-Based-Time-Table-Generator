// Store departments
let departments = JSON.parse(localStorage.getItem("departments")) || [];


// Used while editing
let editIndex = -1;

// Sample Data
if (departments.length === 0) {

    departments = [

        {
            id: 1,
            code: "CSE",
            name: "Computer Science & Engineering"
        },

        {
            id: 2,
            code: "AIML",
            name: "Artificial Intelligence & Machine Learning"
        },

        {
            id: 3,
            code: "ISE",
            name: "Information Science & Engineering"
        }

    ];

    localStorage.setItem(
        "departments",
        JSON.stringify(departments)
    );

}

// Display table
function loadDepartments() {

    const tableBody = document.getElementById("departmentTableBody");

    tableBody.innerHTML = "";

    departments.forEach((department, index) => {

        tableBody.innerHTML += `
        <tr>

            <td>${department.id}</td>

            <td>${department.name}</td>

            <td>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="editDepartment(${index})">

                    Edit

                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteDepartment(${index})">

                    Delete

                </button>

            </td>

        </tr>
        `;

    });

}

loadDepartments();
// Save Department
document.getElementById("saveDepartment").addEventListener("click", function () {

    const departmentName = document.getElementById("departmentName").value.trim();

    if (departmentName === "") {
        alert("Department name is required.");
        return;
    }

    const duplicate = departments.some((dept, index) =>
        dept.name.toLowerCase() === departmentName.toLowerCase() &&
        index !== editIndex
    );

    if (duplicate) {
        alert("Department already exists.");
        return;
    }

    if (editIndex === -1) {

        // Add
        const newId = departments.length > 0
            ? departments[departments.length - 1].id + 1
            : 1;

        departments.push({
            id: newId,
            name: departmentName
        });

    } else {

        // Update
        departments[editIndex].name = departmentName;
        editIndex = -1;

    }

    loadDepartments();

    localStorage.setItem(
        "departments",
        JSON.stringify(departments)
    );

    document.getElementById("departmentName").value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById("departmentModal"));
    if (modal) modal.hide();

});
function editDepartment(index) {

    editIndex = index;

    document.getElementById("departmentName").value =
        departments[index].name;

    const modal = new bootstrap.Modal(
        document.getElementById("departmentModal")
    );

    modal.show();

}

function deleteDepartment(index) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this department?"
    );

    if (!confirmDelete) {
        return;
    }

    departments.splice(index, 1);

    localStorage.setItem(
        "departments",
        JSON.stringify(departments)
    );

    loadDepartments();

}
document.getElementById("searchDepartment").addEventListener("keyup", function () {

    const searchValue = this.value.toLowerCase();

    const rows = document.querySelectorAll("#departmentTableBody tr");

    rows.forEach(row => {

        const text = row.textContent.toLowerCase();

        if (text.includes(searchValue)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });

});
