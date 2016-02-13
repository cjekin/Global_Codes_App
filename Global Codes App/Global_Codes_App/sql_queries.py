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
               location_table = config.global_location)

    result = run_odbc_query(sql)

    result['columns'] = columns
    result['columns_desc'] = get_column_display_names(columns)
    result['hidden'] = []
    result['locked'] = ['SubSectionCode']
    result['id_field'] = 'SubSectionCode'
    result['table'] = config.global_location

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
    """.format(global_main = config.global_main_table, loinc = config.loinc_db, global_dept = config.global_location)


    result = run_odbc_query(sql)

    result['columns'] = columns
    result['columns_desc'] = get_column_display_names(columns)
    result['hidden'] = [0]
    result['locked'] = ['Alias','GlobalCode','SubSection','Department','HALO_SubSection','HALO_Department']
    result['id_field'] = 'GlobalCode'
    result['table'] = config.global_main_table

    print sql
    return result



def Worksection_Data(params):
    columns = ['section_letter','section_name']

    sql = """
    select {fields} from {sections_table} where Origin = '{system}'
    """.format(fields = '[' + '],['.join(columns)  + '] ', 
               sections_table = config.global_sections,
               system = params['system'])

    result = run_odbc_query(sql)

    print sql
    return result


def TLC_List_For_Mapper(params): #db_name, section, primary, unmapped):

    section_sql = ''
    other_sql = []
    other_sql_string = ''

    if params['section'][:1] <> '0':
        section_sql = " and f.WrkSection = '" + params['section'][:1] + "' "
    if params['primary'] == '1':
        other_sql.append(' tlc_primary = 1 ')
    if params['unmapped'] == '1':
        other_sql.append(' tlc_mapped = 0') 
    if len(other_sql) > 0:
        other_sql_string = ' where ' + ' and '.join(other_sql)

    sql = """
    select tlc_mapped, tlc, tlc_name, tlc_type, num_codes from (
    select min(tfc_mapped) as tlc_mapped, tlc, tlc_name, tlc_type, tlc_primary, count(tfc) as num_codes
    from (
	    select tlc.[Test Code] as tlc, tlc.[Description] as tlc_name, tlc.[TLC type] as tlc_type,
	    case when tlc.[Test Code] in (select distinct TLC from {FORM_INFO}) then 1 else 0 end as tlc_primary, tc.TFC as tfc
	    ,case when isnull(map.loinc,'') <> '' or isnull(map.result_type,'') not in ('Result','SubResult','') then 1 else 0 end as tfc_mapped
	    from {TEST_STAGING} tlc 
	    inner join {FLAT} tc on tlc.[Test Code] = tc.TLC and tlc.[Origin] = tc.[Origin]
	    inner join {FORM_STAGING} f on tc.TFC = f.TFC and tc.[Origin] = f.[Origin]
	    left join {GlobalCodes_Map} map on f.TFC = map.tfc and map.origin = f.[Origin]
	    where tlc.Origin = '{DB_NAME}'
	    {SECTION}
    ) q1
    group by tlc, tlc_name, tlc_type, tlc_primary
    ) q2
    {OTHER_SQL}
    
    """.format(DB_NAME = params['system'], 
               SECTION = section_sql, 
               OTHER_SQL = other_sql_string,
               TEST_STAGING = config.global_test_staging,
               FLAT = config.global_flatten,
               FORM_STAGING = config.global_form_staging,
               FORM_INFO = config.global_form_info,
               GlobalCodes_Map = config.global_map_table)

    print 'Running\n\n\n', sql, '\n\n\n'

    result = run_odbc_query(sql)

    result['columns'] = ['tlc_mapped','tlc','tlc_name','tlc_type','num_codes']
    result['columns_desc'] = ['Mapped','TLC','TLC Description','Type','Num Codes']
    result['id_field'] = 'tlc'
    result['table'] = config.global_main_table

    return result




def TLC_Detail_For_Mapper(params): 

    sql = """
    select f.TFC as tfc, f.WrkSection as sec, f.TestName as tfc_name, 
    isnull(f.Units,'') as tfc_units, isnull(f.Reflab,'') as tfc_reflab
    ,isnull(fi.MostCommon,'') as MostCommon, isnull(fi.NumLastYear,0) as NumLastYear

    ,isnull(map.result_type,'') result_type 
    ,isnull(map.loinc,'') as loinc, isnull(loinc.LONG_COMMON_NAME,'') as loinc_name
    ,isnull(map.container,'') as container 

    ,isnull(map.loc1,'') as loc1, isnull(l1.SubSection,'') as loc1_subsection, isnull(l1.Department,'') as loc1_department, isnull(l1.Location,'') as loc1_location
    ,isnull(map.loc2,'') as loc2, isnull(l2.SubSection,'') as loc2_subsection, isnull(l2.Department,'') as loc2_department, isnull(l2.Location,'') as loc2_location
    ,map.map_id

    from {TEST} tlc
    inner join {FLAT} flat on tlc.[Test Code] = flat.[TLC] and tlc.Origin = flat.Origin
    inner join {FORM} f on flat.TFC = f.TFC and flat.Origin = f.Origin
    left join {FORM_INFO} fi on f.TFC = fi.TFC and f.Origin = fi.Origin
    left join {MAP} map on f.TFC = map.tfc and f.Origin = map.origin
    left join {LOINC} loinc on map.loinc = loinc.LOINC_NUM
    left join {LOCATIONS} l1 on map.loc1 = l1.SubSectionCode
    left join {LOCATIONS} l2 on map.loc2 = l2.SubSectionCode
    where tlc.[Test Code] = '{TLC}'
    and tlc.[Origin] = '{ORIGIN}'
    order by f.[Row]
    """.format(TEST = config.global_test_staging,
               FLAT = config.global_flatten,
               FORM = config.global_form_staging,
               FORM_INFO = config.global_form_info,
               MAP = config.global_map_table,
               LOINC = config.loinc_db,
               LOCATIONS = config.global_location,
               TLC = params['TLC'],
               ORIGIN = params['Origin'])

    print 'Running\n\n\n', sql, '\n\n\n'

    result = run_odbc_query(sql)

    result['columns_desc'] = ['TFC','Sec','TFC Name','Units','Reflab','Most Common Result',
                              'Type','LOINC','Container','Loc1','Current Location','Department',
                              'Location','Loc2','Future Location','Future Dept','Future Loc','map_id']
    result['id_field'] = 'map_id'
    result['table'] = config.global_map_table

    return result



def Mapped_LOINC_List(params): 
    
    sql = """
    
    select loinc as id, [text]
    from (
    select distinct loinc,
    l.LONG_COMMON_NAME as [text], l.LONG_COMMON_NAME + ';' + l.RELATEDNAMES2 as alias, 
    COMMON_SI_TEST_RANK

    from {MAP} map
    inner join {LOINC} l on map.loinc = l.LOINC_NUM
    where charindex('{search_term}',l.COMPONENT + ';' + l.RELATEDNAMES2) > 0
    and CLASSTYPE = 1
    ) q
    order by case when COMMON_SI_TEST_RANK = 0 then 9999 else COMMON_SI_TEST_RANK end asc
    """.format(MAP = config.global_map_table, 
               LOINC = config.loinc_db, 
               #LOCATIONS = config.global_location,
               search_term = params['search_term'])

    result = run_odbc_query(sql)

    result['columns_desc'] = ['LOINC','LOINC Name']
    result['id_field'] = 'loinc'
    result['table'] = config.loinc_db

    return result




#def Container_List_For_Mapper(): 

#    sql = """
#    select cont_id as id, container as [text], cont_type
#    from {CONTAINER}
#    """.format(CONTAINER = config.global_container)
          

#    result = run_odbc_query(sql)

#    result['columns_desc'] = ['Container ID','Container','Container Type']
#    result['id_field'] = 'cont_id'
#    result['table'] = config.global_container

#    return result



def Location_List_For_Mapper(): 

    sql = """
    select SubSectionCode as id, SubSection as [text], Department, 
    SubSection + ';' + Location + ';' + [Address] as search_fields
    from {LOCATIONS}
    """.format(LOCATIONS = config.global_location)
               

    result = run_odbc_query(sql)

    D = {}
    i = 1
    for r in result['data']:
        if r['Department'] not in D:
            D[r['Department']] = [r]
        else:
            D[r['Department']].append(r)
    depts = sorted([k for k in D])
    L = [dict(id=i, text=depts[i], children=D[depts[i]]) for i in range(len(depts))]


    result['nested_select'] = L
    result['columns_desc'] = ['SubSection Code','SubSection','Search Text']
    result['id_field'] = 'id'
    result['table'] = config.global_location

    return result


def Container_List_For_Mapper(): 

    sql = """
    select [container] as [id],[container] as [text],[cont_type]
    from {CONTAINERS}
    """.format(CONTAINERS = config.global_container)
           
    result = run_odbc_query(sql) 
       
    D = {}
    i = 1
    for r in result['data']:
        if r['cont_type'] not in D:
            D[r['cont_type']] = [r]
        else:
            D[r['cont_type']].append(r)
    cont = sorted([k for k in D])
    L = [dict(id=i, text=cont[i], children=D[cont[i]]) for i in range(len(cont))]

    result['nested_select'] = L
    result['columns_desc'] = ['ID','Container','Container Type']
    result['id_field'] = 'id'
    result['table'] = config.global_container

    return result



def Find_Similar_LOINC(params): 

    sql = """
    select top 1 m.[map_id],m.[origin],m.[tfc],m.[loinc],m.[container],m.[loc1],m.[loc2],m.[result_type],
    l1.SubSection as loc1_subsection, l1.Department as loc1_department, l2.SubSection as loc2_subsection, l2.Department as loc2_department
    from {MAP} m
    inner join {LOCATIONS} l1 on m.loc1 = l1.SubSectionCode
    inner join {LOCATIONS} l2 on m.loc2 = l2.SubSectionCode
    left join {FORM_INFO} fi on m.tfc = fi.TFC and m.origin = fi.Origin
    where loinc = '{loinc_code}'
    order by isnull(NumLastYear,0)
    """.format(MAP = config.global_map_table, 
               FORM_INFO = config.global_form_info, 
               LOCATIONS = config.global_location,
               loinc_code = params['loinc'])
           
    result = run_odbc_query(sql) 
       
    result['id_field'] = 'map_id'
    result['table'] = config.global_map_table

    return result



def More_TFC_Info(params): 

    sql = """
    select f.TestName, f.Units,  fi.MostCommon, fi.MostCommonPct, fi.SecondMostCommon, fi.SecondMostCommonPct
    ,f.Functions, f.RepSection, fi.NumLastYear, fi.TLC, fi.TLCDescription, f.Reflab, isnull(fi.RefLabName,'') as RefLabName
    ,f.WrkSection, fi.SectionName
    from {FORM_STAGING} f
    left join {FORM_INFO} fi on f.TFC = fi.TFC and f.Origin = fi.Origin
    where f.TFC = '{TFC}'
    and f.Origin = '{ORIGIN}'
    """.format(FORM_STAGING = config.global_form_staging, 
               FORM_INFO = config.global_form_info,
               TFC = params['tfc'],
               ORIGIN = params['origin'])
           
    result = run_odbc_query(sql) 
       
    result['columns_desc'] = ['Test Name','Units','Most Common Result','Most Common %','2nd Most Common','2nd Most Common %','Functions','Report Sec','Number Last Year','TLC','TLC Desc','RefLab','RefLab Name','Section','Section Name']
    result['columns'] = ['TestName', 'Units',  'MostCommon', 'MostCommonPct', 'SecondMostCommon', 'SecondMostCommonPct', 'Functions', 'RepSection', 'NumLastYear', 'TLC', 'TLCDescription', 'Reflab', 'RefLabName', 'WrkSection', 'SectionName']   
    result['id_field'] = 'ID'
    result['table'] = config.global_form_staging

    return result