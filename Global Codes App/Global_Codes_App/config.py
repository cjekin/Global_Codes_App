# Main config file holding global variables
# and SQL table pointers


# Global variables
global_tlcs = {}
global_codes = {}


# SQL database config
connection_string = 'DSN=Warehouse;CHARSET=UTF8'
global_map_table = 'GlobalCodes_Map'
global_main_table = 'GlobalCodes_Main'
global_audit_table = 'GlobalCodes_Audit'
location_table = 'GlobalCodes_Departments'


# Other
error_log_file = 'error_log.txt'
excluded_fields = ['HALO_SubSection','HALO_Department','SubSection','Department']




