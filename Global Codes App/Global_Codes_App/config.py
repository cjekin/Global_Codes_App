# Main config file holding global variables
# and SQL table pointers


# Global variables
global_tlcs = {}
global_codes = {}
systems = ['BMI_ALL_DW','CROM_ALL_DW','EAL_BHI_DW','EAL_MIC_DW','UCLH_BHI_DW','UCLH_MIC_DW','RFH_BIO_DW','RFH_VIRO_DW','RFH_HPIL_DW','RFH_MICR_DW','WSL_ALL_DW']

# SQL database config
connection_string = 'DSN=Warehouse;CHARSET=UTF8'
global_map_table = '[GlobalCodes].[dbo].[GlobalCodes_Map]'
global_main_table = '[Warehouse].[dbo].[GlobalCodes_Main]'
global_audit_table = '[GlobalCodes].[dbo].[GlobalCodes_Audit]'
#global_audit_table = '[Warehouse].[dbo].[GlobalCodes_Audit]'

global_location = '[GlobalCodes].[dbo].[GlobalCodes_Locations]'
global_container = '[GlobalCodes].dbo.[GlobalCodes_Container]'
global_preanalytics = '[GlobalCodes].dbo.[GlobalCodes_Preanalytics]'

global_test_codes_staging = '[GlobalCodes].[dbo].[GlobalCodes_TEST_CODES_STAGING]'
global_test_staging =  '[GlobalCodes].[dbo].[GlobalCodes_TEST_STAGING]'
global_form_staging =  '[GlobalCodes].[dbo].[GlobalCodes_FORM_STAGING]'
global_sections = '[GlobalCodes].[dbo].[GlobalCodes_SECTIONS]'
global_flatten = '[GlobalCodes].[dbo].[GlobalCodes_FLAT]'
global_form_info = '[GlobalCodes].[dbo].[GlobalCodes_FORM_INFO]'

map_tbl = 'g_map'
global_map_tbl = '[GlobalCodes].[dbo].[global_map]'
global_lexical_tbl = '[GlobalCodes].[dbo].[GlobalCodes_Lexical]'
loinc_db = '[GlobalCodes].[dbo].[LOINC_Main]'


# Other
error_log_file = 'error_log.txt'
excluded_fields = ['HALO_SubSection','HALO_Department','SubSection','Department']


# Pro config (new spreadsheet queries)



spreadsheet_queries = [{'func': 'Global_Table', 'name': 'Global Codes Table', 'desc': 'Global codes joined to locations for extra info'},
                       {'func': 'Global_Table_WithUnits', 'name': 'Global Codes Table (With Units)', 'desc': 'Global codes joined to locations for extra info'},
                       {'func': 'Lexical_Table', 'name': 'Lexical Table', 'desc': 'Global multi-lingual table'},
                       {'func': 'Location_Table', 'name': 'Location Table', 'desc': 'Global location table'},
                       {'func': 'Preanalytics_Table', 'name': 'Preanalytics Table', 'desc': 'Shows preanalytics information for loinc, container and location'}
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







