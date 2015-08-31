


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