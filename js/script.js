const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function(e){

        e.preventDefault();

        // Temporary Login
        window.location.href = "dashboard.html";

    });

}
/* =========================
   AI CHAT
========================= */

const aiChatButton = document.getElementById("aiChatButton");
const aiChatWindow = document.getElementById("aiChatWindow");
const closeAiChat = document.getElementById("closeAiChat");
const aiChatInput = document.getElementById("aiChatInput");
const aiSendButton = document.getElementById("aiSendButton");
const aiChatMessages = document.getElementById("aiChatMessages");


/* Run AI chat only if the elements exist */

if (
    aiChatButton &&
    aiChatWindow &&
    closeAiChat &&
    aiChatInput &&
    aiSendButton &&
    aiChatMessages
) {

    /* Open Chat */

    aiChatButton.addEventListener("click", function(){

        aiChatWindow.style.display = "flex";

        aiChatInput.focus();

    });


    /* Close Chat */

    closeAiChat.addEventListener("click", function(){

        aiChatWindow.style.display = "none";

    });


    /* Send Message */
    function getAIResponse(message){

        const question = message.toLowerCase();


        /* Greeting */

        if(
            question.includes("hello") ||
            question.includes("hi") ||
            question.includes("hey")
        ){
            return "Hello Admin! 👋 How can I help you with the academic scheduling system?";
        }


        /* Department */

        if(
            question.includes("department") &&
            (
                question.includes("add") ||
                question.includes("create")
            )
        ){
            return "To add a department, open Department from the sidebar and enter the required department details.";
        }


        if(
            question.includes("department") &&
            (
                question.includes("view") ||
                question.includes("list")
            )
        ){
            return "Open Department from the sidebar to view the departments currently available in the system.";
        }


        /* Scheme */

        if(
            question.includes("scheme") &&
            (
                question.includes("add") ||
                question.includes("create") ||
                question.includes("upload")
            )
        ){
            return "Open Scheme from the sidebar to add or manage academic schemes such as the 2022 or 2025 scheme.";
        }


        /* Subject */

        if(
            question.includes("subject") &&
            (
                question.includes("add") ||
                question.includes("create")
            )
        ){
            return "Open Subject from the sidebar to add subject details such as subject code, name, department, semester and scheme.";
        }


        /* Faculty */

        if(
            question.includes("faculty") &&
            (
                question.includes("add") ||
                question.includes("create")
            )
        ){
            return "Open Faculty from the sidebar to add faculty details.";
        }


        /* Faculty Subject Assignment */

        if(
            question.includes("faculty") &&
            question.includes("subject") &&
            (
                question.includes("assign") ||
                question.includes("assignment")
            )
        ){
            return "Open Faculty Subject Assignment from the sidebar to assign subjects to faculty members.";
        }


        /* Timetable Constraints */

        if(
            question.includes("constraint") ||
            question.includes("constraints")
        ){
            return "Open Timetable Constraints from the sidebar to configure the rules and restrictions used during timetable generation.";
        }


        /* Generate Timetable */

        if(
            question.includes("generate") &&
            question.includes("timetable")
        ){
            return "To generate a timetable, open Generate Timetable from the sidebar, select the required academic details and start the timetable generation process.";
        }


        /* View Timetable */

        if(
            question.includes("view") &&
            question.includes("timetable")
        ){
            return "Open View Timetable from the sidebar to view the generated timetable.";
        }


        /* Export */

        if(
            question.includes("export") &&
            (
                question.includes("excel") ||
                question.includes("timetable")
            )
        ){
            return "Open View Timetable and use the Export Excel option to export the generated timetable.";
        }


        /* Login */

        if(
            question.includes("login") ||
            question.includes("sign in")
        ){
            return "Use your administrator credentials on the login page to access the academic scheduling dashboard.";
        }


        /* Dashboard */

        if(
            question.includes("dashboard") ||
            question.includes("home")
        ){
            return "The dashboard provides quick access to departments, schemes, subjects, faculty, timetable generation and other academic scheduling functions.";
        }


        /* Help */

        if(
            question.includes("help") ||
            question.includes("what can you do")
        ){
            return "I can help you with Departments, Schemes, Subjects, Faculty, Faculty Subject Assignment, Timetable Constraints, Timetable Generation, View Timetable and Excel Export.";
        }


        /* Default */

        return "I'm currently able to help with Departments, Schemes, Subjects, Faculty, Faculty Subject Assignment, Timetable Constraints, Timetable Generation, View Timetable and Excel Export.";
    }

    function sendAIMessage(){

        const message = aiChatInput.value.trim();

        if(message === ""){
            return;
        }


        /* User message */

        const userMessage = document.createElement("div");

        userMessage.className = "user-message";

        userMessage.textContent = message;

        aiChatMessages.appendChild(userMessage);


        /* Clear input */

        aiChatInput.value = "";


        /* Scroll down */

        aiChatMessages.scrollTop =
            aiChatMessages.scrollHeight;


        /* Temporary AI response */

        fetch("http://127.0.0.1:5000/ai-chat", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: message
        })

    })

    .then(response => response.json())

    .then(data => {

        const aiMessage =
            document.createElement("div");

        aiMessage.className = "ai-message";

        if (data.subjects && data.subjects.length > 0) {

        const title = document.createElement("div");

        title.className = "ai-message";

        title.textContent = data.response;

        aiChatMessages.appendChild(title);


        const table = document.createElement("table");

        table.className = "ai-subject-table";


        table.innerHTML = `
            <thead>
                <tr>
                    <th>Cycle</th>
                    <th>Code</th>
                    <th>Subject Name</th>
                </tr>
            </thead>
            <tbody>
                ${data.subjects.map(subject => `
                    <tr>
                        <td>${subject.cycle}</td>
                        <td>${subject.code}</td>
                        <td>${subject.name}</td>
                    </tr>
                `).join("")}
            </tbody>
        `;


        aiChatMessages.appendChild(table);

    } else {

        const aiMessage =
            document.createElement("div");

        aiMessage.className = "ai-message";

        aiMessage.textContent =
            data.response;

        aiChatMessages.appendChild(aiMessage);
    }

        aiChatMessages.scrollTop =
            aiChatMessages.scrollHeight;

    })

    .catch(error => {

        const aiMessage =
            document.createElement("div");

        aiMessage.className = "ai-message";

        aiMessage.textContent =
            "Sorry, I couldn't connect to the AI server.";

        aiChatMessages.appendChild(aiMessage);

        aiChatMessages.scrollTop =
            aiChatMessages.scrollHeight;

        console.error("AI API Error:", error);

    });

    }


    /* Send button */

    aiSendButton.addEventListener(
        "click",
        sendAIMessage
    );


    /* Enter key */

    aiChatInput.addEventListener(
        "keypress",
        function(event){

            if(event.key === "Enter"){

                sendAIMessage();

            }

        }
    );

}
/* =========================
   DASHBOARD DATABASE STATS
========================= */

fetch("http://127.0.0.1:5000/dashboard-stats")
    .then(response => response.json())
    .then(data => {

        document.getElementById("departmentCount").textContent =
            data.departments;

        document.getElementById("schemeCount").textContent =
            data.schemes;

        document.getElementById("subjectCount").textContent =
            data.subjects;

        document.getElementById("facultyCount").textContent =
            data.faculty;

        document.getElementById("timetableCount").textContent =
            data.timetables;

        document.getElementById("pendingCount").textContent =
            data.pending;

    })
    .catch(error => {

        console.error(
            "Failed to load dashboard statistics:",
            error
        );

    });