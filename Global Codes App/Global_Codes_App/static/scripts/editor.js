﻿// Global variables
var worksection_data = 'empty';
var preload_status = 'empty';
var current_tlc = 'U/E';
var current_tlc_name = 'UREA AND ELECTROLYTES';
var current_tlc_type = 'G';
var current_system = 'CROM_ALL_DW';


// Get all the data preloaded including: Worksection and library
$(function () {

    console.log('Starting up now...');
    $('#data_preload_splash').hide();

    // Get the work section data
    $.getJSON('/worksection_data', function (data) {
        worksection_data = data;
        var options = '';
        for (var i = 0; i < worksection_data['systems'].length; i++) {
            options += '<option>' + worksection_data['systems'][i] + '</option>';
        }
        $('#tlc_search_system').html(options);
        $('#tlc_search_system').val(current_system);
        $('#tlc_search_section').html(get_worksections(current_system));
    });

    // Load the library code data
    var url_val = '/tlc_data?system=' + current_system + '&section=' + $('#tlc_search_section').val().substring(0, 1) + '&primary=0&unmapped=0';
    library_code_datatable.ajax.url(url_val).load();
    fill_library_code_detail(current_system, current_tlc);
    event_handlers();
});


// Populate the worksections in the library code lookup based on value selected
function get_worksections(system) {
    var worksections = worksection_data[system];
    var options = '';
    for (i = 0; i < worksections.length; i++) {
        options += '<option>' + worksections[i][0] + ' - ' + worksections[i][1] + '</option>';
    }
    return options;
}
$('#tlc_search_system').change(function () {
    $('#tlc_search_section').html(get_worksections($('#tlc_search_system').val()));
    current_system = $('#tlc_search_system').val();
});


// Initialize the library search data table
console.log('Section = ' + $('#tlc_search_section').val());
var library_code_datatable = $('#library_code_datatable').DataTable({
    "ajax": '/tlc_data?system=' + $('#tlc_search_system').val() + '&section=' + $('#tlc_search_section').val().substring(0, 1) + '&primary=0&unmapped=0',
    "columnDefs": [
        {
            "render": function (data) {
                if (data == "1") {
                    return "<i class=\"fa fa-check-circle text-center text-success\"></i>";
                } else {
                    return "";
                }
        },
            "targets": 0
        }
    ]
});

// Refresh the library data table
function update_tlc_table() {
    var primary = +$('#tlc_search_primary').prop('checked');
    var unmapped = +$('#tlc_search_unmapped').prop('checked');
    current_system = $('#tlc_search_system').val();
    current_section = $('#tlc_search_section').val().substring(0, 1);
    var url_val = '/tlc_data?system=' + current_system + '&section=' + current_section + '&primary=' + primary + '&unmapped=' + unmapped;
    
    library_code_datatable.ajax.url(url_val).load();
    event_handlers();
};
$('#tlc_search_submit').click(function () { update_tlc_table() });

// Respond to clicking a library code
$("#library_code_datatable tbody").delegate("tr", "click", function () {
    current_tlc = $("td:eq(1)", this).text();
    current_tlc_name = $("td:eq(2)", this).text();
    current_tlc_type = $("td:eq(3)", this).text();
    console.log('You clicked: ' + current_tlc + ' in system ' + current_system);
    fill_library_code_detail();
});



//Fill in the library code detail
function fill_library_code_detail() {
    var url = '/tlc_detail?system=' + current_system + '&tlc=' + current_tlc.replace('/','%2F');
    $.getJSON(url , function (data) {
        if (data['data'] == 'ERROR') {
            swal({
                title: "Error looking up " + current_tlc,
                text: "An exception occurred loading the TLC data. The details have been recorded in the error log. " + data['error_detail'],
                type: "warning"
            });
        } else {
            // Put the TLC details at the top
            $('#tlc-detail-header').text(current_tlc + ' - ' + current_tlc_name + ' - ' + current_tlc_type);

            // Build the header
            var headers = data['data'][0]
            var cont = '<thead><tr>';
            for (i = 0; i < headers.length; i++) {
                cont += '<th>' + headers[i].replace('_',' ') + '</th>';
            };
            cont += '<th></th></tr></thead><tbody>'

            // Build the body
            for (i = 1; i < data['data'].length; i++) {
                cont += '<tr class="global-drop">'
                var row = data['data'][i]
                for (j = 0; j < headers.length; j++) {

                    if (headers[j] == 'Global' && row[j] != '') {
                        row[j] = '<button type="button" class="btn btn-primary btn-xs current-global-map">' + row[j] + '</button>';
                    };

                    cont += '<td class="' + headers[j] + '">' + row[j] + '</td>';
                };
                cont += '<td><a class=""><i class="pe-7s pe-7s-more pe-2x tfc-more"></i></a></td></tr>';
            };
            cont += '</tbody>';
            $('#tlc-detail-table').html(cont);
            event_handlers();
        };
    });

}




// Initialise all the event handlers
function event_handlers () {

    // Drag and drop functions
    $(".global-drag").draggable({
        helper: "clone",
        cancel: false
    });

    $(".global-drop").droppable({
        activeClass: "ui-state-default",
        hoverClass: "ui-state-hover",

        drop: function (event, ui) {
            var dropped_row = $(this)
            var dropped_global = ui.draggable.text()
            console.log("Adding " + dropped_global + " to " + dropped_row.find(".tfc").text());
            
            var url = '/add_mapping?system=' + $('#tlc_search_system').val() + '&tfc=' + $(this).find(".tfc").text() + '&global_code=' + ui.draggable.text() + '&user=' + 'CEKIN';
            $.getJSON(url, function (data) {
                if (data['result'] == 'ERROR') {
                    swal({
                        title: "Unable",
                        text: "An error occurred while adding " + ui.draggable.text() + " to " + $(this).find(".tfc").text() + ". The details have been recorded in the error log.",
                        type: "warning"
                    });
                } else {
                    dropped_row.find(".global_code").html('<button type="button" class="btn btn-primary btn-xs current-global-map">' + dropped_global + '</button>');
                    dropped_row.find(".global_name").html(data['global_name']);
                    dropped_row.find(".global_sample").html(data['global_sample']);
                    dropped_row.find(".global_type").html(data['global_type']);
                    update_tlc_table();
                    //event_handlers();
                };
            });
        },
    });

    // Clicking an existing mapping
    $(".current-global-map").click(function () {
        console.log('Clicked a mapping');

        var clicked_mapping = this;
        var global = $(clicked_mapping).html();
        var tfc = $(clicked_mapping).parent().parent().find(".tfc").text();

        swal({
            title: "Are you sure?",
            text: "This will delete the mapping of " + global + " from " + tfc,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Delete Mapping"
        },
            function () {
                var url = '/remove_mapping?system=' + $('#tlc_search_system').val() + '&tfc=' + tfc + '&global_code=' + global + '&user=' + 'CEKIN';
                $.getJSON(url, function (data) {
                    if (data['result'] == 'ERROR') {
                        swal({
                            title: "Unable to remove",
                            text: "An error occurred while removing " + global + " from " + tfc + ". The details have been recorded in the error log.",
                            type: "warning"
                        });
                    } else {
                        console.log("Removing " + $(clicked_mapping).html() + " from " + $(clicked_mapping).parent().parent().find(".tfc").text());
                        $(clicked_mapping).parent().parent().find('.global_name').text('');
                        $(clicked_mapping).parent().parent().find('.global_sample').text('');
                        $(clicked_mapping).parent().parent().find('.global_type').text('');
                        $(clicked_mapping).remove();
                        update_tlc_table();
                    };
                });
            });
    });

    // Respond to clicking a format code more icon
    $(".tfc-more").click(function () {
        var clicked_tfc = this;

        if ($(clicked_tfc).closest('tr').next('tr').hasClass('extra-tfc-info')) {
            $(clicked_tfc).closest('tr').next('tr').remove();
        } else {
            var tfc = $(clicked_tfc).closest('tr').find(".TFC").text();
            var url = '/get_more_tfc_info?system=' + $('#tlc_search_system').val() + '&tfc=' + tfc;
            $.getJSON(url, function (data) {
                if (data['data'] == 'ERROR') {
                    $(clicked_tfc).closest("tr").after('<tr class="extra-tfc-info"><td colspan="12">' + data['error_detail'] + '</td></tr>');
                } else {
                    var h = data['data'][0];
                    var d = data['data'][1];
                    var out = '<ul>';
                    for (i = 0; i < h.length; i++) {
                        out += '<li><b>' + h[i] + '</b>:  ' + d[i] + '</li>';
                    };
                    out += '</ul>'

                    $(clicked_tfc).closest("tr").after('<tr class="extra-tfc-info"><td colspan="12">' + out + '</td></tr>');
                };
            });
        };
    });
};
$(event_handlers());


// Preload the global code data
$.getJSON('/global_table', function (global_data) {

    if (global_data['result'] == 'ERROR') {
        swal({
            title: "Problem loading the globals",
            text: "An exception occurred when we were preloading the data. The details have been recorded in the error log.",
            type: "warning"
        });
    } else {
            $('#global_code_datatable').DataTable({
            data: global_data['result'],
            columns: [
                { title: "BenchCode" },
                { title: "Description" },
                { title: "Sample" },
                { title: "Type." },
                { title: "Analyte" },
                { title: "PrimaryLibrary" },
                { title: "SubSection" },
                { title: "Department" }
            ],
            "columnDefs": [
            {
                "render": function (data) {
                    return '<div class="global-drag"><button type="button" class="btn btn-primary btn-xs">' + data + '</button></div>';
                },
                "targets": 0
            }
            ]
        });
    };
});
// Need to reinitialise the event handlers when you search
$('#global_code_datatable').on('draw.dt', function () {
    event_handlers();
});




