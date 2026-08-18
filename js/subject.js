// ============================================================
// SUBJECT MANAGEMENT
// ============================================================

const API_URL = "http://127.0.0.1:5000/subjects";

let subjects = [];
let departments = [];
let schemes = [];

let editIndex = -1;
let editSubjectId = null;


// ============================================================
// FETCH DEPARTMENTS
// ============================================================

async function fetchDepartments() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/departments"
        );

        if (!response.ok) {
            throw new Error("Failed to fetch departments");
        }

        departments = await response.json();

        loadDepartmentDropdown();
        loadDepartmentFilter();

    } catch (error) {

        console.error(
            "Department loading error:",
            error
        );

        alert("Unable to load departments.");

    }

}


// ============================================================
// FETCH SCHEMES
// ============================================================

async function fetchSchemes() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/schemes"
        );

        if (!response.ok) {
            throw new Error("Failed to fetch schemes");
        }

        schemes = await response.json();

        loadSchemeDropdown();
        loadSchemeFilter();

    } catch (error) {

        console.error(
            "Scheme loading error:",
            error
        );

        alert("Unable to load schemes.");

    }

}


// ============================================================
// FETCH SUBJECTS
// ============================================================

async function fetchSubjects() {

    try {

        const response =
            await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                "Failed to fetch subjects"
            );
        }

        const data =
            await response.json();

        const rawSubjects =
            Array.isArray(data)
                ? data
                : data.subjects || [];
        console.log("SUBJECT API RESPONSE:", data);
        console.log("FIRST SUBJECT:", rawSubjects[0]);

        subjects = rawSubjects.map(subject => ({
            subject_id: subject[0],

            subject_code: subject[1],

            subject_name: subject[2],

            department_code: subject[3],

            semester_no: subject[4],

            scheme_year: subject[5],

            credits: subject[6] ?? 0,

            lecture_hours: subject[7] ?? 0,

            tutorial_hours: subject[8] ?? 0,

            practical_hours: subject[9] ?? 0,

            cycle: subject[10] ?? null,

            is_optional: subject[11] ?? 0
        }));

        loadSubjects();

        updateSubjectStats();

        filterSubjects();

    } catch (error) {

        console.error(
            "Subject loading error:",
            error
        );

        alert(
            "Unable to load subjects."
        );

    }

}


// ============================================================
// LOAD SUBJECT TABLE
// ============================================================

function loadSubjects() {

    const table =
        document.getElementById(
            "subjectTableBody"
        );

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (subjects.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="13"
                    class="text-center text-danger">
                    No subjects found.
                </td>
            </tr>
        `;

        return;
    }


    subjects.forEach(
        (subject, index) => {

            table.innerHTML += `
                <tr>

                    <td>
                        ${subject.subject_id}
                    </td>

                    <td>
                        ${subject.subject_code || "-"}
                    </td>

                    <td>
                        ${subject.subject_name || "-"}
                    </td>

                    <td>
                        ${subject.department_code || "-"}
                    </td>

                    <td>
                        ${subject.scheme_year || "-"}
                    </td>

                    <td>
                        ${subject.semester_no || "-"}
                    </td>

                    <td>
                        ${subject.credits ?? 0}
                    </td>

                    <td>
                        ${subject.lecture_hours ?? 0}
                    </td>

                    <td>
                        ${subject.tutorial_hours ?? 0}
                    </td>

                    <td>
                        ${subject.practical_hours ?? 0}
                    </td>

                    <td>
                        ${subject.cycle || "-"}
                    </td>

                    <td>
                        ${
                            Number(
                                subject.is_optional
                            ) === 1
                                ? "Yes"
                                : "No"
                        }
                    </td>

                    <td>

                        <button
                            class="edit-btn"
                            onclick="editSubject(${index})">

                            <i class="bi bi-pencil"></i>
                            Edit

                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteSubject(${index})">

                            <i class="bi bi-trash"></i>
                            Delete

                        </button>

                    </td>

                </tr>
            `;

        }
    );

}


// ============================================================
// SAVE / UPDATE SUBJECT
// ============================================================

document
    .getElementById("saveSubject")
    .addEventListener(
        "click",
        async function () {

            const department =
                document
                    .getElementById(
                        "department"
                    )
                    .value;

            const scheme =
                document
                    .getElementById(
                        "scheme"
                    )
                    .value;

            const semester =
                document
                    .getElementById(
                        "semester"
                    )
                    .value;

            const code =
                document
                    .getElementById(
                        "subjectCode"
                    )
                    .value
                    .trim();

            const name =
                document
                    .getElementById(
                        "subjectName"
                    )
                    .value
                    .trim();

            const credits =
                document
                    .getElementById(
                        "credits"
                    )
                    .value;

            const lectureHours =
                document
                    .getElementById(
                        "lectureHours"
                    )
                    .value;

            const tutorialHours =
                document
                    .getElementById(
                        "tutorialHours"
                    )
                    .value;

            const practicalHours =
                document
                    .getElementById(
                        "practicalHours"
                    )
                    .value;

            const cycleField =
                document.getElementById(
                    "cycleField"
                );

            const cycle =
                cycleField.style.display === "none"
                    ? null
                    : document
                        .getElementById(
                            "cycle"
                        )
                        .value || null;

            const isOptional =
                document
                    .getElementById(
                        "isOptional"
                    )
                    .value;


            // ------------------------------------------------
            // VALIDATION
            // ------------------------------------------------

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

                alert(
                    "Please fill all fields."
                );

                return;
            }


            // ------------------------------------------------
            // SUBJECT DATA
            // ------------------------------------------------

            const subjectData = {

                department:
                    department,

                scheme:
                    scheme,

                semester:
                    semester,

                subject_code:
                    code,

                subject_name:
                    name,

                credits:
                    credits,

                lecture_hours:
                    lectureHours,

                tutorial_hours:
                    tutorialHours,

                practical_hours:
                    practicalHours,

                cycle:
                    cycle,

                is_optional:
                    isOptional

            };


            try {

                let response;


                // ============================================
                // ADD
                // ============================================

                if (
                    editSubjectId === null
                ) {

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
                                        subjectData
                                    )
                            }
                        );

                }


                // ============================================
                // UPDATE
                // ============================================

                else {

                    response =
                        await fetch(
                            `${API_URL}/${editSubjectId}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        subjectData
                                    )
                            }
                        );

                }


                const result =
                    await response.json();


                if (!response.ok) {

                    alert(
                        result.error ||
                        "Operation failed."
                    );

                    return;
                }


                alert(
                    result.message ||
                    "Subject saved successfully!"
                );


                editSubjectId = null;
                editIndex = -1;


                resetSubjectForm();


                await fetchSubjects();


                filterSubjects();


                const modal =
                    bootstrap.Modal.getInstance(
                        document.getElementById(
                            "subjectModal"
                        )
                    );

                if (modal) {
                    modal.hide();
                }


            } catch (error) {

                console.error(
                    "Save subject error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );

            }

        }
    );


// ============================================================
// RESET SUBJECT FORM
// ============================================================

function resetSubjectForm() {

    editIndex = -1;

    editSubjectId = null;


    document.getElementById(
        "department"
    ).value = "";

    document.getElementById(
        "scheme"
    ).value = "";

    document.getElementById(
        "semester"
    ).value = "";

    document.getElementById(
        "subjectCode"
    ).value = "";

    document.getElementById(
        "subjectName"
    ).value = "";

    document.getElementById(
        "credits"
    ).value = "";

    document.getElementById(
        "lectureHours"
    ).value = "";

    document.getElementById(
        "tutorialHours"
    ).value = "";

    document.getElementById(
        "practicalHours"
    ).value = "";

    document.getElementById(
        "cycle"
    ).value = "";

    document.getElementById(
        "isOptional"
    ).value = "0";


    // Hide cycle for reset

    document.getElementById(
        "cycleField"
    ).style.display = "none";


    // Hide optional field for reset

    document.getElementById(
        "optionalField"
    ).style.display = "none";

}


// ============================================================
// EDIT SUBJECT
// ============================================================

function editSubject(index) {

    editIndex = index;

    const subject =
        subjects[index];

    editSubjectId =
        subject.subject_id;


    document.getElementById(
        "department"
    ).value =
        subject.department_code || "";


    document.getElementById(
        "scheme"
    ).value =
        subject.scheme_year || "";


    document.getElementById(
        "semester"
    ).value =
        subject.semester_no || "";


    document.getElementById(
        "subjectCode"
    ).value =
        subject.subject_code || "";


    document.getElementById(
        "subjectName"
    ).value =
        subject.subject_name || "";


    document.getElementById(
        "credits"
    ).value =
        subject.credits ?? 0;


    document.getElementById(
        "lectureHours"
    ).value =
        subject.lecture_hours ?? 0;


    document.getElementById(
        "tutorialHours"
    ).value =
        subject.tutorial_hours ?? 0;


    document.getElementById(
        "practicalHours"
    ).value =
        subject.practical_hours ?? 0;


    document.getElementById(
        "cycle"
    ).value =
        subject.cycle || "";


    document.getElementById(
        "isOptional"
    ).value =
        Number(
            subject.is_optional
        ) === 1
            ? "1"
            : "0";


    // --------------------------------------------------------
    // Show cycle for semester 1/2
    // --------------------------------------------------------

    const semester =
        Number(
            subject.semester_no
        );


    if (
        semester === 1 ||
        semester === 2
    ) {

        document.getElementById(
            "cycleField"
        ).style.display = "block";

    } else {

        document.getElementById(
            "cycleField"
        ).style.display = "none";

    }


    // --------------------------------------------------------
    // Show optional for semester >= 3
    // --------------------------------------------------------

    if (
        semester >= 3
    ) {

        document.getElementById(
            "optionalField"
        ).style.display = "block";

    } else {

        document.getElementById(
            "optionalField"
        ).style.display = "none";

    }


    new bootstrap.Modal(
        document.getElementById(
            "subjectModal"
        )
    ).show();

}


// ============================================================
// DELETE SUBJECT
// ============================================================

async function deleteSubject(index) {

    if (
        !confirm(
            "Are you sure you want to delete this subject?"
        )
    ) {
        return;
    }


    const subjectId =
        subjects[index].subject_id;


    try {

        const response =
            await fetch(
                `${API_URL}/${subjectId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Delete failed."
            );

            return;
        }


        alert(
            result.message ||
            "Subject deleted successfully!"
        );


        await fetchSubjects();

        filterSubjects();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );

    }

}


// ============================================================
// SEARCH
// ============================================================

document
    .getElementById(
        "searchSubject"
    )
    .addEventListener(
        "keyup",
        filterSubjects
    );


// ============================================================
// SUBJECT STATISTICS
// ============================================================

function updateSubjectStats() {

    const department =
        document
            .getElementById(
                "filterDepartment"
            )
            ?.value || "";

    const scheme =
        document
            .getElementById(
                "filterScheme"
            )
            ?.value || "";

    const semester =
        document
            .getElementById(
                "filterSemester"
            )
            ?.value || "";


    const filteredSubjects =
        subjects.filter(
            subject => {

                const departmentMatch =
                    department === "" ||
                    subject.department_code ===
                    department;


                const schemeMatch =
                    scheme === "" ||
                    String(
                        subject.scheme_year
                    ) ===
                    String(scheme);


                const semesterMatch =
                    semester === "" ||
                    String(
                        subject.semester_no
                    ) ===
                    String(semester);


                return (
                    departmentMatch &&
                    schemeMatch &&
                    semesterMatch
                );

            }
        );


    const total =
        filteredSubjects.length;


    const theory =
        filteredSubjects.filter(
            subject =>

                Number(
                    subject.lecture_hours
                ) > 0 &&

                Number(
                    subject.practical_hours
                ) === 0

        ).length;


    const lab =
        filteredSubjects.filter(
            subject =>

                Number(
                    subject.lecture_hours
                ) === 0 &&

                Number(
                    subject.practical_hours
                ) > 0

        ).length;


    const integrated =
        filteredSubjects.filter(
            subject =>

                Number(
                    subject.lecture_hours
                ) > 0 &&

                Number(
                    subject.practical_hours
                ) > 0

        ).length;


    const totalElement =
        document.getElementById(
            "totalSubjects"
        );

    const theoryElement =
        document.getElementById(
            "theorySubjects"
        );

    const labElement =
        document.getElementById(
            "labSubjects"
        );

    const integratedElement =
        document.getElementById(
            "integratedSubjects"
        );


    if (totalElement) {
        totalElement.textContent =
            total;
    }

    if (theoryElement) {
        theoryElement.textContent =
            theory;
    }

    if (labElement) {
        labElement.textContent =
            lab;
    }

    if (integratedElement) {
        integratedElement.textContent =
            integrated;
    }


    updateSubjectChart(
        theory,
        lab,
        integrated
    );

}


// ============================================================
// SUBJECT CHART
// ============================================================

let subjectTypeChart = null;


function updateSubjectChart(
    theory,
    lab,
    integrated
) {

    const canvas =
        document.getElementById(
            "subjectTypeChart"
        );


    if (!canvas) {
        return;
    }


    if (subjectTypeChart) {

        subjectTypeChart.destroy();

    }


    subjectTypeChart =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Theory",
                        "Lab",
                        "Integrated"
                    ],

                    datasets: [

                        {

                            data: [
                                theory,
                                lab,
                                integrated
                            ],

                            backgroundColor: [
                                "#168653",
                                "#8b5cf6",
                                "#d89b00"
                            ],

                            borderWidth: 0

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );

}


// ============================================================
// FILTER SUBJECTS
// ============================================================

function filterSubjects() {

    const department =
        document
            .getElementById(
                "filterDepartment"
            )
            ?.value || "";


    const scheme =
        document
            .getElementById(
                "filterScheme"
            )
            ?.value || "";


    const semester =
        document
            .getElementById(
                "filterSemester"
            )
            ?.value || "";


    const type =
        document
            .getElementById(
                "filterType"
            )
            ?.value || "";


    const search =
        document
            .getElementById(
                "searchSubject"
            )
            ?.value
            .toLowerCase() || "";


    const rows =
        document.querySelectorAll(
            "#subjectTableBody tr"
        );


    rows.forEach(
        row => {

            if (
                row.cells.length < 10
            ) {
                return;
            }


            const rowDepartment =
                row.cells[3]
                    .textContent
                    .trim();


            const rowScheme =
                row.cells[4]
                    .textContent
                    .trim();


            const rowSemester =
                row.cells[5]
                    .textContent
                    .trim();


            const lectureHours =
                parseInt(
                    row.cells[7]
                        .textContent
                        .trim()
                ) || 0;


            const practicalHours =
                parseInt(
                    row.cells[9]
                        .textContent
                        .trim()
                ) || 0;


            let rowType;


            if (
                lectureHours > 0 &&
                practicalHours > 0
            ) {

                rowType =
                    "Integrated";

            }

            else if (
                practicalHours > 0
            ) {

                rowType =
                    "Lab";

            }

            else {

                rowType =
                    "Theory";

            }


            const code =
                row.cells[1]
                    .textContent
                    .toLowerCase();


            const name =
                row.cells[2]
                    .textContent
                    .toLowerCase();


            const departmentMatch =
                department === "" ||
                rowDepartment ===
                department;


            const schemeMatch =
                scheme === "" ||
                rowScheme ===
                scheme;


            const semesterMatch =
                semester === "" ||
                rowSemester ===
                semester;


            const typeMatch =
                type === "" ||
                rowType ===
                type;


            const searchMatch =
                code.includes(search) ||
                name.includes(search);


            if (
                departmentMatch &&
                schemeMatch &&
                semesterMatch &&
                typeMatch &&
                searchMatch
            ) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        }
    );

}


// ============================================================
// DEPARTMENT FILTER
// ============================================================

function loadDepartmentFilter() {

    const filter =
        document.getElementById(
            "filterDepartment"
        );


    if (!filter) {
        return;
    }


    filter.innerHTML =
        `<option value="">
            All Departments
        </option>`;


    departments.forEach(
        department => {

            filter.innerHTML += `
                <option
                    value="${department.department_code}">
                    ${department.department_code}
                </option>
            `;

        }
    );

}


// ============================================================
// SCHEME FILTER
// ============================================================

function loadSchemeFilter() {

    const filter =
        document.getElementById(
            "filterScheme"
        );


    if (!filter) {
        return;
    }


    filter.innerHTML =
        `<option value="">
            All Schemes
        </option>`;


    schemes.forEach(
        scheme => {

            filter.innerHTML += `
                <option
                    value="${scheme.scheme_year}">
                    ${scheme.scheme_year}
                </option>
            `;

        }
    );

}


// ============================================================
// DEPARTMENT DROPDOWN
// ============================================================

function loadDepartmentDropdown() {

    const dropdown =
        document.getElementById(
            "department"
        );


    if (!dropdown) {
        return;
    }


    dropdown.innerHTML =
        `<option value="">
            Select Department
        </option>`;


    departments.forEach(
        department => {

            dropdown.innerHTML += `
                <option
                    value="${department.department_code}">
                    ${department.department_code}
                </option>
            `;

        }
    );

}


// ============================================================
// SCHEME DROPDOWN
// ============================================================

function loadSchemeDropdown() {

    const dropdown =
        document.getElementById(
            "scheme"
        );


    if (!dropdown) {
        return;
    }


    dropdown.innerHTML =
        `<option value="">
            Select Scheme
        </option>`;


    schemes.forEach(
        scheme => {

            dropdown.innerHTML += `
                <option
                    value="${scheme.scheme_year}">
                    ${scheme.scheme_year}
                </option>
            `;

        }
    );

}


// ============================================================
// INITIAL LOAD
// ============================================================

fetchDepartments();

fetchSchemes();

fetchSubjects();


// ============================================================
// FILTER EVENTS
// ============================================================

document
    .getElementById(
        "filterDepartment"
    )
    ?.addEventListener(
        "change",
        function () {

            filterSubjects();

            updateSubjectStats();

        }
    );


document
    .getElementById(
        "filterScheme"
    )
    ?.addEventListener(
        "change",
        function () {

            filterSubjects();

            updateSubjectStats();

        }
    );


document
    .getElementById(
        "filterSemester"
    )
    ?.addEventListener(
        "change",
        function () {

            filterSubjects();

            updateSubjectStats();

        }
    );


document
    .getElementById(
        "filterType"
    )
    ?.addEventListener(
        "change",
        filterSubjects
    );


// ============================================================
// SEMESTER CHANGE
// ============================================================

const semesterDropdown =
    document.getElementById(
        "semester"
    );


if (semesterDropdown) {

    semesterDropdown.addEventListener(
        "change",
        function () {

            const semester =
                parseInt(
                    this.value
                ) || 0;


            // -----------------------------------------------
            // Cycle for Sem 1 / 2
            // -----------------------------------------------

            if (
                semester === 1 ||
                semester === 2
            ) {

                document.getElementById(
                    "cycleField"
                ).style.display =
                    "block";

            } else {

                document.getElementById(
                    "cycleField"
                ).style.display =
                    "none";

                document.getElementById(
                    "cycle"
                ).value = "";

            }


            // -----------------------------------------------
            // Optional from Sem 3
            // -----------------------------------------------

            if (
                semester >= 3
            ) {

                document.getElementById(
                    "optionalField"
                ).style.display =
                    "block";

            } else {

                document.getElementById(
                    "optionalField"
                ).style.display =
                    "none";

                document.getElementById(
                    "isOptional"
                ).value =
                    "0";

            }

        }
    );

}


// ============================================================
// INITIAL FIELD STATE
// ============================================================

const cycleField =
    document.getElementById(
        "cycleField"
    );

if (cycleField) {

    cycleField.style.display =
        "none";

}


const optionalField =
    document.getElementById(
        "optionalField"
    );

if (optionalField) {

    optionalField.style.display =
        "none";

}


// ============================================================
// PDF IMPORT
// ============================================================

const importSubjectsBtn =
    document.getElementById(
        "importSubjectsBtn"
    );


const subjectPdfInput =
    document.getElementById(
        "subjectPdfInput"
    );


const confirmImportBtn =
    document.getElementById(
        "confirmImportBtn"
    );


// ============================================================
// OPEN PDF SELECTOR
// ============================================================

if (
    importSubjectsBtn &&
    subjectPdfInput
) {

    importSubjectsBtn.addEventListener(
        "click",
        function () {

            subjectPdfInput.click();

        }
    );

}


// ============================================================
// PDF SELECTED → PREVIEW
// ============================================================

if (subjectPdfInput) {

    subjectPdfInput.addEventListener(
        "change",
        async function (event) {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            // ------------------------------------------------
            // Check PDF
            // ------------------------------------------------

            if (
                !file.name
                    .toLowerCase()
                    .endsWith(".pdf")
            ) {

                alert(
                    "Please select a PDF file."
                );

                subjectPdfInput.value =
                    "";

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            try {

                // --------------------------------------------
                // Send PDF to Flask
                // --------------------------------------------

                const response =
                    await fetch(
                        "http://127.0.0.1:5000/subjects/import-pdf",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const result =
                    await response.json();


                // --------------------------------------------
                // Flask error
                // --------------------------------------------

                if (!response.ok) {

                    alert(
                        result.error ||
                        "PDF extraction failed."
                    );

                    return;
                }


                // --------------------------------------------
                // Save extracted subjects
                // --------------------------------------------

                window.importedSubjects =
                    Array.isArray(
                        result.subjects
                    )
                        ? result.subjects
                        : [];


                if (
                    window.importedSubjects
                        .length === 0
                ) {

                    alert(
                        "No subjects were extracted from this PDF."
                    );

                    return;
                }


                // --------------------------------------------
                // Preview table
                // --------------------------------------------

                const previewTable =
                    document.getElementById(
                        "importPreviewTableBody"
                    );


                if (!previewTable) {

                    alert(
                        "Preview table was not found."
                    );

                    return;
                }


                previewTable.innerHTML =
                    "";


                window.importedSubjects
                    .forEach(
                        subject => {

                            const row =
                                document.createElement(
                                    "tr"
                                );


                            row.innerHTML = `

                                <td>
                                    ${
                                        subject.subject_code
                                        || "-"
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.subject_name
                                        || "-"
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.department_code
                                        || "-"
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.scheme
                                        || "-"
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.semester
                                        || "-"
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.lecture_hours
                                        ?? 0
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.tutorial_hours
                                        ?? 0
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.practical_hours
                                        ?? 0
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.credits
                                        ?? 0
                                    }
                                </td>

                                <td>
                                    ${
                                        subject.cycle
                                        || "-"
                                    }
                                </td>

                                <td>
                                    ${
                                        Number(
                                            subject.is_optional
                                        ) === 1
                                            ? "Yes"
                                            : "No"
                                    }
                                </td>

                            `;


                            previewTable.appendChild(
                                row
                            );

                        }
                    );


                // --------------------------------------------
                // Preview count
                // --------------------------------------------

                const previewCount =
                    document.getElementById(
                        "importPreviewCount"
                    );


                if (previewCount) {

                    previewCount.textContent =
                        `${window.importedSubjects.length} subjects`;

                }


                // --------------------------------------------
                // Show preview modal
                // --------------------------------------------

                const modalElement =
                    document.getElementById(
                        "importPreviewModal"
                    );


                if (!modalElement) {

                    alert(
                        "Preview modal was not found."
                    );

                    return;
                }


                const previewModal =
                    new bootstrap.Modal(
                        modalElement
                    );


                previewModal.show();


            } catch (error) {

                console.error(
                    "PDF extraction error:",
                    error
                );


                alert(
                    "Unable to connect to the Flask server."
                );

            }

        }
    );

}


// ============================================================
// CONFIRM IMPORT → DATABASE
// ============================================================

if (confirmImportBtn) {

    confirmImportBtn.addEventListener(
        "click",
        async function () {

            // ------------------------------------------------
            // Check preview data
            // ------------------------------------------------

            if (
                !window.importedSubjects ||
                window.importedSubjects.length === 0
            ) {

                alert(
                    "There are no subjects to import."
                );

                return;
            }


            // ------------------------------------------------
            // Confirm
            // ------------------------------------------------

            const confirmed =
                confirm(
                    `Are you sure you want to import ${window.importedSubjects.length} subjects into the database?`
                );


            if (!confirmed) {
                return;
            }


            // ------------------------------------------------
            // Disable button
            // ------------------------------------------------

            const originalText =
                confirmImportBtn.innerHTML;


            confirmImportBtn.disabled =
                true;


            confirmImportBtn.innerHTML =
                "Importing...";


            try {

                // --------------------------------------------
                // Send subjects to Flask
                // --------------------------------------------

                const response =
                    await fetch(
                        "http://127.0.0.1:5000/subjects/import-pdf/confirm",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    subjects:
                                        window.importedSubjects
                                })
                        }
                    );


                const result =
                    await response.json();


                // --------------------------------------------
                // Import error
                // --------------------------------------------

                if (!response.ok) {

                    alert(
                        result.error ||
                        "Subject import failed."
                    );

                    return;
                }


                // --------------------------------------------
                // Success alert
                // --------------------------------------------

                alert(
                    "Subjects imported successfully!\n\n" +

                    "Inserted: " +
                    (
                        result.inserted_subjects
                        || 0
                    ) +

                    "\nSkipped: " +
                    (
                        result.skipped_subjects
                        || 0
                    ) +

                    "\nErrors: " +
                    (
                        result.error_count
                        || 0
                    )
                );


                // --------------------------------------------
                // Close preview modal
                // --------------------------------------------

                const modalElement =
                    document.getElementById(
                        "importPreviewModal"
                    );


                if (modalElement) {

                    const modal =
                        bootstrap.Modal
                            .getInstance(
                                modalElement
                            );


                    if (modal) {
                        modal.hide();
                    }

                }


                // --------------------------------------------
                // Clear imported data
                // --------------------------------------------

                window.importedSubjects =
                    [];


                subjectPdfInput.value =
                    "";


                // --------------------------------------------
                // Refresh table
                // --------------------------------------------

                await fetchSubjects();

                filterSubjects();

                updateSubjectStats();


            } catch (error) {

                console.error(
                    "Import error:",
                    error
                );


                alert(
                    "Unable to connect to the Flask server."
                );


            } finally {

                // --------------------------------------------
                // Restore button
                // --------------------------------------------

                confirmImportBtn.disabled =
                    false;

                confirmImportBtn.innerHTML =
                    originalText;

            }

        }
    );

}