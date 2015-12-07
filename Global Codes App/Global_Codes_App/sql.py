import config
import pyodbc
import string
import traceback
import sys


def exec_stored_procedure(stored_procedure,arguements=[]):
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'

    if len(arguements) > 0:
        args = "'" + "','".join(arguements) + "'"
    else:
        args = ''
    
    sql = "EXEC %s %s;" % (stored_procedure,args)
    data = {}

    print(sql)

    cursor.execute(sql)
    headers = [column[0] for column in cursor.description]     
       
    raw_data = cursor.fetchall()
    data = dict(result=[dict(zip(headers,[str(i) for i in row])) for row in raw_data])

    return data

def exec_stored_procedure_noreturn(stored_procedure,arguements=[]):
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'
    
    if arguements <> []:
        args = "'" + "','".join(arguements) + "'"
    else:
        args = ''

    sql = "EXEC %s %s;" % (stored_procedure,args)

    data = {}

    cursor.execute(sql)
    cursor.commit()
  
       

def exec_stored_procedure_list(stored_procedure, arguements=[], header_row=False):
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'

    # Put string arguements in quotes
    args = []
    for a in arguements:
        if type(a) == str or type(a) == unicode:
            args.append("'" + a + "'")
        else:
            args.append(a)
    
    sql = "EXEC %s %s;" % (stored_procedure,','.join(args))
    data = {}
    print 'Running SQL: ', sql
           
    cursor.execute(sql)
    raw_data = cursor.fetchall()
        
    # Clear the non-ascii characters from the result
    for i in range(len(raw_data)):
        for j in range(len(raw_data[i])):
            try:
                raw_data[i][j] = str(raw_data[i][j])
            except:
                print 'Problem with raw data row ', i, ' col ', j
            raw_data[i][j] =  ''.join([c if ord(c) < 128 else ' ' for c in raw_data[i][j]]) 

    output_list = []
    if header_row == True:
        output_list = [[column[0] for column in cursor.description]]

    for r in raw_data:
        output_list.append(list(r))

    data = dict(data=output_list)

    return data





def strip_non_ascii(string):
    ''' Returns the string without non ASCII characters'''
    stripped = (c for c in string if 0 < ord(c) < 127)
    return ''.join(stripped)



#def pull_library_data(D,system,section,primary,unmapped):
#    result = []
#    print 'pull_library_data: ', primary, unmapped
#    for r in D[system]:
#        accept = True
        
#        if unmapped == '1' and D[system][r]['tlc_mapped'] == 1:
#            accept = False
#        if primary == '1' and D[system][r]['tlc_primary'] == 0:
#            accept = False
#        if section not in D[system][r]['tlc_sections']:
#            accept = False
#        if accept == True:
#            num_tfc = str(len([t for t in D[system][r]['tfc']]))
#            L = [D[system][r]['tlc_mapped'], r, D[system][r]['tlc_name'], D[system][r]['tlc_type'], num_tfc]
            
#            result.append(L)
#    #result = sorted(result, key=lambda k: k['TLC']) 
            
#    return {'data': result}




def pull_all_global_codes():
    print('Running pull_all_global_codes')
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'
    
    sql = "EXEC spGlobalsApp_GlobalCodes"
    data = {}
           
    try: 
        cursor.execute(sql)
        headers = [column[0] for column in cursor.description]
            
        raw_data = cursor.fetchall()
        data = dict(result=[dict(zip(headers,row)) for row in raw_data])
    except:
        data['result'] = 'ERROR'

    return data



def add_mapping(system,tfc,new_global_code,user):
    result = 'OK'

    cnxn = pyodbc.connect(config.connection_string)
    cursor = cnxn.cursor()

    # Put in the mapping
    sql = """
    UPDATE %s
    set [GlobalCode] = '%s' where [Origin] = '%s' and [Code] = '%s'
    """ % (config.global_map_table, new_global_code,system,tfc)
    cursor.execute(sql.replace('\n',' '))

    # Add to the audit trail
    sql = """
    INSERT INTO %s ([Date],[UserName],[Origin],[Code],[Field],[OldValue],[NewValue],[ChangeType])
    VALUES (getdate(),'%s','%s','%s','GlobalCode','','%s','Add Mapping')
    """ % (config.global_audit_table,user,system,tfc,new_global_code)
    cursor.execute(sql.replace('\n',' '))
    cursor.commit()

    return dict(result='OK')

def remove_mapping(system,tfc,old_global_code,user):
    result = 'OK'

    cnxn = pyodbc.connect(config.connection_string)
    cursor = cnxn.cursor()

    # Put in the mapping
    sql = """
    UPDATE %s 
    set [GlobalCode] = '' where [Origin] = '%s' and [Code] = '%s'
    """ % (config.global_map_table,system,tfc)
    cursor.execute(sql.replace('\n',' '))

    # Add to the audit trail
    sql = """
    INSERT INTO %s ([Date],[UserName],[Origin],[Code],[Field],[OldValue],[NewValue],[ChangeType])
    VALUES (getdate(),'%s','%s','%s','GlobalCode','%s','','Removed mapping')
    """ % (config.global_audit_table,user,system,tfc,old_global_code)
    cursor.execute(sql.replace('\n',' '))
    cursor.commit()

    return dict(result='OK')

def exclude_tfc(system,tfc,exclusion,user):
    result = 'OK'

    cnxn = pyodbc.connect(config.connection_string)
    cursor = cnxn.cursor()

    if exclusion == 'None':
        exclusion = ''

    # Add the exclusion
    sql = """
    UPDATE %s
    set [Excluded] = '%s' where [Origin] = '%s' and [Code] = '%s'
    """ % (config.global_map_table, exclusion,system,tfc)
    cursor.execute(sql.replace('\n',' '))

    # Add to the audit trail
    sql = """
    INSERT INTO %s ([Date],[UserName],[Origin],[Code],[Field],[OldValue],[NewValue],[ChangeType])
    VALUES (getdate(),'%s','%s','%s','Excluded','','%s','Exclusion Changed')
    """ % (config.global_audit_table,user,system,tfc,exclusion)
    cursor.execute(sql.replace('\n',' '))
    cursor.commit()

    return dict(result='OK')


def get_more_tfc_info(system, tfc):
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'
    
    sql = "EXEC spGlobalsApp_GetTFCInfo %s,%s" % (system,tfc)
    data = {}
           
    cursor.execute(sql)
    headers = [column[0] for column in cursor.description]
            
    raw_data = cursor.fetchall()
    data = dict(result=[dict(zip(headers,row)) for row in raw_data])

    return data


def update_global_code_fields(code, updates, user):
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'
    
    #o = [' ' + k + ' = ' + '\'' + v[0] + '\'' for k,v in updates.iteritems()]
    #n = [' ' + k + ' = ' + '\'' + v[1] + '\'' for k,v in updates.iteritems()]

    for k,v in updates.iteritems():

        # Escape dodgy characters
        old = v[0].replace('\'','\'\'')
        new = v[1].replace('\'','\'\'')

        sql = "insert into %s values(getdate(), '%s', 'GlobalCodes_Main', '%s', '%s', '%s', '%s', 'GlobalUpdate')" % (config.global_audit_table, user, code, k, old, new)
        print 'Update audit trail:\n', sql, '\n'
        cursor.execute(sql)

        sql = "update %s set [%s] = '%s' where GlobalCode = '%s'" % (config.global_main_table,k,new,code)
        print 'Update global codes main:\n', sql, '\n'   
        cursor.execute(sql)

    cursor.commit()

    

def insert_new_global_code(code, submission, user):
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'
    
    fields = [f for f in submission]
    values = [submission[f] for f in fields]

    sql = "insert into %s ([%s]) values ('%s')" % (config.global_main_table,"], [".join(fields), "', '".join(values))
               
    cursor.execute(sql)

    for f in fields:
        if submission[f] <> '':
            sql = "insert into %s values(getdate(), '%s', 'GlobalCodes_Main', '%s', '%s', '', '%s', 'NewGlobal')" % (config.global_audit_table, user, code, f, submission[f])
            cursor.execute(sql)

    cursor.commit()






