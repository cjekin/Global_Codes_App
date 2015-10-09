// Load the dashboard
$(function () {

    // Get the work section data
    $.getJSON('/worksection_data', function (data) {
        worksection_data = data;
        var options = '';
        for (var i = 0; i < worksection_data['systems'].length; i++) {
            options += '<option>' + worksection_data['systems'][i] + '</option>';
        }
        $('#tlc_search_system').html(options);
        $('#tlc_search_system').val(current_system);
        $('#tlc_search_section').html(get_worksections(current_system));
    });

    // Load the library code data
    var url_val = '/tlc_data?system=' + current_system + '&section=' + $('#tlc_search_section').val().substring(0, 1) + '&primary=0&unmapped=0';
    console.log(url_val);
    library_code_datatable.ajax.url(url_val).load();
    fill_library_code_detail(current_system, current_tlc);
    update_system_info();
    event_handlers();
});