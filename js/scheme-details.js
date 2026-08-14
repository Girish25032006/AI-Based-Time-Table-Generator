const API_BASE_URL = "http://127.0.0.1:5000";


async function loadSchemeDetails() {

    const params = new URLSearchParams(
        window.location.search
    );

    const schemeId = params.get("scheme_id");

    if (!schemeId) {

        document.getElementById("schemeTitle").textContent =
            "No scheme selected.";

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/scheme-details/${schemeId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load scheme details");
        }

        const data = await response.json();


        document.getElementById("schemeTitle").textContent =
            `${data.scheme_year} Scheme`;


        const container =
            document.getElementById("schemeDetails");

        container.innerHTML = "";


        data.departments.forEach(department => {

            let pdfSection = "";

                if (department.pdfs && department.pdfs.length > 0) {

                    pdfSection = `
                        <div class="scheme-pdf-section">

                            ${department.pdfs.map(pdf => `
                                
                                <div class="scheme-pdf-item">

                                    <div class="scheme-pdf-name">

                                        <i class="bi bi-file-earmark-pdf-fill"></i>

                                        ${pdf.pdf_name}

                                    </div>

                                    <a
                                        href="${API_BASE_URL}/scheme-pdfs/${pdf.pdf_path.replace("scheme-pdfs/", "")}"
                                        class="scheme-download-btn"
                                        target="_blank"
                                        download>

                                        <i class="bi bi-download"></i>

                                        Download

                                    </a>
                                    <button
                                        type="button"
                                        class="scheme-reupload-btn"
                                        data-pdf-id="${pdf.id}"
                                        style="display: none;">

                                        <i class="bi bi-upload"></i>

                                        Re-upload

                                    </button>

                                </div>

                            `).join("")}

                        </div>
                    `;

                } else if (department.pdf_path) {

                    pdfSection = `
                        <div class="scheme-pdf-section">

                            <div class="scheme-pdf-item">

                                <div class="scheme-pdf-name">

                                    <i class="bi bi-file-earmark-pdf-fill"></i>

                                    Scheme PDF

                                </div>

                                <div class="scheme-pdf-actions">

                                    <a
                                        href="${API_BASE_URL}/scheme-pdfs/${department.pdf_path.replace("scheme-pdfs/", "")}"
                                        class="scheme-download-btn"
                                        target="_blank"
                                        download>

                                        <i class="bi bi-download"></i>

                                        Download

                                    </a>

                                    <button
                                        type="button"
                                        class="scheme-reupload-btn"
                                        data-pdf-type="main"
                                        data-scheme-department-id="${department.id}"
                                        style="display: none;">

                                        <i class="bi bi-upload"></i>

                                        Re-upload

                                    </button>

                                </div>

                            </div>

                        </div>
                    `;

                } else {

                    pdfSection = `
                        <div class="scheme-pdf-section">

                            <div class="scheme-no-pdf">

                                <i class="bi bi-file-earmark"></i>

                                PDF not available

                            </div>

                            <button
                                type="button"
                                class="scheme-upload-btn"
                                data-pdf-type="main"
                                data-scheme-id="${data.scheme_id}"
                                data-department-id="${department.department_id}"
                                data-scheme-department-id="${department.id || ""}">

                                <i class="bi bi-upload"></i>

                                Upload

                            </button>

                        </div>
                    `;

                }


            container.innerHTML += `

                <div class="scheme-department-box">

                    <div class="scheme-department-top">

                        <div class="scheme-department-icon">

                            <i class="bi bi-building"></i>

                        </div>


                        <div class="scheme-department-info">

                            <div class="scheme-department-code">

                                ${department.department_code}

                            </div>


                            <div class="scheme-department-name">

                                ${department.department_name}

                            </div>

                        </div>

                    </div>


                    ${pdfSection}

                </div>

            `;

        });


    } catch (error) {

        console.error(error);

        document.getElementById("schemeTitle").textContent =
            "Unable to load scheme details.";

    }

}


loadSchemeDetails();


/* =========================================
   UPLOAD NEW DEPARTMENT PDF
========================================= */

document.addEventListener("click", function (event) {

    const uploadButton =
        event.target.closest(".scheme-upload-btn");

    if (!uploadButton) {
        return;
    }


    const schemeId =
        uploadButton.dataset.schemeId;


    const departmentId =
        uploadButton.dataset.departmentId;


    const schemeDepartmentId =
        uploadButton.dataset.schemeDepartmentId;


    if (!schemeId || !departmentId) {

        alert(
            "Scheme or department information not found."
        );

        return;
    }


    const fileInput =
        document.createElement("input");

    fileInput.type = "file";

    fileInput.accept = "application/pdf";


    fileInput.onchange = async function () {

        const file =
            fileInput.files[0];


        if (!file) {
            return;
        }


        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {

            alert("Please select a PDF file.");

            return;
        }


        const formData =
            new FormData();


        formData.append(
            "pdf_type",
            "main"
        );


        formData.append(
            "scheme_id",
            schemeId
        );


        formData.append(
            "department_id",
            departmentId
        );


        if (schemeDepartmentId) {

            formData.append(
                "scheme_department_id",
                schemeDepartmentId
            );

        }


        formData.append(
            "file",
            file
        );


        try {

            uploadButton.disabled = true;

            uploadButton.innerHTML = `
                <i class="bi bi-hourglass-split"></i>
                Uploading...
            `;


            const response =
                await fetch(
                    `${API_BASE_URL}/api/scheme-pdf/reupload`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error ||
                    "Upload failed."
                );

            }


            alert(
                "PDF uploaded successfully."
            );


            await loadSchemeDetails();


        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Failed to upload PDF."
            );


            uploadButton.disabled = false;

            uploadButton.innerHTML = `
                <i class="bi bi-upload"></i>
                Upload
            `;

        }

    };


    fileInput.click();

});
/* =========================================
   SEARCH DEPARTMENT
========================================= */

document
    .getElementById("searchDepartment")
    .addEventListener("input", function () {

        const searchValue =
            this.value.toLowerCase().trim();

        const departmentBoxes =
            document.querySelectorAll(
                ".scheme-department-box"
            );

        departmentBoxes.forEach(box => {

            const text =
                box.textContent.toLowerCase();

            if (text.includes(searchValue)) {

                box.style.display = "";

            } else {

                box.style.display = "none";

            }

        });

    });
    /* =========================================
   UPDATE MODE
========================================= */

let schemeUpdateMode = false;

const updateButton =
    document.getElementById("updateSchemeDetails");


updateButton.addEventListener("click", function () {

    schemeUpdateMode = !schemeUpdateMode;

    if (schemeUpdateMode) {

        this.textContent = "Save";

    } else {

        this.textContent = "Update";

    }

    document
        .querySelectorAll(".scheme-reupload-btn")
        .forEach(button => {

            button.style.display =
                schemeUpdateMode ? "inline-flex" : "none";

        });

});
/* =========================================
   RE-UPLOAD PDF
========================================= */

/* =========================================
   RE-UPLOAD PDF
========================================= */

document.addEventListener("click", function (event) {

    const button =
        event.target.closest(".scheme-reupload-btn");

    if (!button) {
        return;
    }


    const pdfType =
        button.dataset.pdfType;


    const pdfId =
        button.dataset.pdfId;


    const schemeDepartmentId =
        button.dataset.schemeDepartmentId;


    // SH / additional PDF
    if (pdfType === "additional" && !pdfId) {

        alert("PDF information not found.");

        return;
    }


    // Normal department PDF
    if (pdfType === "main" && !schemeDepartmentId) {

        alert("Department PDF information not found.");

        return;
    }


    // Create file input
    const fileInput =
        document.createElement("input");

    fileInput.type = "file";
    fileInput.accept = "application/pdf";


    // Open file explorer
    fileInput.click();


    fileInput.addEventListener(
        "change",
        async function () {

            const file =
                this.files[0];


            if (!file) {
                return;
            }


            if (
                file.type !== "application/pdf" &&
                !file.name.toLowerCase().endsWith(".pdf")
            ) {

                alert("Please select a PDF file.");

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "pdf_type",
                pdfType
            );


            if (pdfType === "additional") {

                formData.append(
                    "pdf_id",
                    pdfId
                );

            }


            if (pdfType === "main") {

                formData.append(
                    "scheme_department_id",
                    schemeDepartmentId
                );

            }


            formData.append(
                "file",
                file
            );


            try {

                button.disabled = true;

                button.innerHTML = `
                    <i class="bi bi-hourglass-split"></i>
                    Uploading...
                `;


                const response =
                    await fetch(
                        `${API_BASE_URL}/api/scheme-pdf/reupload`,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Upload failed."
                    );

                }


                alert(
                    "PDF re-uploaded successfully."
                );


                await loadSchemeDetails();


            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "Failed to re-upload PDF."
                );


            } finally {

                button.disabled = false;

                button.innerHTML = `
                    <i class="bi bi-upload"></i>
                    Re-upload
                `;

            }

        }
    );

});