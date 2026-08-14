const API = "http://127.0.0.1:5000";
const DEPARTMENT_API = "http://127.0.0.1:5000/departments";
const SCHEME_API = "http://127.0.0.1:5000/schemes";
const ACADEMIC_YEAR_API = "http://127.0.0.1:5000/academic-years";
const semesterType = document.getElementById("viewSemesterType");

const viewType = document.getElementById("viewType");

const semesterDiv = document.getElementById("semesterDiv");

const semester = document.getElementById("viewSemester");
const viewTimetableBtn = document.getElementById("viewTimetableBtn");
const printTimetableBtn =document.getElementById("printTimetableBtn");
const exportPdfBtn =document.getElementById("exportPdfBtn");
const exportExcelBtn =
    document.getElementById("exportExcelBtn");
viewType.addEventListener("change", function () {

    if (this.value === "single") {

        semesterDiv.style.display = "block";

    } else {

        semesterDiv.style.display = "none";

    }

});
semesterType.addEventListener("change", function () {

    semester.innerHTML =
        `<option value="">Select Semester</option>`;

    let semesters = [];

    if (this.value === "Odd") {

        semesters = [1, 3, 5, 7];

    }

    else if (this.value === "Even") {

        semesters = [2, 4, 6, 8];

    }

    semesters.forEach(function (sem) {

        semester.innerHTML +=
            `<option value="${sem}">
                Semester ${sem}
            </option>`;

    });

});
viewTimetableBtn.addEventListener("click", viewTimetable);
printTimetableBtn.addEventListener(
    "click",
    printTimetable
);
exportPdfBtn.addEventListener(
    "click",
    exportPDF
);
exportExcelBtn.addEventListener(
    "click",
    exportExcel
);
function displayTimetable(timetable) {

    const container = document.getElementById("professionalTimetable");

    container.innerHTML = "";
    container.innerHTML = `
    <div class="table-responsive">

    <table class="table table-bordered text-center align-middle">

    <thead class="table-primary">

    <tr>

    <th rowspan="2">Day</th>

    <th>I</th>
    <th>II</th>

    <th class="table-warning" style="width:90px;">
          Tea Break
      </th>

    <th>III</th>
    <th>IV</th>

    <th class="table-danger" style="width:90px;">
        Lunch Break
    </th>

    <th>V</th>
    <th>VI</th>
    <th>VII</th>

    </tr>

    <tr>

    <th>9:10<br>9:55</th>

    <th>10:05<br>11:00</th>

    <th>11:00<br>11:15</th>

    <th>11:15<br>12:10</th>

    <th>12:10<br>1:05</th>

    <th>1:05<br>1:45</th>

    <th>1:45<br>2:40</th>

    <th>2:40<br>3:35</th>

    <th>3:35<br>4:30</th>

    </tr>

    </thead>

    <tbody id="professionalBody">

    </tbody>

    </table>

    </div>
    `;

    const semesterOrder = Object.keys(timetable)
        .map(Number)
        .sort((a, b) => a - b);

    const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
    ];

    for (const semester of semesterOrder) {

        

        const tbody = document.getElementById("professionalBody");

        const semesterData = timetable[semester];

        for (const day of dayOrder) {

            if (!semesterData[day]) {
                continue;
            }

            let row = `<tr>`;

            row += `<td><b>${day}</b></td>`;

            // Tea Break (only once)
            
            const periods = semesterData[day];
            let displayColumn = 1;

            let i = 0;

            while (i < periods.length) {
              // Lunch Break after Period 4
              if (displayColumn === 5 && day === "Monday") {

                  row += `
                      <td rowspan="5"
                          class="table-danger align-middle fw-bold">
                          LUNCH<br>BREAK
                      </td>
                  `;

              }
              const slot = periods[i];
              if (displayColumn === 3 && day === "Monday") {

                  row += `
                      <td rowspan="5"
                          class="table-warning align-middle fw-bold">
                          TEA<br>BREAK
                      </td>
                  `;

              }

              if (slot === "Empty") {

                  row += `<td class="text-muted">-</td>`;

                  i++;
                  displayColumn++;

                  continue;

              } else {

                  let cellClass = "table-primary";

                  if (slot.subject_type === "Lab") {

                      cellClass = "table-warning";

                  } else if (slot.subject_type === "Integrated") {

                      cellClass = "table-success";

                  }

                  if (
    i < periods.length - 1 &&
    periods[i + 1] !== "Empty" &&
    slot.subject_type !== "Theory" &&
    slot.subject_id === periods[i + 1].subject_id
) {

    row += `
        <td colspan="2" class="table-warning">

            <strong>${slot.subject_code}</strong><br>

            <small>${slot.faculty_name}</small>

        </td>
    `;

    i += 2;
    displayColumn += 2;
} else {

    row += `
        <td class="${cellClass}">

            <strong>${slot.subject_code}</strong><br>

            <small>${slot.faculty_name}</small>

        </td>
    `;

    i++;
    displayColumn++;
}

              }

    // Tea Break after Period 2
             

          }

            row += `</tr>`;

            tbody.innerHTML += row;

        }

    }

}
async function viewTimetable() {

    const response = await fetch(
        `${API}/view-timetable`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                department: document.getElementById("viewDepartment").value,
                scheme: document.getElementById("viewScheme").value,
                academic_year: document.getElementById("viewAcademicYear").value,
                semester_type: document.getElementById("viewSemesterType").value,
                view_type: document.getElementById("viewType").value,
                semester: document.getElementById("viewSemester").value

            })

        }
    );

    const result = await response.json();

    console.log(result);

    document.getElementById("displayDepartment").textContent =
        result.department;

    document.getElementById("displaySemester").textContent =
        result.semester;

    document.getElementById("displayBranch").textContent =
        result.department;

    document.getElementById("displayScheme").textContent =
        result.scheme;

    document.getElementById("displayAcademicYear").textContent =
        result.academic_year;

    displayTimetable(result.timetable);
    loadSubjectDetails();
    loadFacultyDetails();
}
async function loadDepartments() {

    const response = await fetch(DEPARTMENT_API);

    const departments = await response.json();

    const select = document.getElementById("viewDepartment");

    select.innerHTML = "";

    departments.forEach(dept => {

        select.innerHTML += `
            <option value="${dept.department_code}">
                ${dept.department_code}
            </option>
        `;

    });

}
async function loadSchemes() {

   const response = await fetch(SCHEME_API);
    const schemes = await response.json();

    const select = document.getElementById("viewScheme");

    select.innerHTML = "";

    schemes.forEach(scheme => {

        select.innerHTML += `
            <option value="${scheme.scheme_year}">
                ${scheme.scheme_year}
            </option>
        `;

    });

}
async function loadAcademicYears() {

    const response = await fetch(ACADEMIC_YEAR_API);

    const years = await response.json();

    const select = document.getElementById("viewAcademicYear");

    select.innerHTML = "";

    years.forEach(year => {

        select.innerHTML += `
            <option value="${year.academic_year}">
                ${year.academic_year}
            </option>
        `;

    });

}
loadDepartments();
loadSchemes();
loadAcademicYears();

async function loadSubjectDetails() {

    const response = await fetch(`${API}/view-subject-details`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

        department: document.getElementById("viewDepartment").value,

        scheme: document.getElementById("viewScheme").value,

        academic_year: document.getElementById("viewAcademicYear").value,

        semester_type: document.getElementById("viewSemesterType").value,

        semester: document.getElementById("viewSemester").value

    })

    });

    const subjects = await response.json();

    const table =
        document.getElementById("subjectDetailsBody");

    table.innerHTML = "";

    subjects.forEach(subject => {

        table.innerHTML += `

            <tr>

                <td>${subject.subject_code}</td>

                <td>${subject.subject_name}</td>

                <td>${subject.credits}</td>

            </tr>

        `;

    });

}
async function loadFacultyDetails() {

    const response = await fetch(`${API}/view-faculty-details`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            department: document.getElementById("viewDepartment").value,

            scheme: document.getElementById("viewScheme").value,

            academic_year: document.getElementById("viewAcademicYear").value,

            semester_type: document.getElementById("viewSemesterType").value,

            semester: document.getElementById("viewSemester").value

        })

    });

    const faculty = await response.json();

    const tbody = document.getElementById("facultyDetailsBody");

    tbody.innerHTML = "";

    faculty.forEach(item => {

        tbody.innerHTML += `
            <tr>
                <td>${item.faculty_name}</td>
                <td>${item.subject_code}</td>
            </tr>
        `;

    });

}
function printTimetable() {

    window.print();

}
function exportPDF() {

    const element = document.getElementById("printArea");

    const options = {

        margin: [0.1, 0.1, 0.1, 0.1],

        filename: "Timetable.pdf",

        image: {

            type: "jpeg",

            quality: 0.98

        },

        html2canvas: {

            scale: 1,

            useCORS: true,

            scrollY: 0

        },

        jsPDF: {

            unit: "mm",

            format: "a4",

            orientation: "landscape"

        },

        pagebreak: {

            mode: ["avoid-all", "css", "legacy"]

        }

    };

    html2pdf().set(options).from(element).save();

}
function exportExcel() {

    const timetableTable =
        document.querySelector("#professionalTimetable table");

    const subjectTable =
        document.querySelector("#subjectDetailsBody").closest("table");

    const facultyTable =
        document.querySelector("#facultyDetailsBody").closest("table");

    if (!timetableTable) {

        alert("Please view the timetable first.");

        return;

    }

    const workbook = XLSX.utils.book_new();


    // =========================
    // TIMETABLE SHEET
    // =========================

    const timetableSheet =
        XLSX.utils.table_to_sheet(timetableTable);

    XLSX.utils.book_append_sheet(
        workbook,
        timetableSheet,
        "Timetable"
    );


    // =========================
    // SUBJECT DETAILS SHEET
    // =========================

    const subjectSheet =
        XLSX.utils.table_to_sheet(subjectTable);

    XLSX.utils.book_append_sheet(
        workbook,
        subjectSheet,
        "Subject Details"
    );


    // =========================
    // FACULTY DETAILS SHEET
    // =========================

    const facultySheet =
        XLSX.utils.table_to_sheet(facultyTable);

    XLSX.utils.book_append_sheet(
        workbook,
        facultySheet,
        "Faculty Details"
    );
    // Set column widths

    timetableSheet["!cols"] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
    ];

    subjectSheet["!cols"] = [
        { wch: 18 },
        { wch: 45 },
        { wch: 12 }
    ];

    facultySheet["!cols"] = [
        { wch: 35 },
        { wch: 20 }
    ];
    function formatHeader(sheet) {

    const range = XLSX.utils.decode_range(sheet["!ref"]);

    for (let col = range.s.c; col <= range.e.c; col++) {

        const cellAddress =
            XLSX.utils.encode_cell({
                r: 0,
                c: col
            });

        const cell = sheet[cellAddress];

        if (cell) {

            cell.s = {
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center"
                }
            };

        }

    }

}

formatHeader(timetableSheet);
formatHeader(subjectSheet);
formatHeader(facultySheet);


    // =========================
    // DOWNLOAD
    // =========================

    XLSX.writeFile(
        workbook,
        "Timetable.xlsx"
    );

}
// Format header rows

