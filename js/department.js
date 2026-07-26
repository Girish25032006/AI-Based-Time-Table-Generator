// Store departments
const API_URL = "http://127.0.0.1:5000/departments";
let departments = [];

// Used while editing
let editIndex = -1;

// Sample Data


    

// Display table
function loadDepartments() {

    const tableBody = document.getElementById("departmentTableBody");

    tableBody.innerHTML = "";

    departments.forEach((department, index) => {

       tableBody.innerHTML += `
<tr>

    <td>${department.department_id}</td>

    <td>${department.department_code}</td>

    <td>${department.department_name}</td>

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


// Save Department
document.getElementById("saveDepartment").addEventListener("click", async function () {
    console.log("Save button clicked");
    const departmentCode = document.getElementById("departmentCode").value.trim().toUpperCase();
    const departmentName = document.getElementById("departmentName").value.trim();

    if (departmentCode === "" || departmentName === "") {

    alert("Please fill all fields.");

    return;

}

   const duplicate = departments.some((dept, index) =>

(
    dept.department_code?.toLowerCase() === departmentCode.toLowerCase() ||
    dept.department_name.toLowerCase() === departmentName.toLowerCase()
)

&& index !== editIndex

);

    if (duplicate) {
        alert("Department already exists.");
        return;
    }

    if (editIndex === -1) {

    await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            department_code: departmentCode,
            department_name: departmentName
        })
    });

    await fetchDepartments();

} else {

    await fetch(`${API_URL}/${departments[editIndex].department_id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            department_code: departmentCode,
            department_name: departmentName
        })
    });

    editIndex = -1;

    await fetchDepartments();

}

    await fetchDepartments();
    document.getElementById("departmentCode").value = "";
    document.getElementById("departmentName").value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById("departmentModal"));
    if (modal) modal.hide();

});
function editDepartment(index) {

    editIndex = index;

    document.getElementById("departmentCode").value =
        departments[index].department_code;

    document.getElementById("departmentName").value =
        departments[index].department_name;

    const modal = new bootstrap.Modal(
        document.getElementById("departmentModal")
    );

    modal.show();

}

async function deleteDepartment(index) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this department?"
    );

    if (!confirmDelete) {
        return;
    }

    await fetch(`${API_URL}/${departments[index].department_id}`, {
        method: "DELETE"
    });

    await fetchDepartments();

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
async function fetchDepartments() {

    const response = await fetch(API_URL);

    departments = await response.json();

    loadDepartments();

}
fetchDepartments();