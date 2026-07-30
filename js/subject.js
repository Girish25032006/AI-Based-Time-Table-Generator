const API_URL = "http://127.0.0.1:5000/subjects";

let subjects = [];
let departments = [];
let schemes = [];

let editIndex = -1;
let editSubjectId = null;
async function fetchDepartments() {

    const response = await fetch("http://127.0.0.1:5000/departments");
    departments = await response.json();

    loadDepartmentDropdown();
    loadDepartmentFilter();

}


async function fetchSchemes() {

    const response = await fetch("http://127.0.0.1:5000/schemes");
    schemes = await response.json();

    loadSchemeDropdown();
    loadSchemeFilter();

}
async function fetchSubjects() {

    try {

        const response = await fetch(API_URL);

        const data = await response.json();

        

        subjects = data;

        loadSubjects();
        filterSubjects();

    } catch (error) {

        alert(error);

    }

}
function loadSubjects(){

const table=document.getElementById("subjectTableBody");

table.innerHTML="";
if (subjects.length === 0) {

    table.innerHTML = `
        <tr>
            <td colspan="10" class="text-center text-danger">
                No subjects found.
            </td>
        </tr>
    `;

    return;
}

subjects.forEach((subject,index)=>{

table.innerHTML+=`

<tr>

<td>${subject.subject_id}</td>

<td>${subject.subject_code}</td>

<td>${subject.subject_name}</td>

<td>${subject.department_code}</td>

<td>${subject.scheme_year}</td>

<td>${subject.semester_no}</td>

<td>${subject.credits}</td>

<td>${subject.lecture_hours}</td>

<td>${subject.tutorial_hours}</td>

<td>${subject.practical_hours}</td>

<td>${subject.cycle ?? "-"}</td>

<td>${subject.is_optional ? "Yes" : "No"}</td>

<td>

<button
class="btn btn-warning btn-sm"
onclick="editSubject(${index})">

Edit

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteSubject(${index})">

Delete

</button>

</td>

</tr>

`;

});

}

document.getElementById("saveSubject").addEventListener("click", async function () {

    const department = document.getElementById("department").value;
    const scheme = document.getElementById("scheme").value;
    const semester = document.getElementById("semester").value;
    const code = document.getElementById("subjectCode").value.trim();
    const name = document.getElementById("subjectName").value.trim();
    const credits = document.getElementById("credits").value;
    const lectureHours = document.getElementById("lectureHours").value;
    const tutorialHours = document.getElementById("tutorialHours").value;
    const practicalHours = document.getElementById("practicalHours").value;
    const cycle = document.getElementById("cycleField").style.display === "none"
    ? null
    : document.getElementById("cycle").value;
    const isOptional = document.getElementById("isOptional").value;
    const groupId = document.getElementById("groupId").value;
    const optionGroupId = document.getElementById("optionGroupId").value;

    
    if (
        department === "" ||
        scheme === "" ||
        semester === "" ||
        code === "" ||
        name === "" ||
        credits === "" ||
        lectureHours === "" ||
        tutorialHours === "" ||
        practicalHours === ""
    ) {
        alert("Please fill all fields.");
        return;
    }
    const subjectData = {
    department,
    scheme,
    semester,
    subject_code: code,
    subject_name: name,
    credits,
    lecture_hours: lectureHours,
    tutorial_hours: tutorialHours,
    practical_hours: practicalHours,
    cycle,
    group_id: groupId === "" ? 1 : groupId,
    is_optional: isOptional,
    option_group_id: optionGroupId || null
};
alert("Cycle value = " + cycle);
let response;

if (editSubjectId === null) {

    response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(subjectData)
    });

} else {

    response = await fetch(`${API_URL}/${editSubjectId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(subjectData)
    });

    editSubjectId = null;
}

const result = await response.json();

alert(result.message);

await fetchSubjects();

editSubjectId = null;
editIndex = -1;
resetSubjectForm();

filterSubjects();

    document.getElementById("subjectCode").value = "";
    document.getElementById("subjectName").value = "";
    document.getElementById("credits").value = "";
    document.getElementById("lectureHours").value = "";
    document.getElementById("tutorialHours").value = "";
    document.getElementById("practicalHours").value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById("subjectModal"));

    if (modal) modal.hide();

});
function resetSubjectForm() {

    editIndex = -1;

    document.getElementById("department").value = "";
    document.getElementById("scheme").value = "";
    document.getElementById("semester").value = "";
    document.getElementById("subjectCode").value = "";
    document.getElementById("subjectName").value = "";
    document.getElementById("credits").value = "";
    document.getElementById("lectureHours").value = "";
    document.getElementById("tutorialHours").value = "";
    document.getElementById("practicalHours").value = "";
    document.getElementById("cycle").value = "";
    document.getElementById("groupId").value = "";
    document.getElementById("isOptional").value = "0";
    document.getElementById("optionGroupId").value = "";

}
function editSubject(index) {

    editIndex = index;

    const subject = subjects[index];
    editSubjectId = subject.subject_id;

    document.getElementById("department").value = subject.department_code;
    document.getElementById("scheme").value = subject.scheme_year;
    document.getElementById("semester").value = subject.semester_no;
    document.getElementById("subjectCode").value = subject.subject_code;
    document.getElementById("subjectName").value = subject.subject_name;
    document.getElementById("credits").value = subject.credits;
    document.getElementById("lectureHours").value = subject.lecture_hours;
    document.getElementById("tutorialHours").value = subject.tutorial_hours;
    document.getElementById("practicalHours").value = subject.practical_hours;
    document.getElementById("cycle").value = subject.cycle;
    document.getElementById("isOptional").value = subject.is_optional;

    new bootstrap.Modal(
        document.getElementById("subjectModal")
    ).show();

}
async function deleteSubject(index) {

    if (!confirm("Are you sure you want to delete this subject?")) {
        return;
    }

    const subjectId = subjects[index].subject_id;

    const response = await fetch(`${API_URL}/${subjectId}`, {
        method: "DELETE"
    });

    const result = await response.json();

    alert(result.message);

    await fetchSubjects();
    filterSubjects();
}
// Search Subject
document.getElementById("searchSubject")
    .addEventListener("keyup", filterSubjects);
function filterSubjects() {

    const department = document.getElementById("filterDepartment")?.value || "";
    const scheme = document.getElementById("filterScheme")?.value || "";
    const semester = document.getElementById("filterSemester")?.value || "";
    const search = document.getElementById("searchSubject").value.toLowerCase();

    const rows = document.querySelectorAll("#subjectTableBody tr");

    rows.forEach(row => {

        const rowDepartment = row.cells[3].textContent.trim();
        const rowScheme = row.cells[4].textContent.trim();
        const rowSemester = row.cells[5].textContent.trim();
        

        const code = row.cells[1].textContent.toLowerCase();
        const name = row.cells[2].textContent.toLowerCase();

        const departmentMatch =
            department === "" || rowDepartment === department;

        const schemeMatch =
            scheme === "" || rowScheme === scheme;

        const semesterMatch =
            semester === "" || rowSemester === semester;

        const searchMatch =
            code.includes(search) || name.includes(search);

        if (
            departmentMatch &&
            schemeMatch &&
            semesterMatch &&
            searchMatch
        ) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });

}
function loadDepartmentFilter() {

    const filter = document.getElementById("filterDepartment");

    filter.innerHTML = `<option value="">All Departments</option>`;

    departments.forEach(department => {

        filter.innerHTML += `
            <option value="${department.department_code}">
                ${department.department_code}
            </option>
        `;

    });

}

function loadSchemeFilter() {

    const filter = document.getElementById("filterScheme");

    filter.innerHTML = `<option value="">All Schemes</option>`;

    schemes.forEach(scheme => {

        

        filter.innerHTML += `
            <option value="${scheme.scheme_year}">
                ${scheme.scheme_year}
            </option>
        `;

    });

}
function loadDepartmentDropdown() {

    const dropdown = document.getElementById("department");

    dropdown.innerHTML = `<option value="">Select Department</option>`;

    departments.forEach(department => {

        dropdown.innerHTML += `
            <option value="${department.department_code}">
                ${department.department_code}
            </option>
        `;

    });

}
function loadSchemeDropdown() {

    const dropdown = document.getElementById("scheme");

    dropdown.innerHTML = `<option value="">Select Scheme</option>`;

    schemes.forEach(scheme => {

       
        dropdown.innerHTML += `
            <option value="${scheme.scheme_year}">
                ${scheme.scheme_year}
            </option>
        `;

    });

}
fetchDepartments();
fetchSchemes();
fetchSubjects();

//loadDepartmentFilter();
//loadSchemeFilter();

//loadDepartmentDropdown();
//loadSchemeDropdown();

document.getElementById("filterDepartment")
    .addEventListener("change", filterSubjects);

document.getElementById("filterScheme")
    .addEventListener("change", filterSubjects);

document.getElementById("filterSemester")
    .addEventListener("change", filterSubjects);
const semesterDropdown = document.getElementById("semester");

semesterDropdown.addEventListener("change", function () {

    const semester = parseInt(this.value);

    if (semester === 1 || semester === 2) {
        document.getElementById("cycleField").style.display = "block";
    } else {
        document.getElementById("cycleField").style.display = "none";
        document.getElementById("cycle").value = "";
    }

});
document.getElementById("cycleField").style.display = "none";

document.getElementById("optionalField").style.display = "none";
document.getElementById("optionGroupField").style.display = "none";

semesterDropdown.addEventListener("change", function () {

    const semester = parseInt(this.value);

    if (semester >= 3) {
        document.getElementById("optionalField").style.display = "block";
    } else {
        document.getElementById("optionalField").style.display = "none";
        document.getElementById("optionGroupField").style.display = "none";
        document.getElementById("isOptional").value = "0";
        document.getElementById("optionGroupId").value = "";
    }

});

document.getElementById("isOptional").addEventListener("change", function () {

    if (this.value === "1") {
        document.getElementById("optionGroupField").style.display = "block";
    } else {
        document.getElementById("optionGroupField").style.display = "none";
        document.getElementById("optionGroupId").value = "";
    }

});
// Hide Group initially
document.getElementById("groupField").style.display = "none";

// Show/Hide Group based on Practical Hours
document.getElementById("practicalHours").addEventListener("input", function () {

    const practicalHours = parseInt(this.value) || 0;

    if (practicalHours > 0) {
        document.getElementById("groupField").style.display = "block";
    } else {
        document.getElementById("groupField").style.display = "none";
        document.getElementById("group").value = "";
    }

});