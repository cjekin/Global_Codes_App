import config
import pyodbc
import string
import traceback
import sys

def generic_sql(table,filters,headers='ALL'):
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'

    if headers == 'ALL':
        header_sql = """
        SELECT COLUMN_NAME
        FROM Warehouse.INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = N'%s'
        """ % (table)

        cursor.execute(header_sql)
        header_raw = cursor.fetchall()
        headers = [i[0] for i in header_raw]
    
    sql = "select %s from TLC" % (','.join(headers))
    
    if len(filters) > 0:
        sql += ' where '
        for key,value in filters.iteritems():
            sql += key + ' = \'' + value + '\''
            
    cursor.execute(sql)
    raw_data = cursor.fetchall()
    data = [dict(zip(headers,row)) for row in raw_data]
    return dict(headers=headers, data=data)


def exec_stored_procedure(stored_procedure,arguements=[]):
    try:
        cnxn = pyodbc.connect(config.connection_string)
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'
    
    sql = "EXEC %s %s;" % (stored_procedure,','.join(arguements))
    data = {}
           
    try: 
        cursor.execute(sql)
        headers = [column[0] for column in cursor.description]
            
        raw_data = cursor.fetchall()
        data = dict(result=[dict(zip(headers,row)) for row in raw_data])
    except:
        data['result'] = 'ERROR'

    return data

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
    print sql
    data = {}
           
    cursor.execute(sql)
    raw_data = cursor.fetchall()
    print 'Raw data\n', raw_data
        
    # Clear the non-ascii characters from the result
    print('Cleaning the data of non-ascii characters...')
    for i in range(len(raw_data)):
        for j in range(len(raw_data[i])):
            raw_data[i][j] = str(raw_data[i][j])
            raw_data[i][j] =  ''.join([c if ord(c) < 128 else ' ' for c in raw_data[i][j]]) 
    print('Finished cleaning data')

    output_list = []
    if header_row == True:
        output_list = [[column[0] for column in cursor.description]]

    for r in raw_data:
        output_list.append(list(r))

    print 'Output list: \n', output_list

    data = dict(data=output_list)

    return data





def strip_non_ascii(string):
    ''' Returns the string without non ASCII characters'''
    stripped = (c for c in string if 0 < ord(c) < 127)
    return ''.join(stripped)


def pull_raw_data():
    # Pull all data in to a single table and convert to dict
    cnxn = pyodbc.connect(config.connection_string)
    cursor = cnxn.cursor()
    
    sql = "EXEC spGlobalsApp_RawMapping"
    data = {}
           
    cursor.execute(sql)
    headers = [column[0] for column in cursor.description]
    print('-----------\nLoading headers for raw data')
            
    raw_data = cursor.fetchall()

    # Clear the non-ascii characters from the result
    print('Cleaning the data of non-ascii characters...')
    for i in range(len(raw_data)):
        for j in range(len(raw_data[i])):
            if type(raw_data[i][j]) == str:
                raw_data[i][j] =  ''.join([c if ord(c) < 128 else ' ' for c in raw_data[i][j]]) 
    print('Finished cleaning data')

    raw_data_dict = [dict(zip(headers,row)) for row in raw_data]

    # Format the result in to a dictionary
    D = {}
    for r in raw_data_dict:
        temp_dict = {k:v for k,v in r.iteritems() if k not in ['system', 'tlc', 'tlc_name', 'tlc_type', 'tlc_primary']}
        
        if r['system'] not in D:
            D[r['system']] = {r['tlc']:dict(tfc=[temp_dict], tlc_type=r['tlc_type'], 
                                            tlc_name=r['tlc_name'], tlc_primary=r['tlc_primary'])}
        elif r['tlc'] not in D[r['system']]: 
            D[r['system']][r['tlc']] = dict(tfc=[temp_dict], tlc_type=r['tlc_type'], 
                                            tlc_name=r['tlc_name'], tlc_primary=r['tlc_primary'])
        else:
            D[r['system']][r['tlc']]['tfc'].append(temp_dict)
            
            
    # Get the summary data
    for system in D:
        for tlc in D[system]:
            D[system][tlc]['tlc_sections'] = sorted(list(set([t['tfc_worksection'] for t in D[system][tlc]['tfc']])))
            D[system][tlc]['tlc_mapped'] = min([t['global_mapped'] for t in D[system][tlc]['tfc']])
    
    return D


def pull_library_data(D,system,section,primary,unmapped):
    result = []
    print 'pull_library_data: ', primary, unmapped
    for r in D[system]:
        accept = True
        
        if unmapped == '1' and D[system][r]['tlc_mapped'] == 1:
            accept = False
        if primary == '1' and D[system][r]['tlc_primary'] == 0:
            accept = False
        if section not in D[system][r]['tlc_sections']:
            accept = False
        if accept == True:
            num_tfc = str(len([t for t in D[system][r]['tfc']]))
            L = [D[system][r]['tlc_mapped'], r, D[system][r]['tlc_name'], D[system][r]['tlc_type'], num_tfc]
            
            result.append(L)
    #result = sorted(result, key=lambda k: k['TLC']) 
            
    return {'data': result}



def pull_tlc_detail_old(system, tlc):
    print('Pulling TLC detail for: ' + system + ': ' + tlc)

    tfcs = config.global_tlcs[system][tlc]['tfc']

    for i in range(len(tfcs)):
        try:
            if 'BC_' in tfcs[i]['global_code']:
                tfcs[i]['global_name'] = config.global_codes[tfcs[i]['global_code']]['Description']
                tfcs[i]['global_sample'] = config.global_codes[tfcs[i]['global_code']]['Sample']
                tfcs[i]['global_type'] = config.global_codes[tfcs[i]['global_code']]['Type']
        except:
            x='Do nothing'
            #print('Unable to find global ' + str(tfcs[i]['global_code']) + ' to get details')

    result = {}
    result['tlc_name'] = config.global_tlcs[system][tlc]['tlc_name']
    result['tlc_type'] = config.global_tlcs[system][tlc]['tlc_type']
    result['tfc'] = tfcs

    return {'result': result} 


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
    set [BC] = '%s' where [Origin] = '%s' and [Code] = '%s'
    """ % (config.global_map_table, new_global_code,system,tfc)
    cursor.execute(sql.replace('\n',' '))

    # Add to the audit trail
    sql = """
    INSERT INTO %s ([Date],[UserName],[Origin],[Code],[Change],[ChangeType])
    VALUES (getdate(),'%s','%s','%s','%s','Add Mapping')
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
    set [BC] = '' where [Origin] = '%s' and [Code] = '%s'
    """ % (config.global_map_table,system,tfc)
    cursor.execute(sql.replace('\n',' '))

    # Add to the audit trail
    sql = """
    INSERT INTO %s ([Date],[UserName],[Origin],[Code],[Change],[ChangeType])
    VALUES (getdate(),'%s','%s','%s','%s','Removed mapping')
    """ % (config.global_audit_table,user,system,tfc,old_global_code)
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