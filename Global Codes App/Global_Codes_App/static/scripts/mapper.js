// Global variables
var preload_status = 'empty';
var current_tlc = 'U/E';
var current_tlc_name = 'UREA AND ELECTROLYTES';
var current_tlc_type = 'G';
var library_code_datatable = '';

var current_system = 'BMI_ALL_DW';
var current_section = '0';
var library_search_datatable = '';
var global_map_table = ''; // Used to update mapping

var loinc_list = [];



// Load the basic data
$(function () {
    get_winpath_systems_select();
    get_worksections_select();
    get_tlc_list_data();
    
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
        $('#tlc_search_section').html('');

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
        };
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






//// Refresh the system info widget
//function update_system_info() {
//    current_system = $('#tlc_search_system').val();
//    current_section = $('#tlc_search_section').val().substring(0, 1);
//    var url_val = '/system_info?system=' + current_system + '&section=' + current_section;
//    $('#system-overview-total').text('Loading...');
//    $('#system-overview-total-percent').text('--');
//    $('#system-overview-codesinsection').text('--');
//    $('#system-overview-codesmapped').text('--');

//    // Get the work section data
//    $.getJSON(url_val, function (data) {
//        if (data['result'] == 'ERROR') {
//            $('#system-overview-total').text('ERROR');
//        } else {
//            $('#system-overview-total').text(data['result'][0]['Total'] + ' total');
//            $('#system-overview-total-percent').text('Percent mapped (' + data['result'][0]['PctMapped'] + '%)');
//            $("#system-overview-total-progress").css("width", data['result'][0]['PctMapped'] + '%');
//            $('#system-overview-codesinsection').text(data['result'][0]['NumSection']);
//            $('#system-overview-codesmapped').text(data['result'][0]['NumSectionMapped']);
//        };
//    });
//};

function run_sql_query(params,method_to_run_on_completion) {
    
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
                method_to_run_on_completion(result);
            };
        }
    });
};


function fill_library_code_detail(result) {

    $('#tlc-detail-header').text(current_tlc + ' - ' + current_tlc_name + ' - ' + current_tlc_type);
    global_map_table = result['table'];
    
    Handlebars.registerHelper('result_type_firstchar', function (str) {
        return str.slice(0, 1).toUpperCase();
    });
    
    Handlebars.registerHelper('result_type_class', function (str) {
        if (str == 'Result') {
            return 'success';
        } else if (str == 'SubResult') {
            return 'info';
        } else {
            return 'default';
        };
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
        $(this).css("background", "#F5F6CE");
    });
    $('.tabitem').focusout(function () {
        $(this).css("background", "white");
    });

    $(".loinc").keydown(function (event) { loinc_keydown(event, this); });

    $(".result-type").keydown(function (event) {
        if (event.key == 'c' || event.key == 'C') {
            event.preventDefault();
            console.log('Pressed C');
        }
    });

    $(".container").keydown(function (event) { container_keydown(event, this); });


    $('.loinc').on("select2:select", function (e) {
        loinc_change_select2(e, this);
    });

};

function loinc_keydown(event, this_loinc) {
    if (event.key == 'Enter') {
        event.preventDefault();
        loinc_open_select2(this_loinc);
    }
};
function container_keydown(event, this_container) {
    if (event.key == 'Enter') {
        event.preventDefault();
        container_open_select2(this_loinc);
    }
};




//
// LOINC field
//

function loinc_open_select2(this_cell) {

    var select = $('<select class="loinc_select2"></select>');
    $(this_cell).html('').append(select);


    function formatState(state) {
        if (!state.id) { return state.text; }
        var $state = $(
          '<small>' + state.text.replace(']',']<br/>') + '</small>'
        );
        return $state;
    };

    select.select2({
        width: '95%',
        placeholder: 'Search mapped LOINC',
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
        escapeMarkup: function (markup) { return markup; }, // let our custom formatter work
        minimumInputLength: 2,
        templateResult: formatState, // omitted for brevity, see the source of this page
    });

    // Event handlers for the select2
    $(this_cell).off('keydown');
    $(this_cell).keydown(function (event) {
        select.select2('open')
    });
};

function loinc_change_select2(e, this_loinc) {
    
    $(this_loinc).off('keydown');

    $(this_loinc).keydown(function (event) {
        console.log('New post-select keydown');
        loinc_keydown(event, this_loinc);
    });

    var submission = {
        table: global_map_table,
        field: $(this_loinc).attr('data-field'),
        id_name: 'map_id',
        id: $(this_loinc).closest('tr').attr('id'),
        oldval: $(this_loinc).attr('data-val'),
        newval: e.params.data.id
    };

    console.log(submission);

    $(this_loinc).css('background', '#FAAC58');

    $.post('/submit_table_update', submission)
        .done(function (data) {
            if (data['data'] == 'ERROR') {
                swal({
                    title: "Problem submitting changes",
                    text: "There was an issue submitting your change.",
                    type: "warning"
                });
                $(this_loinc).css('background', '#F5A9BC');
            } else {
                console.log('POST UPDATE: Changed ' + submission['table'] + ' field ' + submission['field'] + ' to ' + submission['newval']);
                var newtext = e.params.data.text;
                var newval = '<span>' + newtext.split(']')[0] + ']</span><br/><small class="font-light">' + newtext.split(']')[1] + '</small>';
                $(this_loinc).html(newval);
                $(this_loinc).focus();
                $(this_loinc).css('background', '#A9F5A9');
            };
        });
};



