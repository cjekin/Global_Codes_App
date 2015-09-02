


import pyodbc

def generic_sql(table,filters,headers='ALL'):
    try:
        cnxn = pyodbc.connect('DSN=Warehouse')
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



def exec_stored_procedure(stored_procedure, headers=[]):
    try:
        cnxn = pyodbc.connect('DSN=Warehouse')
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'
    
    sql = "EXEC %s ;" % (stored_procedure)
    data = {}
           
    try: 
        cursor.execute(sql)
        raw_data = cursor.fetchall()

        if headers == []:
            data['data'] = [dict(zip(range(len(row)),row)) for row in raw_data]
        else:
            data['data'] = [dict(zip(headers,row)) for row in raw_data]
    except:
        data['data'] = 'Error'

    return data



def pull_raw_data():
    # Pull all data in to a single table and convert to dict
    try:
        cnxn = pyodbc.connect('DSN=Warehouse')
        cursor = cnxn.cursor()
    except:
        print 'Problem making connection'
    
    sql = "EXEC spGlobalsApp_RawMapping"
    data = {}
           
    try: 
        cursor.execute(sql)
        headers = [column[0] for column in cursor.description]
        print headers
            
        raw_data = cursor.fetchall()
        raw_data_dict = [dict(zip(headers,row)) for row in raw_data]
    except:
        print('Problem pulling data')
        return {'data':'ERROR'} 
    
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
            D[system][tlc]['tlc_mapped'] = max([t['global_mapped'] for t in D[system][tlc]['tfc']])
    
    return D


def pull_library_data(D,system,section='ALL',primary=1,unmapped=1):
    result = []
    for r in D[system]:
        accept = True
        
        if unmapped == 1 and D[system][r]['tlc_mapped'] == 1:
            accept = False
        if primary == 1 and D[system][r]['tlc_primary'] == 0:
            accept = False
        if section not in D[system][r]['tlc_sections']:
            accept = False
        if accept == True:
            num_tfc = len([t for t in D[system][r]['tfc']])
            L = dict(Mapped=D[system][r]['tlc_mapped'], TLC=r,
                     Name=D[system][r]['tlc_name'],Type=D[system][r]['tlc_type'],Size=num_tfc)
            result.append(L)
    result = sorted(result, key=lambda k: k['TLC']) 
            
    return {'data': result}