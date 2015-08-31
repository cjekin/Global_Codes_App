# Imports
import pyodbc
from datetime import datetime
from flask import render_template, jsonify, Response, request
from Global_Codes_App import app
import sql

data = {}


@app.route('/')
@app.route('/home')
def home():
    return render_template(
        'editor.html',
        title='Home Page',
        year=datetime.now().year,
    )

@app.route('/preload_data')
def preload_data():
    global data
    data['tlcs'] = sql.generic_sql('TLC', {})
    print 'Finished loading: ', len(data['tlcs'])
    return jsonify({'result':'OK'})

@app.route('/tlc_data')
def tlc_data():
    origin = request.args.get('origin')
    if origin == None:
        origin = 'WSL_ALL_DW'
    filters = {'Origin':origin}
    data = sql.generic_sql('TLC',filters)
    json_data = jsonify(data)
    return json_data
    


