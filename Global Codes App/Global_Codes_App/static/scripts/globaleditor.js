
// Get the global variables
var current_dept = 'All';


// Initialise the global code table
var global_code_datatable = $('#global_code_datatable').DataTable({
    ajax: '/globalseditordata?department=All',
    sPlaceHolder: "head:before",
    columns: [
        { title: "Alias" },
        { title: "GlobalCode" },
        { title: "Description" },
        { title: "Sample" },
        { title: "Type" },
        { title: "Analyte" },
        { title: "PrimaryLibrary" },
        { title: "SubSection" },
        { title: "Department" },
        { title: "NLMC" },
        { title: "SNOMEDCT_UK" },
        { title: "PBCL" },
        { title: "LOINC" },
        { title: "Interface" },
        { title: "MiddlewareCode" }
    ],
    "columnDefs": [
    {
        "visible": false,
        "targets": 0
    }
    ],
    "scrollX": true,
    "bAutoWidth": false
});


// Assign event listener to global filter
$('#global_dept_filter_button').click(function () {
    var url_val = '/globalseditordata?department=' + current_dept;
    global_code_datatable.ajax.url(url_val).load();
});

$('#global_dept_filter').change(function () {
    current_dept = $('#global_dept_filter').val();
    console.log('Current_dept: ' + current_dept);
});


// Respond to clicking a global code
$("#global_code_datatable tbody").delegate("tr", "click", function () {
    current_global_code = $("td:eq(0)", this).text();
    current_global_name = $("td:eq(1)", this).text();
    console.log('You clicked: ' + current_global_code + ' : ' + current_global_name);
    //fill_library_code_detail();
});