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
        $('#tlc_search_system').val('WSL_ALL_DW');
        $('#tlc_search_section').html(get_worksections($('#tlc_search_system').val()));
    });

    // Preload the library code data
    $.getJSON('/preload_data', function (data) {
        preload_status = data;

        if (preload_status['result'] == 'ERROR') {
            swal({
                title: "Error!",
                text: "Problem preloading the data."
            });
        } else {
            var url_val = '/tlc_data?system=' + $('#tlc_search_system').val() + '&section=' + $('#tlc_search_section').val().substring(0, 1) + '&primary=1&unmapped=1';
            library_code_datatable.ajax.url(url_val).load();
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


// Initialize the data tables
$('#global_code_datatable').DataTable();
console.log('Section = ' + $('#tlc_search_section').val());
var library_code_datatable = $('#library_code_datatable').DataTable({
    "ajax": '/tlc_data?system=' + $('#tlc_search_system').val() + '&section=' + $('#tlc_search_section').val() + '&primary=1&unmapped=1'
});
$('#tlc_search_submit').click(function () {
    var url_val = '/tlc_data?system=' + $('#tlc_search_system').val() + '&section=' + $('#tlc_search_section').val().substring(0,1) + '&primary=1&unmapped=1';
    library_code_datatable.ajax.url(url_val).load();
});



// Drag and drop functions
$(function draggables () {
    $(".global-drag").draggable({
        helper: "clone"
    });

    $(".global-drop").droppable({
        activeClass: "ui-state-default",
        hoverClass: "ui-state-hover",

        drop: function (event, ui) {
            console.log("Adding " + ui.draggable.text() + " to " + $(this).find(".tfc").text());
            $(this).find(".global-code").html('<span class="label label-success current-global-map">' + ui.draggable.html() + '</span>');
            draggables(); // Re-identify the draggable elements
        },
    });
});

// Mapping click function
$(function () { 
    $(".current-global-map").dblclick(function () {
            
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
                $(clicked_mapping).remove();
                console.log("Removing " + $(clicked_mapping).html() + " from " + $(clicked_mapping).parent().parent().find(".tfc").text());
            });
    });
});





// Build a table from JSON data
function buildTableFromJSON(data, table_id) {

    var headers = data['headers'];

    var table = '<table id="' + table_id + '" class="table"><tr>';

    // Create header
    for (h = 0; h < headers.length; h++) {
        table += '<th>' + headers[h] + '</th>';
    }
    table += '</tr>';

    // Create content
    for (i = 0; i < data['data'].length; i++) {
        var row = data['data'][i];
        table += '<tr>';
        for (h = 0; h < headers.length; h++) {
            var cell = row[headers[h]];
            if (headers[h] == 'TLC') {
                table += '<td id="tlc|' + row['Origin'] + '|' + row['TLC'] + '">' + cell + '</td>';
            } else {
                table += '<td>' + cell + '</td>';
            }
        }
        table += '</tr>';
    }

    table += '</table>';

    return table;

}

