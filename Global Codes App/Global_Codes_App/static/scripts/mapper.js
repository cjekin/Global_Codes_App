// Global variables
var preload_status = 'empty';
var current_tlc = 'U/E';
var current_tlc_name = 'UREA AND ELECTROLYTES';
var current_tlc_type = 'G';
var current_row = '';
var library_code_datatable = '';

var current_system = 'BMI_ALL_DW';
var current_section = '0';
var library_search_datatable = '';
var global_map_table = ''; // Used to update mapping
var location_list = '';
var container_list = '';

var loinc_list = [];

var error_colour = '#F5A9BC';
var success_colour = '#A9F5A9';
var processing_colour = '#FAAC58';


var map_result_type = {
    'Result': 'warning', 'SubResult': 'success', 'Qualifier': 'info', 'Calculation': 'info', 'Internal': 'info disabled', 'NotRequested': 'info disabled', 'Inactive': 'info disabled', 'Calculation': 'info'
};
var map_result_type_key_pressed = {
    R: 'Result', S: 'SubResult', Q: 'Qualifier', I: 'Internal', N: 'NotRequested', D: 'Disabled', C: 'Calculation'
};


// Load the basic data
$(function () {
    get_winpath_systems_select();
    get_worksections_select();
    get_tlc_list_data();
    get_location_list();
    get_container_list();
    
    //$(":tabbable").attr('tabindex', -1);
});

    
function get_winpath_systems_select() {
    $.getJSON('/get_variable_from_config?variable=systems', function (data) {

        var options = data['data'];
        $('#tlc_search_system').html('');

        for (i = 0; i < options.length; i++) {
            $('#tlc_search_system').append(
                $('<option></option>').val(options[i]).html(options[i])
            );
        };
    });
};

function get_worksections_select() {
    $.getJSON('/get_sql_data?query=Worksection_Data&system=' + current_system, function (data) {

        var options = data['data'];
        $('#tlc_search_section').html('<option>0 - ALL SECTIONS</option>');

        for (i = 0; i < options.length; i++) {
            if(options[i]['section_name'] == 'None'){
                var section = '';
            } else{
                var section = options[i]['section_name'];
            };
            var code = options[i]['section_letter'];
            $('#tlc_search_section').append(
                $('<option></option>').val(code).html(code + ' - ' + section)
            );
        };
    });
};


function get_tlc_list_data() {
   
    $('#library-code-header').html('<i class="fa fa-spinner fa-pulse"></i> Loading...');

    var primary = +$('#tlc_search_primary').prop('checked');
    var unmapped = +$('#tlc_search_unmapped').prop('checked');
    var params = '&system=' + current_system + '&section=' + current_section + '&primary=' + primary + '&unmapped=' + unmapped;

    $.getJSON('/get_sql_data?query=TLC_List_For_Mapper' + params, function (result) {

        if (result['result'] == 'ERROR') {
            swal({
                title: "Problem loading the library code list",
                text: "An exception occurred when we loading the data. The details have been recorded in the error log.",
                type: "warning"
            });
        } else {
            if (library_code_datatable != '') {
                library_code_datatable.clear();
                library_code_datatable.rows.add(result['data']);
                library_code_datatable.draw();
                $('#library-code-header').text(current_system);
            } else {
                draw_library_table(result);
                $('#library-code-header').text(current_system);
            };


            // Select the first library code and load the detail
            current_row = library_code_datatable.row(1);
            current_tlc = library_code_datatable.row(1).data()['tlc'];
            current_tlc_name = library_code_datatable.row(1).data()['tlc_name'];
            current_tlc_type = library_code_datatable.row(1).data()['tlc_type'];
            params = { query: 'TLC_Detail_For_Mapper', Origin: current_system, TLC: current_tlc };
            $('#library_code_detail_table').html('<div class="text-center"><i class="fa fa-spinner fa-2x fa-pulse m-b-lg m-t-lg"></i></div>');
            run_sql_query(params, fill_library_code_detail);
        };
    });
};


function get_location_list() {
    params = { query: 'Location_List_For_Mapper' };
    $.ajax({
        url: '/get_sql_data', dataType: 'json',
        data: params,
        success: function (result) {
            if (result['result'] == 'ERROR') { swal('Error getting location list'); }
            else {
                location_list = result;
            };
        }
    });
};

function get_container_list() {
    params = { query: 'Container_List_For_Mapper' };
    $.ajax({
        url: '/get_sql_data', dataType: 'json',
        data: params,
        success: function (result) {
            if (result['result'] == 'ERROR') { swal('Error getting container list'); }
            else {
                container_list = result;
            };
        }
    });
};


function draw_library_table(result) {

    var column_headers = [];
    for (i = 0; i < result['columns'].length; i++) {
        var col = { data: result['columns'][i], title: result['columns_desc'][i] };
        column_headers.push(col);
    };
 
    
    library_code_datatable = $('#library_code_datatable').DataTable({
        data: result['data'],
        columns: column_headers,
        "autoWidth": true,
        "tabIndex": -1,
        "columnDefs": [
        {
            "render": function (data) {
                if (data == "1") {
                    return "<i class=\"fa fa-check-circle text-center text-success\"></i>";
                } else {
                    return "";
                }
            },
            "width": "20px",
            "targets": 0
        }
        ]
    });

    $('#library_code_datatable tbody').on('click', 'tr', function () {
        var data = library_code_datatable.row(this).data();

        current_row = library_code_datatable.row(this);
        current_tlc = data['tlc'];
        current_tlc_name = data['tlc_name'];
        current_tlc_type = data['tlc_type'];
        console.log('You clicked: ' + current_tlc + ' in system ' + current_system);

        params = { query: 'TLC_Detail_For_Mapper', Origin: current_system, TLC: current_tlc };
        $('#library_code_detail_table').html('<div class="text-center"><i class="fa fa-spinner fa-2x fa-pulse m-b-lg m-t-lg"></i></div>');

        run_sql_query(params, fill_library_code_detail);
    });
};




//
// Event Handlers
//

// Change system
$('#tlc_search_system').change(function () {
    current_system = $('#tlc_search_system').val();
    get_worksections_select(current_system);
});

$('#tlc_search_section').change(function () {
    current_section = $('#tlc_search_section').val();
});

$('#tlc_search_submit').click(function () {
    get_tlc_list_data();
    //update_system_info();
});





//
//  General functions
//

function run_sql_query(params,method_to_run,other_params) {
    $.ajax({
        url: '/get_sql_data',
        dataType: 'json',
        data: params,
        success: function (result) {
            if (result['result'] == 'ERROR') {
                swal({
                    title: "Error running sql query",
                    text: "An error occurred running: " + myurl + ". The details have been recorded in the error log.",
                    type: "warning"
                });
            } else {
                if (!other_params) {
                    method_to_run(result);
                } else {
                    method_to_run(result, other_params);
                };
            };
        }
    });
};


function run_sql_update(this_cell, params) {

    var submission = {
        table: global_map_table,
        field: this_cell.data('field'),
        id_name: 'map_id',
        id: this_cell.closest('tr').attr('id'),
        oldval: this_cell.data('val'),
        newval: (params['newval'] || '' )
    };


    console.log('Submitting: ',submission);

    $.post('/submit_table_update', submission)
        .done(function (data) {
            if (data['data'] == 'ERROR') {

                if (this_cell.data('field') == 'loinc') {
                    var loinc_name = this_cell.data('loinc-desc');
                    if (loinc_name == '') {
                        $(this).html('').focus();
                    } else {
                        var old_html = '<span>' + loinc_name.split('[')[0] + '</span><br/>' + '<small class="font-light">' + loinc_name.split(']')[0] + ']<br/>' + loinc_name.split(']')[1] + '</small>';
                        this_cell.html(old_html);
                    };
                };

                if (this_cell.data('field') == 'result_type') {
                    var res_type = this_cell.data('val');
                    if (res_type == '') {
                        $(this).html('').focus();
                    } else {
                        var old_html = '<button tabindex="-1" class="btn btn-' + ( map_result_type[res_type] || 'default' ) + ' btn-xs result-type result-type-button">' + res_type.slice(0, 1) + '</button>'
                        this_cell.html(old_html);
                    };
                };

                this_cell.focus();
                this_cell.effect('highlight', { color: error_colour }, 1000);

            } else {
                console.log('POST UPDATE: Changed ' + submission['table'] + ' field ' + submission['field'] + ' to ' + submission['newval']);

                // 
                if (this_cell.data('field') == 'loinc') {
                    
                };

                if (this_cell.data('field') == 'result_type') {
                    var res_type = params['newval'];
                    var new_html = '<button tabindex="-1" class="btn btn-' + (map_result_type[res_type] || 'default') + ' btn-xs result-type result-type-button">' + res_type.slice(0, 1) + '</button>'
                    this_cell.html(new_html);
                };

                $(this_cell).focus();
                $(this_cell).effect('highlight', { color: success_colour }, 1000);
            };
        });
};


function fill_library_code_detail(result) {

    if (result == null) {
        $('#library_code_detail_table').html('<div class="text-center">Error running query</div>');
        return;
    };

    $('#tlc-detail-header').text(current_tlc + ' - ' + current_tlc_name + ' - ' + current_tlc_type);
    global_map_table = result['table'];
    
    Handlebars.registerHelper('result_type_firstchar', function (str) {
        return ( str.slice(0, 1).toUpperCase() || '?' );
    });
    
    Handlebars.registerHelper('result_type_class', function (str) {
        return (map_result_type[str] || 'default' );
    });


   
    Handlebars.registerHelper('loinc_description_main', function (str) {
        return (str || '').split('[')[0];
    });
    Handlebars.registerHelper('loinc_description_full', function (str) {
        return (str || '').replace(']', ']<br />');
    });

    // Build the html from the data and a handlebars.js template
    var theTemplateScript = $("#mapper-handlebars-template").html();
    var theTemplate = Handlebars.compile(theTemplateScript);
    var d = result;
    var theCompiledHtml = theTemplate(d);
    $('#library_code_detail_table').html(theCompiledHtml);

    tlc_detail_event_handlers();
};




//
// TLC detail event handlers
//

function tlc_detail_event_handlers() {

    // Apply the tabindex
    $(':tabbable').each(function (i) { $(this).attr('tabindex', -1); });
    $('.tabitem').each(function (i) { $(this).attr('tabindex', i + 1); });

    // Apply the event handlers
    $('.tabitem').focusin(function () {
        $(this).addClass('focusin-cell');
    });
    $('.tabitem').focusout(function () {
        $(this).removeClass('focusin-cell');
    });
    $('.tabitem').keydown(function (e) {
        if (e.key == 'ArrowDown') {
            var col = $(this).parent().children().index($(this));
            $(this).closest('tr').next().find('td:eq(' + col + ')').focus();
            e.preventDefault();
        };
        if (e.key == 'ArrowUp') {
            var col = $(this).parent().children().index($(this));
            $(this).closest('tr').prev().find('td:eq(' + col + ')').focus();
            e.preventDefault();
        };
        if (e.key == 'ArrowRight') {
            $(this).next().focus();
            e.preventDefault();
        };
        if (e.key == 'ArrowLeft') {
            $(this).prev().focus();
            e.preventDefault();
        };
    });
    $('.tabitem').first().focus();


    // TFC cell events
    $('.tfc-name').click(function () {
        console.log('Clicked TFC name');
        if ($(this).hasClass('full')) {
            var min_html = '<span class="font-bold">' + $(this).data('val') + '</span><small class="font-trans pull-right">' + $(this).data('units') + '</small><br /><small class="font-trans">' + $(this).data('common') + '</small><small class="font-trans pull-right">[ ' + $(this).data('num') + ' ]</small>';
            $(this).html(min_html);
            $(this).removeClass('full');
        } else {
            var cell = $(this);
            var tfc = $(this).closest('tr').find('.tfc').data('val');
            $.ajax({
                url: '/get_sql_data', dataType: 'json',
                data: { query: 'More_TFC_Info', tfc: tfc, origin: current_system },
                success: function (result) {
                    if (result['result'] == 'ERROR') { swal('Error getting TFC data'); }
                    else {
                        var d = result['data'][0];
                        var c = result['columns'];
                        var h = result['columns_desc'];
                        var list = cell.html('').append('<dl></dl>').addClass('dl-horizontal');
                        for (i = 0; i < c.length; i++) {
                            list.append('<dt>' + h[i] + '</dt><dd>' + d[c[i]] + '</dd>');
                        };                       
                        cell.addClass('full');
                    };
                }
            });
        };
    });


    // LOINC cell events
    $(".loinc").keydown(function (event) {
        var select = $(this).find('select').data('select2');

        if (event.key == 'Enter' && !select) {
            event.preventDefault();
            open_loinc_select2($(this));
        };
        if (event.key == 'Escape' && select) {
            if (!select.isOpen()) {
                event.preventDefault();
                var loinc_name = $(this).data('loinc-desc');
                if (loinc_name == '') {
                    $(this).removeClass('bigdrop');
                    $(this).html('').focus();
                } else {
                    var old_html = '<span>' + loinc_name.split('[')[0] + '</span><br/>'
                    + '<small class="font-light">' + loinc_name.split(']')[0] + ']<br/>'
                    + loinc_name.split(']')[1] + '</small>'
                    $(this).removeClass('bigdrop');
                    $(this).html(old_html).focus();
                };
            };
        };
    });
    $('.loinc').on("select2:select", function (e) {
        loinc_change_select2(e, $(this));
    });


    // Result type events
    $(".result-type").keydown(function (event) {
        var key_pressed = event.key.toUpperCase();
        if (map_result_type_key_pressed[key_pressed]) {
            event.preventDefault();
            console.log('Pressed ' + key_pressed);
            run_sql_update($(this), { newval: map_result_type_key_pressed[key_pressed]  });
        };
    });


    // Container events
    $(".container").keydown(function (event) {
        var select = $(this).find('select').data('select2');

        if (event.key == 'Enter' && !select) {
            event.preventDefault();
            open_container_select2($(this));
        };
        if (event.key == 'Escape' && select) {
            if (!select.isOpen()) {
                event.preventDefault();
                $(this).html('<span>' + $(this).data('val') + '</span>').focus();
            };
        };
    });
    $('.container').on('select2:select', function (e) {
        var cell = $(this);

        console.log('Location change event: ', e.params.data);
        if (e.params.data.text == $(this).data('val')) {
            cell.html('<span>' + cell.data('val') + '</span>').focus();
            return;
        };
        
        $.post('/submit_table_update', { id: $(this).closest('tr').attr('id'), field: $(this).data('field'), oldval: $(this).data('val'), newval: e.params.data.id, table: global_map_table, id_name: 'map_id' })
            .done(function (data) {
                if (data['data'] == 'ERROR') {
                    cell.html('<span>' + $(this).data('val') + '</span>').focus();
                    cell.effect('highlight', { color: error_colour }, 1000);
                } else {
                    cell.data({ val: e.params.data.id });
                    cell.html('<span>' + e.params.data.text + '</span>').focus();
                    cell.removeClass('bigdrop');
                    cell.effect('highlight', { color: success_colour }, 1000);
                };
            });
    });


    // Location events
    $(".loc1,.loc2").keydown(function (event) {
        var select = $(this).find('select').data('select2');

        if (event.key == 'Enter' && !select) {
            console.log('Location ENTER key');
            event.preventDefault();
            open_location_select2($(this));
        };
        if (event.key == 'Escape' && select) {
            console.log('Location ESC key');
            if (!select.isOpen()) {
                event.preventDefault();
                $(this).removeClass('bigdrop');
                $(this).html('<span>' + $(this).data('subsection') + '</span><br/><small class="font-trans">' + $(this).data('department') + '</small>').focus();
            };
        };
    });
    $('.loc1,.loc2').on("select2:select", function (e) {
        var cell = $(this);

        if (e.params.data.id == cell.data('val')) {
            cell.html('<span>' + cell.data('subsection') + '</span><br/><small class="font-trans">' + cell.data('department') + '</small>').focus();
            return;
        };

        $.post('/submit_table_update', { id: cell.closest('tr').attr('id'), field: cell.data('field'), oldval: cell.data('val'), newval: e.params.data.id, table: global_map_table, id_name: 'map_id' })
            .done(function (data) {
            if (data['data'] == 'ERROR') {
                cell.html('<span>' + cell.data('subsection') + '</span><br/><small class="font-trans">' + cell.data('department') + '</small>').focus();
                cell.effect('highlight', { color: error_colour }, 1000);
            } else {
                cell.data({ val: e.params.data.id, subsection: e.params.data.text, department: e.params.data.Department });
                cell.html('<span>' + e.params.data.text + '</span><br/><small class="font-trans">' + e.params.data.Department + '</small>').focus();
                cell.effect('highlight', { color: success_colour }, 6000);
            };
        });
    });



    // Next TLC
    $(".tabitem").keydown(function (e) {
        if (e.key == 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();

            current_row = current_row.next();
            var data = current_row.data();
            current_tlc = data['tlc'];
            current_tlc_name = data['tlc_name'];
            current_tlc_type = data['tlc_type'];
            console.log('Moving to: ' + current_tlc + ' in system ' + current_system);

            params = { query: 'TLC_Detail_For_Mapper', Origin: current_system, TLC: current_tlc };
            $('#library_code_detail_table').html('<div class="text-center"><i class="fa fa-spinner fa-2x fa-pulse m-b-lg m-t-lg"></i></div>');
            run_sql_query(params, fill_library_code_detail);

        };
        if (e.key == 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();

            current_row = current_row.prev();
            var data = current_row.data();
            current_tlc = data['tlc'];
            current_tlc_name = data['tlc_name'];
            current_tlc_type = data['tlc_type'];
            console.log('Moving to: ' + current_tlc + ' in system ' + current_system);

            params = { query: 'TLC_Detail_For_Mapper', Origin: current_system, TLC: current_tlc };
            $('#library_code_detail_table').html('<div class="text-center"><i class="fa fa-spinner fa-2x fa-pulse m-b-lg m-t-lg"></i></div>');
            run_sql_query(params, fill_library_code_detail);
        }
    });

};




function open_loinc_select2(this_cell) {

    var select = $('<select></select>');
    $(this_cell).html('').append(select);
    $(this_cell).addClass('bigdrop');

    function formatState(state) {
        if (!state.id) { return state.text; }
        var $state = $(
          '<small>' + state.text.replace(']',']<br/>') + '</small>'
        );
        return $state;
    };

    select.select2({
        width: '95%',
        placeholder: 'Press Enter',
        ajax: {
            url: '/get_sql_data',
            dataType: 'json',
            delay: 500,
            data: function (params) {
                return {
                    search_term: params.term, // search term
                    query: 'Mapped_LOINC_List'
                };
            },
            processResults: function (data, params) {
                return {
                    results: data.data,
                    pagination: {
                        more: (params.page * 30) < data.total_count
                    }
                }
            },
            cache: true
        },
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 2,
        templateResult: formatState,
    });

    select.select2('open');
    
};


function loinc_change_select2(e, cell) {
    
    var submission = {
        table: global_map_table,
        field: cell.attr('data-field'),
        id_name: 'map_id',
        id: cell.closest('tr').attr('id'),
        oldval: cell.attr('data-val'),
        newval: e.params.data.id
    };

    $.post('/submit_table_update', submission)
        .done(function (data) {
            if (data['data'] == 'ERROR') {
                cell.html('<span>' + (cell.data('loinc-desc') || '').split('[')[0] + '</span><br /><small class="font-light">' + (cell.data('loinc-desc') || '') + '</small>').focus();
                cell.effect('highlight', { color: error_colour }, 1000);
            } else {
                var newtext = e.params.data.text;
                var newval = '<span>' + newtext.split(']')[0] + ']</span><br/><small class="font-light">' + newtext.split(']')[1] + '</small>';
                cell.html(newval).focus();
                cell.data({ 'loinc-desc': newtext, 'val': e.params.data.id });
                cell.effect('highlight', { color: success_colour }, 1000);
                get_other_data(e.params.data.id);
            };
        });

    function get_other_data(loinc_code) {

        console.log('Searching for other values for: ', loinc_code);

        var type = cell.closest('tr').find('.result-type'); //.data('val');
        var cont = cell.closest('tr').find('.container'); //.data('val');
        var loc1 = cell.closest('tr').find('.loc1'); //.data('val');
        var loc2 = cell.closest('tr').find('.loc2'); //.data('val'));

        $.ajax({
            url: '/get_sql_data', dataType: 'json',
            data: { query: 'Find_Similar_LOINC', loinc: loinc_code },
            success: function (result) {
                if (result['result'] == 'ERROR') { swal('Error getting similar LOINC codes'); }
                else {
                    var res = result['data'][0];
                    console.log('Checking type: ', type.data('val'), ' and ', res['result_type']);
                    if (type.data('val') == '' && res['result_type'] != '') {
                        console.log('Updating type');
                        var formatted_text = '<button tabindex="-1" class="btn btn-' + ( map_result_type[res['result_type']] || 'default' ) + ' btn-xs result-type result-type-button">' + res['result_type'].slice(0, 1).toUpperCase() + '</button>';
                        update_other_fields(type, res['result_type'], formatted_text, { val: res['result_type'] });
                    };

                    if (cont.data('val') == '' && res['container'] != '') {
                        update_other_fields(cont, res['container'], res['container'], { val: res['container'] });
                    };

                    if (loc1.data('val') == '' && res['loc1'] != '') {
                        console.log('Updating location');
                        var formatted_text = '<span>' + res['loc1_subsection'] + '</span><br /><small class="font-trans">' + res['loc1_department'] + '</small>';
                        update_other_fields(loc1, res['loc1'], formatted_text, { val: res['loc1'], subsection: res['loc1_subsection'], department: res['loc1_department'] });
                    };

                    if (loc2.data('val') == '' && res['loc2'] != '') {
                        console.log('Updating location');
                        var formatted_text = '<span>' + res['loc2_subsection'] + '</span><br /><small class="font-trans">' + res['loc2_department'] + '</small>';
                        update_other_fields(loc2, res['loc2'], formatted_text, { val: res['loc2'], subsection: res['loc2_subsection'], department: res['loc2_department'] });
                    };
                    
                };
            }
        });
    };

    function update_other_fields(cell, newval, formatted_text, html_vals) {
        var submission = {
            field: cell.attr('data-field'), id: cell.closest('tr').attr('id'), oldval: cell.attr('data-val'), newval: newval, table: global_map_table, id_name: 'map_id',
        };
        $.post('/submit_table_update', submission)
            .done(function (data) {
                if (data['data'] == 'ERROR') {
                    cell.effect('highlight', { color: error_colour }, 1000);
                } else {
                    cell.html(formatted_text).focus();
                    cell.data(html_vals);
                    cell.effect('highlight', { color: success_colour }, 1000);
                };
            });
    };

    
};




function open_container_select2(this_cell) {

    var select = $('<select></select>');
    $(this_cell).html('').append(select);
    $(this_cell).addClass('bigdrop');

    var current_container = this_cell.data('val');

    select.select2({
        data: container_list['nested_select'],
        width: '100%',
        initSelection: function (element, callback) {
            callback({ id: current_container, text: current_container });
        },
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 0
        //,templateResult: formatState,
    });

    select.val(current_container).trigger('change');
    select.select2('open');
};

function open_location_select2(this_cell) {

    var select = $('<select></select>');
    $(this_cell).html('').append(select);
    $(this_cell).addClass('bigdrop');


    function formatState(state) {
        if (!state.id) { return state.text; }
        var $state = $(
          '<small>' + state.text.replace(',', ',<br/>') + '</small>'
        );
        return $state;
    };

    select.select2({
        data: location_list['nested_select'],
        width: '100%',
        placeholder: 'Press Enter',
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 0,
        templateResult: formatState,
        initSelection: function (element, callback) {
            callback({ id: this_cell.data('val'), text: this_cell.data('subsection') });
        },
    });

    select.val(this_cell.data('val')).trigger('change');
    select.select2('open');
};




