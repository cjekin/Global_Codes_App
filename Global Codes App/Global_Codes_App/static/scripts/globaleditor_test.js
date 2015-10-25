var editor; // use a global for the submit and return data rendering in the examples

$(document).ready(function () {

    console.log('Document ready');

    editor = new $.fn.dataTable.Editor({
        ajax: "/editglobaldata",
        table: "#example",
        fields: [{
            label: "First name:",
            name: "first_name"
        }, {
            label: "Last name:",
            name: "last_name"
        }, {
            label: "Position:",
            name: "position"
        }, {
            label: "Office:",
            name: "office"
        }, {
            label: "Extension:",
            name: "extn"
        }, {
            label: "Start date:",
            name: "start_date",
            type: "date"
        }, {
            label: "Salary:",
            name: "salary"
        }
        ]
    });

    console.log('Starting datatable init');

    $('#example').DataTable({
        dom: "Bfrtip",
        ajax: "/datatest",
        columns: [
            {
                data: null, render: function (data, type, row) {
                    // Combine the first and last names into a single table field
                    return data.first_name + ' ' + data.last_name;
                }
            },
            { data: "position" },
            { data: "office" },
            { data: "extn" },
            { data: "start_date" },
            { data: "salary", render: $.fn.dataTable.render.number(',', '.', 0, '$') }
        ],
        select: true,
        buttons: [
            { extend: "create", editor: editor },
            { extend: "edit", editor: editor },
            { extend: "remove", editor: editor }
        ]
    });

    console.log('Finished with initialisation');

});