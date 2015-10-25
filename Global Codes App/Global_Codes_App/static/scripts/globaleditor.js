﻿
// Get the global variables
var current_dept = 'All';
var current_global_code = 'BC_UE_NA';
var current_global_name = 'Sodium';
var info_headers = ['GlobalCode', 'Description', 'Sample', 'Type', 'Analyte', 'PrimaryLibrary', 'SubSection', 'Department', 'NLMC', 'SNOMEDCT_UK', 'LOINC', 'PBCL', 'Interface', 'MiddlewareCode'];


// Preload all the TFCs for quick lookup
$.getJSON('/pull_all_tfcs_to_one_table', function (data) {
    if (data['data'] == 'ERROR') {
        swal({
            title: "Error preloading the TFCs",
            text: "An exception occurred pulling all the TFCs in to a single table. The details have been recorded in the error log. " + data['error_detail'],
            type: "warning"
        });
    } else {
        console.log('Pulled all TFCs to single table');
    };
});


// Get the list of departments
$.getJSON('/globals_department_list', function (data) {
    if (data['data'] == 'ERROR') {
        swal({
            title: "Error looking up departments",
            text: "An exception occurred loading the list of departments. The details have been recorded in the error log. " + data['error_detail'],
            type: "warning"
        });
    } else {
        var dept_filter = '<option>All</option>';
        for (i = 0; i < data['data'].length; i++) {
            dept_filter += '<option>' + data['data'][i] + '</option>';
        };
        $('#global_dept_filter').html(dept_filter);
    };
});

// Initialise the global code table
var global_code_datatable = $('#global_code_datatable').DataTable({
    "fnInitComplete": function () {
        $('#results tbody tr').each(function () {
            $(this).find('td:eq(0)').attr('nowrap', 'nowrap');
        });
    },
    ajax: '/globalseditordata?department=All',
    sPlaceHolder: "head:before",
    columns: [
        { title: "Alias" },
        { title: "GlobalCode" },
        { title: "Description" },
        { title: "Sample" },
        { title: "Type" },
        { title: "Analyte" },
        { title: "PrimaryLibrary" },
        { title: "SubSection" },
        { title: "Department" },
        { title: "NLMC" },
        { title: "SNOMEDCT_UK" },
        { title: "PBCL" },
        { title: "LOINC" },
        { title: "Interface" },
        { title: "MiddlewareCode" }
    ],
    "columnDefs": [
    {
        "visible": false,
        "targets": 0
    }
    ],
    "scrollX": true,
    "bAutoWidth": false
});


// Assign event listener to global filter
$('#global_dept_filter_button').click(function () {
    var url_val = '/globalseditordata?department=' + current_dept;
    global_code_datatable.ajax.url(url_val).load();
});

$('#global_dept_filter').change(function () {
    current_dept = $('#global_dept_filter').val();
    console.log('Current_dept: ' + current_dept);
});


// Respond to clicking a global code
$("#global_code_datatable tbody").delegate("tr", "click", function () {
    current_global_code = $("td:eq(0)", this).text();
    current_global_name = $("td:eq(1)", this).text();
    console.log('You clicked: ' + current_global_code + ' : ' + current_global_name);
    fill_global_code_info(current_global_code);
});


///////////////////////////////
// Global code information
///////////////////////////////

//Fill in the library code detail
function fill_global_code_info(code) {

    var url = '/globalcodedetail?code=' + code;

    $.getJSON(url, function (data) {
        if (data['data'] == 'ERROR') {
            swal({
                title: "Error looking up " + code,
                text: "An exception occurred loading the global data. The details have been recorded in the error log. " + data['error_detail'],
                type: "warning"
            });
        } else {

            // Put the header in
            $('#global_header_code').text(current_global_code);

            // Fill in the basic information
            var info_html = '';
            for (i = 0; i < info_headers.length; i++) {
                info_html += '<div class="form-group"><label class="col-lg-4 control-label">';
                info_html += info_headers[i] + '</label><div id="info_' + info_headers[i];
                info_html += '" class="col-lg-8"><p class="form-control-static">';
                info_html += data['info'][0][info_headers[i]] + '</p></div></div>';
            };
            $('#global_info').html(info_html);

            // Fill in the audit trail
            var audit_html = '';
            for (i = 0; i < data['audit'].length; i++) {
                audit_html += '<tr><td>' + data['audit'][i]['ChangeType'] + ' ' + data['audit'][i]['Code'] + '<br/><small><i class="fa fa-clock-o"></i>';
                audit_html += data['audit'][i]['Date'] + '</small></td><td><strong>' + data['audit'][i]['Origin'] + '</strong></td><td>';
                audit_html += data['audit'][i]['UserName'] + '</td></tr>';
            };
            $('#global_audit').html(audit_html);

            // Fill in the mapping information
            var mapping_html = '';
            for (i = 0; i < data['mapping'].length; i++) {
                mapping_html += '<tr><td>' +  data['mapping'][i]['Origin'] + '</td>';
                mapping_html += '<td>' +  data['mapping'][i]['Code'] + '</td>';
                mapping_html += '<td>' +  data['mapping'][i]['Description'] + '</td>';
                mapping_html += '<td>' +  data['mapping'][i]['MostCommon'] + '</td>';
                mapping_html += '<td>' +  data['mapping'][i]['Units'] + '</td>';
                mapping_html += '<td>' +  data['mapping'][i]['NumLastYear'] + '</td>';
                mapping_html += '<td>' +  data['mapping'][i]['LastSeen'] + '</td>';
                mapping_html += '<td>' +  data['mapping'][i]['GlobalCode'] + '</td>';
                mapping_html += '<td>' +  data['mapping'][i]['Excluded'] + '</td>';
                mapping_html += '<td><button class="btn btn-danger btn-xs global_tfc_mapping_del">DEL</button></td>';
                mapping_html += '<td><button class="btn btn-success btn-xs global_tfc_mapping_edit">EDIT</button></td></tr>';
            };
            $('#global_tfc_mapping').html(mapping_html);
        };
    });
};

// Respond to clicking EDIT button
$("#global_edit_button").click(function () {
    for (i = 0; i < info_headers.length; i++) {
        var content = $('#info_' + info_headers[i] + ' p').text();
        $('#info_' + info_headers[i]).html('<input value="' + content + '" class="form-control"></div>');
    };
    $('#global_info').append('<div class="form-group"><div class="col-sm-7 col-sm-offset-4"><button id="global_info_submit" type="button"  onClick="global_info_submit_click(); return false;" class="btn btn-success">Save changes</button></div></div>');
});

function global_info_submit_click() {
    console.log('Clicked submit button');
};