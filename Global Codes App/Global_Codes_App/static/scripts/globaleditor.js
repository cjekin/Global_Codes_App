
// Get the global variables
var current_dept = 'All';
var current_global_code = 'BC_UE_NA';
var current_global_name = 'Sodium';
var current_global_data = {};
var info_headers = ['GlobalCode', 'Description', 'Sample', 'Type', 'Analyte', 'PrimaryLibrary', 'SubSection', 'Department', 'BAFO_Subsection', 'BAFO_Department', 'HSL_Code', 'NLMC', 'SNOMEDCT_UK', 'LOINC', 'PBCL', 'Interface', 'MiddlewareCode'];

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
        $('.global_detail_class').show();
        window.scrollTo(0,0);
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
        { title: "BAFO_Subsection" },
        { title: "BAFO_Department" },
        { title: "HSL_Code" },
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
        if (data['audit'][i]['Origin'] == 'GlobalCodes_Main') {
            audit_html += '<tr><td>' + data['audit'][i]['Change'].split("|").join("<br/>") + '<br/><small><i class="fa fa-clock-o"></i> ';
        } else {
            audit_html += '<tr><td>' + data['audit'][i]['ChangeType'] + ' ' + data['audit'][i]['Code'] + '<br/><small><i class="fa fa-clock-o"></i> ';
        };
        audit_html += data['audit'][i]['Date'] + '</small></td><td><strong>' + data['audit'][i]['Origin'] + '</strong></td><td>';
        audit_html += data['audit'][i]['UserName'] + '</td></tr>';
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
        mapping_html += '<td><button class="btn btn-danger btn-xs global_tfc_mapping_del disabled">DEL</button></td>';
        mapping_html += '<td><button class="btn btn-success btn-xs global_tfc_mapping_edit disabled">EDIT</button></td></tr>';
    };
    $('#global_tfc_mapping').html(mapping_html);
};

// Respond to clicking EDIT button
$("#global_edit_button").click(function () {
    for (i = 0; i < info_headers.length; i++) {
        var content = $('#info_' + info_headers[i] + ' p').text();
        $('#info_' + info_headers[i]).html('<input value="' + content + '" class="form-control"></div>');
    };
    $('#global_info').append('<div class="form-group" id="global_info_submit_div"><div class="col-sm-7 col-sm-offset-4"><button id="global_info_submit" type="button"  onClick="global_info_submit_click(); return false;" class="btn btn-success">Save changes</button></div></div>');
});

// Respond to clicking SUBMIT button on global info
function global_info_submit_click() {
    console.log('Clicked submit button');

    $('#global_info_submit').html('Submitting...');

    var submission = {};
    for (i = 0; i < info_headers.length; i++) {
        var content = $('#info_' + info_headers[i] + ' input').val();
        submission[info_headers[i]] = content
    };

    $.post('\global_edit_submit_changes', submission)
        .done(function (data) {
            fill_global_data(data);
        })
        .fail(function () {
            swal({
                title: "Problem submitting changes" + code,
                text: "There was an issue submitting your changes. Please check the code details",
                type: "warning"
            });
        });
};

// Respond to clicking NEW button
$("#global_new_button").click(function () {
    
    // Put the header in
    $('#global_header_code').text('NEW CODE');

    // Build the basic info form
    var info_html = '';
    for (i = 0; i < info_headers.length; i++) {
        info_html += '<div class="form-group"><label class="col-lg-4 control-label">';
        info_html += info_headers[i] + '</label><div id="info_' + info_headers[i];
        info_html += '" class="col-lg-8"><input value="" class="form-control"></div>';
        info_html += '' + '</div>';
    };
    $('#global_info').html(info_html);
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
            var content = $('#info_' + info_headers[i] + ' input').val();
            submission[info_headers[i]] = content
        };

        // Check if the code already exists
        console.log(submission);
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
