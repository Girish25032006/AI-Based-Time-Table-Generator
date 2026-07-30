const API_URL = "http://127.0.0.1:5000/faculties";
let departments = [];
let editFacultyId = null;
let faculties = [];
let editIndex = -1;

async function fetchDepartments() {

    const response = await fetch("http://127.0.0.1:5000/departments");

    departments = await response.json();

    loadDepartmentDropdown();

}
function loadDepartmentDropdown() {

    

    const dropdown =
        document.getElementById("facultyDepartment");

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

fetchDepartments();

async function fetchFaculties() {

    try {

        const response = await fetch(API_URL);

        const data = await response.json();

        faculties = data;

        displayFaculties();

    } catch (error) {

        alert(error);

    }

}

function displayFaculties() {
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
        !faculty.faculty_name.toLowerCase().includes(search) &&
        !faculty.department_code.toLowerCase().includes(search) &&
        !faculty.designation.toLowerCase().includes(search)
        
    ) {

        return;

    }

        table.innerHTML += `
            <tr>

                <td>${faculty.faculty_id}</td>
                <td>${faculty.faculty_name}</td>

                <td>${faculty.department_code}</td>
                <td>${faculty.designation}</td>

                

                <td>${faculty.max_workload}</td>

                
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
fetchFaculties();

async function saveFaculty() {
    

    const name = document.getElementById("facultyName").value.trim();
    const department = document.getElementById("facultyDepartment").value;
    const designation = document.getElementById("facultyDesignation").value;
    const workload = document.getElementById("facultyWorkload").value;
    const status = document.getElementById("facultyStatus").value;
    const facultyData = {

    faculty_name: name,
    department: department,
    designation: designation,
    max_workload: workload,
    status: status

    };
    console.log({
        name,
        department,
        designation,
        workload,
        status
    });

    if (
        name === "" ||
        department === "" ||
        designation === "" ||
        workload === ""
    ) {

        alert("Please fill all fields.");

        return;
    }

    const duplicate = faculties.some((faculty, index) =>

        faculty.faculty_name.toLowerCase()=== name.toLowerCase()&&
        index !== editIndex

    );

    if (duplicate) {

        alert("Faculty already exists.");

        return;

    }
    
    let response;

    if (editFacultyId === null) {

        response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(facultyData)
        });

    } else {

        response = await fetch(`${API_URL}/${editFacultyId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(facultyData)
        });
        
        editFacultyId = null;

    }
    console.log(response.status);

    const result = await response.json();


    alert(result.message);

    await fetchFaculties();

    editFacultyId = null;
    editIndex = -1;

    resetFacultyForm();

    const modal = bootstrap.Modal.getInstance(
        document.getElementById("facultyModal")
    );

    if (modal) modal.hide();
}

function editFaculty(index) {

    editIndex = index;

    const faculty = faculties[index];
    editFacultyId = faculty.faculty_id;

    document.getElementById("facultyName").value = faculty.faculty_name;

    document.getElementById("facultyDepartment").value = faculty.department_code;
    

    

    document.getElementById("facultyDesignation").value =
        faculty.designation;

    document.getElementById("facultyWorkload").value = faculty.max_workload;

   
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
    
    document.getElementById("facultyStatus").value = "Active";

    

    document.querySelector("#facultyModal .btn-primary").textContent =
        "Save Faculty";

}

async function deleteFaculty(index) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this faculty?"
    );

    if (!confirmDelete) {
        return;
    }

    const faculty = faculties[index];

    const response = await fetch(
        `${API_URL}/${faculty.faculty_id}`,
        {
            method: "DELETE"
        }
    );

    const result = await response.json();

    alert(result.message);

    await fetchFaculties();
}
document
    .getElementById("searchFaculty")
    .addEventListener("keyup", displayFaculties);



document
    .getElementById("facultyDesignation")
    .addEventListener("change", function () {

        const designation = this.value;
        const workload = document.getElementById("facultyWorkload");

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

    });