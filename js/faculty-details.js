// ============================================================
// FACULTY DETAILS PAGE
// EDIT / SAVE / CANCEL
// PROFILE IMAGE UPLOAD
// ============================================================

const API_BASE_URL = "http://127.0.0.1:5000";

let currentFaculty = null;
let originalFaculty = null;
let selectedProfileImage = null;


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    loadFacultyDetails();

});


// ============================================================
// GET FACULTY ID FROM URL
// ============================================================

function getFacultyId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("faculty_id");
}


// ============================================================
// LOAD FACULTY DETAILS
// ============================================================

async function loadFacultyDetails() {

    const facultyId =
        getFacultyId();

    if (!facultyId) {

        alert("Faculty ID not found.");

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/faculties/${facultyId}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load faculty details."
            );
        }


        const faculty =
            await response.json();


        currentFaculty = faculty;

        originalFaculty =
            JSON.parse(
                JSON.stringify(faculty)
            );


        displayFacultyDetails(
            faculty
        );


        setViewMode();


    } catch (error) {

        console.error(
            "Faculty loading error:",
            error
        );

        alert(
            "Unable to load faculty details."
        );
    }
}


// ============================================================
// DISPLAY FACULTY DETAILS
// ============================================================

function displayFacultyDetails(faculty) {


    // --------------------------------------------------------
    // BASIC INFORMATION
    // --------------------------------------------------------

    setText(
        "facultyName",
        faculty.faculty_name
    );


    setText(
        "facultyDesignation",
        faculty.designation
    );


    setText(
        "facultyDepartment",
        faculty.department_name
    );


    setText(
        "facultyDescription",
        faculty.faculty_description ||
        "-"
    );


    setText(
        "facultyStatus",
        faculty.status ||
        "-"
    );


    setText(
        "facultyJoinDate",
        formatDate(
            faculty.join_date
        )
    );


    setText(
        "facultyTeachingExperience",
        faculty.teaching_experience ||
        "-"
    );


    setText(
        "facultyWorkload",
        faculty.max_workload
            ? `${faculty.max_workload} Hours / Week`
            : "-"
    );


    // --------------------------------------------------------
    // QUALIFICATIONS
    // --------------------------------------------------------

    setText(
        "facultyQualifications",
        faculty.qualifications ||
        "-"
    );


    // --------------------------------------------------------
    // SKILLS
    // --------------------------------------------------------

    setText(
        "facultySkills",
        faculty.skills ||
        "-"
    );


    // --------------------------------------------------------
    // ACADEMIC CONTRIBUTIONS
    // --------------------------------------------------------

    setText(
        "facultyBooksPatents",
        faculty.books_patents ||
        "-"
    );


    setText(
        "facultyMemberships",
        faculty.professional_memberships ||
        "-"
    );


    setText(
        "facultyConsultancy",
        faculty.consultancy ||
        "-"
    );


    setText(
        "facultyAwards",
        faculty.awards ||
        "-"
    );


    setText(
        "facultyGrants",
        faculty.grants ||
        "-"
    );


    setText(
        "facultyNationalJournals",
        faculty.national_journals ||
        "-"
    );


    setText(
        "facultyInternationalJournals",
        faculty.international_journals ||
        "-"
    );


    setText(
        "facultyNationalConferences",
        faculty.national_conferences ||
        "-"
    );


    setText(
        "facultyInternationalConferences",
        faculty.international_conferences ||
        "-"
    );


    setText(
        "facultyPhdGuidance",
        faculty.phd_guidance ||
        "-"
    );


    setText(
        "facultyMastersProjects",
        faculty.masters_projects ||
        "-"
    );


    // --------------------------------------------------------
    // PROFILE IMAGE
    // --------------------------------------------------------

    displayProfileImage(
        faculty.profile_image
    );
}


// ============================================================
// DISPLAY PROFILE IMAGE
// ============================================================

function displayProfileImage(imagePath) {

    const image =
        document.getElementById(
            "facultyProfileImage"
        );


    if (!image) {
        return;
    }


    if (
        imagePath &&
        imagePath.trim() !== ""
    ) {

        let imageUrl =
            imagePath;


        if (
            !imagePath.startsWith(
                "http://"
            ) &&
            !imagePath.startsWith(
                "https://"
            )
        ) {

            imageUrl =
                `${API_BASE_URL}/${imagePath}`;
        }


        image.src =
            `${imageUrl}?t=${Date.now()}`;


    } else {

        image.src =
            "images/default-faculty.png";
    }


    image.onerror =
        function () {

            this.onerror = null;

            this.src =
                "images/default-faculty.png";
        };
}


// ============================================================
// SET TEXT
// ============================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value ?? "-";
    }
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (isNaN(date.getTime())) {
        return value;
    }


    return date.toLocaleDateString(
        "en-GB"
    );
}


// ============================================================
// EDIT MODE
// ============================================================

function enableFacultyEdit() {

    if (!currentFaculty) {
        return;
    }


    createEditableFields();


    document
        .getElementById(
            "editFacultyBtn"
        )
        ?.classList.add("d-none");


    document
        .getElementById(
            "saveFacultyBtn"
        )
        ?.classList.remove("d-none");


    document
        .getElementById(
            "cancelFacultyBtn"
        )
        ?.classList.remove("d-none");
}


// ============================================================
// CREATE EDITABLE FIELDS
// ============================================================

function createEditableFields() {

    createInput(
        "facultyName",
        "faculty_name",
        currentFaculty.faculty_name,
        "text"
    );


    createSelect(
        "facultyDesignation",
        "designation",
        currentFaculty.designation,
        [
            "Assistant Professor",
            "Associate Professor",
            "Professor",
            "HOD",
            "Principal"
        ]
    );


    createSelect(
        "facultyDepartment",
        "department",
        currentFaculty.department_code,
        [
            "AIML",
            "CSE",
            "ISE",
            "ECE",
            "VLSI",
            "ME",
            "CIV",
            "SH"
        ]
    );


    createTextarea(
        "facultyDescription",
        "faculty_description",
        currentFaculty.faculty_description
    );


    createSelect(
        "facultyStatus",
        "status",
        currentFaculty.status,
        [
            "Active",
            "Inactive"
        ]
    );


    createDateInput(
        "facultyJoinDate",
        "join_date",
        currentFaculty.join_date
    );


    createInput(
        "facultyTeachingExperience",
        "teaching_experience",
        currentFaculty.teaching_experience,
        "text"
    );


    // --------------------------------------------------------
    // WORKLOAD
    // --------------------------------------------------------
    // Workload is NOT editable.
    // It is automatically calculated from designation.


    createTextarea(
        "facultyQualifications",
        "qualifications",
        currentFaculty.qualifications
    );


    createTextarea(
        "facultySkills",
        "skills",
        currentFaculty.skills
    );


    createTextarea(
        "facultyBooksPatents",
        "books_patents",
        currentFaculty.books_patents
    );


    createTextarea(
        "facultyMemberships",
        "professional_memberships",
        currentFaculty.professional_memberships
    );


    createTextarea(
        "facultyConsultancy",
        "consultancy",
        currentFaculty.consultancy
    );


    createTextarea(
        "facultyAwards",
        "awards",
        currentFaculty.awards
    );


    createTextarea(
        "facultyGrants",
        "grants",
        currentFaculty.grants
    );


    createTextarea(
        "facultyNationalJournals",
        "national_journals",
        currentFaculty.national_journals
    );


    createTextarea(
        "facultyInternationalJournals",
        "international_journals",
        currentFaculty.international_journals
    );


    createTextarea(
        "facultyNationalConferences",
        "national_conferences",
        currentFaculty.national_conferences
    );


    createTextarea(
        "facultyInternationalConferences",
        "international_conferences",
        currentFaculty.international_conferences
    );


    createTextarea(
        "facultyPhdGuidance",
        "phd_guidance",
        currentFaculty.phd_guidance
    );


    createTextarea(
        "facultyMastersProjects",
        "masters_projects",
        currentFaculty.masters_projects
    );


    // --------------------------------------------------------
    // DESIGNATION CHANGE → UPDATE WORKLOAD PREVIEW
    // --------------------------------------------------------

    const designation =
        document.getElementById(
            "designation"
        );


    if (designation) {

        designation.addEventListener(
            "change",
            function () {

                updateWorkloadPreview(
                    this.value
                );

            }
        );
    }
}


// ============================================================
// CREATE INPUT
// ============================================================

function createInput(
    elementId,
    inputName,
    value,
    type = "text"
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    const input =
        document.createElement(
            "input"
        );


    input.type =
        type;


    input.name =
        inputName;


    input.id =
        inputName;


    input.className =
        "form-control";


    input.value =
        value || "";


    replaceElement(
        element,
        input
    );
}


// ============================================================
// CREATE DATE INPUT
// ============================================================

function createDateInput(
    elementId,
    inputName,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "date";


    input.name =
        inputName;


    input.id =
        inputName;


    input.className =
        "form-control";


    input.value =
        convertDateForInput(
            value
        );


    replaceElement(
        element,
        input
    );
}


// ============================================================
// CREATE TEXTAREA
// ============================================================

function createTextarea(
    elementId,
    inputName,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    const textarea =
        document.createElement(
            "textarea"
        );


    textarea.name =
        inputName;


    textarea.id =
        inputName;


    textarea.className =
        "form-control";


    textarea.rows =
        4;


    textarea.value =
        value || "";


    replaceElement(
        element,
        textarea
    );
}


// ============================================================
// CREATE SELECT
// ============================================================

function createSelect(
    elementId,
    selectName,
    selectedValue,
    options
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    const select =
        document.createElement(
            "select"
        );


    select.name =
        selectName;


    select.id =
        selectName;


    select.className =
        "form-select";


    options.forEach(
        function (optionValue) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                optionValue;


            option.textContent =
                optionValue;


            if (
                optionValue.toLowerCase() ===
                String(
                    selectedValue || ""
                ).toLowerCase()
            ) {

                option.selected =
                    true;
            }


            select.appendChild(
                option
            );

        }
    );


    replaceElement(
        element,
        select
    );
}


// ============================================================
// REPLACE DISPLAY ELEMENT
// ============================================================

function replaceElement(
    oldElement,
    newElement
) {

    oldElement.replaceWith(
        newElement
    );
}


// ============================================================
// DATE FOR INPUT
// ============================================================

function convertDateForInput(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date
        .toISOString()
        .split("T")[0];
}


// ============================================================
// WORKLOAD PREVIEW
// ============================================================

function updateWorkloadPreview(
    designation
) {

    let workload = 0;

    const value =
        String(
            designation || ""
        )
        .toLowerCase()
        .trim();


    if (
        value.includes(
            "principal"
        )
    ) {

        workload = 6;

    } else if (
        value.includes("hod") ||
        value.includes("head")
    ) {

        workload = 12;

    } else if (
        value.includes(
            "assistant professor"
        )
    ) {

        workload = 18;

    } else if (
        value.includes(
            "associate professor"
        )
    ) {

        workload = 16;

    } else if (
        value.includes(
            "professor"
        )
    ) {

        workload = 16;
    }


    setText(
        "facultyWorkload",
        workload
            ? `${workload} Hours / Week`
            : "-"
    );
}


// ============================================================
// PROFILE IMAGE SELECT
// ============================================================

function initializeFacultyImageUpload() {

    const uploadButton =
        document.getElementById(
            "facultyImageUploadBtn"
        );


    const fileInput =
        document.getElementById(
            "facultyImageInput"
        );


    const profileImage =
        document.getElementById(
            "facultyProfileImage"
        );


    if (
        !uploadButton ||
        !fileInput ||
        !profileImage
    ) {

        return;
    }


    uploadButton.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];


            if (!file) {
                return;
            }


            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                alert(
                    "Please select a JPG, PNG or WEBP image."
                );

                this.value = "";

                return;
            }


            const maxSize =
                5 * 1024 * 1024;


            if (
                file.size > maxSize
            ) {

                alert(
                    "Image size must be less than 5 MB."
                );

                this.value = "";

                return;
            }


            // Store the image.
            // It will be uploaded ONLY after Save.
            selectedProfileImage =
                file;


            // Preview only.
            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    profileImage.src =
                        event.target.result;

                };


            reader.readAsDataURL(
                file
            );

        }
    );
}


// ============================================================
// SAVE FACULTY DETAILS
// ============================================================

async function saveFacultyDetails() {

    const facultyId =
        getFacultyId();


    if (!facultyId) {

        alert(
            "Faculty ID not found."
        );

        return;
    }


    try {

        const facultyData = {

            faculty_name:
                getValue(
                    "faculty_name"
                ),

            department:
                getValue(
                    "department"
                ),

            designation:
                getValue(
                    "designation"
                ),

            status:
                getValue(
                    "status"
                )
        };


        const detailsData = {

            faculty_description:
                getValue(
                    "faculty_description"
                ),

            join_date:
                getValue(
                    "join_date"
                ),

            teaching_experience:
                getValue(
                    "teaching_experience"
                ),

            qualifications:
                getValue(
                    "qualifications"
                ),

            skills:
                getValue(
                    "skills"
                ),

            books_patents:
                getValue(
                    "books_patents"
                ),

            professional_memberships:
                getValue(
                    "professional_memberships"
                ),

            consultancy:
                getValue(
                    "consultancy"
                ),

            awards:
                getValue(
                    "awards"
                ),

            grants:
                getValue(
                    "grants"
                ),

            national_journals:
                getValue(
                    "national_journals"
                ),

            international_journals:
                getValue(
                    "international_journals"
                ),

            national_conferences:
                getValue(
                    "national_conferences"
                ),

            international_conferences:
                getValue(
                    "international_conferences"
                ),

            phd_guidance:
                getValue(
                    "phd_guidance"
                ),

            masters_projects:
                getValue(
                    "masters_projects"
                ),

            // Keep current image path
            profile_image:
                currentFaculty.profile_image ||
                null
        };


        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (
            !facultyData.faculty_name ||
            !facultyData.designation ||
            !facultyData.department
        ) {

            alert(
                "Faculty name, department and designation are required."
            );

            return;
        }


        // ----------------------------------------------------
        // SAVE MAIN FACULTY
        // ----------------------------------------------------

        const facultyResponse =
            await fetch(
                `${API_BASE_URL}/faculties/${facultyId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            facultyData
                        )
                }
            );


        const facultyResult =
            await facultyResponse.json();


        if (!facultyResponse.ok) {

            throw new Error(
                facultyResult.message ||
                "Unable to update faculty."
            );
        }


        // ----------------------------------------------------
        // SAVE FACULTY DETAILS
        // ----------------------------------------------------

        const detailsResponse =
            await fetch(
                `${API_BASE_URL}/faculties/${facultyId}/details`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            detailsData
                        )
                }
            );


        const detailsResult =
            await detailsResponse.json();


        if (!detailsResponse.ok) {

            throw new Error(
                detailsResult.message ||
                "Unable to update faculty details."
            );
        }


        // ----------------------------------------------------
        // UPLOAD NEW IMAGE
        // ----------------------------------------------------

        if (selectedProfileImage) {

            const formData =
                new FormData();


            formData.append(
                "profile_image",
                selectedProfileImage
            );


            const imageResponse =
                await fetch(
                    `${API_BASE_URL}/faculties/${facultyId}/profile-image`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const imageResult =
                await imageResponse.json();


            if (!imageResponse.ok) {

                throw new Error(
                    imageResult.message ||
                    "Faculty image upload failed."
                );
            }


            // Update local path
            currentFaculty.profile_image =
                imageResult.profile_image;
        }


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        alert(
            "Faculty details saved successfully!"
        );

        selectedProfileImage = null;

        // Reload the page completely.
        // This returns all fields to normal view mode.
        window.location.reload();


    } catch (error) {

        console.error(
            "Save faculty error:",
            error
        );


        alert(
            error.message ||
            "Unable to save faculty details."
        );
    }
}


// ============================================================
// GET INPUT VALUE
// ============================================================

function getValue(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return "";
    }


    return element.value.trim();
}


// ============================================================
// CANCEL EDIT
// ============================================================
function cancelFacultyEdit() {

    selectedProfileImage = null;

    if (!originalFaculty) {
        return;
    }

    // Restore original data
    currentFaculty =
        JSON.parse(
            JSON.stringify(
                originalFaculty
            )
        );

    // Reload the page.
    // This removes all input/select/textarea elements
    // and returns the page to normal view mode.
    window.location.reload();
}

// ============================================================
// VIEW MODE
// ============================================================

function setViewMode() {

    document
        .getElementById(
            "editFacultyBtn"
        )
        ?.classList.remove(
            "d-none"
        );


    document
        .getElementById(
            "saveFacultyBtn"
        )
        ?.classList.add(
            "d-none"
        );


    document
        .getElementById(
            "cancelFacultyBtn"
        )
        ?.classList.add(
            "d-none"
        );
}


// ============================================================
// INITIALIZE IMAGE UPLOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeFacultyImageUpload();

    }
);

// =====================================================
// BACK TO FACULTY MANAGEMENT
// =====================================================

function goBackToFaculty() {
    window.location.href = "faculty.html";
}

// =========================================================
// FACULTY IMAGE FULL-SCREEN VIEW
// =========================================================

function openFacultyImage() {

    const image = document.getElementById("facultyProfileImage");
    const modal = document.getElementById("facultyImageModal");
    const largeImage = document.getElementById("facultyLargeImage");

    if (!image || !modal || !largeImage) {
        console.error("Faculty image elements not found.");
        return;
    }

    // Use the currently displayed faculty image
    largeImage.src = image.src;

    // Show popup
    modal.classList.add("show");
}


function closeFacultyImage() {

    const modal = document.getElementById("facultyImageModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("show");
}


// Close popup using ESC key
document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closeFacultyImage();
    }

});