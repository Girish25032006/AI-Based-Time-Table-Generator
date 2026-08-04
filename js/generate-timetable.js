const API = "http://127.0.0.1:5000";

const DEPARTMENT_API = `${API}/departments`;

const SCHEME_API = `${API}/schemes`;

const SUMMARY_API = `${API}/timetable-constraints`;
const ACADEMIC_YEAR_API = `${API}/academic-years`;
const SAVE_TIMETABLE_API = `${API}/save-timetable`;

let departments = [];

let schemes = [];
async function loadDepartments() {

    const response = await fetch(DEPARTMENT_API);

    departments = await response.json();

    const dropdown =
        document.getElementById("generateDepartment");

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
async function loadSchemes() {

    const response = await fetch(SCHEME_API);

    schemes = await response.json();

    const dropdown =
        document.getElementById("generateScheme");

    dropdown.innerHTML =
        '<option value="">Select Scheme</option>';

    schemes.forEach(scheme => {

        dropdown.innerHTML += `
            <option value="${scheme.scheme_year}">
                ${scheme.scheme_year}
            </option>
        `;

    });

}
async function loadAcademicYears() {

    const response = await fetch(ACADEMIC_YEAR_API);

    const years = await response.json();

    const dropdown =
        document.getElementById("generateAcademicYear");

    dropdown.innerHTML =
        '<option value="">Select Academic Year</option>';

    years.forEach(year => {

        dropdown.innerHTML += `
            <option value="${year.academic_year}">
                ${year.academic_year}
            </option>
        `;

    });

}

loadDepartments();

loadSchemes();

loadAcademicYears();


async function generateTimetable() {

    const data = {

        department:
            document.getElementById("generateDepartment").value,

        scheme:
            document.getElementById("generateScheme").value,

        academic_year:
            document.getElementById("generateAcademicYear").value,

        semester_type:
            document.getElementById("generateSemesterType").value

    };
    const response = await fetch(
        `${API}/generate-timetable`,
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        }
    );

    const result = await response.json();
    window.generatedTimetable = result;

    document.getElementById("summaryWorkingDays").value =
        result.working_days;

    document.getElementById("summaryPeriodsPerDay").value =
        result.periods_per_day;

    document.getElementById("summaryLunchBreak").value =
        "After Period " + result.lunch_after_period;

    document.getElementById("summaryShortBreak").value =
        "After Period " +
        result.short_break_after_period +
        " (" +
        result.short_break_duration +
        " Min)";

    document.getElementById("summarySubjects").value =
        result.total_subjects;

    document.getElementById("summaryFaculty").value =
        result.faculty_assigned;

    // Display Timetable
    displayTimetable(result.timetable);

}
document
    .getElementById("generateTimetableBtn")
    .addEventListener(
        "click",
        generateTimetable
    );
document
    .getElementById("saveTimetableBtn")
    .addEventListener(
        "click",
        saveTimetable
    );
function displayTimetable(timetable) {

    const container = document.getElementById("timetableContainer");

    container.innerHTML = "";

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

        container.innerHTML += `
            <div class="card mt-4 shadow-sm">

                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">
                        Semester ${semester}
                    </h5>
                </div>

                <div class="card-body">

                    <div class="table-responsive">

                        <table class="table table-bordered table-striped text-center align-middle">

                            <thead class="table-dark">

                                <tr>
                                    <th>Day</th>
                                    <th>P1</th>
                                    <th>P2</th>
                                    <th>P3</th>
                                    <th>P4</th>
                                    <th>P5</th>
                                    <th>P6</th>
                                    <th>P7</th>
                                </tr>

                            </thead>

                            <tbody id="semester${semester}Body">

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>
        `;

        const tbody = document.getElementById(`semester${semester}Body`);

        const semesterData = timetable[semester];

        for (const day of dayOrder) {

            if (!semesterData[day]) {
                continue;
            }

            let row = `<tr>`;

            row += `<td><b>${day}</b></td>`;

            const periods = semesterData[day];

            let i = 0;

            while (i < periods.length) {

                const slot = periods[i];

                // Empty Period
                if (slot === "Empty") {

                    row += `<td class="text-muted">-</td>`;
                    i++;
                    continue;

                }

                // Merge Lab / Integrated Practical
                if (
                    i < periods.length - 1 &&
                    periods[i + 1] !== "Empty" &&
                    slot.subject_type !== "Theory" &&
                    slot.subject_id === periods[i + 1].subject_id
                ) {

                    row += `
                        <td colspan="2"
                            class="table-warning align-middle">

                            <div>
                                <strong>${slot.subject_code}</strong>
                            </div>

                            <small>${slot.faculty_name}</small>

                        </td>
                    `;

                    i += 2;

                }
                else {

                    let cellClass = "table-primary";

                    if (slot.subject_type === "Lab") {
                        cellClass = "table-warning";
                    }
                    else if (slot.subject_type === "Integrated") {
                        cellClass = "table-success";
                    }

                    row += `
                        <td class="${cellClass}">

                            <div>
                                <strong>${slot.subject_code}</strong>
                            </div>

                            <small>${slot.faculty_name}</small>

                        </td>
                    `;

                    i++;

                }

            }

            row += `</tr>`;

            tbody.innerHTML += row;

        }

    }

}
async function saveTimetable() {

    if (!window.generatedTimetable) {

        alert("Please generate the timetable first.");
        return;

    }

    const response = await fetch(
        `${API}/save-timetable`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(window.generatedTimetable)
        }
    );

    const result = await response.json();

    alert(result.message);

}