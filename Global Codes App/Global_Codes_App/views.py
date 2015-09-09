# Imports
import config
import pyodbc
from datetime import datetime
from flask import render_template, jsonify, Response, request, json
from Global_Codes_App import app
import sql
import traceback
import sys
import time

def error_log(error):
    with open(config.error_log_file,'a') as F:
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

    try:
        #raise ValueError('Testing error handling')
        if config.global_tlcs == {}:
            config.global_tlcs = sql.pull_raw_data()
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

    if config.global_tlcs == {}:
        result = dict(data = [[0,'TLC','NAME','I','0'],[0,'TLC','NAME','I','0']])
    else:
        result = sql.pull_library_data(config.global_tlcs,system,section,primary,unmapped)

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

        if config.global_tlcs == {}:
            result = dict(result = 'ERROR', error_detail='The data was not preloaded')
        else:
            result = sql.pull_tlc_detail(system,tlc)

    except Exception, err:
        error_log('Error looking up TLC detail:\n' + str(traceback.format_exc()))
        print ('-----------\ntlc_detail error' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data




@app.route('/global_table')
def global_table():
    print('-----------\nPreloading global codes')

    try:  
        result = sql.pull_all_global_codes()

        L = {'result':[]}
        for r in result['result']:
            L['result'].append([r['BenchCode'], r['Description'], r['Sample'], r['Type'], r['Analyte'], r['PrimaryLibrary'], r['SubSection'], r['Department']])
            config.global_codes[r['BenchCode']] = r

    except Exception, err:
        error_log('Error getting global codes together:\n' + str(traceback.format_exc()))
        print('*** PROBLEM LOADING GLOBALS***')
        result = dict(result = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(L)
    return json_data



@app.route('/add_mapping')
def add_mapping():
    system = request.args.get('system')
    tfc = request.args.get('tfc')
    new_global_code = request.args.get('global_code')
    user = request.args.get('user')

    try:  
        result = sql.add_mapping(system,tfc,new_global_code,user)
        result['global_name'] = config.global_codes[new_global_code]['Description']
        result['global_sample'] = config.global_codes[new_global_code]['Sample']
        result['global_type'] = config.global_codes[new_global_code]['Type']

        # Update the raw data and summary
        for tlc in config.global_tlcs[system]:
            for i in range(len(config.global_tlcs[system][tlc]['tfc'])):
                if config.global_tlcs[system][tlc]['tfc'][i]['tfc'] == tfc:
                    config.global_tlcs[system][tlc]['tfc'][i]['global_code'] = new_global_code
                    config.global_tlcs[system][tlc]['tfc'][i]['global_mapped'] = 1
                    config.global_tlcs[system][tlc]['tlc_sections'] = sorted(list(set([t['tfc_worksection'] for t in config.global_tlcs[system][tlc]['tfc']])))
                    config.global_tlcs[system][tlc]['tlc_mapped'] = min([t['global_mapped'] for t in config.global_tlcs[system][tlc]['tfc']])

    except Exception, err:
        error_log('Unable to add code to mapping:\n' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem adding mapping')

    return jsonify(result)


@app.route('/remove_mapping')
def remove_mapping():
    system = request.args.get('system')
    tfc = request.args.get('tfc')
    old_global_code = request.args.get('global_code')
    user = request.args.get('user')

    try:  
        result = sql.remove_mapping(system,tfc,old_global_code,user)

        # Update the raw data and summary
        for tlc in config.global_tlcs[system]:
            for i in range(len(config.global_tlcs[system][tlc]['tfc'])):
                if config.global_tlcs[system][tlc]['tfc'][i]['tfc'] == tfc:
                    config.global_tlcs[system][tlc]['tfc'][i]['global_code'] = ''
                    config.global_tlcs[system][tlc]['tfc'][i]['global_mapped'] = 0
                    config.global_tlcs[system][tlc]['tlc_sections'] = sorted(list(set([t['tfc_worksection'] for t in config.global_tlcs[system][tlc]['tfc']])))
                    config.global_tlcs[system][tlc]['tlc_mapped'] = min([t['global_mapped'] for t in config.global_tlcs[system][tlc]['tfc']])

    except Exception, err:
        error_log('Unable to remove code from mapping:\n' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem removing mapping')

    return jsonify(result)



    
    


