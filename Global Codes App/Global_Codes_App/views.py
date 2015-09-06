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
global_codes = {}

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
    global global_codes

    try:
        system = request.args.get('system')
        tlc = request.args.get('tlc')

        global global_tlcs

        if global_tlcs == {}:
            result = dict(result = 'ERROR', error_detail='The data was not preloaded')
        else:
            #print('I am passing the global_codes: ' + str(global_codes)[:100])
            result = sql.pull_tlc_detail(global_tlcs,system,tlc, global_codes)

    except Exception, err:
        error_log('Error looking up TLC detail:\n' + str(traceback.format_exc()))
        print ('-----------\ntlc_detail error' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data




@app.route('/global_table')
def global_table():
    print('Called /global_table function')
    global global_codes

    try:  
        result = sql.pull_all_global_codes()
        print('Callback result: ' + str(result)[:100])

        L = {'result':[]}
        for r in result['result']:
            L['result'].append([r['BenchCode'], r['Description'], r['Sample'], r['Type'], r['Analyte'], r['PrimaryLibrary'], r['SubSection'], r['Department']])
            global_codes[r['BenchCode']] = r

    except Exception, err:
        error_log('Error getting global codes together:\n' + str(traceback.format_exc()))
        print('*** PROBLEM LOADING GLOBALS***')
        result = dict(result = 'ERROR', error_detail='Problem running query')

    print('I have loaded the globals: ' + str(global_codes)[:100])

    json_data = jsonify(L)
    return json_data



@app.route('/add_mapping')
def add_mapping():
    system = request.args.get('system')
    tfc = request.args.get('tfc')
    global_code = request.args.get('global_code')
    user = request.args.get('user')

    global global_codes
    global global_tlcs

    try:  
        result = sql.add_mapping(system,tfc,global_code,user)
        result['global_name'] = global_codes[global_code]['Description']
        result['global_sample'] = global_codes[global_code]['Sample']
        result['global_type'] = global_codes[global_code]['Type']

        # Update the raw data and summary
        for tlc in global_tlcs[system]:
            for i in range(len(global_tlcs[system][tlc]['tfc'])):
                if global_tlcs[system][tlc]['tfc'][i]['tfc'] == tfc:
                    global_tlcs[system][tlc]['tfc'][i]['global_code'] = global_code
                    global_tlcs[system][tlc]['tfc'][i]['global_mapped'] = 1
                    global_tlcs[system][tlc]['tlc_sections'] = sorted(list(set([t['tfc_worksection'] for t in global_tlcs[system][tlc]['tfc']])))
                    global_tlcs[system][tlc]['tlc_mapped'] = min([t['global_mapped'] for t in global_tlcs[system][tlc]['tfc']])

    except Exception, err:
        error_log('Unable to add code to mapping:\n' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem adding mapping')

    return jsonify(result)

@app.route('/remove_mapping')
def remove_mapping():
    system = request.args.get('system')
    tfc = request.args.get('tfc')
    global_code = request.args.get('global_code')
    user = request.args.get('user')

    global global_codes
    global global_tlcs

    try:  
        result = sql.remove_mapping(system,tfc,global_code,user)

        # Update the raw data and summary
        for tlc in global_tlcs[system]:
            for i in range(len(global_tlcs[system][tlc]['tfc'])):
                if global_tlcs[system][tlc]['tfc'][i]['tfc'] == tfc:
                    global_tlcs[system][tlc]['tfc'][i]['global_code'] = ''
                    global_tlcs[system][tlc]['tfc'][i]['global_mapped'] = 0
                    global_tlcs[system][tlc]['tlc_sections'] = sorted(list(set([t['tfc_worksection'] for t in global_tlcs[system][tlc]['tfc']])))
                    global_tlcs[system][tlc]['tlc_mapped'] = min([t['global_mapped'] for t in global_tlcs[system][tlc]['tfc']])

    except Exception, err:
        error_log('Unable to remove code from mapping:\n' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem removing mapping')

    return jsonify(result)



    
    


