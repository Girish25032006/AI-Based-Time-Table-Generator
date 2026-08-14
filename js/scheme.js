// Store Schemes
const API_URL = "http://127.0.0.1:5000/schemes";

let schemes = [];
// Used while editing
let editIndex = -1;

// Sample Data


// Load Table
function loadSchemes() {

    const container =
        document.getElementById("schemeTableBody");

    container.innerHTML = "";

    schemes.forEach((scheme, index) => {

        container.innerHTML += `

            <div class="scheme-box">

                <div class="scheme-icon">

                    <i class="bi bi-journal-bookmark-fill"></i>

                </div>

                <div class="scheme-info">

                    <div class="scheme-year">
                        ${scheme.scheme_year}
                    </div>

                    <div class="scheme-label">
                        Scheme
                    </div>

                </div>

                <div class="scheme-actions">

                    <button
                        class="scheme-view-btn"
                        onclick="viewSchemeDetails(${scheme.scheme_id})">

                        View Detail

                    </button>

                    <button
                        class="scheme-edit-btn"
                        onclick="editScheme(${index})">

                        Edit

                    </button>

                    <button
                        class="scheme-delete-btn"
                        onclick="deleteScheme(${index})">

                        Delete

                    </button>

                </div>

            </div>

        `;

    });

    updateSchemeButtons();
}


document.getElementById("saveScheme").addEventListener("click", async function () {

    const schemeName = document.getElementById("schemeName").value.trim();

    if (schemeName === "") {
        alert("Scheme name is required.");
        return;
    }

    const duplicate = schemes.some((scheme, index) =>
   scheme.scheme_year.toString()=== schemeName.toLowerCase() &&
    index !== editIndex
);

    if (duplicate) {
        alert("Scheme already exists.");
        return;
    }

    if (editIndex === -1) {

    await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            scheme_year: schemeName
        })
    });

    await fetchSchemes();

}  else {

    await fetch(`${API_URL}/${schemes[editIndex].scheme_id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            scheme_year: schemeName
        })
    });

    editIndex = -1;

    await fetchSchemes();

}

    await fetchSchemes();

    document.getElementById("schemeName").value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById("schemeModal"));

    if (modal) modal.hide();

});
function editScheme(index) {

    editIndex = index;

    document.getElementById("schemeName").value =
        schemes[index].scheme_year;

    const modal = new bootstrap.Modal(
        document.getElementById("schemeModal")
    );

    modal.show();

}
async function deleteScheme(index) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this scheme?"
    );

    if (!confirmDelete) {
        return;
    }

    await fetch(`${API_URL}/${schemes[index].scheme_id}`, {
        method: "DELETE"
    });

    await fetchSchemes();

}
document
    .getElementById("searchScheme")
    .addEventListener("input", function () {

        const value =
            this.value.toLowerCase().trim();

        const boxes =
            document.querySelectorAll(".scheme-box");

        boxes.forEach(box => {

            const text =
                box.textContent.toLowerCase();

            if (text.includes(value)) {

                box.style.display = "";

            } else {

                box.style.display = "none";

            }

        });

    });

async function fetchSchemes() {

    const response = await fetch(API_URL);

    schemes = await response.json();

    loadSchemes();

}


fetchSchemes();


/* =========================
   UPDATE / SAVE MODE
========================= */

let updateMode = false;

const updateSchemeButton =
    document.getElementById("updateScheme");


function updateSchemeButtons() {

    const editButtons =
        document.querySelectorAll(".scheme-edit-btn");

    const deleteButtons =
        document.querySelectorAll(".scheme-delete-btn");


    editButtons.forEach(button => {

        button.style.display =
            updateMode ? "flex" : "none";

    });


    deleteButtons.forEach(button => {

        button.style.display =
            updateMode ? "flex" : "none";

    });

}


/* =========================
   UPDATE BUTTON
========================= */

updateSchemeButton.addEventListener(
    "click",
    function () {

        updateMode = !updateMode;


        if (updateMode) {

            this.textContent = "Save";

        } else {

            this.textContent = "Update";

        }


        updateSchemeButtons();

    }
);
function viewSchemeDetails(schemeId) {

    window.location.href =
        `scheme-details.html?scheme_id=${schemeId}`;

}