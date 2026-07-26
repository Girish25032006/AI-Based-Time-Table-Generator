from flask import Flask
from flask_cors import CORS
from department_api import department_api
from scheme_api import scheme_api

app = Flask(__name__)
CORS(app)
app.register_blueprint(department_api)
app.register_blueprint(scheme_api)

@app.route("/")
def home():
    return "AI Timetable Backend Running"

if __name__ == "__main__":
    app.run(debug=True)