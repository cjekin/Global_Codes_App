
// Get the global variables
var current_dept = 'All';
var current_global_code = 'BC_UE_NA';
var current_global_name = 'Sodium';
var current_global_data = {};
var mapping_exclusions = {};
var wsl_depts = [];
var halo_depts = [];
var info_headers = ['GlobalCode', 'Description', 'Sample', 'Type', 'Analyte', 'PrimaryLibrary', 'SubSectionCode', 'SubSection', 'Department',
    'HALO_SubSectionCode', 'HALO_SubSection', 'HALO_Department', 'HSL_Code', 'NLMC', 'SNOMEDCT_UK', 'LOINC', 'PBCL', 'Interface', 'MiddlewareCode'];

// Custom renderers for fields (default is input)
var header_val = {
    'Sample':'select',
    'Type': 'select',
    'Description': 'autocomplete',
    'Analyte': 'autocomplete',
    'PrimaryLibrary': 'autocomplete',
    'Department': 'department',
    'SubSectionCode': 'disabled',
    'SubSection': 'subsection_wsl',
    'Department': 'disabled',
    'HALO_SubSectionCode': 'disabled',
    'HALO_SubSection': 'subsection_halo',
    'HALO_Department': 'disabled'
};



$('.global_detail_class').hide();
$(window.scrollTo(0, 0));

function scroll_to_this(element,speed) {
    $('html, body').animate({
        scrollTop: element.offset().top
    }, speed);
};

// Preload all the TFCs for quick lookup in subsequent SQL queries
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
    if (data['result'] == 'ERROR') {
        swal({
            title: "Error looking up departments",
            text: "An exception occurred loading the list of departments. The details have been recorded in the error log. " + data['error_detail'],
            type: "warning"
        });
    } else {
        all_depts = data['data'];
        var departments = []
        var dept_filter = '<option>All</option>';
        for (i = 0; i < data['result'].length; i++) {

            // Build the filter list of departments (WSL only)
            if ($.inArray(data['result'][i]['Department'], departments) < 0 && data['result'][i]['WSL'] == 'Y') {
                dept_filter += '<option>' + data['result'][i]['Department'] + '</option>';
                departments.push(data['result'][i]['Department']);
            };

            // Build the list of WSL departments
            if (data['result'][i]['WSL'] == 'Y') {
                wsl_depts.push([
                    data['result'][i]['Department'],
                    data['result'][i]['SubSection'],
                    data['result'][i]['SubSectionCode']
                ]);
            };

            // Build the list of Halo departments
            if (data['result'][i]['HALO'] == 'Y') {
                halo_depts.push([
                    data['result'][i]['Department'],
                    data['result'][i]['SubSection'],
                    data['result'][i]['SubSectionCode']
                ]);
            };
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
        $('.global_detail_class').show();
        window.scrollTo(0,0);
    },
    ajax: '/globalseditordata?department=All',
    sPlaceHolder: "head:before",
    columns: [
        { title: "Alias", name: "Alias" },
        { title: "GlobalCode", name: "GlobalCode" },
        { title: "Description", name: "Description"},
        { title: "Sample", name: "Sample" },
        { title: "Type", name: "Type" },
        { title: "Analyte", name: "Analyte" },
        { title: "PrimaryLibrary", name: "PrimaryLibrary" },
        { title: "SubSectionCode", name: "SubSectionCode" },
        { title: "SubSection", name: "SubSection" },
        { title: "Department", name: "Department" },
        { title: "HALO_SubSectionCode", name: "HALO_SubSectionCode" },
        { title: "HALO_Subsection", name: "HALO_Subsection" },
        { title: "HALO_Department", name: "HALO_Department" },
        { title: "HSL_Code", name: "HSL_Code" },
        { title: "NLMC", name: "NLMC" },
        { title: "SNOMEDCT_UK", name: "SNOMEDCT_UK" },
        { title: "PBCL", name: "PBCL" },
        { title: "LOINC", name: "LOINC" },
        { title: "Interface", name: "Interface" },
        { title: "MiddlewareCode", name: "MiddlewareCode" }
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
    get_global_code_info(current_global_code);
});

// Preload a global code
$(get_global_code_info(current_global_code));


///////////////////////////////
// Global code information
///////////////////////////////

//Fill in the library code detail
function get_global_code_info(code) {

    var url = '/globalcodedetail?code=' + code;

    $.getJSON(url, function (data) {
        if (data['data'] == 'ERROR') {
            swal({
                title: "Error looking up " + code,
                text: "An exception occurred loading the global data. The details have been recorded in the error log. " + data['error_detail'],
                type: "warning"
            });
        } else {
            fill_global_data(data);
        };
    });
};

function fill_global_data(data) {

    current_global_data = data;

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
        audit_html += '<tr><td>' +
            data['audit'][i]['Origin'] + '<br/>' +
            data['audit'][i]['Code'] + '<br/>' +
            data['audit'][i]['Field'] + '<br/></td><td>' +
            '<strong>Old:</strong> ' + data['audit'][i]['OldValue'] + '<br/>' + 
            '<strong>New:</strong> ' + data['audit'][i]['NewValue'] + '<br/></td><td>' +
            data['audit'][i]['ChangeType'] + '<br/>' +
            data['audit'][i]['UserName'] + '<br/>' +
            '<small><i class="fa fa-clock-o"></i> ' + data['audit'][i]['Date'].substring(0,16) + '</td></tr>'
        };
    $('#global_audit').html(audit_html);


    // Fill in the mapping information
    var mapping_html = '';
    for (i = 0; i < data['mapping'].length; i++) {
        mapping_html += '<tr><td>' + data['mapping'][i]['Origin'] + '</td>';
        mapping_html += '<td>' + data['mapping'][i]['Code'] + '</td>';
        mapping_html += '<td>' + data['mapping'][i]['Description'] + '</td>';
        mapping_html += '<td>' + data['mapping'][i]['MostCommon'] + '</td>';
        mapping_html += '<td>' + data['mapping'][i]['Units'] + '</td>';
        mapping_html += '<td>' + data['mapping'][i]['NumLastYear'] + '</td>';
        mapping_html += '<td>' + data['mapping'][i]['LastSeen'] + '</td>';
        mapping_html += '<td>' + data['mapping'][i]['GlobalCode'] + '</td>';
        mapping_html += '<td>' + data['mapping'][i]['Excluded'] + '</td>';
        mapping_html += '<td><button type="button" onClick="mapping_del_click(this); return false;" class="btn btn-danger btn-xs global_tfc_mapping_del">DEL</button></td>';
        mapping_html += '<td><button type="button" onClick="mapping_edit_click(this); return false;" class="btn btn-success btn-xs global_tfc_mapping_edit">EDIT</button></td></tr>';
        mapping_exclusions[data['mapping'][i]['Origin'] + '|' + data['mapping'][i]['Code']] = data['mapping'][i]['Excluded']; // Store the exclusion to check against when changed later
    };
    $('#global_tfc_mapping').html(mapping_html);
};


// Functions to fill in the form with the right data type
function input_type(field, content, val) {
    
    // Regular input field
    if (!header_val.hasOwnProperty(field)) {
        return '<input id="form-input-' + field + '" value="' + content + '" class="form-control"></input>'
    };

    // Regular text area
    if (header_val[field] == 'textarea') {
        return '<textarea class="form-control">' + content + '</textarea>'
    };

    // Autocomplete input
    if (header_val[field] == 'autocomplete') {
        return '<input id="form-input-' + field + '" value="' + content + '" class="form-control"></input>'
    };

    // Disabled input field
    if (header_val[field] == 'disabled') {
        return '<input id="form-input-' + field + '" value="' + content + '" class="form-control" disabled="True"></input>'
    };
    

    // Select field (based on datatables.unique())
    if (header_val[field] == 'select') {
        var input = '<select class="form-control">';
        var colindex = global_code_datatable.column(field + ':name').index();
        var values = global_code_datatable.column(colindex).data().unique().sort();

        for (j = 0; j < values.length; j++) {
            input += '<option>' + values[j] + '</option>';
        }
        input += '</select>';
        input = input.replace('<option>' + content, '<option selected="selected">' + content);
        return input;
    };


    // Subsection by code
    if (header_val[field] == 'subsection_wsl' || header_val[field] == 'subsection_halo') {
        var departments = [];
        var last_department = '';

        // Get the list of departments
        var all_depts = [];
        if (header_val[field] == 'subsection_wsl') {
            all_depts = wsl_depts;
            var current_subsectioncode = current_global_data['info'][0]['SubSectionCode']
            var input = '<select class="form-control" onchange="change_wsl_subsection_code()">';
        } else {
            all_depts = halo_depts;
            var current_subsectioncode = current_global_data['info'][0]['HALO_SubSectionCode']
            var input = '<select class="form-control" onchange="change_halo_subsection_code()">';
        };


        for (j = 0; j < all_depts.length; j++) {

            var this_department = all_depts[j][0];
            var this_subsection = all_depts[j][1];
            var this_subsectioncode = all_depts[j][2];

            if (this_department != last_department && j > 0) {
                input += '</optgroup>';
            };

            if ($.inArray(this_department, departments) < 0) {
                input += '<optgroup label="' + this_department + '"><option value="' + this_subsectioncode + '">' + this_subsection + '</option>';
                departments.push(this_department);
            } else {
                input += '<option value="' + this_subsectioncode + '">' + this_subsection + '</option>';
            };

            last_department = this_department;
        };
        input += '</optgroup></select>';
        input = input.replace('<option value="' + current_subsectioncode + '">', '<option value="' + current_subsectioncode + '"' + ' selected="selected">');
        return input;
    };

};

// Respond to changing the SubSection code
function change_wsl_subsection_code() {
    var select_subsection = $('#info_SubSection' + ' select option:selected').text();
    var select_val = $('#info_SubSection' + ' select option:selected').val();
    var select_dept = $('#info_SubSection' + ' select option:selected').closest('optgroup').attr('label');
    $('#info_SubSectionCode input').val(select_val);
    $('#info_Department input').val(select_dept);
};

// Respond to changing the HALO_SubSection code
function change_halo_subsection_code() {
    var select_subsection = $('#info_HALO_SubSection' + ' select option:selected').text();
    var select_val = $('#info_HALO_SubSection' + ' select option:selected').val();
    var select_dept = $('#info_HALO_SubSection' + ' select option:selected').closest('optgroup').attr('label');
    $('#info_HALO_SubSectionCode input').val(select_val);
    $('#info_HALO_Department input').val(select_dept);
};


// Respond to clicking EDIT button
$("#global_edit_button").click(function () {
    console.log('info_headers.length: ', info_headers.length);
    for (i = 0; i < info_headers.length; i++) {
        var content = $('#info_' + info_headers[i] + ' p').text();
        $('#info_' + info_headers[i]).html(input_type(info_headers[i], content));

        // Apply an autocomplete
        if (header_val[info_headers[i]] == 'autocomplete') {
            var colindex = global_code_datatable.column(info_headers[i] + ':name').index();
            var values = global_code_datatable.column(colindex).data().unique().toArray();
            $('#' + 'form-input-' + info_headers[i]).autocomplete({ source: values });
        };

        // Disable the GlobalCode field
        if (info_headers[i] == 'GlobalCode') {
            $('#' + 'form-input-' + info_headers[i]).prop( "disabled", true );
        };
    };
    $('#global_info').append('<div class="form-group" id="global_info_submit_div"><div class="col-sm-7 col-sm-offset-4"><button id="global_info_submit" type="button"  onClick="global_info_submit_click(); return false;" class="btn btn-success">Save changes</button></div></div>');
});

// Respond to clicking SUBMIT button on global info
function global_info_submit_click() {
    console.log('Clicked submit button');

    $('#global_info_submit').html('Submitting...');

    var submission = {};
    for (i = 0; i < info_headers.length; i++) {
        var select_content = $('#info_' + info_headers[i] + ' select option:selected').text();
        var input_content = $('#info_' + info_headers[i] + ' input').val();
        var content = (input_content || select_content);
        submission[info_headers[i]] = content
    };

    console.log(submission);

    $.post('\global_edit_submit_changes', submission)
        .done(function (data) {
            if (data['data'] == 'ERROR') {
                swal({
                    title: "Problem submitting changes",
                    text: "There was an issue submitting your changes. Please check the code details" + '<br/><br/><span class="code">' + data['error_detail'] + '</span>',
                    type: "warning",
                    html: true
                });
            } else {
                fill_global_data(data);

                // Reload the global table
                var url_val = '/globalseditordata?department=' + current_dept;
                global_code_datatable.ajax.url(url_val).load();
            };
        });
};

// Respond to clicking NEW button
$("#global_new_button").click(function () {
    
    // Put the header in
    $('#global_header_code').text('NEW CODE');

    // Build the basic info form
    for (i = 0; i < info_headers.length; i++) {
        $('#info_' + info_headers[i]).html(input_type(info_headers[i], ''));

        // Apply an autocomplete
        if (header_val[info_headers[i]] == 'autocomplete') {
            var colindex = global_code_datatable.column(info_headers[i] + ':name').index();
            var values = global_code_datatable.column(colindex).data().unique().toArray();
            $('#' + 'form-input-' + info_headers[i]).autocomplete({ source: values });
        };

    };
    $('#global_info').append('<div class="form-group" id="global_info_create_div"><div class="col-sm-7 col-sm-offset-4"><button id="global_info_newcode" type="button"  onClick="global_info_new_click(); return false;" class="btn btn-success">Create New</button></div></div>');

    // Clear the audit trail and mapping info
    $('#global_audit').html('<tr><td></td><td></td><td></td></tr>');
    $('#global_tfc_mapping').html('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');

    $('#global_audit').html('');
    $('#global_tfc_mapping').html('');

});

// Respond to clicking COPY button
$("#global_copy_button").click(function () {

    // Put the header in
    $('#global_header_code').text('NEW CODE');

    // Build the basic info form
    for (i = 0; i < info_headers.length; i++) {
        var content = $('#info_' + info_headers[i] + ' p').text();
        //$('#info_' + info_headers[i]).html('<input value="' + content + '" class="form-control"></div>');
        $('#info_' + info_headers[i]).html(input_type(info_headers[i], content));
    };
    $('#global_info').append('<div class="form-group" id="global_info_create_div"><div class="col-sm-7 col-sm-offset-4"><button id="global_info_newcode" type="button"  onClick="global_info_new_click(); return false;" class="btn btn-success">Create New</button></div></div>');

    // Clear the audit trail and mapping info
    $('#global_audit').html('<tr><td></td><td></td><td></td></tr>');
    $('#global_tfc_mapping').html('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');

    $('#global_audit').html('');
    $('#global_tfc_mapping').html('');

});

// Respond to clicking CREATE NEW button on global info
function global_info_new_click() {
    console.log('Clicked CREATE NEW button');

    // Check if there is a code
    if ($('#info_GlobalCode input').val() == '') {
        swal({
            title: "Please enter a code",
            text: "Cannot submit a new code without a Global Code entry",
            type: "warning"
        });

    } else {

        // Get the data
        var submission = {};
        for (i = 0; i < info_headers.length; i++) {
            var select_content = $('#info_' + info_headers[i] + ' select option:selected').text();
            var input_content = $('#info_' + info_headers[i] + ' input').val();
            var content = (input_content || select_content);
            submission[info_headers[i]] = content
        };

        // Check if the code already exists
        var all_global_codes_array = $.makeArray(global_code_datatable.column(1).data());
        if ($.inArray(submission['GlobalCode'], all_global_codes_array) != -1) {
            swal({
                title: "Code already exists",
                text: "There is already a global code for " + submission['GlobalCode'],
                type: "warning"
            });
        } else {

            // Submit the code and run the query
            current_global_code = submission['GlobalCode']
            $.post('\global_edit_new_code', submission)
                .done(function (data) {
                    if (data['data'] == 'ERROR') {
                        swal({
                            title: "Problem submitting changes" + code,
                            text: "There was an issue submitting your changes. Please check the code details",
                            type: "warning"
                        });
                    } else {
                        fill_global_data(data);

                        // Reload the global table
                        var url_val = '/globalseditordata?department=' + current_dept;
                        global_code_datatable.ajax.url(url_val).load();
                    };
                });
        };  
    };
};


// Respond to clicking DELETE button
$("#global_delete_button").click(function () {
    console.log('Clicked DELETE button');
    //scroll_to_this($(this), 500);
    $(window.scrollTo($(window).scrollTop(), 0));

    // Check if there is a code to delete
    if (current_global_code == "") {
        swal({
            title: 'Please select a code to delete',
            type: 'info'
        });
        return;
    };

    // Check if there is anything mapped to the code
    if (current_global_data['mapping'].length > 0) {

        swal({
            title: "Codes mapped",
            text: "There are " + current_global_data['mapping'].length + " codes mapped to this. Type an optional exclusion here",
            type: "input",
            showCancelButton: true,
            closeOnConfirm: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#ff6666",
            inputPlaceholder: "Exclusion (optional)"
        },
        function (inputValue) {

            console.log(inputValue);

            if (inputValue == false) {
                console.log('Cancelled delete');
            } else {
                delete_current_global_code(inputValue);
            };
        });
        return;
    };

    // Straight deletion of an unmapped code
    swal({
        title: "Are you sure?",
        text: "You are about to delete " + current_global_code,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Delete code",
        closeOnConfirm: true
    },
    function () {
        delete_current_global_code('');
    });
});

function delete_current_global_code(exclusion) {

    console.log('Confirmed click with exclusion: ' + exclusion);

    $.getJSON('/global_edit_delete_code?code=' + current_global_code + '&exclusion=' + exclusion, function (data) {
        if (data['data'] == 'ERROR') {
            swal({
                title: "Error deleting the code",
                text: "An exception occurred while deleting the global code. The details have been recorded in the error log. " + data['error_detail'],
                type: "warning"
            });
        } else {

            // Clear the global code
            current_global_code = "";

            // Clear the form info
            for (i = 0; i < info_headers.length; i++) {
                current_global_data['info'][0][info_headers[i]] = "";
            };

            // Clear the audit trail and mapping info
            current_global_data['audit'] = [];
            current_global_data['mapping'] = [];

            fill_global_data(current_global_data);

            // Reload the global table
            var url_val = '/globalseditordata?department=' + current_dept;
            global_code_datatable.ajax.url(url_val).load();

        };
    });
};



// Click the mapping DELETE buttons
function mapping_del_click(element) {
    var row = $(element).parent().parent();
    var origin = row.find('td:eq(0)').text();
    var tfc = row.find('td:eq(1)').text();
    
    console.log($(element).parent().parent().text());
    console.log(origin, ': ', tfc);

    swal({
        title: "Are you sure?",
        text: "This will delete the mapping of " + current_global_code + " from " + tfc,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "Delete Mapping"
    },
        function () {
            var result = remove_mapping(origin, tfc, current_global_code);
            console.log('Result = ', result);
            if (result == 'OK') {
                row.remove();
            };
    });
};



// Click the mapping EDIT buttons
function mapping_edit_click(element) {

    var row = $(element).parent().parent();
    var origin = row.find('td:eq(0)').text();
    var tfc = row.find('td:eq(1)').text();

    var global_content = row.find('td:eq(7)').text();
    var global_width = row.find('td:eq(7)').width();
    row.find('td:eq(7)').html('<input onkeyup="mapping_global_keyup(this); return false;" value="' + global_content + '" class="form-control">');

    var exclusion_content = row.find('td:eq(8)').text();
    var exclusion_width = row.find('td:eq(8)').width();
    row.find('td:eq(8)').html('<input value="' + exclusion_content + '" class="form-control">');

    $(element).parent().html('<button type="button" onClick="mapping_save_click(this); return false;" class="btn btn-info btn-xs global_tfc_mapping_save">SAVE</button>');
};


// Monitor global code changes and highlight if global not available
function mapping_global_keyup(element) {
    var text = $(element).val();

    if (text == '') {
        $(element).css({ 'background-color': '#ffffff' }); // No text
    } else if (global_code_datatable.column(1).data().indexOf(text) > -1) {
        $(element).css({ 'background-color': '#c6ffb3' }); // Found
    } else {
        $(element).css({ 'background-color': '#ffcccc' }); // Not found
    };  
};


// Respond to clicking SAVE on the mapping
function mapping_save_click(element) {

    var row = $(element).parent().parent();
    var global_content = row.find('td:eq(7) input').val();
    var exclusion_content = row.find('td:eq(8) input').val();
    var origin = row.find('td:eq(0)').text();
    var tfc = row.find('td:eq(1)').text();

    console.log('Global: ', global_content, ' Exclusion: ', exclusion_content);

    // Reject if both global and exclusion exist
    if (global_content != '' && exclusion_content != '') {
        swal({
            title: "Can't have a global and exclusion",
            text: "You can't put both a global mapping and an exclusion in place at the same time. Please pick one or the other.",
            type: "warning"
        });
        return;
    };

    // Change the global code if different
    if (global_content != '') {
        if (global_code_datatable.column(1).data().indexOf(global_content) == -1) {
            swal({
                title: "Not a valid global code",
                text: "The global code you have chosen doesn't exist. Please check.",
                type: "warning"
            });
            return;
        };
        if (global_content != current_global_code) {
            console.log('Switching global code from ', current_global_code, ' to ', global_content);
            remove_mapping(origin, tfc, current_global_code);
            add_mapping(origin, tfc, global_content);
        } else {
            console.log('Same global code of ', global_content, '. No need to change');
        };
    };

    // Remove the global code mapping if blank
    if (global_content == '') {
        console.log('Removing global code ', current_global_code, ' from ', origin + ':' + tfc);
        remove_mapping(origin, tfc, current_global_code);
    };

    // If the exclusion exists
    if (exclusion_content != '') {
        console.log('Excluding test ', origin, ':', tfc, ' with exclusion ', exclusion_content);
        exclude_mapping(origin, tfc, exclusion_content);
    }

    // If the exclusion is blank
    var previous_exclusion = mapping_exclusions[origin + '|' + tfc];
    console.log('Previous exclusion: ', previous_exclusion);
    if (exclusion_content == '' && previous_exclusion != '') {
        console.log('Removing exclusion ', origin, ':', tfc);
        exclude_mapping(origin, tfc, 'None');
    }


    // Reset the form elements
    row.find('td:eq(7)').html(global_content);
    row.find('td:eq(8)').html(exclusion_content);
    row.find('td:eq(10)').html('<td><button type="button" onClick="mapping_edit_click(this); return false;" class="btn btn-success btn-xs global_tfc_mapping_edit">EDIT</button></td></tr>');
    
    // Remove if mapped differently
    if (global_content != current_global_code) {
        row.remove();
    };


    console.log('Finished...');
};




//
// Functions to change global and exclusion mapping
//

function remove_mapping(origin, tfc, global_code) {
    var url = '/remove_mapping?system=' + origin + '&tfc=' + tfc + '&global_code=' + current_global_code + '&user=' + '';
    $.getJSON(url, function (data) {
        if (data['result'] == 'ERROR') {
            swal({
                title: "Unable to remove",
                text: "An error occurred while removing " + current_global_code + " from " + tfc + ". The details have been recorded in the error log.",
                type: "warning"
            });
            return 'ERROR';
        } else {
            console.log("Removed " + current_global_code + " from " + origin + ':' + tfc);
            return 'OK';
        };
    });
};


function add_mapping(origin, tfc, global_code) {
    var url = '/add_mapping?system=' + origin + '&tfc=' + tfc + '&global_code=' + global_code;
    $.getJSON(url, function (data) {
        if (data['result'] == 'ERROR') {
            swal({
                title: "Unable",
                text: "An error occurred while adding " + ui.draggable.text() + " to " + $(this).find(".TFC").text() + ". The details have been recorded in the error log.",
                type: "warning"
            });
            return 'ERROR';
        } else {
            console.log("Added " + global_code + " to " + origin + ':' + tfc);
            return 'OK';
        };
    });
};


function exclude_mapping(origin, tfc, exclusion) {
    var url = '/exclude_tfc?system=' + origin + '&tfc=' + tfc + '&exclusion=' + exclusion;
    $.getJSON(url, function (data) {
        if (data['result'] == 'ERROR') {
            swal({
                title: "Error excluding TFC",
                text: "The details have been recorded in the error log.",
                type: "warning"
            });
            return 'ERROR';
        } else {
            return 'OK';
        };
    });
};
