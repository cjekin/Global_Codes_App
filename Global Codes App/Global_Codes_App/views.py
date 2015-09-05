# Imports
import pyodbc
from datetime import datetime
from flask import render_template, jsonify, Response, request, json
from Global_Codes_App import app
import sql
import traceback
import sys
import time

global_tlcs = {}

def error_log(error):
    with open('error_log.txt','a') as F:
        current_time = time.strftime("%d/%m/%Y %H:%M")
        F.write('-----' + current_time + '\n' + error)


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

    try:
        #raise ValueError('Testing error handling')
        if global_tlcs == {}:
            global_tlcs = sql.pull_raw_data()
    except Exception, err:
        error_log('Preload data function:\n' + str(traceback.format_exc()))
        return jsonify({'result':'ERROR'}) 

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
        #print('Looking up system: ' + system)
        worksection_data[system] = [[r['section_letter'],r['section_name']] for r in data['data'] if r['system_name'] == system]

    json_data = jsonify(worksection_data)
    return json_data


@app.route('/tlc_detail')
def tlc_detail():
    try:
        system = request.args.get('system')
        tlc = request.args.get('tlc')

        global global_tlcs

        if global_tlcs == {}:
            result = dict(result = 'ERROR', error_detail='The data was not preloaded')
        else:
            result = sql.pull_tlc_detail(global_tlcs,system,tlc)

    except Exception, err:
        error_log('Error looking up TLC detail:\n' + str(traceback.format_exc()))
        print ('-----------\ntlc_detail error' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data




@app.route('/global_table')
def global_table():
        
    result = sql.pull_all_global_codes()

    json_data = jsonify(result)
    return json_data



    
    


