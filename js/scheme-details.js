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

            if (department.pdf_path) {

                pdfSection = `
                    <div class="scheme-pdf-section">

                        <div class="scheme-pdf-name">
                            <i class="bi bi-file-earmark-pdf-fill"></i>

                            Scheme PDF
                        </div>

                        <a
                            href="${API_BASE_URL}/scheme-pdfs/${department.pdf_path}"
                            class="scheme-download-btn"
                            target="_blank"
                            download>

                            <i class="bi bi-download"></i>

                            Download
                        </a>

                    </div>
                `;

            } else {

                pdfSection = `
                    <div class="scheme-pdf-section">

                        <div class="scheme-no-pdf">

                            <i class="bi bi-file-earmark"></i>

                            PDF not available

                        </div>

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