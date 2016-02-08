// Load the dashboard
$(document).ready(function () {

    // Load any new TFCs in to the mapping table
    $.getJSON('/get_new_tfc', function (data) {
        if (data['result'] == 'ERROR') {
            swal('Error getting new TFCs');
        };
    });

    // Get the work section data
    $.getJSON('/dashboard_getdata', function (data) {

        var dashboard = ''

        if (data['data'] == 'ERROR') {
            swal({
                title: "Error running the system stat query",
                text: "An exception occurred pulling all the system data. The details have been recorded in the error log. " + data['error_detail'],
                type: "warning"
            });
        };

        for (i = 0; i < data['system'].length; i++) {
            var system = data['system'][i];

            // Summary widget
            dashboard += '<div class="row"><div class="col-md-3"><div class="hpanel hbggreen"><div class="panel-body"><div class="text-center"><h3>';
            dashboard += system;
            dashboard += '</h3><p class="text-big font-light">';
            dashboard += data['data'][system][3] + '%'; // Percent mapped
            dashboard += '</p><small>';
            dashboard += data['data'][system][0] + ' of ' + data['data'][system][1] + ' codes mapped</small></div></div></div></div>';

            // Get the maximum number of codes
            var max_codes = 0;
            console.log('Looking at system: ', system);
            for (j = 0; j < data['data'][system][2].length; j++) {
                //console.log('Raw: ', data['data'][system][2]);
                //console.log('Length: ', data['data'][system][2].length);
                //console.log('Item: ', data['data'][system][2][j][3]);
                var num_codes = data['data'][system][2][j][3];
                console.log(' num_codes: ', num_codes);
                if (parseInt(num_codes) > parseInt(max_codes)) {
                    console.log(' new max');
                    max_codes = num_codes
                }
            };
            console.log(system, max_codes);
            
            // Progress panel 1
            dashboard += '<div class="col-lg-4"><div class="hpanel stats"><div class="panel-body h-200"><div class="stats-title pull-left"><h4>Mapping progress</h4></div><div class="m-t-xl">';
            for (j = 0; j < 8; j++) {
                var sections = data['data'][system][2];

                // Make the bars a relative width based on total number of codes
                var num_codes = sections[j][3];
                if (num_codes == '0') {
                    pct_of_total_width = '0';
                } else {
                    var pct_of_total_width = ((sections[j][3] / max_codes) * 100).toFixed(0);
                };
                
                dashboard += '<span class="font-bold no-margins">';
                dashboard += sections[j][1] + ' (' + sections[j][2] + ' / ' + sections[j][3] + ') ' + '</span><div class="progress m-t-xs full progress-small" style="width:' + pct_of_total_width + '%"><div style="width: ';
                dashboard += sections[j][4] + '%" aria-valuemax="100" aria-valuemin="0" aria-valuenow="55" role="progressbar" class=" progress-bar progress-bar-success"></div></div>';
            };
            dashboard += '</div></div></div></div>'; // Close the panel

            // Progress panel 2
            dashboard += '<div class="col-lg-4"><div class="hpanel stats"><div class="panel-body h-200"><div class="stats-title pull-left"></div><div class="m-t-xl">';
            for (j = 8; j < data['data'][system][2].length; j++) {
                var sections = data['data'][system][2];

                // Make the bars a relative width based on total number of codes
                var num_codes = sections[j][3];
                if (num_codes == '0') {
                    pct_of_total_width = '0';
                } else {
                    var pct_of_total_width = ((sections[j][3] / max_codes) * 100).toFixed(0);
                };

                dashboard += '<span class="font-bold no-margins">';
                dashboard += sections[j][1] + ' (' + sections[j][2] + ' / ' + sections[j][3] + ') ' + '</span><div class="progress m-t-xs full progress-small" style="width:' + pct_of_total_width + '%"><div style="width: ';
                dashboard += sections[j][4] + '%" aria-valuemax="100" aria-valuemin="0" aria-valuenow="55" role="progressbar" class=" progress-bar progress-bar-success"></div></div>';
            };
            dashboard += '</div></div></div></div>'; // Close the panel

            dashboard += '</div>'; // Close the row
        };

        $('#global_code_dashboard_main').html(dashboard);

    });
});