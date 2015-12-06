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
from flask.ext.stormpath import login_required, user

def error_log(error):
    with open(config.error_log_file,'a') as F:
        current_time = time.strftime("%d/%m/%Y %H:%M")
        F.write('-----' + current_time + '\n' + error)
        print error


@app.route('/logout')
def logout():
    logout_user()
    flash('You were logged out.')

    return redirect(url_for('show_posts'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None

    if request.method == 'POST':
        try:
            _user = User.from_login(
                request.form['email'],
                request.form['password'],
            )
            login_user(_user, remember=True)
            flash('You were logged in.')

            return redirect(url_for('home'))
        except StormpathError, err:
            error = err.message

    return render_template('login.html', error=error)




#
# Editor page
#

@app.route('/editor')
@login_required
def home():
    return render_template(
        'editor.html',
        title='Home Page',
        year=datetime.now().year,
    )

@app.route('/get_new_tfc')
@login_required
def get_new_tfc():
    print 'Getting new TFCs'

    try:
        sql.exec_stored_procedure_noreturn('spGlobalsApp_GetNewTFC')
        result = dict(data = 'OK')

    except Exception, err:
        error_log('Error getting new TFCs in the mapping table:\n' + str(traceback.format_exc()))
        print ('-----------\nError getting new TFCs in the mapping table' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Error getting new TFCs in the mapping table')

    json_data = jsonify(result)
    return json_data


@app.route('/tlc_data')
@login_required
def tlc_data():
    system = request.args.get('system')
    section = request.args.get('section')
    primary = request.args.get('primary')
    unmapped = request.args.get('unmapped')

    args = [system,section,primary,unmapped]

    try:
        result = sql.exec_stored_procedure_list('spGlobalsApp_GetTLCList',args)
    except Exception, err:
        result = {'data':[['0','Error getting data','','']]}
        error_log('Error getting TLC list:\n' + str(traceback.format_exc()))
        print ('-----------\n tlc_data error' + str(traceback.format_exc()))

    json_data = jsonify(result)
    return json_data


@app.route('/worksection_data')
@login_required
def worksection_data():
    data = sql.exec_stored_procedure('spGlobalsApp_WorkSections')

    worksection_data = {}
    # Get a separate lists of unique sections
    systems = []
    for r in data['result']:
        if r['system_name'] not in systems:
            systems.append(r['system_name'])
    worksection_data['systems'] = systems

    # Get a lookup based on system
    for system in systems:
        worksection_data[system] = [[r['section_letter'],r['section_name']] for r in data['result'] if r['system_name'] == system]

    json_data = jsonify(worksection_data)
    return json_data


@app.route('/tlc_detail')
@login_required
def tlc_detail():

    try:
        system = request.args.get('system')
        tlc = request.args.get('tlc')

        result = sql.exec_stored_procedure_list('spGlobalsApp_GetTLCDetail', [system,tlc], True)

    except Exception, err:
        error_log('Error looking up TLC detail:\n' + str(traceback.format_exc()))
        print ('-----------\ntlc_detail error' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data



@app.route('/system_info')
@login_required
def system_info():
    try:
        system = request.args.get('system')
        section = request.args.get('section')

        result = sql.exec_stored_procedure('spGlobalsApp_SystemOverview', [system,section])

    except Exception, err:
        error_log('Error looking up TLC detail:\n' + str(traceback.format_exc()))
        print ('-----------\n system_info error' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem getting system overview')

    json_data = jsonify(result)
    return json_data


@app.route('/global_table')
@login_required
def global_table():
    print('-----------\nPreloading global codes')

    try:  
        result = sql.pull_all_global_codes()

        L = {'result':[]}
        for r in result['result']:
            L['result'].append([r['GlobalCode'], r['Description'], r['Sample'], r['Type'], r['Analyte'], r['PrimaryLibrary'], r['SubSection'], r['Department'], r['Alias']])
            config.global_codes[r['GlobalCode']] = r

    except Exception, err:
        error_log('Error getting global codes together:\n' + str(traceback.format_exc()))
        print('*** PROBLEM LOADING GLOBALS***')
        result = dict(result = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(L)
    return json_data



@app.route('/add_mapping')
@login_required
def add_mapping():
    system = request.args.get('system')
    tfc = request.args.get('tfc')
    new_global_code = request.args.get('global_code')

    try:  
        result = sql.add_mapping(system,tfc,new_global_code,user.email)
        result['global_name'] = config.global_codes[new_global_code]['Description']
        result['global_sample'] = config.global_codes[new_global_code]['Sample']
        result['global_library'] = config.global_codes[new_global_code]['PrimaryLibrary']

    except Exception, err:
        error_log('Unable to add code to mapping:\n' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem adding mapping')

    return jsonify(result)


@app.route('/remove_mapping')
@login_required
def remove_mapping():
    system = request.args.get('system')
    tfc = request.args.get('tfc')
    old_global_code = request.args.get('global_code')

    try:  
        result = sql.remove_mapping(system,tfc,old_global_code,user.email)

    except Exception, err:
        error_log('Unable to remove code from mapping:\n' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem removing mapping')

    return jsonify(result)

@app.route('/exclude_tfc')
@login_required
def exclude_tfc():
    system = request.args.get('system')
    tfc = request.args.get('tfc')
    exclusion = request.args.get('exclusion')

    try:  
        result = sql.exclude_tfc(system,tfc,exclusion,user.email)

    except Exception, err:
        error_log('Unable to add code to mapping:\n' + str(traceback.format_exc()))
        result = dict(result = 'ERROR', error_detail='Problem adding mapping')

    return jsonify(result)


@app.route('/get_more_tfc_info')
@login_required
def get_more_tfc_info():
    tfc = request.args.get('tfc')
    system = request.args.get('system')
    print('Getting TFC info for' + str(tfc) + ' in ' + str(system))

    try:  
        result = sql.exec_stored_procedure_list('spGlobalsApp_GetMoreTFCInfo', [system, tfc], True)
    except Exception, err:
        error_log('Error getting TFC info:\n' + str(traceback.format_exc()))
        print('*Error getting TFC info')
        result = dict(data = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data




#
# Dashboard
#

@app.route('/')
@app.route('/home')
@app.route('/dashboard')
@login_required
def dashboard():
    return render_template(
        'dashboard.html',
        title='Mapping Overview',
        year=datetime.now().year
    )


@app.route('/dashboard_getdata')
@login_required
def dashboard_getdata():

    try:
        data = sql.exec_stored_procedure_list('spGlobalsApp_AllSystemStats')

        summary = {}
        for row in data['data']:
            system = row[0]
            if system not in summary:
                summary[system] = [int(row[2]),int(row[3]),[row]]
            else:
                summary[system][0] += int(row[2])
                summary[system][1] += int(row[3])
                summary[system][2].append(row)

        for key in summary:
            pct = int( float(summary[key][0]) / float(summary[key][1]) * 100 )
            summary[key].append(pct)
            summary[key][2] = sorted(summary[key][2])

        data['data'] = summary
        data['system'] = sorted([s for s in summary])

    except Exception, err:
        error_log('Error getting dashboard data:\n' + str(traceback.format_exc()))
        print ('-----------\n Error getting dashboard data:\n' + str(traceback.format_exc()))
        data = dict(data = 'ERROR', error_detail='Problem getting system overview')

    json_data = jsonify(data)
    return json_data




#
# Global editor page
#

@app.route('/pull_all_tfcs_to_one_table')
@login_required
def pull_all_tfcs_to_one_table():
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
        sql = "EXEC spGlobalsApp_GlobalCodeDetail_LoadAllTFCs"
        cursor.execute(sql)
        result = dict(data = 'OK')
    except:
        error_log('Error executing pull_all_tfcs_to_one_table:\n' + str(traceback.format_exc()))
        print ('-----------\nError pull_all_tfcs_to_one_table' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data


@app.route('/globaleditor')
@login_required
def globalseditor():
    return render_template(
        'globaleditor.html',
        title='Global code editor',
        year=datetime.now().year,
    )

@app.route('/globals_department_list')
@login_required
def globals_department_list():
    try:
        result = sql.exec_stored_procedure_list('spGlobalsApp_GlobalCodeDetail_DeptList')
    except Exception, err:
        error_log('Error executing spGlobalsApp_GlobalEditor_DeptList:\n' + str(traceback.format_exc()))
        print ('-----------\nError pulling all global departments' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data


@app.route('/globalseditordata')
@login_required
def globalseditordata():

    try:
        department = request.args.get('department')

        result = sql.exec_stored_procedure_list('spGlobalsApp_GlobalEditor',[department])

    except Exception, err:
        error_log('Error executing spGlobalsApp_GlobalEditor:\n' + str(traceback.format_exc()))
        print ('-----------\nError pulling all globals' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data

@app.route('/globalcodedetail')
@login_required
def globalcodedetail():
    print 'Clicked global code detail'

    try:
        code = request.args.get('code')
        result = {}
        result['info'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Info',[code])['result']
        result['audit'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Audit',[code])['result']
        result['mapping'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Mapping',[code])['result']
        
    except Exception, err:
        error_log('Error executing code detail lookup:\n' + str(traceback.format_exc()))
        print ('-----------\nError executing code detail lookup' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem running query')

    print 'Returned audit: ', result['audit']
    json_data = jsonify(result)
    print 'JSON conversion:\n', json_data
    return json_data


@app.route('/global_edit_submit_changes', methods=['POST'])
@login_required
def global_edit_submit_changes():
    print 'Submitting global code changes'

    try:
        code = request.form['GlobalCode']
        lookup = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Info',[code])['result'][0]
        print 'Lookup: ', lookup
        
        # Find the changes       
        updates = {}
        for r in lookup:
            if r <> 'Alias':
                if lookup[r] <> request.form[r]:
                    updates[r] = (lookup[r],request.form[r])
        result = dict(data='OK', updates=updates)

        sql.update_global_code_fields(code, updates, user.email)

        result['info'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Info',[code])['result']
        result['audit'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Audit',[code])['result']
        result['mapping'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Mapping',[code])['result']

    except Exception, err:
        error_log('Error reciving global code edit submission:\n' + str(traceback.format_exc()))
        print ('-----------\nError reciving global code edit submission' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail=str(traceback.format_exc()))

    json_data = jsonify(result)
    return json_data


@app.route('/global_edit_new_code', methods=['POST'])
@login_required
def global_edit_new_code():
    print 'Creating new global code'

    try:
        submission = {r:request.form[r] for r in request.form}
        code = submission['GlobalCode']

        sql.insert_new_global_code(code, submission, user.email)

        result = dict(data = 'OK')

        result['info'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Info',[code])['result']
        result['audit'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Audit',[code])['result']
        result['mapping'] = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Mapping',[code])['result']

    except Exception, err:
        error_log('Problem creating a new global code:\n' + str(traceback.format_exc()))
        print ('-----------\nProblem creating a new global code' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem creating a new global code')

    json_data = jsonify(result)
    return json_data

@app.route('/global_edit_delete_code')
@login_required
def global_edit_delete_code():
    print 'Deleting global code'

    try:
        code = request.args.get('code')
        exclusion = request.args.get('exclusion')

        sql.exec_stored_procedure_noreturn('spGlobalsApp_DeleteGlobalCode',[code, exclusion, user.email])

        result = dict(data = 'OK')

    except Exception, err:
        error_log('Error deleting global code:\n' + str(traceback.format_exc()))
        print ('-----------\nError deleting global code' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem deleting the code')

    json_data = jsonify(result)
    return json_data


#
# Spreadsheet
#

@app.route('/spreadsheet')
@login_required
def spreadsheet():
    return render_template(
        'spreadsheet.html',
        title='Spreadsheet Editor',
        year=datetime.now().year,
    )


@app.route('/pull_spreadsheet_globals')
@login_required
def pull_spreadsheet_globals():

    try:
        result = sql.exec_stored_procedure_list('spGlobalsApp_GlobalSpreadsheet', header_row=True)

    except Exception, err:
        error_log('Error executing spGlobalsApp_GlobalSpreadsheet:\n' + str(traceback.format_exc()))
        print ('-----------\nError pulling all globals' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem running query')

    json_data = jsonify(result)
    return json_data


@app.route('/spreadsheet_changefield', methods=['POST'])
@login_required
def spreadsheet_changefield():
    print 'Submitting change to field from spreadsheet'

    try:
        print 'Raw submission: ', request.form  
        code = request.form['GlobalCode']

        lookup = sql.exec_stored_procedure('spGlobalsApp_GlobalCodeDetail_Info',[code])['result'][0]
        print 'Looking up previous code', lookup

        updates = {}
        for r in [r for r in request.form if r <> 'GlobalCode']:
            if r in lookup:
                updates[r] = (lookup[r],request.form[r])
            else:
                updates[r] = ('',request.form[r])

        print 'spreadsheet_changefield\n', code, updates
        sql.update_global_code_fields(code, updates, user.email)
        result = dict(data = 'OK')

    except Exception, err:
        error_log('Error reciving global code spreadsheet edit submission:\n' + str(traceback.format_exc()))
        print ('-----------\nError reciving global code spreadsheet edit submission' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem submitting global changes')

    json_data = jsonify(result)
    return json_data


@app.route('/spreadsheet_newcode', methods=['POST'])
@login_required
def spreadsheet_newcode():
    print 'Spreadsheet: Creating new global code'

    try:
        submission = {r:request.form[r] for r in request.form}
        code = submission['GlobalCode']

        sql.insert_new_global_code(code, submission, user.email)

        result = dict(data = 'OK')

    except Exception, err:
        error_log('Problem creating a new global code from spreadsheet:\n' + str(traceback.format_exc()))
        print ('-----------\nProblem creating a new global code from spreadsheet' + str(traceback.format_exc()))
        result = dict(data = 'ERROR', error_detail='Problem creating a new global code')

    json_data = jsonify(result)
    return json_data











    
    


