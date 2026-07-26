// Store Schemes
const API_URL = "http://127.0.0.1:5000/schemes";

let schemes = [];
// Used while editing
let editIndex = -1;

// Sample Data


// Load Table
function loadSchemes() {

    const tableBody = document.getElementById("schemeTableBody");

    tableBody.innerHTML = "";

    schemes.forEach((scheme, index) => {

        tableBody.innerHTML += `
            <tr>
                <td>${scheme.scheme_id}</td>
                <td>${scheme.scheme_year}</td>
                <td>
                    <button
                        class="btn btn-warning btn-sm"
                        onclick="editScheme(${index})">
                        Edit
                    </button>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="deleteScheme(${index})">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    });

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
document.getElementById("searchScheme").addEventListener("keyup", function () {

    const value = this.value.toLowerCase();

    const rows = document.querySelectorAll("#schemeTableBody tr");

    rows.forEach(row => {

        if (row.textContent.toLowerCase().includes(value)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });

});

async function fetchSchemes() {

    const response = await fetch(API_URL);

    schemes = await response.json();

    loadSchemes();

}

fetchSchemes();