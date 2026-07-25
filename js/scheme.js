// Store Schemes
let schemes = JSON.parse(localStorage.getItem("schemes")) || [];

// Used while editing
let editIndex = -1;

// Sample Data
if (schemes.length === 0) {

    schemes = [

        {
            id: 1,
            name: "2022 Scheme"
        },

        {
            id: 2,
            name: "2025 Scheme"
        }

    ];

    localStorage.setItem(
        "schemes",
        JSON.stringify(schemes)
    );

}

// Load Table
function loadSchemes() {

    const tableBody = document.getElementById("schemeTableBody");

    tableBody.innerHTML = "";

    schemes.forEach((scheme, index) => {

        tableBody.innerHTML += `
            <tr>
                <td>${scheme.id}</td>
                <td>${scheme.name}</td>
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

loadSchemes();
document.getElementById("saveScheme").addEventListener("click", function () {

    const schemeName = document.getElementById("schemeName").value.trim();

    if (schemeName === "") {
        alert("Scheme name is required.");
        return;
    }

    const duplicate = schemes.some((scheme, index) =>
        scheme.name.toLowerCase() === schemeName.toLowerCase() &&
        index !== editIndex
    );

    if (duplicate) {
        alert("Scheme already exists.");
        return;
    }

    if (editIndex === -1) {

        const newId = schemes.length > 0
            ? schemes[schemes.length - 1].id + 1
            : 1;

        schemes.push({
            id: newId,
            name: schemeName
        });

    } else {

        schemes[editIndex].name = schemeName;
        editIndex = -1;

    }

    loadSchemes();
    localStorage.setItem(
        "schemes",
        JSON.stringify(schemes)
   );

    document.getElementById("schemeName").value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById("schemeModal"));

    if (modal) modal.hide();

});
function editScheme(index) {

    editIndex = index;

    document.getElementById("schemeName").value =
        schemes[index].name;

    const modal = new bootstrap.Modal(
        document.getElementById("schemeModal")
    );

    modal.show();

}
function deleteScheme(index) {

    if (!confirm("Are you sure you want to delete this scheme?")) {
        return;
    }

    schemes.splice(index, 1);
    localStorage.setItem(
        "schemes",
        JSON.stringify(schemes)
    );

    loadSchemes();

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