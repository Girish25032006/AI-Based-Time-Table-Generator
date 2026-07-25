let subjects = JSON.parse(localStorage.getItem("subjects")) || [];
const departments = JSON.parse(localStorage.getItem("departments")) || [];
const schemes = JSON.parse(localStorage.getItem("schemes")) || [];

let editIndex = -1;

if (subjects.length === 0) {

    subjects = [

        {
            id: 1,
            code: "BCS301",
            name: "Data Structures",
            department: "CSE",
            scheme: "2022",
            semester: "3",
            credits: 4,
            hours: 5,
            type: "Theory"
        },

        {
            id: 2,
            code: "BAI301",
            name: "Python Programming",
            department: "AIML",
            scheme: "2022",
            semester: "3",
            credits: 4,
            hours: 5,
            type: "Theory"
        }

    ];

    localStorage.setItem(
        "subjects",
        JSON.stringify(subjects)
    );

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

<td>${subject.id}</td>

<td>${subject.code}</td>

<td>${subject.name}</td>

<td>${subject.department}</td>

<td>${subject.scheme}</td>

<td>${subject.semester}</td>

<td>${subject.credits}</td>

<td>${subject.hours}</td>

<td>${subject.type}</td>

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

document.getElementById("saveSubject").addEventListener("click", function () {

    const department = document.getElementById("department").value;
    const scheme = document.getElementById("scheme").value;
    const semester = document.getElementById("semester").value;
    const code = document.getElementById("subjectCode").value.trim();
    const name = document.getElementById("subjectName").value.trim();
    const credits = document.getElementById("credits").value;
    const hours = document.getElementById("weeklyHours").value;
    const type = document.getElementById("subjectType").value;

    if (
        department === "" ||
        scheme === "" ||
        semester === "" ||
        code === "" ||
        name === "" ||
        credits === "" ||
        hours === "" ||
        type === ""
    ) {
        alert("Please fill all fields.");
        return;
    }

    const duplicate = subjects.some((subject, index) =>
        subject.code.toLowerCase() === code.toLowerCase() &&
        index !== editIndex
    );

    if (duplicate) {
        alert("Subject Code already exists.");
        return;
    }

    if (editIndex === -1) {

        const newId = subjects.length > 0
            ? subjects[subjects.length - 1].id + 1
            : 1;

        subjects.push({
            id: newId,
            code,
            name,
            department,
            scheme,
            semester,
            credits,
            hours,
            type
        });

    } else {

        subjects[editIndex] = {
            ...subjects[editIndex],
            code,
            name,
            department,
            scheme,
            semester,
            credits,
            hours,
            type
        };

        editIndex = -1;
    }

    loadSubjects();
    filterSubjects();
    localStorage.setItem(
      "subjects",
      JSON.stringify(subjects)
    );

    document.getElementById("subjectCode").value = "";
    document.getElementById("subjectName").value = "";
    document.getElementById("credits").value = "";
    document.getElementById("weeklyHours").value = "";

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
    document.getElementById("weeklyHours").value = "";
    document.getElementById("subjectType").value = "";

}
function editSubject(index) {

    editIndex = index;

    const subject = subjects[index];

    document.getElementById("department").value = subject.department;
    document.getElementById("scheme").value = subject.scheme;
    document.getElementById("semester").value = subject.semester;
    document.getElementById("subjectCode").value = subject.code;
    document.getElementById("subjectName").value = subject.name;
    document.getElementById("credits").value = subject.credits;
    document.getElementById("weeklyHours").value = subject.hours;
    document.getElementById("subjectType").value = subject.type;

    new bootstrap.Modal(
        document.getElementById("subjectModal")
    ).show();

}
function deleteSubject(index) {

    if (!confirm("Are you sure you want to delete this subject?")) {
        return;
    }

    subjects.splice(index, 1);
    localStorage.setItem(
      "subjects",
      JSON.stringify(subjects)
  );

    loadSubjects();
    filterSubjects();
}
// Search Subject
document.getElementById("searchSubject")
    .addEventListener("keyup", filterSubjects);
function filterSubjects() {

    const department = document.getElementById("filterDepartment").value;
    const scheme = document.getElementById("filterScheme").value;
    const semester = document.getElementById("filterSemester").value;
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
            <option value="${department.code}">
              ${department.code}
            </option>
        `;

    });

}

function loadSchemeFilter() {

    const filter = document.getElementById("filterScheme");

    filter.innerHTML = `<option value="">All Schemes</option>`;

    schemes.forEach(scheme => {

        const value = scheme.name.replace(" Scheme", "");

        filter.innerHTML += `
            <option value="${value}">
                ${scheme.name}
            </option>
        `;

    });

}
function loadDepartmentDropdown() {

    const dropdown = document.getElementById("department");

    dropdown.innerHTML = `<option value="">Select Department</option>`;

    departments.forEach(department => {

        dropdown.innerHTML += `
            <option value="${department.code}">
              ${department.code}
            </option>
        `;

    });

}
function loadSchemeDropdown() {

    const dropdown = document.getElementById("scheme");

    dropdown.innerHTML = `<option value="">Select Scheme</option>`;

    schemes.forEach(scheme => {

        const value = scheme.name.replace(" Scheme", "");

        dropdown.innerHTML += `
            <option value="${value}">
                ${scheme.name}
            </option>
        `;

    });

}
loadSubjects();

loadDepartmentFilter();
loadSchemeFilter();

loadDepartmentDropdown();
loadSchemeDropdown();

document.getElementById("filterDepartment")
    .addEventListener("change", filterSubjects);

document.getElementById("filterScheme")
    .addEventListener("change", filterSubjects);

document.getElementById("filterSemester")
    .addEventListener("change", filterSubjects);

