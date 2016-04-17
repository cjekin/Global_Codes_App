// Get the global variables
var container = document.getElementById('spreadsheet');
var hot = ''; //Placeholder for handsontable
var data = [];
var displayed_data = [];
var id_field = '';
var current_table = '';
var current_query = '';
var current_spreadsheet_data = '';


// On page load...
$(function() {
    get_spreadsheet_list();
    current_query = 'Lexical_Table';
    get_spreadsheet('Lexical_Table');
});

$('#spreadsheet_refresh').click(function () {
    current_query = $('#spreadsheet_query_list').val();
    get_spreadsheet(current_query);
});


function get_spreadsheet_list() {
    $.getJSON('get_variable_from_config?variable=' + 'spreadsheet_queries', function (returned_data) {
        if (returned_data['data'] == 'ERROR') {
            swal({
                title: returned_data['data'],
                text: returned_data['error_detail'],
                type: "warning"
            });
        } else {
            var dt = returned_data['data'];
            for (i = 0; i < dt.length; i++) {
                $('<option>').val(dt[i]['func']).text(dt[i]['name']).appendTo('#spreadsheet_query_list');
            };
            ////console.log($('#spreadsheet_query_list select').val());
        };
    });
};


function get_spreadsheet(sheet) {
    var url = '/get_sql_data?query=' + sheet;
    $.getJSON(url, function (returned_data) {
        if (returned_data['data'] == 'ERROR') {
            swal({
                title: returned_data['data'],
                text: returned_data['error_detail'],
                type: "warning"
            });
        } else {
            data = returned_data['data'];
            id_field = returned_data['id_field'];
            current_table = returned_data['table'];
            if (typeof hot == 'object') {
                hot.destroy();
            };
            current_spreadsheet_data = returned_data;
            build_spreadsheet(current_spreadsheet_data);
        };
    });
};


// General cell render
function cellRender(row, col, prop, colProperties) {
    var cellProperties = {};
    if (col == 2 || col == 3) {
        cellProperties.readOnly = true;
    }
    return cellProperties;
}

function build_spreadsheet(result) {

    var column_data = result['columns'].map(function (item) {
        var properties = { data: item };
        
        if ($.inArray(item, result['locked']) > -1) {
            properties.readOnly = true;
        };
        if (result['type'] != null) {
            //console.log(result['type'], item);
            if ($.inArray(item, result['type']) > -1) {
                properties.type = result['type'][item];
                //console.log(properties.type, result['type'][item]);
            };
        };
        return properties;
    });

    filtered_data = result['data'];

    hot = new Handsontable(container, {
        data: filtered_data,
        columns: column_data,
        colHeaders: result['columns_desc'],
        rowHeaders: true,
        hiddenColumns: {
            columns: result['hidden'],
            indicators: true
        },

        allowInsertColumn: false,
        allowInsertRow: false,
        allowRemoveRow: false,
        allowRemoveColumn: false,
        bindRowsWithHeaders: true,
        columnSorting: true,
        contextMenu: true,
        copyPaste: true,
        dropdownMenu: true,
        filters: true,
        manualColumnMove: true,
        manualColumnResize: true,
        search: true,
        wordWrap: false,
        //colWidths: '200px',

        currentRowClassName: 'currentRow', // Highlights the selected row
        currentColClassName: 'currentCol',

        autoColumnSize: {syncLimit: 100}, // Auto-fit the columns (take first 100 rows only)

        afterChange: function (changes, source) {
            //console.log('afterChange event: ' + (changes || 'nochange').toString() + ' from ' + source);
            
            if (changes != null && source == 'edit') {
                cell_changed(changes, source);
            } else if (changes != null && source == 'autofill') {
                for (i = 0; i < changes.length; i++) {
                    cell_changed([changes[i]], source);
                };
            } else if (changes != null && source == 'paste') {
                for (i = 0; i < changes.length; i++) {
                    cell_changed([changes[i]], source);
                };
            };
        }

    });

    searchField = document.getElementById('search_field'),
    function onlyExactMatch(queryStr, value) {
        return queryStr.toString() === value.toString();
    }

    Handsontable.Dom.addEvent(searchField, 'keyup', function (event) {
        var queryResult = hot.search.query(this.value);

        ////console.log(queryResult);
        
        hot.render();
    });

};



function cell_changed(changes, source) {

    ////console.log('cell_changed value: ' + changes.toString());

    var row = changes[0][0];
    var col = changes[0][1];
    var oldval = changes[0][2];
    var newval = changes[0][3];
    var edited_id = hot.getDataAtCell(row, id_field)
    
    //console.log('Editing id', hot.getDataAtCell(row, id_field), ' field: ', col, ' old: ', oldval, ' new: ', newval);

    //console.log('Id field: ', id_field);

    // Check that there is an update and submit
    if (oldval != newval) {
        var submission = {
            table: current_table,
            field: col,
            id_name: id_field,
            id: edited_id,
            oldval: oldval,
            newval: newval,
            code: ''
        };

        $.post('/submit_table_update', submission)
        .done(function (data) {
            if (data['data'] == 'ERROR') {
                swal({
                    title: "Problem submitting changes",
                    text: "There was an issue submitting your change. Change reverted on spreadsheet.",
                    type: "warning"
                });
                hot.setDataAtCell(row, col, oldval, 'AUTO');
            } else {
                //console.log('POST UPDATE: Changed ' + edited_id + ' field ' + col + ' to ' + newval);
            };
        });
    };
};



$('#panel_fullscreen_icon').click(function(){

    //console.log('Clicked full screen icon');

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
        build_spreadsheet(current_spreadsheet_data);
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
        build_spreadsheet(current_spreadsheet_data);
    };
});


