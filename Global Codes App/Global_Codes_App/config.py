# Main config file holding global variables
# and SQL table pointers


# Global variables
global_tlcs = {}
global_codes = {}
systems = ['BMI_ALL_DW','CROM_ALL_DW','WSL_ALL_DW']

# SQL database config
connection_string = 'DSN=Warehouse;CHARSET=UTF8'
global_map_table = 'GlobalCodes_Map'
global_main_table = 'GlobalCodes_Main'
global_audit_table = 'GlobalCodes_Audit'
location_table = 'GlobalCodes_Departments'

global_audit_table_fields = { 'date': '[Date]', 'user': '[UserName]', 'origin': '[Origin]',
                             'code': '[Code]', 'field': '[Field]', 'oldval': '[OldValue]', 
                             'newval': '[NewValue]', 'change': '[ChangeType]'}

# Other
error_log_file = 'error_log.txt'
excluded_fields = ['HALO_SubSection','HALO_Department','SubSection','Department']


# Pro config (new spreadsheet queries)

map_tbl = 'g_map'
lexical_tbl = 'g_lexical'
global_map_tbl = '[GlobalCodes].[dbo].[global_map]'
global_lexical_tbl = '[GlobalCodes].[dbo].[global_lexical]'
loinc_db = '[GlobalCodes].[dbo].[LOINC]'

spreadsheet_queries = [{'func': 'Lexical_Table', 'name': 'Lexical Table', 'desc': 'Global multi-lingual table'},
                       {'func': 'Location_Table', 'name': 'Location Table', 'desc': 'Global location table'},
                       {'func': 'Global_Table', 'name': 'Global Codes Table', 'desc': 'Global codes joined to locations for extra info'}
                       ]

column_display = {
    'loinc':'LOINC',
    'snomed_analyte':'SNOMED-CT Analyte',
    'nlmc': 'NLMC',
    'readcode': 'Read Code',
    'cust_analyte': 'Analyte',
    'cust_description': 'TDL Description',
    'origin': 'Winpath',
    'tfc': 'TFC',
    'container': 'Container',
    'loc1': 'Current Location',
    'loc2': 'HALO location',
    'type': 'Type'
    }







