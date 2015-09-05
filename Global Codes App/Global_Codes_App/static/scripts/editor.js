// Global variables
var worksection_data = 'empty';
var preload_status = 'empty';


// Get all the data preloaded including: Worksection and library
$(function () {

    console.log('Starting up now...');
    $('#global_code_editor_main').hide();

    // Get the work section data
    $.getJSON('/worksection_data', function (data) {
        worksection_data = data;
        var options = '';
        for (var i = 0; i < worksection_data['systems'].length; i++) {
            options += '<option>' + worksection_data['systems'][i] + '</option>';
        }
        $('#tlc_search_system').html(options);
        $('#tlc_search_system').val('CROM_ALL_DW');
        $('#tlc_search_section').html(get_worksections($('#tlc_search_system').val()));
    });

    // Preload the library code data
    $.getJSON('/preload_data', function (data) {
        preload_status = data;

        if (preload_status['result'] == 'ERROR') {
            swal({
                title: "Problem preloading the data",
                text: "An exception occurred when we were preloading the data. The details have been recorded in the error log.",
                type: "warning"
            });
            $('#data_preload_splash').hide();
        } else {
            var url_val = '/tlc_data?system=' + $('#tlc_search_system').val() + '&section=' + $('#tlc_search_section').val().substring(0, 1) + '&primary=0&unmapped=0';
            library_code_datatable.ajax.url(url_val).load();
            fill_library_code_detail('CROM_ALL_DW', 'U/E');
            event_handlers();
            $('#data_preload_splash').hide();
            $('#global_code_editor_main').show();
        };
    });
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
});


// Initialize the library seach data table
console.log('Section = ' + $('#tlc_search_section').val());
var library_code_datatable = $('#library_code_datatable').DataTable({
    "ajax": '/tlc_data?system=' + $('#tlc_search_system').val() + '&section=' + $('#tlc_search_section').val() + '&primary=0&unmapped=0',
    "columnDefs": [
        {
            "render": function (data) {
                //console.log(data)
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
$('#tlc_search_submit').click(function () {
    var primary = +$('#tlc_search_primary').prop('checked');
    var unmapped = +$('#tlc_search_unmapped').prop('checked');
    var url_val = '/tlc_data?system=' + $('#tlc_search_system').val() + '&section=' + $('#tlc_search_section').val().substring(0, 1) + '&primary=' + primary + '&unmapped=' + unmapped;
    library_code_datatable.ajax.url(url_val).load();
});

// Respond to clicking a library code
$("#library_code_datatable tbody").delegate("tr", "click", function () {
    var tlc_click = $("td:eq(1)", this).text();
    var system = $('#tlc_search_system').val()
    console.log('You clicked: ' + tlc_click + ' in system ' + system);
    fill_library_code_detail(system, tlc_click);
});




//Fill in the library code detail
function fill_library_code_detail(system, tlc) {
    $.getJSON('/tlc_detail?system=' + system + '&tlc=' + tlc, function (data) {
        if (data['result'] == 'ERROR') {
            swal({
                title: "Error looking up " + tlc,
                text: "An exception occurred loading the TLC data. The details have been recorded in the error log. " + data['error_detail'],
                type: "warning"
            });
        } else {
            var tlc_detail = data['result'];
            console.log(tlc_detail);
            $('#tlc-detail-header').text(tlc + ' - ' + tlc_detail['tlc_name'] + ' - ' + tlc_detail['tlc_type']);

            // Get the field names
            var tfcs = data['result']['tfc'];
            var headers = ['Sec','TFC','Name','Most Common Result','Units','Num','Global','Global Name','Global Sample','Result Type','Excluded',''];
            var fields = ['tfc_worksection','tfc','tfc_name','tfc_common_result','tfc_units','tfc_numlastyear','global_code','global_code_desc','global_code_sample','global_code_type','global_excluded'];
        
            // Build the header
            var cont = '<thead><tr>';
            for (i = 0; i < headers.length; i++) {
                cont += '<th>' + headers[i] + '</th>';
            };
            cont += '<th></th></tr></thead><tbody>'

            // Build the body
            for (i = 0; i < tfcs.length; i++) {
                cont += '<tr class="global-drop">'
                for (j = 0; j < fields.length; j++) {

                    if (fields[j] in tfcs[i]) {
                        var res_val = (tfcs[i][fields[j]] || '');
                    } else {
                        var res_val = '--';
                    };
                

                    if (fields[j] == 'global_code' && res_val != '') {
                        //res_val = '<span class="label label-success current-global-map">' + res_val + '</span>';
                        res_val = '<button type="button" class="btn btn-primary btn-xs current-global-map">' + res_val + '</button>';
                    };

                    cont += '<td class="' + fields[j] + '">' + res_val + '</td>';
                };
                cont += '<td><span class="glyphicon glyphicon-option-horizontal"></span></td></tr>';
            };
            cont += '</tbody>';
            //console.log(cont);
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
            console.log("Adding " + ui.draggable.text() + " to " + $(this).find(".tfc").text());
            $(this).find(".global_code").html('<button type="button" class="btn btn-primary btn-xs current-global-map">' + ui.draggable.text() + '</button>');
            event_handlers();
        },
    });

    // Clicking an existing mapping
    $(".current-global-map").click(function () {
        console.log('Clicked a mapping');

        var clicked_mapping = this;

        swal({
            title: "Are you sure?",
            text: "This will delete the mapping of " + $(clicked_mapping).html() + " from " + $(clicked_mapping).parent().parent().find(".tfc").text(),
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Delete Mapping"
        },
            function () {
                console.log("Removing " + $(clicked_mapping).html() + " from " + $(clicked_mapping).parent().parent().find(".tfc").text());
                $(clicked_mapping).remove();
            });
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


