const API_BASE_URL = "http://127.0.0.1:5000";


/* =========================================
   LOAD ACADEMIC YEARS
========================================= */

async function loadAcademicYears() {

    const grid =
        document.getElementById("academicYearGrid");

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/academic-years`
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load academic years."
            );
        }

        const data = await response.json();

        grid.innerHTML = "";


        if (!data.length) {

            grid.innerHTML = `
                <div class="academic-year-empty">

                    <i class="bi bi-calendar-x"></i>

                    <p>
                        No academic years found.
                    </p>

                </div>
            `;

            return;
        }


        data.forEach(year => {

            const card =
                document.createElement("div");

            card.className =
                "academic-year-card";


            card.innerHTML = `

                <div class="academic-year-card-content">

                    <div class="academic-year-icon">

                        <i class="bi bi-calendar3"></i>

                    </div>

                    <div>

                        <div class="academic-year-value">

                            ${year.academic_year}

                        </div>

                        <div class="academic-year-label">

                            Academic Year

                        </div>

                    </div>

                </div>


                <div class="academic-year-card-actions">

                    <button
                        type="button"
                        class="academic-year-edit-btn"
                        onclick="editAcademicYear(
                            ${year.academic_year_id}
                        )">

                        <i class="bi bi-pencil"></i>

                        Edit

                    </button>


                    <button
                        type="button"
                        class="academic-year-delete-btn"
                        onclick="deleteAcademicYear(
                            ${year.academic_year_id}
                        )">

                        <i class="bi bi-trash"></i>

                        Delete

                    </button>

                </div>

            `;


            grid.appendChild(card);

        });


    } catch (error) {

        console.error(error);

        grid.innerHTML = `

            <div class="academic-year-empty">

                <i class="bi bi-exclamation-circle"></i>

                <p>
                    Unable to load academic years.
                </p>

            </div>

        `;

    }

}


/* =========================================
   SEARCH
========================================= */

document
    .getElementById("searchAcademicYear")
    .addEventListener("input", function () {

        const searchText =
            this.value.toLowerCase().trim();

        const rows =
            document.querySelectorAll(
                "#academicYearTableBody tr"
            );


        rows.forEach(row => {

            const text =
                row.textContent.toLowerCase();

            row.style.display =
                text.includes(searchText)
                    ? ""
                    : "none";

        });

    });


/* =========================================
   ADD ACADEMIC YEAR
========================================= */

document
    .getElementById("addAcademicYearBtn")
    .addEventListener("click", function () {

        const academicYear =
            prompt(
                "Enter Academic Year\nExample: 2026-27"
            );


        if (!academicYear) {
            return;
        }


        addAcademicYear(
            academicYear.trim()
        );

    });


async function addAcademicYear(academicYear) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/academic-years`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    academic_year: academicYear
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to add academic year."
            );

        }


        alert(
            "Academic year added successfully."
        );


        loadAcademicYears();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}


/* =========================================
   EDIT
========================================= */

async function editAcademicYear(id) {

    const newYear = prompt(
        "Enter the new Academic Year:"
    );

    if (!newYear) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/academic-years/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    academic_year: newYear.trim(),
                    status: "Active"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Failed to update academic year."
            );
        }

        alert(
            "Academic year updated successfully."
        );

        loadAcademicYears();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }
}


async function deleteAcademicYear(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this academic year?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/academic-years/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Failed to delete academic year."
            );
        }

        alert(
            "Academic year deleted successfully."
        );

        loadAcademicYears();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }
}


/* =========================================
   DELETE
========================================= */




/* =========================================
   INITIAL LOAD
========================================= */

loadAcademicYears();


let updateMode = false;


document
    .getElementById("updateAcademicYearBtn")
    .addEventListener("click", function () {

        updateMode = !updateMode;

        document.body.classList.toggle(
            "academic-year-update-mode",
            updateMode
        );

        this.classList.toggle(
            "active",
            updateMode
        );

    });