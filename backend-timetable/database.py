import mysql.connector

connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="timetable_db"
)

if connection.is_connected():
    print("MySQL Connected Successfully!")