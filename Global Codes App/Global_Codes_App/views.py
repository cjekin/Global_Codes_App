# Imports
import pyodbc
from datetime import datetime
from flask import render_template, jsonify, Response, request, json
from Global_Codes_App import app
import sql

global_tlcs = {}


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
    global global_tlcs

    if global_tlcs == {}:
        global_tlcs = sql.pull_raw_data()

    if 'error' in global_tlcs:
        print('Error gathering global_tlcs!')
        return jsonify({'result':'ERROR'})
    else:
        print('Loaded data')
        return jsonify({'result':'OK'})


@app.route('/tlc_data')
def tlc_data():
    system = request.args.get('system')
    section = request.args.get('section')
    primary = request.args.get('primary')
    unmapped = request.args.get('unmapped')

    global global_tlcs

    if global_tlcs == {}:
        result = dict(data = [[0,'TLC','NAME','I','0'],[0,'TLC','NAME','I','0']])
    else:
        result = sql.pull_library_data(global_tlcs,system,section,primary,unmapped)

    json_data = jsonify(result)
    return json_data


@app.route('/worksection_data')
def worksection_data():
    headers = ['system_name','section_letter','section_name']
    data = sql.exec_stored_procedure('spGlobalsApp_WorkSections',headers)

    worksection_data = {}
    # Get a separate lists of unique sections
    systems = []
    for r in data['data']:
        if r['system_name'] not in systems:
            systems.append(r['system_name'])
    worksection_data['systems'] = systems

    # Get a lookup based on system
    for system in systems:
        print('Looking up system: ' + system)
        worksection_data[system] = [[r['section_letter'],r['section_name']] for r in data['data'] if r['system_name'] == system]

    json_data = jsonify(worksection_data)
    return json_data

@app.route('/tlc_search_data')
def tlc_search_data():
    system = request.args.get('system')
    worksection = request.args.get('worksection')
    global global_tlcs
   
    tlcs = {}
    for row in global_tlcs:
        if row['system'] == str(system) and row['tfc_worksection'] == str(worksection):
            if row['tlc'] not in tlcs:
                tlcs[row['tlc']] = dict(tlc = row['tlc'], tlc_name = row['tlc_name'], tlc_type = row['tlc_type'], tlc_mapped = row['global_mapped'])
            elif row['global_mapped'] == '0':
                tlcs[row['tlc']['global_mapped']] = '0'

    tlc_list = sorted([k for k in tlcs]) # return in alphabetical order
    data = dict(data = [tlcs[k] for k in tlc_list])
    json_data = jsonify(data)
    return json_data
    
    


