
// Get the global variables
var container = document.getElementById('spreadsheet');
var hot = ''; //Placeholder for handsontable
var data = [];
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
        build_spreadsheet(data);
    };
});

function build_spreadsheet(data) {

    column_headers = data[0].map(function (item) { return { title: item }; });

    hot = new Handsontable(container, {
        data: data.slice(1,data.length-1),
        minSpareRows: 1,
        columns: column_headers,
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        afterChange: function (changes, source) {
            //console.log('afterChange event: ' + (changes || 'nochange').toString() + ' from ' + source);
            if (changes != null && source == 'edit') {
                cell_changed(changes, source);
            };
        }
    });
};

$('#do_something').click(function () {
    hot.setDataAtCell(2, 2, 'Changed!', 'AUTO')
    console.log(hot.getDataAtCell(2, 5));
});

function cell_changed(changes, source) {

    //console.log('cell_changed value: ' + changes.toString());

    var row = changes[0][0];
    var col = changes[0][1];
    var oldval = changes[0][2];
    var newval = changes[0][3];

    var edited_global = hot.getDataAtCell(row, 0);
    var edited_field = column_headers[col]['title'];


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