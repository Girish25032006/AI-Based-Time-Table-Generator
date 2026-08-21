// ============================================================
// FACULTY SUBJECT ASSIGNMENT
// ============================================================

const API_URL =
    "http://127.0.0.1:5000/faculty-subject-assignments";

const SUBJECT_API =
    "http://127.0.0.1:5000/assignment-subjects";

const FACULTY_API =
    "http://127.0.0.1:5000/assignment-faculties";

const DEPARTMENT_API =
    "http://127.0.0.1:5000/assignment-departments";

const SCHEME_API =
    "http://127.0.0.1:5000/schemes";

const ACADEMIC_YEAR_API =
    "http://127.0.0.1:5000/academic-years";


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let selectedFacultyId = null;
let selectedFacultyName = "";

let selectedSemester = "";

// P = P-Cycle
// C = C-Cycle
let selectedCycle = "";

let currentSubjects = [];
let currentFaculty = [];

let manuallyAddedFaculty = [];

let existingAssignments = {};


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    bindEvents();

    await Promise.all([
        loadDepartments(),
        loadSchemes(),
        loadAcademicYears()
    ]);

    copyDepartmentsToAddModal();

    renderSemesterPills();
    renderCyclePills();
});


// ============================================================
// EVENT LISTENERS
// ============================================================

function bindEvents() {

    document
        .getElementById("filterDepartment")
        .addEventListener("change", async () => {

            selectedFacultyId = null;
            selectedFacultyName = "";

            hideSelectedFaculty();

            await loadFacultyAndSubjects();

        });


    document
        .getElementById("filterScheme")
        .addEventListener(
            "change",
            loadFacultyAndSubjects
        );


    document
        .getElementById("filterSemesterType")
        .addEventListener("change", async () => {

            selectedSemester = "";
            selectedCycle = "";

            renderSemesterPills();
            renderCyclePills();

            clearSubjects();

            await loadFacultyAndSubjects();

        });


    document
        .getElementById("filterAcademicYear")
        .addEventListener(
            "change",
            loadFacultyAndSubjects
        );


    document
        .getElementById("subjectSearch")
        .addEventListener(
            "input",
            filterSubjectRows
        );


    document
        .getElementById("addFacultyDepartment")
        .addEventListener(
            "change",
            loadModalFaculty
        );


    document
        .getElementById("addFacultySelect")
        .addEventListener(
            "change",
            showModalFacultyPreview
        );
}


// ============================================================
// FETCH HELPER
// ============================================================

async function fetchJSON(url, options = {}) {

    const response = await fetch(url, options);

    let data = {};

    try {

        data = await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `Request failed: ${response.status}`
        );

    }


    return data;
}


// ============================================================
// LOAD DEPARTMENTS
// ============================================================

async function loadDepartments() {

    try {

        const departments =
            await fetchJSON(DEPARTMENT_API);


        const select =
            document.getElementById(
                "filterDepartment"
            );


        select.innerHTML =
            `
            <option value="">
                Select Department
            </option>
            `;


        departments.forEach(department => {

            select.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHtml(
                    department.department_code
                )}">

                    ${escapeHtml(
                        department.department_name
                    )}

                    (${escapeHtml(
                        department.department_code
                    )})

                </option>
                `
            );

        });


        copyDepartmentsToAddModal(
            departments
        );

    } catch (error) {

        console.error(
            "Department error:",
            error
        );

        alert(
            "Unable to load departments.\n\n" +
            error.message
        );

    }
}


// ============================================================
// COPY DEPARTMENTS TO ADD FACULTY MODAL
// ============================================================

function copyDepartmentsToAddModal(
    departments = null
) {

    const source =
        document.getElementById(
            "filterDepartment"
        );

    const target =
        document.getElementById(
            "addFacultyDepartment"
        );


    if (!source || !target) return;


    if (departments) {

        target.innerHTML =
            `
            <option value="">
                Select Department
            </option>
            `;


        departments.forEach(department => {

            target.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHtml(
                    department.department_code
                )}">

                    ${escapeHtml(
                        department.department_name
                    )}

                    (${escapeHtml(
                        department.department_code
                    )})

                </option>
                `
            );

        });

    } else {

        target.innerHTML =
            source.innerHTML;

        target.value = "";

    }
}


// ============================================================
// LOAD SCHEMES
// ============================================================

async function loadSchemes() {

    try {

        const schemes =
            await fetchJSON(SCHEME_API);


        const select =
            document.getElementById(
                "filterScheme"
            );


        select.innerHTML =
            `
            <option value="">
                Select Scheme
            </option>
            `;


        schemes.forEach(scheme => {

            select.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHtml(
                    scheme.scheme_year
                )}">

                    ${escapeHtml(
                        scheme.scheme_year
                    )}

                </option>
                `
            );

        });

    } catch (error) {

        console.error(
            "Scheme error:",
            error
        );

        alert(
            "Unable to load schemes.\n\n" +
            error.message
        );

    }
}


// ============================================================
// LOAD ACADEMIC YEARS
// ============================================================

async function loadAcademicYears() {

    try {

        const years =
            await fetchJSON(
                ACADEMIC_YEAR_API
            );


        const select =
            document.getElementById(
                "filterAcademicYear"
            );


        select.innerHTML =
            `
            <option value="">
                Select Academic Year
            </option>
            `;


        years.forEach(year => {

            const academicYear =
                Array.isArray(year)
                    ? year[0]
                    : year.academic_year;


            if (!academicYear) return;


            select.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHtml(
                    academicYear
                )}">

                    ${escapeHtml(
                        academicYear
                    )}

                </option>
                `
            );

        });

    } catch (error) {

        console.error(
            "Academic year error:",
            error
        );

        alert(
            "Unable to load academic years.\n\n" +
            error.message
        );

    }
}


// ============================================================
// SEMESTER PILLS
// ============================================================

function renderSemesterPills() {

    const type =
        document.getElementById(
            "filterSemesterType"
        ).value;


    const container =
        document.getElementById(
            "semesterPills"
        );


    container.innerHTML = "";


    if (!type) {

        renderCyclePills();

        return;

    }


    const semesters =
        type === "Odd"
            ? [1, 3, 5, 7]
            : [2, 4, 6, 8];


    container.insertAdjacentHTML(
        "beforeend",
        `
        <button
            type="button"
            class="btn btn-outline-success ${
                selectedSemester === ""
                    ? "active"
                    : ""
            }"
            onclick="selectSemester('')">

            All

        </button>
        `
    );


    semesters.forEach(semester => {

        container.insertAdjacentHTML(
            "beforeend",
            `
            <button
                type="button"
                class="btn btn-outline-success ${
                    String(semester) ===
                    String(selectedSemester)
                        ? "active"
                        : ""
                }"
                onclick="selectSemester('${semester}')">

                ${semester}

            </button>
            `
        );

    });


    renderCyclePills();
}


// ============================================================
// P-CYCLE / C-CYCLE
// ONLY FOR SEMESTER 1 AND 2
// ============================================================

function renderCyclePills() {

    const container =
        document.getElementById(
            "cyclePills"
        );


    if (!container) return;


    container.innerHTML = "";


    const semester =
        Number(selectedSemester);


    // Cycle is only applicable
    // for semester 1 and 2

    if (
        semester !== 1 &&
        semester !== 2
    ) {

        return;

    }


    container.innerHTML = `

        <label class="form-label fw-semibold mb-2">
            Cycle
        </label>

        <div class="cycle-pills">

            <button
                type="button"
                class="btn btn-outline-success ${
                    selectedCycle === "P"
                        ? "active"
                        : ""
                }"
                onclick="selectCycle('P')">

                P-Cycle

            </button>


            <button
                type="button"
                class="btn btn-outline-success ${
                    selectedCycle === "C"
                        ? "active"
                        : ""
                }"
                onclick="selectCycle('C')">

                C-Cycle

            </button>

        </div>

    `;
}


// ============================================================
// SELECT SEMESTER
// ============================================================

async function selectSemester(
    semester
) {

    selectedSemester = semester;


    // If semester 1 or 2,
    // default to P-Cycle.

    if (
        Number(semester) === 1 ||
        Number(semester) === 2
    ) {

        selectedCycle = "P";

    } else {

        selectedCycle = "";

    }


    renderSemesterPills();
    renderCyclePills();


    await loadFacultyAndSubjects();
}


// ============================================================
// SELECT CYCLE
// ============================================================

async function selectCycle(
    cycle
) {

    selectedCycle = cycle;


    renderCyclePills();


    await loadFacultyAndSubjects();
}


// ============================================================
// CHECK COMMON SEMESTER
// ============================================================

function isCommonSemester() {

    const semester =
        Number(selectedSemester);


    return (
        semester === 1 ||
        semester === 2
    );
}


// ============================================================
// GET FACULTY DEPARTMENT
// ============================================================
//
// Semester 1 and 2 are COMMON semesters.
// Therefore faculty workload comes from SH.
//
// Semester 3 onwards:
// use the selected department.
//

function getFacultyDepartment(
    selectedDepartment
) {

    if (isCommonSemester()) {

        return "SH";

    }


    return selectedDepartment;
}


// ============================================================
// LOAD FACULTY + SUBJECTS
// ============================================================

async function loadFacultyAndSubjects() {

    const department =
        document.getElementById(
            "filterDepartment"
        ).value;


    const scheme =
        document.getElementById(
            "filterScheme"
        ).value;


    const semesterType =
        document.getElementById(
            "filterSemesterType"
        ).value;


    const academicYear =
        document.getElementById(
            "filterAcademicYear"
        ).value;


    renderSemesterPills();
    renderCyclePills();


    if (
        !department ||
        !scheme ||
        !semesterType ||
        !academicYear
    ) {

        clearSubjects();

        renderWorkload([]);

        updateButtons();

        return;

    }


    // For semester 1 / 2,
    // a cycle must be selected.

    if (
        isCommonSemester() &&
        !selectedCycle
    ) {

        clearSubjects();

        renderWorkload([]);

        updateButtons();

        return;

    }


    try {

        const facultyDepartment =
            getFacultyDepartment(
                department
            );


        await loadFaculty(
            facultyDepartment,
            academicYear
        );


        await loadSubjects(
            department,
            scheme,
            semesterType,
            academicYear
        );

    } catch (error) {

        console.error(error);


        alert(
            "Unable to load faculty or subjects.\n\n" +
            error.message
        );


        clearSubjects();

    }
}


// ============================================================
// LOAD FACULTY
// ============================================================

async function loadFaculty(
    department,
    academicYear
) {

    const data =
        await fetchJSON(
            `${FACULTY_API}/${encodeURIComponent(
                department
            )}?academic_year=${encodeURIComponent(
                academicYear
            )}`
        );


    currentFaculty =
        data.map(normalizeFaculty);


    // Add manually selected faculty

    manuallyAddedFaculty.forEach(
        extra => {

            if (
                !currentFaculty.some(
                    faculty =>
                        String(
                            faculty.faculty_id
                        ) ===
                        String(
                            extra.faculty_id
                        )
                )
            ) {

                currentFaculty.push(
                    extra
                );

            }

        }
    );


    renderWorkload(
        currentFaculty
    );
}


// ============================================================
// NORMALIZE FACULTY
// ============================================================

function normalizeFaculty(
    faculty
) {

    return {

        faculty_id:
            Number(
                faculty.faculty_id
            ),

        faculty_name:
            faculty.faculty_name || "",

        department_code:
            faculty.department_code || "",

        department_name:
            faculty.department_name || "",

        designation:
            faculty.designation ||
            "Faculty",

        max_workload:
            Number(
                faculty.max_workload || 0
            ),

        assigned_workload:
            Number(
                faculty.assigned_workload || 0
            ),

        remaining_workload:
            Number(
                faculty.remaining_workload || 0
            )

    };
}


// ============================================================
// FACULTY WORKLOAD CARDS
// ============================================================

function renderWorkload(
    faculties
) {

    const grid =
        document.getElementById(
            "workloadGrid"
        );


    const count =
        document.getElementById(
            "facultyCount"
        );


    count.textContent =
        `${faculties.length} Faculty`;


    if (!faculties.length) {

        grid.innerHTML = `

            <div class="empty-state">

                <i
                    class="bi bi-person-x fs-1 d-block mb-2">
                </i>

                No faculty found.

            </div>


            <div
                class="add-faculty-card"
                onclick="openAddFacultyModal()">

                <div class="text-center">

                    <i
                        class="bi bi-plus-circle fs-2 d-block">
                    </i>

                    <strong>
                        Add Faculty
                    </strong>

                </div>

            </div>

        `;

        return;

    }


    grid.innerHTML = "";


    faculties.forEach(
        faculty => {

            const target =
                Number(
                    faculty.max_workload || 0
                );


            const assigned =
                Number(
                    faculty.assigned_workload || 0
                );


            const percentage =
                target > 0
                    ? Math.min(
                        100,
                        Math.round(
                            (assigned / target) *
                            100
                        )
                    )
                    : 0;


            const isSelected =
                String(
                    selectedFacultyId
                ) ===
                String(
                    faculty.faculty_id
                );


            grid.insertAdjacentHTML(
                "beforeend",
                `

                <div
                    class="workload-card ${
                        isSelected
                            ? "selected"
                            : ""
                    }"
                    data-faculty-id="${faculty.faculty_id}"
                    onclick="selectFaculty(
                        ${faculty.faculty_id}
                    )">


                    <div
                        class="d-flex justify-content-between align-items-start">

                        <div>

                            <div class="workload-name">

                                ${escapeHtml(
                                    faculty.faculty_name
                                )}

                            </div>

                            <div class="text-muted small">

                                ${escapeHtml(
                                    faculty.designation ||
                                    "Faculty"
                                )}

                            </div>

                        </div>


                        <i
                            class="bi bi-person-check text-success">
                        </i>

                    </div>


                    <div
                        class="mt-2 d-flex justify-content-between align-items-center">

                        <span class="small text-muted">

                            ${escapeHtml(
                                faculty.department_code ||
                                ""
                            )}

                        </span>


                        <span class="workload-hours">

                            ${assigned}h /
                            ${target}h

                        </span>

                    </div>


                    <div
                        class="workload-progress mt-2">

                        <div
                            style="width:${percentage}%">
                        </div>

                    </div>


                    <div
                        class="mt-2 small text-muted">

                        ${Math.max(
                            0,
                            target - assigned
                        )}h remaining

                    </div>

                </div>

                `

            );

        }
    );


    // ADD FACULTY CARD

    grid.insertAdjacentHTML(
        "beforeend",
        `

        <div
            class="add-faculty-card"
            onclick="openAddFacultyModal()">

            <div class="text-center">

                <i
                    class="bi bi-plus-circle fs-2 d-block">
                </i>

                <strong>
                    Add Faculty
                </strong>

                <div class="small text-muted mt-1">

                    Choose department →
                    faculty

                </div>

            </div>

        </div>

        `
    );
}


// ============================================================
// SELECT FACULTY CARD
// ============================================================

function selectFaculty(
    facultyId
) {

    const faculty =
        currentFaculty.find(
            f =>
                String(
                    f.faculty_id
                ) ===
                String(
                    facultyId
                )
        );


    if (!faculty) return;


    selectedFacultyId =
        Number(
            faculty.faculty_id
        );


    selectedFacultyName =
        faculty.faculty_name;


    const banner =
        document.getElementById(
            "selectedFacultyBanner"
        );


    const name =
        document.getElementById(
            "selectedFacultyName"
        );


    if (name) {

        name.textContent =
            `${faculty.faculty_name} (${faculty.assigned_workload}h / ${faculty.max_workload}h)`;

    }


    if (banner) {

        banner.classList.remove(
            "d-none"
        );

    }


    renderWorkload(
        currentFaculty
    );


    highlightSelectedFacultyRows();


    document
        .querySelectorAll(
            ".faculty-radio"
        )
        .forEach(radio => {

            radio.checked =
                String(
                    radio.value
                ) ===
                String(
                    selectedFacultyId
                );

        });
}


// ============================================================
// CLEAR SELECTED FACULTY
// ============================================================

function clearSelectedFaculty() {

    selectedFacultyId = null;

    selectedFacultyName = "";

    hideSelectedFaculty();

    highlightSelectedFacultyRows();

    renderWorkload(
        currentFaculty
    );
}


// ============================================================
// HIDE SELECTED FACULTY
// ============================================================

function hideSelectedFaculty() {

    const banner =
        document.getElementById(
            "selectedFacultyBanner"
        );


    if (banner) {

        banner.classList.add(
            "d-none"
        );

    }
}


// ============================================================
// HIGHLIGHT SUBJECT ROWS
// ============================================================

function highlightSelectedFacultyRows() {

    document
        .querySelectorAll(
            ".subject-row"
        )
        .forEach(row => {

            const selects =
                row.querySelectorAll(
                    "select"
                );


            const matches =
                Array.from(selects)
                    .some(
                        select =>
                            String(
                                select.value
                            ) ===
                            String(
                                selectedFacultyId
                            )
                    );


            row.classList.toggle(
                "assigned-to-selected",
                matches
            );

        });
}


// ============================================================
// LOAD SUBJECTS
// ============================================================

async function loadSubjects(
    department,
    scheme,
    semesterType,
    academicYear
) {

    let semesters = [];


    if (selectedSemester) {

        semesters = [
            Number(
                selectedSemester
            )
        ];

    } else {

        semesters =
            semesterType === "Odd"
                ? [1, 3, 5, 7]
                : [2, 4, 6, 8];

    }


    let allSubjects = [];


    for (
        const semester of semesters
    ) {

        /*
         * Semester 1 / 2:
         * use P or C cycle.
         *
         * Semester 3 onwards:
         * use NA.
         */

        let cycle = "NA";


        if (
            (semester === 1 ||
             semester === 2) &&
            selectedCycle
        ) {

            cycle =
                selectedCycle;

        }


        const url =
            `${SUBJECT_API}/` +
            `${encodeURIComponent(
                department
            )}/` +
            `${encodeURIComponent(
                scheme
            )}/` +
            `${semester}/` +
            `${encodeURIComponent(
                cycle
            )}` +
            `?academic_year=${encodeURIComponent(
                academicYear
            )}`;


        const subjects =
            await fetchJSON(url);


        allSubjects =
            allSubjects.concat(
                subjects.map(
                    subject => ({

                        ...subject,

                        semester_id:
                            Number(
                                subject.semester_id ||
                                semester
                            )

                    })
                )
            );

    }


    currentSubjects =
        allSubjects;


    await loadExistingAssignments(
        academicYear,
        department,
        scheme,
        selectedSemester,
        selectedCycle
    );


    renderSubjects();
}


// ============================================================
// LOAD EXISTING ASSIGNMENTS
// ============================================================

async function loadExistingAssignments(
    academicYear,
    department,
    scheme,
    semester,
    cycle
) {

    const params =
        new URLSearchParams({

            academic_year:
                academicYear,

            department:
                department,

            scheme:
                scheme

        });


    if (semester) {

        params.set(
            "semester",
            semester
        );

    }


    if (
        cycle &&
        (
            Number(semester) === 1 ||
            Number(semester) === 2
        )
    ) {

        params.set(
            "cycle",
            cycle
        );

    }


    try {

        const data =
            await fetchJSON(
                `${API_URL}/context?${params.toString()}`
            );


        const map = {};


        data.forEach(
            item => {

                map[
                    String(
                        item.subject_id
                    )
                ] = {

                    theory:
                        item.faculty_id
                            ? String(
                                item.faculty_id
                            )
                            : "",

                    lab:
                        item.lab_faculty_id
                            ? String(
                                item.lab_faculty_id
                            )
                            : "",

                    assignmentId:
                        item.assignment_id

                };

            }
        );


        existingAssignments =
            map;


    } catch (error) {

        /*
         * Keep the page working even if
         * the old context endpoint does
         * not understand cycle yet.
         */

        console.warn(
            "Unable to load existing assignments:",
            error
        );


        existingAssignments = {};

    }
}


// ============================================================
// RENDER SUBJECTS
// ============================================================

function renderSubjects() {

    const container =
        document.getElementById(
            "subjectsContainer"
        );


    if (!currentSubjects.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i
                    class="bi bi-book fs-1 d-block mb-2">
                </i>

                No subjects found
                for the selected filters.

            </div>

        `;


        updateSubjectSummary();

        updateButtons();

        return;

    }


    const search =
        document
            .getElementById(
                "subjectSearch"
            )
            .value
            .toLowerCase();


    const rows =
        currentSubjects.filter(
            subject => {

                const text =
                    `
                    ${subject.subject_code || ""}
                    ${subject.subject_name || ""}
                    ${subject.course_type || ""}
                    `
                    .toLowerCase();


                return text.includes(
                    search
                );

            }
        );


    container.innerHTML = `

        <div class="table-responsive">

            <table
                class="table table-bordered align-middle mb-0">

                <thead class="table-light">

                    <tr>

                        <th>
                            Subject
                        </th>

                        <th>
                            Sem
                        </th>

                        <th>
                            L-T-P
                        </th>

                        <th>
                            Credits
                        </th>

                        <th>
                            Theory
                        </th>

                        <th>
                            Co-Lab Faculty
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>

                <tbody id="subjectRows"></tbody>

            </table>

        </div>

    `;


    const tbody =
        document.getElementById(
            "subjectRows"
        );


    rows.forEach(
        subject => {

            tbody.insertAdjacentHTML(
                "beforeend",
                buildSubjectRow(
                    subject
                )
            );

        }
    );


    bindSubjectSelects();

    updateSubjectSummary();

    updateButtons();

    highlightSelectedFacultyRows();
}


// ============================================================
// BUILD SUBJECT ROW
// ============================================================

function buildSubjectRow(
    subject
) {

    const existing =
        existingAssignments[
            String(
                subject.subject_id
            )
        ] || {};


    const credits =
        Number(
            subject.credits || 0
        );


    const lecture =
        Number(
            subject.lecture_hours || 0
        );


    const tutorial =
        Number(
            subject.tutorial_hours || 0
        );


    const practical =
        Number(
            subject.practical_hours || 0
        );


    const theoryRequired = true;


    const labRequired =
        practical > 0;


    const complete =
        (!theoryRequired ||
            !!existing.theory) &&

        (!labRequired ||
            !!existing.lab);


    return `

        <tr
            class="subject-row"
            data-subject-id="${subject.subject_id}"
            data-search="${escapeHtml(
                `${subject.subject_code || ""} ${subject.subject_name || ""}`
            )}">


            <!-- SUBJECT -->

            <td>

                <div class="subject-code">

                    ${escapeHtml(
                        subject.subject_code || ""
                    )}

                </div>

                <div>

                    ${escapeHtml(
                        subject.subject_name || ""
                    )}

                </div>

                <div class="subject-meta">

                    ${escapeHtml(
                        subject.course_type ||
                        "CORE"
                    )}

                </div>

            </td>


            <!-- SEMESTER -->

            <td>

                Semester
                ${subject.semester_id}

            </td>


            <!-- L-T-P -->

            <td>

                ${lecture}-
                ${tutorial}-
                ${practical}

            </td>


            <!-- CREDITS -->

            <td>

                <strong>
                    ${credits}
                </strong>

                <div class="subject-meta">

                    ${
                        credits === 0
                            ? "0h"
                            : credits === 1
                                ? "2h"
                                : "4h"
                    }

                    theory load

                </div>

            </td>


            <!-- THEORY -->

            <td>

                ${
                    theoryRequired

                        ?

                    `
                    <select
                        class="form-select faculty-select theory-select"
                        data-subject-id="${subject.subject_id}">

                        ${buildFacultyOptions(
                            existing.theory
                        )}

                    </select>
                    `

                        :

                    `
                    <span class="text-muted small">

                        No theory

                    </span>
                    `
                }

            </td>


            <!-- CO-LAB -->

            <td>

                ${
                    labRequired

                        ?

                    `
                    <select
                        class="form-select faculty-select lab-select"
                        data-subject-id="${subject.subject_id}">

                        ${buildFacultyOptions(
                            existing.lab
                        )}

                    </select>

                    <div class="subject-meta mt-1">

                        Co-lab workload:
                        ${practical}h

                    </div>
                    `

                        :

                    `
                    <span class="text-muted small">

                        No lab

                    </span>
                    `
                }

            </td>


            <!-- STATUS -->

            <td>

                <span
                    class="status-pill ${
                        complete
                            ? "complete"
                            : ""
                    }">

                    ${
                        complete
                            ? "Assigned"
                            : "Pending"
                    }

                </span>

            </td>

        </tr>

    `;
}


// ============================================================
// FACULTY DROPDOWN OPTIONS
// ============================================================

function buildFacultyOptions(
    selectedValue
) {

    let html =
        `
        <option value="">
            Select Faculty
        </option>
        `;


    currentFaculty.forEach(
        faculty => {

            const selected =
                String(
                    faculty.faculty_id
                ) ===
                String(
                    selectedValue
                )
                    ? "selected"
                    : "";


            html += `

                <option
                    value="${faculty.faculty_id}"
                    ${selected}>

                    ${escapeHtml(
                        faculty.faculty_name
                    )}

                    ${
                        faculty.department_code
                            ? ` (${escapeHtml(
                                faculty.department_code
                            )})`
                            : ""
                    }

                </option>

            `;

        }
    );


    return html;
}


// ============================================================
// SUBJECT DROPDOWN EVENTS
// ============================================================

function bindSubjectSelects() {

    document
        .querySelectorAll(
            ".faculty-select"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                () => {

                    const row =
                        select.closest(
                            ".subject-row"
                        );


                    updateSubjectStatus(
                        row
                    );


                    updateWorkloadPreview();

                    highlightSelectedFacultyRows();

                    updateButtons();

                }
            );

        });
}


// ============================================================
// UPDATE SUBJECT STATUS
// ============================================================

function updateSubjectStatus(
    row
) {

    if (!row) return;


    const subjectId =
        row.dataset.subjectId;


    const subject =
        currentSubjects.find(
            item =>
                String(
                    item.subject_id
                ) ===
                String(
                    subjectId
                )
        );


    if (!subject) return;


    const theory =
        row.querySelector(
            ".theory-select"
        );


    const lab =
        row.querySelector(
            ".lab-select"
        );


    const theoryRequired = true;


    const labRequired =
        Number(
            subject.practical_hours || 0
        ) > 0;


    const complete =
        (
            !theoryRequired ||
            !!theory?.value
        ) &&

        (
            !labRequired ||
            !!lab?.value
        );


    const status =
        row.querySelector(
            ".status-pill"
        );


    if (!status) return;


    status.classList.toggle(
        "complete",
        !!complete
    );


    status.textContent =
        complete
            ? "Assigned"
            : "Pending";
}


// ============================================================
// WORKLOAD PREVIEW
// ============================================================

function updateWorkloadPreview() {

    const workloadMap = {};

    // Start every faculty at 0
    currentFaculty.forEach(faculty => {
        workloadMap[faculty.faculty_id] = 0;
    });


    document.querySelectorAll(".subject-row").forEach(row => {

        const subjectId = row.dataset.subjectId;

        const subject = currentSubjects.find(
            item =>
                String(item.subject_id) ===
                String(subjectId)
        );

        if (!subject) return;


        // ==========================================
        // GET SUBJECT HOURS
        // ==========================================

        const credits =
            Number(subject.credits || 0);

        let practical =
            Number(subject.practical_hours || 0);

        const lecture =
            Number(subject.lecture_hours || 0);

        const tutorial =
            Number(subject.tutorial_hours || 0);


        /*
         * If practical_hours is not supplied by
         * backend, calculate it from L-T-P.
         *
         * Example:
         * 3-0-2 -> practical = 2
         */

        if (!practical) {

            const ltp =
                subject.ltp ||
                subject.l_t_p ||
                subject.LTP ||
                "";

            if (ltp) {

                const parts =
                    String(ltp)
                        .split("-")
                        .map(Number);

                if (parts.length === 3) {

                    practical =
                        Number(parts[2] || 0);

                }

            }

        }


        // ==========================================
        // THEORY WORKLOAD
        // ==========================================

        let theoryHours = 0;

        // Theory workload only exists if
        // the subject has lecture or tutorial hours.

        if (lecture > 0 || tutorial > 0) {

            if (credits === 1) {

                theoryHours = 2;

            } else if (credits >= 2) {

                theoryHours = 4;

            }

        }


        /*
         * IMPORTANT:
         *
         * Theory and lab are separate workloads.
         *
         * Example:
         *
         * 4 credit + 2 practical
         *
         * Theory = 4h
         * Lab    = 2h
         * Total  = 6h
         */


        // ==========================================
        // SELECTED THEORY FACULTY
        // ==========================================

        const theoryFaculty =
            row.querySelector(
                ".theory-select"
            )?.value;


        // THEORY FACULTY
        // If subject has theory + lab,
        // Theory faculty gets BOTH workloads.

        if (
            theoryFaculty &&
            workloadMap[theoryFaculty] !== undefined
        ) {

            const theoryFacultyWorkload =
                theoryHours + practical;

            workloadMap[theoryFaculty] +=
                theoryFacultyWorkload;

        }

        // ==========================================
        // SELECTED CO-LAB FACULTY
        // ==========================================

        const labFaculty =
            row.querySelector(
                ".lab-select"
            )?.value;


        if (
            labFaculty &&
            workloadMap[labFaculty] !== undefined
        ) {

            workloadMap[labFaculty] +=
                practical;

        }

    });


    // ==========================================
    // UPDATE FACULTY CARDS
    // ==========================================

    document
        .querySelectorAll(".workload-card")
        .forEach(card => {

            const facultyId =
                card.dataset.facultyId;


            if (!facultyId) return;


            const faculty =
                currentFaculty.find(
                    item =>
                        String(item.faculty_id) ===
                        String(facultyId)
                );


            if (!faculty) return;


            // Existing saved workload
            const saved =
                Number(
                    faculty.assigned_workload || 0
                );


            // New workload from current selections
            const preview =
                Number(
                    workloadMap[faculty.faculty_id] || 0
                );


            // FINAL WORKLOAD
            const total =
                saved + preview;


            const target =
                Number(
                    faculty.max_workload || 0
                );


            // ======================================
            // UPDATE HOURS
            // ======================================

            const hours =
                card.querySelector(
                    ".workload-hours"
                );


            if (hours) {

                hours.textContent =
                    `${total}h / ${target}h`;

            }


            // ======================================
            // UPDATE PROGRESS
            // ======================================

            const progress =
                card.querySelector(
                    ".workload-progress > div"
                );


            if (progress) {

                const percentage =
                    target > 0
                        ? Math.min(
                            100,
                            Math.round(
                                (total / target) * 100
                            )
                        )
                        : 0;


                progress.style.width =
                    `${percentage}%`;

            }


            // ======================================
            // UPDATE REMAINING
            // ======================================

            const remaining =
                card.querySelector(
                    ".mt-2.small.text-muted"
                );


            if (remaining) {

                remaining.textContent =
                    `${Math.max(
                        0,
                        target - total
                    )}h remaining`;

            }

        });
}

// ============================================================
// SUBJECT SUMMARY
// ============================================================

function updateSubjectSummary() {

    const total =
        currentSubjects.length;


    let assigned = 0;


    document
        .querySelectorAll(
            ".subject-row"
        )
        .forEach(row => {

            const status =
                row.querySelector(
                    ".status-pill"
                );


            if (
                status &&
                status.classList.contains(
                    "complete"
                )
            ) {

                assigned++;

            }

        });


    const subjectText =
        isCommonSemester()
            ? `Semester ${selectedSemester} - ${selectedCycle === "P" ? "P-Cycle" : "C-Cycle"}`
            : "";


    document.getElementById(
        "subjectSummary"
    ).textContent =
        `${assigned} of ${total} subjects have required faculty assignments.${subjectText ? " " + subjectText : ""}`;


    const pending =
        Math.max(
            0,
            total - assigned
        );


    const badge =
        document.getElementById(
            "pendingBadge"
        );


    badge.textContent =
        `${pending} pending`;


    badge.classList.toggle(
        "complete",
        pending === 0
    );
}


// ============================================================
// SEARCH SUBJECTS
// ============================================================

function filterSubjectRows() {

    const search =
        document
            .getElementById(
                "subjectSearch"
            )
            .value
            .toLowerCase();


    document
        .querySelectorAll(
            ".subject-row"
        )
        .forEach(row => {

            row.style.display =
                row.dataset.search
                    .toLowerCase()
                    .includes(search)
                        ? ""
                        : "none";

        });

}


// ============================================================
// CLEAR SUBJECTS
// ============================================================

function clearSubjects() {

    currentSubjects = [];

    existingAssignments = {};


    document.getElementById(
        "subjectsContainer"
    ).innerHTML = `

        <div class="empty-state">

            <i
                class="bi bi-funnel fs-1 d-block mb-2">
            </i>

            Select department,
            scheme, semester type,
            academic year and semester.

        </div>

    `;


    document.getElementById(
        "subjectSummary"
    ).textContent =
        "Select department, scheme, semester type and semester.";


    document.getElementById(
        "pendingBadge"
    ).textContent =
        "0 pending";


    updateButtons();
}


// ============================================================
// ENABLE / DISABLE BUTTONS
// ============================================================

function updateButtons() {

    const department =
        document.getElementById(
            "filterDepartment"
        ).value;


    const scheme =
        document.getElementById(
            "filterScheme"
        ).value;


    const semesterType =
        document.getElementById(
            "filterSemesterType"
        ).value;


    const academicYear =
        document.getElementById(
            "filterAcademicYear"
        ).value;


    const valid =
        department &&
        scheme &&
        semesterType &&
        academicYear &&
        currentSubjects.length > 0;


    document.getElementById(
        "saveBtn"
    ).disabled = !valid;


    document.getElementById(
        "reassignBtn"
    ).disabled = !valid;
}
// ============================================================
// GET SUBJECT PRACTICAL HOURS
// ============================================================

function getSubjectPracticalHours(subject) {

    if (!subject) {
        return 0;
    }

    // 1. Backend practical_hours
    const practicalHours =
        Number(subject.practical_hours);

    if (
        Number.isFinite(practicalHours) &&
        practicalHours >= 0
    ) {
        return practicalHours;
    }

    // 2. Try L-T-P fields
    const ltp =
        subject.ltp ||
        subject.l_t_p ||
        subject.LTP ||
        subject["L-T-P"] ||
        subject.ltp_hours ||
        "";

    if (ltp) {

        const parts =
            String(ltp)
                .trim()
                .split("-")
                .map(value => Number(value));

        if (
            parts.length === 3 &&
            parts.every(value => Number.isFinite(value))
        ) {

            return Number(parts[2] || 0);

        }
    }

    // 3. Nothing found
    return 0;
}

// ============================================================
// SAVE / RE-ASSIGN
// ============================================================

async function saveAssignments(isReassign) {

    const academicYear =
        document.getElementById(
            "filterAcademicYear"
        ).value;

    const department =
        document.getElementById(
            "filterDepartment"
        ).value;

    const scheme =
        document.getElementById(
            "filterScheme"
        ).value;

    const semesterType =
        document.getElementById(
            "filterSemesterType"
        ).value;


    if (
        !academicYear ||
        !department ||
        !scheme ||
        !semesterType ||
        !currentSubjects.length
    ) {

        alert(
            "Select Department, Scheme, Semester Type, Academic Year and Semester first."
        );

        return;
    }


    if (
        isCommonSemester() &&
        !selectedCycle
    ) {

        alert(
            "Please select P-Cycle or C-Cycle."
        );

        return;
    }


    if (isReassign) {

        const confirmReassign =
            confirm(
                "Re-Assign will replace the saved faculty assignment for the selected subjects in the selected academic year. Continue?"
            );

        if (!confirmReassign) {
            return;
        }
    }


    // ============================================================
    // THEORY + CO-LAB VALIDATION
    // ============================================================

    const incompleteAssignments = [];


    document
        .querySelectorAll(".subject-row")
        .forEach(row => {

            const subjectId =
                row.dataset.subjectId;


            const subject =
                currentSubjects.find(
                    item =>
                        String(item.subject_id) ===
                        String(subjectId)
                );


            if (!subject) return;


            const theory =
                row.querySelector(
                    ".theory-select"
                )?.value || "";


            const lab =
                row.querySelector(
                    ".lab-select"
                )?.value || "";


            const lecture =
                Number(
                    subject.lecture_hours || 0
                );


            const tutorial =
                Number(
                    subject.tutorial_hours || 0
                );


            const practical =
                getSubjectPracticalHours(
                    subject
                );


            // Theory + Lab only
            const isTheoryAndLab =
                (
                    lecture > 0 ||
                    tutorial > 0
                ) &&
                practical > 0;


            if (!isTheoryAndLab) {
                return;
            }


            // Theory selected but Co-Lab missing
            if (
                theory &&
                !lab
            ) {

                incompleteAssignments.push(
                    `Semester ${subject.semester_id} - ${subject.subject_code} (${subject.subject_name}): Theory Faculty is assigned, but Co-Lab Faculty is not assigned.`
                );
            }


            // Co-Lab selected but Theory missing
            else if (
                !theory &&
                lab
            ) {

                incompleteAssignments.push(
                    `Semester ${subject.semester_id} - ${subject.subject_code} (${subject.subject_name}): Co-Lab Faculty is assigned, but Theory Faculty is not assigned.`
                );
            }

        });


    if (
        incompleteAssignments.length > 0
    ) {

        alert(
            "Please complete the Theory + Co-Lab assignment:\n\n" +
            incompleteAssignments.join("\n\n")
        );

        return;
    }


    // ============================================================
    // WORKLOAD LIMIT VALIDATION
    // ============================================================

    const workloadErrors =
        validateWorkloadLimits();

    if (workloadErrors.length > 0) {

        alert(
            "Workload Limit Exceeded!\n\n" +
            workloadErrors.join("\n\n")
        );

        return;
    }


    // ============================================================
    // CREATE ASSIGNMENTS
    // ============================================================

    const assignments = [];


    document
        .querySelectorAll(".subject-row")
        .forEach(row => {

            const subjectId =
                Number(
                    row.dataset.subjectId
                );


            const theory =
                row.querySelector(
                    ".theory-select"
                )?.value || null;


            const lab =
                row.querySelector(
                    ".lab-select"
                )?.value || null;


            assignments.push({

                subject_id:
                    subjectId,

                faculty_id:
                    theory,

                lab_faculty_id:
                    lab

            });

        });


    const button =
        document.getElementById(
            isReassign
                ? "reassignBtn"
                : "saveBtn"
        );


    button.disabled = true;


    button.innerHTML =
        `
        <span
            class="spinner-border spinner-border-sm me-1">
        </span>

        ${
            isReassign
                ? "Re-Assigning..."
                : "Saving..."
        }
        `;


    try {

        const result =
            await fetchJSON(
                API_URL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        academic_year:
                            academicYear,

                        department:
                            department,

                        scheme:
                            scheme,

                        semester_type:
                            semesterType,

                        semester:
                            selectedSemester ||
                            null,

                        cycle:
                            selectedCycle ||
                            null,

                        mode:
                            isReassign
                                ? "reassign"
                                : "save",

                        assignments:
                            assignments

                    })

                }
            );


        alert(
            result.message ||
            (
                isReassign
                    ? "Assignments re-assigned successfully."
                    : "Assignments saved successfully."
            )
        );


        await loadFacultyAndSubjects();


    } catch (error) {

        console.error(
            "Save error:",
            error
        );


        alert(
            "Unable to save assignments.\n\n" +
            error.message
        );


    } finally {

        button.innerHTML =
            isReassign

                ?

                `
                <i class="bi bi-arrow-repeat me-1"></i>
                Re-Assign
                `

                :

                `
                <i class="bi bi-save me-1"></i>
                Save Assignment
                `;


        updateButtons();

    }
}
function validateWorkloadLimits() {

    const workloadMap = {};

    currentFaculty.forEach(faculty => {
        workloadMap[faculty.faculty_id] = 0;
    });

    document
        .querySelectorAll(".subject-row")
        .forEach(row => {

            const subjectId =
                row.dataset.subjectId;

            const subject =
                currentSubjects.find(
                    item =>
                        String(item.subject_id) ===
                        String(subjectId)
                );

            if (!subject) return;

            const credits =
                Number(subject.credits || 0);

            const lecture =
                Number(subject.lecture_hours || 0);

            const tutorial =
                Number(subject.tutorial_hours || 0);

            const practical =
                getSubjectPracticalHours(subject);

            let theoryHours = 0;

            if (
                lecture > 0 ||
                tutorial > 0
            ) {

                if (credits === 1) {
                    theoryHours = 2;
                }
                else if (credits >= 2) {
                    theoryHours = 4;
                }
            }

            // Theory faculty
            const theoryFaculty =
                row.querySelector(
                    ".theory-select"
                )?.value;

            if (
                theoryFaculty &&
                workloadMap[theoryFaculty] !== undefined
            ) {

                workloadMap[theoryFaculty] +=
                    theoryHours +
                    (
                        theoryHours > 0
                            ? practical
                            : 0
                    );
            }

            // Co-Lab faculty
            const labFaculty =
                row.querySelector(
                    ".lab-select"
                )?.value;

            if (
                labFaculty &&
                workloadMap[labFaculty] !== undefined
            ) {

                workloadMap[labFaculty] +=
                    practical;
            }

        });

    const errors = [];

    currentFaculty.forEach(faculty => {

        const current =
            Number(
                faculty.assigned_workload || 0
            );

        const newWorkload =
            Number(
                workloadMap[
                    faculty.faculty_id
                ] || 0
            );

        const total =
            current + newWorkload;

        const maximum =
            Number(
                faculty.max_workload || 0
            );

        if (total > maximum) {

            const excess =
                total - maximum;

            errors.push(
                `Faculty: ${faculty.faculty_name}\n` +
                `Maximum Workload: ${maximum}h\n` +
                `Total Workload: ${total}h\n` +
                `Excess: ${excess}h`
            );
        }

    });

    return errors;
}


// ============================================================
// OPEN ADD FACULTY MODAL
// ============================================================

function openAddFacultyModal() {

    const modalElement =
        document.getElementById(
            "addFacultyModal"
        );


    const modal =
        bootstrap.Modal
            .getOrCreateInstance(
                modalElement
            );


    document.getElementById(
        "addFacultyDepartment"
    ).value = "";


    document.getElementById(
        "addFacultySelect"
    ).innerHTML =
        `
        <option value="">
            Select Department First
        </option>
        `;


    document.getElementById(
        "addFacultySelect"
    ).disabled = true;


    document.getElementById(
        "addFacultyPreview"
    ).innerHTML = "";


    modal.show();
}


// ============================================================
// LOAD FACULTY IN ADD MODAL
// ============================================================

async function loadModalFaculty() {

    const department =
        document.getElementById(
            "addFacultyDepartment"
        ).value;


    const select =
        document.getElementById(
            "addFacultySelect"
        );


    select.disabled = true;


    select.innerHTML =
        `
        <option value="">
            Loading faculty...
        </option>
        `;


    if (!department) {

        select.innerHTML =
            `
            <option value="">
                Select Department First
            </option>
            `;

        return;

    }


    try {

        const academicYear =
            document.getElementById(
                "filterAcademicYear"
            ).value;


        const faculty =
            await fetchJSON(
                `${FACULTY_API}/${encodeURIComponent(
                    department
                )}?academic_year=${encodeURIComponent(
                    academicYear || ""
                )}`
            );


        select.innerHTML =
            `
            <option value="">
                Select Faculty
            </option>
            `;


        faculty.forEach(
            item => {

                select.insertAdjacentHTML(
                    "beforeend",
                    `
                    <option value="${item.faculty_id}">

                        ${escapeHtml(
                            item.faculty_name
                        )}

                    </option>
                    `
                );

            }
        );


        select.disabled = false;


    } catch (error) {

        console.error(error);


        select.innerHTML =
            `
            <option value="">
                Error loading faculty
            </option>
            `;

    }
}


// ============================================================
// FACULTY PREVIEW IN MODAL
// ============================================================

async function showModalFacultyPreview() {

    const select =
        document.getElementById(
            "addFacultySelect"
        );


    const facultyId =
        select.value;


    const preview =
        document.getElementById(
            "addFacultyPreview"
        );


    if (!facultyId) {

        preview.innerHTML = "";

        return;

    }


    const department =
        document.getElementById(
            "addFacultyDepartment"
        ).value;


    try {

        const faculties =
            await fetchJSON(
                `${FACULTY_API}/${encodeURIComponent(
                    department
                )}`
            );


        const faculty =
            faculties.find(
                item =>
                    String(
                        item.faculty_id
                    ) ===
                    String(
                        facultyId
                    )
            );


        if (!faculty) return;


        preview.innerHTML = `

            <div class="alert alert-success mb-0">

                <strong>

                    ${escapeHtml(
                        faculty.faculty_name
                    )}

                </strong>

                <br>

                <small>

                    ${escapeHtml(
                        faculty.designation ||
                        "Faculty"
                    )}

                    •

                    Target workload:

                    ${faculty.max_workload || 0}h

                </small>

            </div>

        `;

    } catch (error) {

        console.error(error);

    }
}


// ============================================================
// ADD SELECTED FACULTY
// ============================================================

async function addSelectedFaculty() {

    const department =
        document.getElementById(
            "addFacultyDepartment"
        ).value;


    const facultyId =
        document.getElementById(
            "addFacultySelect"
        ).value;


    if (
        !department ||
        !facultyId
    ) {

        alert(
            "Select department and faculty."
        );

        return;

    }


    try {

        const academicYear =
            document.getElementById(
                "filterAcademicYear"
            ).value;


        const facultyList =
            await fetchJSON(
                `${FACULTY_API}/${encodeURIComponent(
                    department
                )}?academic_year=${encodeURIComponent(
                    academicYear || ""
                )}`
            );


        const faculty =
            facultyList.find(
                item =>
                    String(
                        item.faculty_id
                    ) ===
                    String(
                        facultyId
                    )
            );


        if (!faculty) {

            alert(
                "Faculty not found."
            );

            return;

        }


        const normalized =
            normalizeFaculty(
                faculty
            );


        if (
            !currentFaculty.some(
                item =>
                    String(
                        item.faculty_id
                    ) ===
                    String(
                        normalized.faculty_id
                    )
            )
        ) {

            manuallyAddedFaculty.push(
                normalized
            );

            currentFaculty.push(
                normalized
            );

        }


        renderWorkload(
            currentFaculty
        );


        renderSubjects();


        bootstrap.Modal
            .getInstance(
                document.getElementById(
                    "addFacultyModal"
                )
            )
            .hide();


        alert(
            `${faculty.faculty_name} is now available for subject assignment.`
        );


    } catch (error) {

        console.error(error);


        alert(
            error.message
        );

    }
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}