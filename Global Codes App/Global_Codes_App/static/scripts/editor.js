// Global variables
var worksection_data = 'empty';



// Get the work section data and populate the sytem lookup field
$(function () {
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


// Library code search button
//$('#tlc_search_submit').click( function() {




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


$(function () {
    // Data tables functions

    // Setup - add a text input to each footer cell
    $('#global_code_datatable tfoot th').each(function () {
        var title = $('#global_code_datatable thead th').eq($(this).index()).text();
        $(this).html('<input type="text" placeholder="Search ' + title + '" />');
    });

    // Initialize the data tables
    $('#library_code_datatable').dataTable();
    $('#global_code_datatable').dataTable();

    // Apply the search
    //table.columns().every(function () {
    //    var that = this;
    //    $('input', this.footer()).on('keyup change', function () {
    //        that
    //            .search(this.value)
    //            .draw();
    //    });
    //});
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

