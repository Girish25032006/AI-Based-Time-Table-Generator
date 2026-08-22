// ============================================================
// GENERATE TIMETABLE - FRONTEND
// ONE TIMETABLE VERSION
// ============================================================

const API_BASE = "http://127.0.0.1:5000";

// ============================================================
// GLOBAL VARIABLES
// ============================================================

let selectedSemesterType = "";
let selectedSemesters = [];
let selectedCycle = "";
let generatedTimetableData = null;

// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    setupEventListeners();

    await Promise.all([
        loadAcademicYears(),
        loadDepartments(),
        loadSchemes()
    ]);

    syncSemesterTypeFromHTML();
    updateSemesterSelection();
    updateCycleSection();
});

// ============================================================
// FETCH JSON
// ============================================================

async function fetchJSON(url, options = {}) {
    const response = await fetch(API_BASE + url, options);

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed: ${response.status}`
        );
    }

    return data;
}

// ============================================================
// NORMALIZE SEMESTER TYPE
// ============================================================

function normalizeSemesterType(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const text = String(value).trim().toLowerCase();

    if (text === "odd" || text.startsWith("odd ")) {
        return "odd";
    }

    if (text === "even" || text.startsWith("even ")) {
        return "even";
    }

    if (text.includes("odd")) {
        return "odd";
    }

    if (text.includes("even")) {
        return "even";
    }

    return "";
}

// ============================================================
// SYNC SEMESTER TYPE
// ============================================================

function syncSemesterTypeFromHTML() {
    const select = document.getElementById("semesterType");

    if (!select) {
        selectedSemesterType = "";
        return;
    }

    selectedSemesterType = normalizeSemesterType(select.value);
}

// ============================================================
// LOAD ACADEMIC YEARS
// ============================================================

async function loadAcademicYears() {
    const select = document.getElementById("academicYear");

    if (!select) return;

    try {
        const data = await fetchJSON("/academic-years");

        select.innerHTML = `
            <option value="">Select Academic Year</option>
        `;

        if (!Array.isArray(data)) {
            return;
        }

        data.forEach(item => {
            let year = "";

            if (typeof item === "string") {
                year = item;
            } else if (Array.isArray(item)) {
                year = item[0] ?? "";
            } else {
                year =
                    item.academic_year ??
                    item.year ??
                    "";
            }

            if (!year) return;

            const option = document.createElement("option");

            option.value = year;
            option.textContent = year;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Academic year error:", error);
        showWarning("Unable to load academic years.");
    }
}

// ============================================================
// LOAD DEPARTMENTS
// ============================================================

async function loadDepartments() {
    const select = document.getElementById("department");

    if (!select) return;

    try {
        const data = await fetchJSON("/assignment-departments");

        select.innerHTML = `
            <option value="">Select Department</option>
        `;

        if (!Array.isArray(data)) {
            return;
        }

        data.forEach(item => {
            let id = "";
            let code = "";
            let name = "";

            if (Array.isArray(item)) {
                id = item[0] ?? "";
                code = item[1] ?? "";
                name = item[2] ?? "";
            } else {
                id =
                    item.department_id ??
                    item.id ??
                    "";

                code =
                    item.department_code ??
                    item.code ??
                    "";

                name =
                    item.department_name ??
                    item.name ??
                    "";
            }

            if (!code) return;

            const option = document.createElement("option");

            option.value = code;

            option.textContent =
                name
                    ? `${code} - ${name}`
                    : code;

            option.dataset.departmentId = id;
            option.dataset.departmentCode = code;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Department error:", error);
        showWarning("Unable to load departments.");
    }
}

// ============================================================
// LOAD SCHEMES
// ============================================================

async function loadSchemes() {
    const select = document.getElementById("scheme");

    if (!select) return;

    try {
        const data = await fetchJSON("/schemes");

        select.innerHTML = `
            <option value="">Select Scheme</option>
        `;

        if (!Array.isArray(data)) {
            return;
        }

        data.forEach(item => {
            let value = "";
            let text = "";

            if (Array.isArray(item)) {
                value = item[0] ?? "";
                text = item[1] ?? item[0] ?? "";
            } else {
                value =
                    item.scheme_id ??
                    item.id ??
                    item.scheme_year ??
                    item.scheme ??
                    "";

                text =
                    item.scheme_year ??
                    item.scheme_name ??
                    item.scheme ??
                    value;
            }

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                return;
            }

            const option = document.createElement("option");

            option.value = value;
            option.textContent = text;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Scheme error:", error);
        showWarning("Unable to load schemes.");
    }
}

// ============================================================
// SEMESTER TYPE CHANGE
// ============================================================

function handleSemesterTypeChange() {
    const select = document.getElementById("semesterType");

    if (!select) return;

    selectedSemesterType =
        normalizeSemesterType(select.value);

    selectedSemesters = [];
    selectedCycle = "";

    updateSemesterSelection();
    updateCycleSection();

    hideWarning();
}

// ============================================================
// UPDATE SEMESTER SELECTION
// ============================================================

function updateSemesterSelection() {
    const container =
        document.getElementById("semesterSelection");

    const info =
        document.getElementById("selectedSemesterText");

    if (!container) return;

    container.innerHTML = "";

    if (!selectedSemesterType) {
        selectedSemesters = [];

        if (info) {
            info.textContent =
                "Select semester type first.";
        }

        return;
    }

    if (selectedSemesterType === "odd") {
        selectedSemesters = [1, 3, 5, 7];
    } else {
        selectedSemesters = [2, 4, 6, 8];
    }

    selectedSemesters.forEach(semester => {
        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "btn btn-success semester-btn active";

        button.textContent =
            `${semester}${getOrdinal(semester)} Semester`;

        container.appendChild(button);
    });

    if (info) {
        info.textContent =
            selectedSemesters
                .map(
                    semester =>
                        `${semester}${getOrdinal(semester)}`
                )
                .join(", ");
    }
}

// ============================================================
// ORDINAL
// ============================================================

function getOrdinal(number) {
    if (
        number % 100 >= 11 &&
        number % 100 <= 13
    ) {
        return "th";
    }

    switch (number % 10) {
        case 1:
            return "st";

        case 2:
            return "nd";

        case 3:
            return "rd";

        default:
            return "th";
    }
}

// ============================================================
// CYCLE
// ============================================================

function updateCycleSection() {
    const section =
        document.getElementById("cycleSection");

    if (!section) return;

    const needsCycle =
        selectedSemesters.includes(1) ||
        selectedSemesters.includes(2);

    if (needsCycle) {
        section.classList.add("show");
    } else {
        section.classList.remove("show");
    }

    updateCycleInfo();
}

function selectPCycle() {
    selectedCycle = "P";

    document
        .getElementById("pCycleBtn")
        ?.classList.add("active");

    document
        .getElementById("cCycleBtn")
        ?.classList.remove("active");

    updateCycleInfo();
}

function selectCCycle() {
    selectedCycle = "C";

    document
        .getElementById("pCycleBtn")
        ?.classList.remove("active");

    document
        .getElementById("cCycleBtn")
        ?.classList.add("active");

    updateCycleInfo();
}

function updateCycleInfo() {
    const info =
        document.getElementById("cycleInfo");

    if (!info) return;

    const needsCycle =
        selectedSemesters.includes(1) ||
        selectedSemesters.includes(2);

    if (!needsCycle) {
        info.textContent =
            "P-Cycle / C-Cycle is not required for the selected semesters.";

        return;
    }

    if (!selectedCycle) {
        info.textContent =
            "Please select P-Cycle or C-Cycle.";

        return;
    }

    info.textContent =
        selectedCycle === "P"
            ? "Selected cycle: P-Cycle"
            : "Selected cycle: C-Cycle";
}

// ============================================================
// VALIDATION
// ============================================================

function validateGeneration() {
    const department =
        document.getElementById("department")?.value;

    const scheme =
        document.getElementById("scheme")?.value;

    const academicYear =
        document.getElementById("academicYear")?.value;

    selectedSemesterType =
        normalizeSemesterType(
            document.getElementById("semesterType")?.value
        );

    if (!department) {
        showWarning("Please select a Department.");
        return false;
    }

    if (!scheme) {
        showWarning("Please select a Scheme.");
        return false;
    }

    if (!selectedSemesterType) {
        showWarning(
            "Please select Odd or Even semester."
        );
        return false;
    }

    if (!academicYear) {
        showWarning(
            "Please select an Academic Year."
        );
        return false;
    }

    updateSemesterSelection();

    if (!selectedSemesters.length) {
        showWarning("No semesters selected.");
        return false;
    }

    const needsCycle =
        selectedSemesters.includes(1) ||
        selectedSemesters.includes(2);

    if (needsCycle && !selectedCycle) {
        showWarning(
            "Please select P-Cycle or C-Cycle."
        );
        return false;
    }

    return true;
}

// ============================================================
// REQUEST DATA
// ============================================================

function collectGenerationData() {
    const normalized =
        normalizeSemesterType(
            document.getElementById("semesterType")?.value
        );

    return {
        department:
            document.getElementById("department")?.value ||
            null,

        scheme:
            document.getElementById("scheme")?.value ||
            null,

        semester_type:
            normalized === "odd"
                ? "Odd"
                : "Even",

        academic_year:
            document.getElementById("academicYear")?.value ||
            null,

        semesters: [...selectedSemesters],

        cycle: selectedCycle || null,

        generate_options: 1
    };
}

// ============================================================
// LOADING
// ============================================================

function showLoading() {
    const box =
        document.getElementById("loadingBox");

    if (box) {
        box.style.display = "block";
    }

    const button =
        document.getElementById("generateBtn");

    if (button) {
        button.disabled = true;

        button.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2">
            </span>
            Generating...
        `;
    }
}

function hideLoading() {
    const box =
        document.getElementById("loadingBox");

    if (box) {
        box.style.display = "none";
    }

    const button =
        document.getElementById("generateBtn");

    if (button) {
        button.disabled = false;

        button.innerHTML = `
            <i class="bi bi-magic me-1"></i>
            Generate Timetable
        `;
    }
}

// ============================================================
// WARNING
// ============================================================

function showWarning(message) {
    const warning =
        document.getElementById("generationWarning");

    const text =
        document.getElementById(
            "generationWarningText"
        );

    if (!warning || !text) {
        alert(message);
        return;
    }

    text.textContent = message;

    warning.classList.remove("d-none");
}

function hideWarning() {
    document
        .getElementById("generationWarning")
        ?.classList.add("d-none");
}

// ============================================================
// GENERATE TIMETABLE
// ============================================================

async function generateTimetable() {
    hideWarning();

    if (!validateGeneration()) {
        return;
    }

    const requestData =
        collectGenerationData();

    console.log(
        "=========================================="
    );

    console.log("GENERATION REQUEST:");
    console.log(requestData);

    console.log(
        "=========================================="
    );

    showLoading();

    try {
        const result =
            await fetchJSON(
                "/generate-timetable",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestData
                        )
                }
            );

        console.log(
            "BACKEND RESPONSE:",
            result
        );

        if (result.success === false) {
            throw new Error(
                result.message ||
                "Timetable generation failed."
            );
        }

        generatedTimetableData = result;

        displayGeneratedTimetable(result);

    } catch (error) {
        console.error(
            "GENERATION ERROR:",
            error
        );

        showWarning(
            error.message ||
            "Unable to generate timetable."
        );

    } finally {
        hideLoading();
    }
}

// ============================================================
// DISPLAY GENERATED TIMETABLE
// ============================================================

function displayGeneratedTimetable(result) {
    const container =
        document.getElementById(
            "generatedResults"
        );

    if (!container) {
        console.error(
            "generatedResults not found."
        );
        return;
    }

    container.innerHTML = "";

    const timetable =
        result.timetable;

    if (!timetable) {
        showRawResponse(
            container,
            result
        );
        return;
    }

    // HEADER
    const header =
        document.createElement("div");

    header.className =
        "card page-card shadow-sm mb-4";

    header.innerHTML = `
        <div class="card-body">

            <h4 class="section-title mb-1">

                <i class="bi bi-calendar-check me-2"></i>

                Generated Timetable

            </h4>

            <p class="text-muted mb-0">

                ${escapeHTML(
                    result.department || ""
                )}

                &nbsp; | &nbsp;

                Academic Year:
                ${escapeHTML(
                    result.academic_year || ""
                )}

                &nbsp; | &nbsp;

                Scheme:
                ${escapeHTML(
                    String(result.scheme || "")
                )}

            </p>

        </div>
    `;

    container.appendChild(header);

    // SAVE BUTTON
    const saveBox =
        document.createElement("div");

    saveBox.className =
        "d-flex justify-content-end mb-3";

    saveBox.innerHTML = `
        <button
            type="button"
            id="saveTimetableBtn"
            class="btn btn-success">

            <i class="bi bi-save me-1"></i>

            Save Timetable

        </button>
    `;

    container.appendChild(saveBox);

    document
        .getElementById(
            "saveTimetableBtn"
        )
        ?.addEventListener(
            "click",
            saveTimetable
        );

    // SEMESTER DATA
    const semesterData =
        extractSemesterData(
            timetable,
            result.semesters ||
            selectedSemesters
        );

    if (!semesterData.length) {
        showRawResponse(
            container,
            result
        );
        return;
    }

    semesterData.forEach(item => {
        renderSemester(
            container,
            item.semester,
            item.data,
            result
        );
    });
}

// ============================================================
// SAVE TIMETABLE
// ============================================================

async function saveTimetable() {
    if (!generatedTimetableData) {
        alert(
            "Please generate a timetable first."
        );
        return;
    }

    const button =
        document.getElementById(
            "saveTimetableBtn"
        );

    const departmentSelect =
        document.getElementById(
            "department"
        );

    const selectedDepartmentOption =
        departmentSelect
            ?.selectedOptions?.[0];

    const departmentId =
        selectedDepartmentOption
            ?.dataset
            ?.departmentId;

    const departmentCode =
        departmentSelect?.value || "";

    const schemeSelect =
        document.getElementById("scheme");

    const schemeId =
        schemeSelect?.value || "";

    const academicYear =
        document.getElementById(
            "academicYear"
        )?.value || "";

    const normalizedSemesterType =
        normalizeSemesterType(
            document.getElementById(
                "semesterType"
            )?.value
        );

    const semesterType =
        normalizedSemesterType === "odd"
            ? "Odd"
            : "Even";

    // VALIDATION
    if (
        departmentId === undefined ||
        departmentId === null ||
        departmentId === "" ||
        Number.isNaN(Number(departmentId))
    ) {
        alert(
            "Department ID is missing. Please select the Department again."
        );
        return;
    }

    if (
        schemeId === undefined ||
        schemeId === null ||
        schemeId === "" ||
        Number.isNaN(Number(schemeId))
    ) {
        alert(
            "Scheme ID is missing. Please select the Scheme again."
        );
        return;
    }

    if (!academicYear) {
        alert(
            "Academic Year is missing."
        );
        return;
    }

    if (!normalizedSemesterType) {
        alert(
            "Semester Type is missing."
        );
        return;
    }

    // BUTTON
    if (button) {
        button.disabled = true;

        button.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2">
            </span>

            Saving...
        `;
    }

    try {
        const saveData = {
            department_id:
                Number(departmentId),

            scheme_id:
                Number(schemeId),

            department:
                departmentCode,

            scheme:
                schemeId,

            academic_year:
                academicYear,

            semester_type:
                semesterType,

            semesters:
                Array.isArray(
                    generatedTimetableData.semesters
                )
                    ? generatedTimetableData.semesters
                    : [...selectedSemesters],

            cycle:
                generatedTimetableData.cycle ??
                selectedCycle ??
                null,

            timetable:
                generatedTimetableData.timetable
        };

        console.log(
            "=========================================="
        );

        console.log(
            "SAVE TIMETABLE REQUEST:"
        );

        console.log(
            JSON.stringify(
                saveData,
                null,
                2
            )
        );

        console.log(
            "=========================================="
        );

        const response =
            await fetchJSON(
                "/save-timetable",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            saveData
                        )
                }
            );

        console.log(
            "SAVE TIMETABLE RESPONSE:",
            response
        );

        alert(
            response.message ||
            "Timetable saved successfully."
        );

        if (button) {
            button.disabled = true;

            button.innerHTML = `
                <i class="bi bi-check-circle me-1"></i>
                Saved
            `;
        }

    } catch (error) {
        console.error(
            "SAVE TIMETABLE ERROR:",
            error
        );

        alert(
            error.message ||
            "Failed to save timetable."
        );

        if (button) {
            button.disabled = false;

            button.innerHTML = `
                <i class="bi bi-save me-1"></i>
                Save Timetable
            `;
        }
    }
}

// ============================================================
// EXTRACT SEMESTER DATA
// ============================================================

function extractSemesterData(
    timetable,
    semesters
) {
    const output = [];

    if (
        timetable &&
        typeof timetable === "object" &&
        !Array.isArray(timetable)
    ) {
        const keys =
            Object.keys(timetable);

        for (
            const semester of semesters
        ) {
            const key =
                String(semester);

            if (
                Object.prototype.hasOwnProperty.call(
                    timetable,
                    key
                )
            ) {
                output.push({
                    semester:
                        Number(semester),

                    data:
                        timetable[key]
                });
            }
        }

        if (!output.length) {
            keys.forEach(key => {
                if (
                    /^\d+$/.test(
                        String(key)
                    )
                ) {
                    output.push({
                        semester:
                            Number(key),

                        data:
                            timetable[key]
                    });
                }
            });
        }
    }

    if (Array.isArray(timetable)) {
        timetable.forEach(item => {
            if (!item) return;

            const semester =
                item.semester ??
                item.semester_id;

            const data =
                item.timetable ??
                item.schedule ??
                item.data ??
                item;

            if (
                semester !== undefined
            ) {
                output.push({
                    semester:
                        Number(semester),

                    data
                });
            }
        });
    }

    return output.sort(
        (a, b) =>
            a.semester -
            b.semester
    );
}

// ============================================================
// RENDER SEMESTER
// ============================================================

function renderSemester(
    container,
    semester,
    data,
    result
) {
    const card =
        document.createElement("div");

    card.className =
        "card page-card shadow-sm mb-4";

    const body =
        document.createElement("div");

    body.className =
        "card-body";

    body.innerHTML = `
        <h5 class="section-title mb-3">

            <i class="bi bi-mortarboard me-2"></i>

            ${semester}${getOrdinal(semester)}
            Semester

        </h5>
    `;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "table-responsive";

    const table =
        document.createElement("table");

    // FIXED: valid single-line className
    table.className =
        "table table-bordered table-hover text-center align-middle timetable-table";

    table.innerHTML = `
        <thead class="table-success">

            <tr>

                <th
                    style="
                        min-width:120px;
                        vertical-align:middle;
                    "
                >
                    Week / Day
                </th>

                <th>P1</th>
                <th>P2</th>
                <th>P3</th>
                <th>P4</th>
                <th>P5</th>
                <th>P6</th>
                <th>P7</th>

            </tr>

        </thead>

        <tbody></tbody>
    `;

    const tbody =
        table.querySelector("tbody");

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    days.forEach(day => {
        const row =
            document.createElement("tr");

        const dayCell =
            document.createElement("th");

        dayCell.textContent = day;

        dayCell.className =
            "table-light";

        dayCell.style.minWidth =
            "120px";

        dayCell.style.verticalAlign =
            "middle";

        row.appendChild(dayCell);

        for (
            let period = 1;
            period <= 7;
            period++
        ) {
            const current =
                getBackendSlot(
                    data,
                    day,
                    period
                );

            const previous =
                period > 1
                    ? getBackendSlot(
                        data,
                        day,
                        period - 1
                    )
                    : null;

            // LAB CONTINUATION
            if (
                period > 1 &&
                isLabSlot(current) &&
                isLabSlot(previous) &&
                sameSlotSubject(
                    current,
                    previous
                )
            ) {
                continue;
            }

            const cell =
                document.createElement("td");

            cell.style.minWidth =
                "150px";

            cell.style.height =
                "90px";

            cell.style.verticalAlign =
                "middle";

            const next =
                period < 7
                    ? getBackendSlot(
                        data,
                        day,
                        period + 1
                    )
                    : null;

            // MERGE TWO LAB PERIODS
            if (
                isLabSlot(current) &&
                isLabSlot(next) &&
                sameSlotSubject(
                    current,
                    next
                )
            ) {
                cell.colSpan = 2;

                cell.style.minWidth =
                    "300px";

                cell.innerHTML =
                    formatBackendSlot(
                        current
                    );

                row.appendChild(cell);

                period++;

                continue;
            }

            cell.innerHTML =
                formatBackendSlot(current);

            row.appendChild(cell);
        }

        tbody.appendChild(row);
    });

    wrapper.appendChild(table);

    body.appendChild(wrapper);

    card.appendChild(body);

    container.appendChild(card);
}

// ============================================================
// GET BACKEND SLOT
// ============================================================

function getBackendSlot(
    data,
    day,
    period
) {
    if (
        data === null ||
        data === undefined
    ) {
        return null;
    }

    if (
        data[day] !== undefined &&
        data[day] !== null
    ) {
        const dayData =
            data[day];

        if (Array.isArray(dayData)) {
            return (
                dayData[period - 1] ??
                null
            );
        }

        if (
            typeof dayData === "object"
        ) {
            const pKey =
                `P${period}`;

            if (
                Object.prototype.hasOwnProperty.call(
                    dayData,
                    pKey
                )
            ) {
                return dayData[pKey];
            }

            if (
                Object.prototype.hasOwnProperty.call(
                    dayData,
                    String(period)
                )
            ) {
                return dayData[
                    String(period)
                ];
            }

            return null;
        }
    }

    if (
        data[period] &&
        typeof data[period] === "object"
    ) {
        return (
            data[period][day] ??
            data[period][day.toLowerCase()] ??
            null
        );
    }

    const periodKey =
        `P${period}`;

    if (
        data[periodKey] &&
        typeof data[periodKey] === "object"
    ) {
        return (
            data[periodKey][day] ??
            data[periodKey][day.toLowerCase()] ??
            null
        );
    }

    if (Array.isArray(data.slots)) {
        const found =
            data.slots.find(slot => {
                const slotDay =
                    String(
                        slot.day ??
                        slot.weekday ??
                        ""
                    ).toLowerCase();

                const slotPeriod =
                    Number(
                        slot.period ??
                        slot.period_number ??
                        0
                    );

                return (
                    slotDay ===
                    day.toLowerCase() &&
                    slotPeriod === period
                );
            });

        if (found) {
            return found;
        }
    }

    if (Array.isArray(data.schedule)) {
        const found =
            data.schedule.find(slot => {
                const slotDay =
                    String(
                        slot.day ??
                        slot.weekday ??
                        ""
                    ).toLowerCase();

                const slotPeriod =
                    Number(
                        slot.period ??
                        slot.period_number ??
                        0
                    );

                return (
                    slotDay ===
                    day.toLowerCase() &&
                    slotPeriod === period
                );
            });

        if (found) {
            return found;
        }
    }

    return null;
}

// ============================================================
// LAB CHECK
// ============================================================

function isLabSlot(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return false;
    }

    if (typeof value === "string") {
        return value
            .toUpperCase()
            .includes("(LAB)");
    }

    if (typeof value === "object") {
        const type =
            value.type ??
            value.class_type ??
            value.session_type ??
            "";

        return (
            value.is_lab === true ||
            value.lab === true ||
            String(type)
                .toLowerCase()
                .includes("lab")
        );
    }

    return false;
}

// ============================================================
// GET SUBJECT CODE
// ============================================================

function getSlotSubjectCode(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (typeof value === "string") {
        return value
            .replace(
                /\s*\(LAB\)\s*/gi,
                ""
            )
            .trim()
            .split(/\s+/)[0]
            .toUpperCase();
    }

    if (typeof value === "object") {
        return String(
            value.subject_code ??
            value.subjectCode ??
            value.code ??
            value.subject ??
            value.name ??
            ""
        )
            .trim()
            .toUpperCase();
    }

    return String(value)
        .trim()
        .toUpperCase();
}

// ============================================================
// SAME LAB SUBJECT
// ============================================================

function sameSlotSubject(
    first,
    second
) {
    const subject1 =
        getSlotSubjectCode(first);

    const subject2 =
        getSlotSubjectCode(second);

    return (
        subject1 !== "" &&
        subject1 === subject2
    );
}

// ============================================================
// FORMAT SLOT
// ============================================================

function formatBackendSlot(value) {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "Empty" ||
        value === "empty" ||
        value === "FREE"
    ) {
        return `
            <span class="text-muted">
                Free
            </span>
        `;
    }

    if (typeof value === "string") {
        const isLab =
            /\(LAB\)/i.test(value);

        const clean =
            value
                .replace(
                    /\s*\(LAB\)\s*/gi,
                    ""
                )
                .trim();

        return `
            <strong>
                ${escapeHTML(clean)}
            </strong>

            ${
                isLab
                    ? `
                        <div>

                            <span
                                class="badge bg-success mt-1">

                                LAB

                            </span>

                        </div>
                    `
                    : ""
            }
        `;
    }

    if (typeof value === "object") {
        const code =
            value.subject_code ??
            value.subjectCode ??
            value.code ??
            value.subject ??
            value.name ??
            "";

        const name =
            value.subject_name ??
            value.subjectName ??
            "";

        const faculty =
            value.faculty_name ??
            value.facultyName ??
            value.faculty ??
            "";

        const type =
            value.type ??
            value.class_type ??
            value.session_type ??
            "";

        const isLab =
            value.is_lab === true ||
            value.lab === true ||
            String(type)
                .toLowerCase()
                .includes("lab");

        let html = "";

        if (code) {
            html += `
                <strong>
                    ${escapeHTML(
                        String(code)
                    )}
                </strong>
            `;
        }

        if (name) {
            html += `
                <div
                    class="small text-muted mt-1">

                    ${escapeHTML(
                        String(name)
                    )}

                </div>
            `;
        }

        if (isLab) {
            html += `
                <div>

                    <span
                        class="badge bg-success mt-1">

                        LAB

                    </span>

                </div>
            `;
        }

        if (faculty) {
            html += `
                <div
                    class="small mt-1">

                    ${escapeHTML(
                        String(faculty)
                    )}

                </div>
            `;
        }

        if (!html) {
            html = `
                <span>
                    ${escapeHTML(
                        JSON.stringify(value)
                    )}
                </span>
            `;
        }

        return html;
    }

    return escapeHTML(String(value));
}

// ============================================================
// RAW RESPONSE
// ============================================================

function showRawResponse(
    container,
    result
) {
    container.innerHTML = `
        <div
            class="card page-card shadow-sm">

            <div class="card-body">

                <h5 class="section-title">
                    Timetable Generated
                </h5>

                <p class="text-muted">
                    Backend generation was successful,
                    but the timetable structure could
                    not be rendered.
                </p>

                <pre
                    class="bg-light p-3 rounded"
                    style="
                        max-height:500px;
                        overflow:auto;
                        text-align:left;
                    "
                >${escapeHTML(
                    JSON.stringify(
                        result,
                        null,
                        2
                    )
                )}</pre>

            </div>

        </div>
    `;
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    document
        .getElementById("semesterType")
        ?.addEventListener(
            "change",
            handleSemesterTypeChange
        );

    document
        .getElementById("pCycleBtn")
        ?.addEventListener(
            "click",
            selectPCycle
        );

    document
        .getElementById("cCycleBtn")
        ?.addEventListener(
            "click",
            selectCCycle
        );

    document
        .getElementById("generateBtn")
        ?.addEventListener(
            "click",
            generateTimetable
        );
}

// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.generateTimetable =
    generateTimetable;

window.selectPCycle =
    selectPCycle;

window.selectCCycle =
    selectCCycle;

window.saveTimetable =
    saveTimetable;