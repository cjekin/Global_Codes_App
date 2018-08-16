# Imports
import sys
import time
from datetime import date, datetime, timedelta
import pyodbc
import traceback

from Global_Codes_App import app
from flask import render_template, jsonify, Response, request, json

from . import config
from . import sql
from . import sql_queries


# Global variables and prep scripts
last_database_update = None


def error_log(error, traceback = '', print_to_screen = False):
    
    with open(config.error_log_file,'a') as F:
        current_time = time.strftime("%d/%m/%Y %H:%M")
        F.write('-----' + current_time + '\n' + error + '\n' + traceback)
    
    if print_to_screen == True:
        print (error + '\n' + traceback)
        result = dict(data = 'ERROR', error_detail=error)
        return result


# @app.route('/logout')
# def logout():
#     logout_user()
#     flash('You were logged out.')

#     return redirect(url_for('show_posts'))


# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     error = None

#     if request.method == 'POST':
#         try:
#             _user = User.from_login(
#                 request.form['email'],
#                 request.form['password'],
#             )
#             login_user(_user, remember=True)
#             flash('You were logged in.')

#             return redirect(url_for('home'))
#         except StormpathError, err:
#             error = err.message

#     return render_template('login.html', error=error)


#
# Dashboard
#

@app.route('/')
@app.route('/home')
@app.route('/dashboard')
def dashboard():

    month_range, num_changes = sql_queries.Dashboard_Graph()
    dashboard_overview = sql_queries.Dashboard_Overview()
    dashboard_overview_var = {r['origin']: r for r in dashboard_overview}
    dashboard_detail = sql_queries.Dashboard_Detail()
    
    return render_template(
        'dashboard.html',
        title='Mapping Overview',
        year=datetime.now().year,
        month_range = json.dumps(month_range),
        num_changes = json.dumps(num_changes),
        dashboard_overview = dashboard_overview,
        dashboard_overview_var = json.dumps(dashboard_overview_var),
        dashboard_detail = json.dumps(dashboard_detail)
    )



#
# Spreadsheet pro
#
    
@app.route('/spreadsheet_pro')
def spreadsheet_pro():
    return render_template(
        'spreadsheet_pro.html',
        title='Spreadsheet Pro Editor',
        year=datetime.now().year
    )


@app.route('/get_variable_from_config')
def get_variable_from_config():
    try:
        variable = request.args.get('variable')
        result = dict(data=getattr(config, variable))
    except AttributeError:
        result = error_log('Variable does not exist', '', True)
    except (Exception, err):
        result = error_log('Problem getting list of spreadsheets', str(traceback.format_exc()), True)
    json_data = jsonify(result)
    return json_data


@app.route('/get_sql_data')
def get_sql_data():
    query = request.args.get('query')
    params = {p[0]:p[1] for p in request.args.items() if p[0] != 'query'}
    
    try:
        methodToCall = getattr(sql_queries, query)
        if params:
            print('\n\nCalling ', query, ' with ', params)
            result = methodToCall(params)
        else:
            result = methodToCall()
    except AttributeError:
        result = error_log('Query does not exist: ' + query, str(traceback.format_exc()), True)
    except(Exception, err):
        result = error_log('Problem running query', str(traceback.format_exc()), True)

    json_data = jsonify(result)
    return json_data


#spreadsheet_pro_change
@app.route('/submit_table_update', methods=['POST'])
def submit_table_update():
    print('Submitting change to field from spreadsheet')

    try:
        submission = {r:request.form[r] for r in request.form}
        sql_queries.update_odbc_table(submission,user.email)
        result = dict(data = 'OK')

    except(Exception, err):
        result = error_log('Problem updating SQL table', str(traceback.format_exc()), True)

    json_data = jsonify(result)
    return json_data


#
# New Mapper
#


@app.route('/mapper')
def mapper():
    if 'system' in request.args:
        current_system_val = request.args.get('system')
        current_section_val = request.args.get('section')
        unmapped_checked = 'checked'
    else:
        current_system_val = 'UCLH_MIC_DW'
        current_section_val = 'B'
        unmapped_checked = ''

    return render_template(
        'mapper.html',
        title='Mapper (New)',
        year=datetime.now().year,
        current_system = current_system_val,
        current_section = current_section_val,
        unmapped = unmapped_checked
    )

@app.route('/mapped_loinc_search')
def mapped_loinc_search():
    query = request.args.get('query')
    params = {p[0]:p[1] for p in request.args.items() if p[0] != 'query'}
    
    try:
        methodToCall = getattr(sql_queries, query)
        if params:
            print('\n\nCalling ', query, ' with ', params)
            result = methodToCall(params)
        else:
            result = methodToCall()
    except AttributeError:
        result = error_log('Query does not exist: ' + query, str(traceback.format_exc()), True)
    except(Exception, err):
        result = error_log('Problem running query', str(traceback.format_exc()), True)

    json_data = jsonify(result)
    return json_data


    


