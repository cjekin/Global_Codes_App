import config
import pyodbc
import string
import traceback
import sys

def safe_str(obj):
    """ return the byte string representation of obj """
    try:
        return str(obj)
    except UnicodeEncodeError:
        # obj is unicode
        return unicode(obj).encode('unicode_escape')

def safe_unicode(obj, *args):
    """ return the unicode representation of obj """
    try:
        return unicode(obj, *args)
    except UnicodeDecodeError:
        # obj is byte string
        ascii_text = str(obj).encode('string_escape')
        return unicode(ascii_text)


def run_odbc_query(sql):
    
    cnxn = pyodbc.connect(config.connection_string)
    cursor = cnxn.cursor()
    
    cursor.execute(sql.replace('\n',' '))
    
    headers = [column[0] for column in cursor.description]     
       
    raw_data = cursor.fetchall()
    
    result = dict(data=[dict(zip(headers,[safe_unicode(i) for i in row])) for row in raw_data])

    return result


def update_odbc_table(submission, user_name):
    
    cnxn = pyodbc.connect(config.connection_string)
    cursor = cnxn.cursor()

    if type(submission['id']) == int:
        id_update = submission['id']
    else:
        id_update = "'" + submission['id'] + "'"
    
    sql_update = """
    update {table}
    set {field} = '{newval}'
    where {id_name} = {id}
    """.format(table = submission['table'], 
               field = submission['field'],
               newval = submission['newval'],
               id_name = submission['id_name'],
               id = id_update
               )

    sql_audit = """
    insert into {table} ({date_fld},{user_fld},{field_fld},{origin_fld},{code_fld},{oldval_fld},{newval_fld},{change_fld})
    values ({date},{user},{field},{origin},{code},{oldval},{newval},{change})
    """.format(table = config.global_audit_table, 
               date_fld = config.global_audit_table_fields['date'],
               user_fld = config.global_audit_table_fields['user'],
               field_fld = config.global_audit_table_fields['field'],
               origin_fld = config.global_audit_table_fields['origin'],
               code_fld = config.global_audit_table_fields['code'],
               oldval_fld = config.global_audit_table_fields['oldval'],
               newval_fld = config.global_audit_table_fields['newval'],
               change_fld = config.global_audit_table_fields['change'],
               date = 'getdate()',
               user = "'" + user_name + "'",
               field = "'" + submission['field'] + "'",
               origin = "'" + submission['table'] + "'",
               code = "'" + submission['id'] + "'",
               oldval = "'" + submission['oldval'] + "'",
               newval = "'" + submission['newval'] + "'",
               change = "'Update'"
               )

    print sql_update
    cursor.execute(sql_update.replace('\n',' '))

    print sql_audit
    cursor.execute(sql_audit.replace('\n',' '))
    cursor.commit()



def get_column_display_names(columns):
    L = []
    for c in columns:
        if c in config.column_display:
            L.append(config.column_display[c])
        else:
            L.append(c)
    return L


def Lexical_Table():
    columns = ['LONG_COMMON_NAME','id','loinc','snomed_analyte','nlmc',
               'readcode','cust_analyte','cust_description']

    sql = """
    SELECT {fields}
    from {global_lexical} l
    inner join {loinc_db} ln on l.loinc = ln.LOINC_NUM
    """.format(fields = '[' + '],['.join(columns)  + '] ', 
               global_lexical = config.global_lexical_tbl, 
               loinc_db = config.loinc_db)

    result = run_odbc_query(sql)
    result['columns'] = columns
    result['columns_desc'] = get_column_display_names(columns)
    result['hidden'] = [1]
    result['locked'] = ['LONG_COMMON_NAME','id','loinc']
    result['id_field'] = 'id'
    result['table'] = config.global_lexical_tbl
    result['type'] = {'snomed_analyte': 'dropdown'}

    print sql
    return result


def Location_Table():
    columns = ['SubSectionCode','SubSection','Department','Location','Address','PostCode',
               'Telephone','Contact','HALO','WSL','Referral']

    sql = """
    SELECT {fields}
    from {location_table}
    """.format(fields = '[' + '],['.join(columns)  + '] ', 
               location_table = config.location_table)

    result = run_odbc_query(sql)

    result['columns'] = columns
    result['columns_desc'] = get_column_display_names(columns)
    result['hidden'] = []
    result['locked'] = ['SubSectionCode']
    result['id_field'] = 'SubSectionCode'
    result['table'] = config.location_table

    print sql
    return result


def Global_Table():
    columns = ['Alias','GlobalCode','Description','Sample','Type','Analyte','PrimaryLibrary','SubSectionCode',
               'SubSection','Department','HALO_SubSectionCode','HALO_SubSection','HALO_Department','HSL_Code','NLMC',
               'SNOMEDCT_UK','PBCL','LOINC','Interface','MiddlewareCode']

    sql = """
    select l.RELATEDNAMES2 as Alias,
    g.[GlobalCode], g.[Description], g.[Sample], g.[Type], g.[Analyte], g.[PrimaryLibrary], 
    isnull(g.SubSectionCode,'') as SubSectionCode, isnull(d1.[SubSection],'') as SubSection, isnull(d1.[Department],'') as Department, 
    isnull(g.HALO_SubSectionCode,'') as HALO_SubSectionCode, isnull(d2.[SubSection],'') as HALO_SubSection, isnull(d2.[Department],'') as HALO_Department,
    isnull(g.HSL_Code,'') as HSL_Code,
    g.[NLMC], g.[SNOMEDCT_UK], g.[PBCL], g.[LOINC], g.[Interface], g.[MiddlewareCode]

    from {global_main} g 
    left join {loinc} l on g.LOINC = l.LOINC_NUM 
    left join {global_dept} d1 on g.SubSectionCode = d1.SubSectionCode and isnull(g.SubSectionCode,'') <> ''
    left join {global_dept} d2 on g.HALO_SubSectionCode = d2.SubSectionCode and isnull(g.HALO_SubSectionCode,'') <> ''
    """.format(global_main = config.global_main_table, loinc = config.loinc_db, global_dept = config.location_table)


    result = run_odbc_query(sql)

    result['columns'] = columns
    result['columns_desc'] = get_column_display_names(columns)
    result['hidden'] = [0]
    result['locked'] = ['Alias','GlobalCode','SubSection','Department','HALO_SubSection','HALO_Department']
    result['id_field'] = 'GlobalCode'
    result['table'] = config.global_main_table

    print sql
    return result