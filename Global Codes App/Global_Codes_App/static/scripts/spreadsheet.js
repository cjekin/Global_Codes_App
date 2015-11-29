
// Get the global variables
var container = document.getElementById('spreadsheet');
var hot = ''; //Placeholder for handsontable
var data = [];
var display_data = [];
var column_headers = [];

$(window.scrollTo(0, 0));

function scroll_to_this(element,speed) {
    $('html, body').animate({
        scrollTop: element.offset().top
    }, speed);
};

// Pull all the spreadsheet data
$.getJSON('/pull_spreadsheet_globals', function (returned_data) {
    if (returned_data['data'] == 'ERROR') {
        swal({
            title: "Error pulling all the globals",
            text: "An exception occurred pulling all the global data. The details have been recorded in the error log. " + data['error_detail'],
            type: "warning"
        });
    } else {
        data = returned_data['data'];
        display_data = data;
        add_filter_item(data);
        build_spreadsheet(display_data);
    };
});


function build_spreadsheet(display_data) {

    column_headers = data[0].map(function (item) { return { title: item }; });
    row_headers = [for (i of display_data.slice(1,display_data.length-1)) i[0]];

    hot = new Handsontable(container, {
        data: display_data.slice(1,display_data.length-1),
        minSpareRows: 1,
        columns: column_headers,
        //rowHeaders: row_headers,
        rowHeaders: true,
        colHeaders: true,
        //contextMenu: ['row_above', 'row_below'],
        contextMenu: true,
        columnSorting: true,
        sortIndicator: true,
        manualColumnFreeze: true,
        fixedColumnsLeft: 0,
        manualColumnResize: true,
        afterChange: function (changes, source) {
            //console.log('afterChange event: ' + (changes || 'nochange').toString() + ' from ' + source);
            if (changes != null && source == 'edit') {
                cell_changed(changes, source);
            } else if(changes != null && source == 'autofill') {
                for (i = 0; i < changes.length; i++) {
                    //console.log('Passed changes: ', [(changes || 'nochange')[i]]);
                    cell_changed([changes[i]], source);
                };
            };
        }
    });
};



//
// Filtering panel functions
//

function add_filter_item(data){

    //Remove the last list buttons and their event handlers
    $('#filter-list-ul li').last().find(".filter-more").off();
    $('#filter-list-ul li').last().find(".filter-less").off();
    $('#filter-list-ul li').last().find(".filter-more").html('');
    $('#filter-list-ul li').last().find(".filter-less").html('');

    var filter_fields = data[0].map( 
        function (item) { 
            return '<option>' + item + '</option>'; 
        });

    var full_html = '<div class="form-group col-lg-4"><select class="form-control input-sm filter-criteria">';
    full_html += '<option></option>' + filter_fields; // Filter fields
    full_html += '</select></div><div class="form-group col-lg-2 filter-operator"><select class="form-control input-sm">';
    full_html += '<option>Contains</option>';  // Operator
    full_html += '</select></div>';
    full_html += '<div class="form-group col-lg-4"><input id="Text2" class="form-control filter-text" type="text" placeholder="Search value" name="" value=""></div>';
    full_html += '<div class="form-group col-lg-1 filter-more"><i class="pe pe-7s-plus pe-2x"></i></div>';
    full_html += '<div class="form-group col-lg-1 filter-less"><i class="pe pe-7s-less pe-2x"></i></div>';

    $('#filter-list-ul').append($("<li>").html(full_html));
    $('#filter-list-ul li').last().find(".filter-more").on('click', more_filter_click);
    $('#filter-list-ul li').last().find(".filter-less").on('click', less_filter_click);
};


function more_filter_click(){
    add_filter_item(data);
};
function less_filter_click(){

    if($('#filter-list-ul li').size() == 1) {
        return;
    }
    
    $('#filter-list-ul li').last().remove();

    // Add the buttons and their event handlers to the new last row
    $('#filter-list-ul li').last().find(".filter-less").html('<i class="pe pe-7s-less pe-2x"></i>');
    $('#filter-list-ul li').last().find(".filter-more").on('click', more_filter_click);

    $('#filter-list-ul li').last().find(".filter-more").html('<i class="pe pe-7s-plus pe-2x"></i>');
    $('#filter-list-ul li').last().find(".filter-less").on('click', less_filter_click);
};



$('#global_spreadsheet_refresh').click(function () {

    // Reset the table if there are no filters
    if($('#filter-list-ul li').size() == 1 && $('#filter-list-ul li').last().find(".filter-criteria").val() == '') {
        console.log('Resetting table to original data');
        display_data = data;
        hot.destroy();
        build_spreadsheet(display_data);
        return;
    }

    // Get the filters from the table
    var filters = {};
    $( "#filter-list-ul li" ).each( function( index, element ){
        var field = $( element ).find(".filter-criteria").val();
        var value = $( element ).find(".filter-text").val();

        field_num = data[0].indexOf(field); 
        if(field_num >= 0){
            filters[field_num] = (value || '');
        };
    });

    display_data = [data[0]];
    for( i=1; i<data.length-1; i++) {

        var include = true;
        for (var key in filters) {
            //console.log(key, filters[key], data[i][key]);
            if(data[i][key].toLowerCase().indexOf(filters[key].toLowerCase()) < 0){
                include = false;
                //console.log('  excluded this');
            };       
        };
        if(include == true){
            display_data.push(data[i]);
        };
    };
    hot.destroy();
    build_spreadsheet(display_data);
});

function cell_changed(changes, source) {

    console.log('cell_changed value: ' + changes.toString());

    var row = changes[0][0];
    var col = changes[0][1];
    var oldval = changes[0][2];
    var newval = changes[0][3];

    var edited_global = hot.getDataAtCell(row, 0);
    var edited_field = column_headers[col]['title'];

    console.log(row, col, oldval, newval, edited_global, edited_field);


    // Check if they are editing a global
    if (col == 0 && oldval != null && newval != oldval) {
        swal("Don't edit existing global codes. Change reverted.");
        hot.setDataAtCell(row, col, oldval, 'AUTO');
    };

    // Check if they are editing an attribute of an existing global
    if (col != 0 && edited_global != null && newval != oldval) {
        var submission = {};
        submission['GlobalCode'] = edited_global;
        submission[edited_field] = newval;
        submit_field_change(submission, row, col, oldval, newval);
    };

    // If it's a new code, check if it already exists
    if (col == 0 && oldval == null) {
        for (i = 1; i < data.length; i++) {
            if (data[i][0] == newval) {
                swal('This code already exists. Change deleted.');
                hot.setDataAtCell(row, col, oldval, 'AUTO');
                return;
            };
        };
        //console.log('Create new code: ' + newval);
        var new_code = {};
        for (i = 0; i < column_headers.length; i++) {
            new_code[column_headers[i]['title']] = (hot.getDataAtCell(row, i) || '');
        };
        //console.log(new_code);
        create_new_globalcode(new_code, row, col, oldval, newval)
    };

};

function submit_field_change(submission, row, col, oldval, newval) {

    $.post('\spreadsheet_changefield', submission)
        .done(function (data) {
            if (data['data'] == 'ERROR') {
                swal({
                    title: "Problem submitting changes",
                    text: "There was an issue submitting your change. Change reverted on spreadsheet.",
                    type: "warning"
                });
                hot.setDataAtCell(row, col, oldval, 'AUTO');
            } else {
                console.log('POST UPDATE: Changed ' + submission['GlobalCode'] + ' field ' + column_headers[col]['title'] + ' to ' + newval);
            };
        });
};

function create_new_globalcode(submission, row, col, oldval, newval) {
    $.post('\spreadsheet_newcode', submission)
        .done(function (data) {
            if (data['data'] == 'ERROR') {
                swal({
                    title: "Problem submitting changes",
                    text: "There was an issue submitting your change for a new code. The new row hasn't been deleted, but is not in the database",
                    type: "warning"
                });
            } else {
                console.log('POST INSERT: Inserted ' + submission['GlobalCode'] + ' with ' + JSON.stringify(submission));
            };
        });
};