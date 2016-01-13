
// Get the global variables
var current_location_code = 'BC_UE_NA';
var current_location_name = 'Sodium';
var current_location_data = {};
var all_depts = [];
var all_locations = ['One','Two','Three'];
var info_headers = ['SubSectionCode','SubSection','Department','Location','Address','PostCode','Telephone','Contact','HALO','WSL','Referral'];

// Custom renderers for fields (default is input)
var header_val = {
    'Sample':'select',
    'Type': 'select',
    'Address': 'textarea',
    'Contact': 'textarea',
    'Department': 'select',
    'Location': 'autocomplete'
};



$('.global_detail_class').hide();
$(window.scrollTo(0, 0));

function scroll_to_this(element,speed) {
    $('html, body').animate({
        scrollTop: element.offset().top
    }, speed);
};




// Initialise the global code table
var location_datatable = $('#location_datatable').DataTable({
    "fnInitComplete": function () {
        $('#results tbody tr').each(function () {
            $(this).find('td:eq(0)').attr('nowrap', 'nowrap');
        });
        $('.global_detail_class').show();
        window.scrollTo(0, 0);
    },
    ajax: '/location_department_list',
    sPlaceHolder: "head:before",
    columns: [
        { title: "Code", name: "SubSectionCode" },
        { title: "SubSection", name: "SubSection" },
        { title: "Department", name: "Department" },
        { title: "Location", name: "Location" },
        { title: "Address", name: "Address", width: "10px" },
        { title: "PostCode", name: "PostCode" },
        { title: "Telephone", name: "Telephone" },
        { title: "Contact", name: "Contact" },
        { title: "HALO", name: "HALO" },
        { title: "WSL", name: "WSL" },
        { title: "Referral", name: "WSL" },
    ],

    "columnDefs": [
        {
            "render": function (data) {
                if (data.length > 50) {
                    return data.substring(0,50) + '...';
                } else {
                    return data;
                }
            },
            "targets": [ 4, 6, 7 ]
        }
    ],

    "scrollX": true,
    "bAutoWidth": false
});


// Respond to clicking a location code
$("#location_datatable tbody").delegate("tr", "click", function () {
    current_location_code = $("td:eq(0)", this).text();
    current_location_name = $("td:eq(1)", this).text();
    console.log('You clicked: ' + current_location_code + ' : ' + current_location_name);
    get_location_info(current_location_code);
});



///////////////////////////////
// Location information
///////////////////////////////

//Fill in the location detail
function get_location_info(code) {

    var url = '/location_detail?code=' + code;

    $.getJSON(url, function (data) {
        if (data['data'] == 'ERROR') {
            swal({
                title: "Error looking up " + code,
                text: "An exception occurred loading the location data. The details have been recorded in the error log. " + data['error_detail'],
                type: "warning"
            });
        } else {
            generate_location_form(data);
        };
    });
};

function generate_location_form(data) {

    current_location_data = data;

    // Put the header in
    $('#location_header_code').text(current_location_code);

    // Fill in the basic information
    var info_html = '';
    for (i = 0; i < info_headers.length; i++) {
        info_html += '<div class="form-group"><label class="col-lg-4 control-label">';
        info_html += info_headers[i] + '</label><div id="info_' + info_headers[i];
        info_html += '" class="col-lg-8"><p class="form-control-static">';
        info_html += data['info'][0][info_headers[i]] + '</p></div></div>';
    };
    $('#location_info').html(info_html);

};



// Functions to fill in the form with the right data type
function input_type(field, content) {


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


    // Select field (based on datatables.unique())
    if (header_val[field] == 'select') {
        var input = '<select class="form-control">';
        var colindex = location_datatable.column(field + ':name').index();
        var values = location_datatable.column(colindex).data().unique().sort();

        for (j = 0; j < values.length; j++) {
            input += '<option>' + values[j] + '</option>';
        }
        input += '</select>';
        input = input.replace('<option>' + content, '<option selected="selected">' + content);
        return input;
    };


    // Department custom field
    if (header_val[field] == 'department') {
        var input = '<select class="form-control">';
        var departments = [];

        for (j = 0; j < all_depts.length; j++) {
            var this_department = all_depts[j][1];
            if ($.inArray(this_department, departments) < 0) {
                input += '<option>' + this_department + '</option>';
            };
            departments.push(this_department);
        }
        input += '</select>';
        input = input.replace('<option>' + content + '</option>', '<option selected="selected">' + content + '</option>');
        return input;
    };

    // Subsection custom field
    if (header_val[field] == 'subsection') {
        var input = '<select class="form-control">';
        var departments = [];
        var last_department = '';

        for (j = 0; j < all_depts.length; j++) {

            var this_department = all_depts[j][1];
            var this_subsection = all_depts[j][0];

            if (this_department != last_department && j > 0) {
                input += '</optgroup>';
            };

            if ($.inArray(this_department, departments) < 0) {
                input += '<optgroup label="' + this_department + '"><option>' + this_subsection + '</option>';
                departments.push(this_department);
            } else {
                input += '<option>' + this_subsection + '</option>';
            };

            last_department = this_department;
        };
        input += '</optgroup></select>';
        input = input.replace('<option>' + content + '</option>', '<option selected="selected">' + content + '</option>');
        return input;
    };
};


// Respond to clicking EDIT button
$("#location_edit_button").click(function () {
    console.log('info_headers.length: ', info_headers.length);
    for (i = 0; i < info_headers.length; i++) {
        var content = $('#info_' + info_headers[i] + ' p').text();
        $('#info_' + info_headers[i]).html(input_type(info_headers[i], content));

        // Apply an autocomplete
        if (header_val[info_headers[i]] == 'autocomplete') {
            var colindex = location_datatable.column(info_headers[i] + ':name').index();
            var values = location_datatable.column(colindex).data().unique().toArray();
            $('#' + 'form-input-' + info_headers[i]).autocomplete({ source: values });
        };

        // Disable the GlobalCode field
        if (info_headers[i] == 'SubSectionCode') {
            $('#' + 'form-input-' + info_headers[i]).prop("disabled", true);
        };

    };
    $('#location_info').append('<div class="form-group" id="location_info_submit_div"><div class="col-sm-7 col-sm-offset-4"><button id="location_info_submit" type="button"  onClick="location_info_submit_click(); return false;" class="btn btn-success">Save changes</button></div></div>');

});

// Respond to clicking SUBMIT button on location info
function location_info_submit_click() {
    console.log('Clicked submit button');

    $('#location_info_submit').html('Submitting...');

    var submission = {};
    for (i = 0; i < info_headers.length; i++) {
        var select_content = $('#info_' + info_headers[i] + ' select option:selected').text();
        var input_content = $('#info_' + info_headers[i] + ' input').val();
        var textarea_content = $('#info_' + info_headers[i] + ' textarea').val();
        var content = (input_content || select_content || textarea_content || '');
        submission[info_headers[i]] = content
    };
    
    $.post('\location_edit_submit_changes', submission)
        .done(function (data) {
            if (data['data'] == 'ERROR') {
                swal({
                    title: "Problem submitting changes",
                    text: "There was an issue submitting your changes. Please check the code details",
                    type: "warning"
                });
            } else {
                get_location_info(current_location_code);

                // Reload the location table
                var url_val = '/location_department_list';
                location_datatable.ajax.url(url_val).load();
            };
        });
};


// Respond to clicking NEW button
$("#location_new_button").click(function () {

    // Put the header in
    $('#location_header_code').text('NEW CODE');

    // Build the basic info form
    for (i = 0; i < info_headers.length; i++) {
        $('#info_' + info_headers[i]).html(input_type(info_headers[i], ''));

        // Apply an autocomplete
        if (header_val[info_headers[i]] == 'autocomplete') {
            var colindex = location_datatable.column(info_headers[i] + ':name').index();
            var values = location_datatable.column(colindex).data().unique().toArray();
            $('#' + 'form-input-' + info_headers[i]).autocomplete({ source: values });
        };
    };
    $('#location_info').append('<div class="form-group" id="location_info_create_div"><div class="col-sm-7 col-sm-offset-4"><button id="location_info_newcode" type="button"  onClick="location_info_new_click(); return false;" class="btn btn-success">Create New</button></div></div>');

    // Clear the audit trail and mapping info
    //$('#global_audit').html('<tr><td></td><td></td><td></td></tr>');
    //$('#global_tfc_mapping').html('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');

    //$('#global_audit').html('');
    //$('#global_tfc_mapping').html('');

});
