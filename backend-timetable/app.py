
from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from department_api import department_api
from scheme_api import scheme_api
from subject_api import subject_api
from faculty import faculty_api
from faculty_subject_assignment import faculty_subject_assignment_api
from timetable_constraints import timetable_constraints_api
from generate_timetable import generate_timetable_api
from ai_api import ai_api
from dashboard_api import dashboard_api
from scheme_details_api import scheme_details_api
from scheme_pdf_api import scheme_pdf_api
from academic_year_api import academic_year_api

app = Flask(__name__)
CORS(app)
PDF_FOLDER = r"C:\Users\Hi\OneDrive\Desktop\frontend_timetable\scheme-pdfs"


@app.route("/scheme-pdfs/<path:filename>")
def serve_scheme_pdf(filename):

    return send_from_directory(
        PDF_FOLDER,
        filename
    )

app.register_blueprint(academic_year_api)
app.register_blueprint(scheme_pdf_api)
app.register_blueprint(scheme_details_api)
app.register_blueprint(department_api)
app.register_blueprint(scheme_api)
app.register_blueprint(subject_api)
app.register_blueprint(faculty_api)
app.register_blueprint(faculty_subject_assignment_api)
app.register_blueprint(timetable_constraints_api)
app.register_blueprint(generate_timetable_api)
app.register_blueprint(ai_api)
app.register_blueprint(dashboard_api)

@app.route("/")
def home():
    return "AI Timetable Backend Running"

if __name__ == "__main__":
    app.run(debug=False)