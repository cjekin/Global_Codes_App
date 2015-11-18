
// Get the global variables


$(window.scrollTo(0, 0));

function scroll_to_this(element,speed) {
    $('html, body').animate({
        scrollTop: element.offset().top
    }, speed);
};

// Get the list of departments
$.getJSON('/pull_spreadsheet_globals', function (data) {
    if (data['data'] == 'ERROR') {
        swal({
            title: "Error pulling all the globals",
            text: "An exception occurred pulling all the global data. The details have been recorded in the error log. " + data['error_detail'],
            type: "warning"
        });
    } else {
        build_spreadsheet(data['data']);
    };
});

function build_spreadsheet(data) {

    var container = document.getElementById('spreadsheet');
    var hot = new Handsontable(container, {
        data: data,
        minSpareRows: 1,
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        afterChange: function (changes, source) {
            if (changes != null) {
                console.log(changes);
                console.log(data[changes[0][0]][changes[0][1]]);
            };
        }
    });

};