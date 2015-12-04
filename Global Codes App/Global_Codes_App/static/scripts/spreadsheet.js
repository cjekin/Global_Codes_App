
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
        data: display_data.slice(1,display_data.length),
        minSpareRows: 0,
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
    full_html += '</select></div><div class="form-group col-lg-2"><select class="form-control input-sm filter-operator">';
    full_html += "<option>Contains</option><option>Doesn't Contain</option><option>Equals</option><option>Not Equal</option>";  // Operator
    full_html += '</select></div>';
    full_html += '<div class="form-group col-lg-4 filter-text-div"><input class="form-control filter-text" type="text" placeholder="Search value" name="" value=""></div>';
    full_html += '<div class="form-group col-lg-1 filter-more"><a href="#"><i class="pe pe-7s-plus pe-2x"></i></a></div>';
    full_html += '<div class="form-group col-lg-1 filter-less"><a href="#"><i class="pe pe-7s-less pe-2x"></i></a></div>';

    $('#filter-list-ul').append($("<li>").html(full_html));
    $('#filter-list-ul li').last().find(".filter-more").on('click', more_filter_click);
    $('#filter-list-ul li').last().find(".filter-less").on('click', less_filter_click);
    $('#filter-list-ul li').last().find(".filter-operator").on('change', filter_operator_change);
    $('#filter-list-ul li').last().find(".filter-criteria").on('change', filter_operator_change);
};


function more_filter_click(){
    add_filter_item(data);
};


function less_filter_click(){

    if($('#filter-list-ul li').size() == 1) {
        $('#filter-list-ul li').last().find(".filter-criteria").val('');
        $('#filter-list-ul li').last().find(".filter-operator").val('Contains');
        $('#filter-list-ul li').last().find(".filter-text").val('');
        return;
    }
    
    $('#filter-list-ul li').last().remove();

    // Add the buttons and their event handlers to the new last row
    $('#filter-list-ul li').last().find(".filter-less").html('<a href="#"><i class="pe pe-7s-less pe-2x"></i></a>');
    $('#filter-list-ul li').last().find(".filter-more").on('click', more_filter_click);

    $('#filter-list-ul li').last().find(".filter-more").html('<a href="#"><i class="pe pe-7s-plus pe-2x"></i></a>');
    $('#filter-list-ul li').last().find(".filter-less").on('click', less_filter_click);
};


function filter_operator_change(){
    var operator = $(this).closest('li').find(".filter-operator").val();
    var field = $(this).closest('li').find(".filter-criteria").val();
    var field_num = data[0].indexOf(field);
    var options = '<select class="form-control input-sm filter-text">';

    //console.log('Changed item', operator, field);

    if(operator == 'Equals' || operator == 'Not Equal'){
        var list = [];
        for( i=1; i<data.length-1; i++) {
            if( $.inArray(data[i][field_num],list) < 0 ) {
                list.push(data[i][field_num]);
            }
        };
        var sorted_list = list.sort();
        for(i=0; i<sorted_list.length; i++) {
            options += '<option>' + sorted_list[i] + '</option>';
        }
        options += '</options>';
        $(this).closest('li').find(".filter-text-div").html(options);
    } else if (operator == 'Contains' || operator == "Doesn't Contain"){
        var input_html = '<input class="form-control filter-text" type="text" placeholder="Search value" name="" value=""></div>';
        $(this).closest('li').find(".filter-text-div").html(input_html);
    };
};

$('#global_spreadsheet_refresh').click(function () {

    // Reset the table if there are no filters
    if($('#filter-list-ul li').size() == 1 && $('#filter-list-ul li').last().find(".filter-criteria").val() == '') {
        console.log('Resetting table to original data');
        display_data = data;
        hot.destroy();
        build_spreadsheet(display_data);
        $('#number_results_returned').text(display_data.length-1 + ' rows');
        return;
    }

    // Get the filters from the table
    var filters = {};
    $( "#filter-list-ul li" ).each( function( index, element ){
        var field = $( element ).find(".filter-criteria").val();
        var operator = $( element ).find(".filter-operator").val();
        var value = $( element ).find(".filter-text").val();

        console.log('Searching for: ', field, operator, value);

        field_num = data[0].indexOf(field); 
        if(field_num >= 0){
            filters[field_num] = [operator,(value || '')];
        };
    });

    // Run through the data and create a filtered set
    display_data = [data[0]];
    for( i=1; i<data.length-1; i++) {

        var include = true;
        for (var key in filters) {
            //console.log(key, filters[key], data[i][key]);
            if(filters[key][0] == 'Contains'){
                if(data[i][key].toLowerCase().indexOf(filters[key][1].toLowerCase()) < 0){
                    include = false;
                };
            } else if(filters[key][0] == 'Equals') {
                if(data[i][key].toLowerCase() != filters[key][1].toLowerCase()){
                    include = false;
                };
            } else if(filters[key][0] == 'Not Equal') {
                if(data[i][key].toLowerCase() == filters[key][1].toLowerCase()){
                    include = false;
                };
            } else if(filters[key][0] == "Doesn't Contain") {
                if(data[i][key].toLowerCase().indexOf(filters[key][1].toLowerCase()) >= 0){
                    include = false;
                };
            }  
        };
        if(include == true){
            display_data.push(data[i]);
        };
    };
    hot.destroy();
    build_spreadsheet(display_data);
    $('#number_results_returned').text(display_data.length-1 + ' rows');
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



$('#panel_fullscreen_icon').click(function(){

    console.log('Clicked full screen icon');

    if($('#header').is(":visible")){
        $('link[rel=stylesheet][href~="static/styles/style.css"]').prop( "disabled", true );
        $('#splash').hide();
        $('#header').hide();
        $('#menu').hide();
        $('#spreadsheet_title').hide();
        $('#spreadsheet_title_warning').hide();
        $('#global_code_filter_panel').hide();
        $('#main-footer').hide();

        $('#spreadsheet_header_text').text('');

        $('#spreadsheet').removeClass('spreadsheet-inpanel');
        $('#global_code_table').addClass('panel-fullscreen');

        hot.destroy();
        build_spreadsheet(display_data);
    } else {
        $('link[rel=stylesheet][href~="static/styles/style.css"]').prop( "disabled", false );
        $('#splash').show();
        $('#header').show();
        $('#menu').show();
        $('#spreadsheet_title').show();
        $('#spreadsheet_title_warning').show();
        $('#global_code_filter_panel').show();
        $('#main-footer').show();

        $('#spreadsheet_header_text').text('Global Codes');

        $('#spreadsheet').addClass('spreadsheet-inpanel');
        $('#global_code_table').removeClass('panel-fullscreen');

        hot.destroy();
        build_spreadsheet(display_data);
    };
});


