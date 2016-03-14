$(function () {
        var lineData = {
            labels: {{ month_range|safe }},
            datasets: [
                
                {
                    label: "Example dataset",
                    fillColor: "rgba(98,203,49,0.5)",
                    strokeColor: "rgba(98,203,49,0.7)",
                    pointColor: "rgba(98,203,49,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(26,179,148,1)",
                    data: {{ num_changes|safe }}
                }
            ]
        };

        var lineOptions = {
            scaleShowGridLines : true,
            scaleGridLineColor : "rgba(0,0,0,.05)",
            scaleGridLineWidth : 1,
            bezierCurve : true,
            bezierCurveTension : 0.4,
            pointDot : true,
            pointDotRadius : 4,
            pointDotStrokeWidth : 1,
            pointHitDetectionRadius : 20,
            datasetStroke : true,
            datasetStrokeWidth : 1,
            datasetFill : true,
            responsive: true
        };


        var ctx = document.getElementById("lineOptions").getContext("2d");
        var myNewChart = new Chart(ctx).Line(lineData, lineOptions);
    });
    
    var current_system = 'CROM_ALL_DW';
    var dashboard_overview_var = {{ dashboard_overview_var|safe }};
    var dashboard_detail = {{ dashboard_detail|safe }};
    
    function fill_system_detail(current_system){
        
        $('#sysdetail_name').text(current_system);
        
        $('#sysdetail_totaltfc').text(dashboard_overview_var[current_system].num_codes + ' TFCs');
        
        $('#sysdetail_progress').text(dashboard_overview_var[current_system].pct_mapped);
        $('#sysdetail_progress').css('width', dashboard_overview_var[current_system].pct_mapped + '%');
        $('#sysdetail_progress').attr('class', 'progress-bar progress-bar-' + dashboard_overview_var[current_system].bootstrap);
        
        $('#sysdetail_numcodes').text(dashboard_overview_var[current_system].num_codes);
        $('#sysdetail_numexcluded').text(dashboard_overview_var[current_system].num_excluded);
        $('#sysdetail_valid_codes').text(dashboard_overview_var[current_system].valid_codes);
        $('#sysdetail_num_mapped').text(dashboard_overview_var[current_system].num_mapped);
        
        function calc_bar_width(num_codes){
            
            var max_len = 0;
            for(i=0; i<dashboard_detail.length; i++){
                if(dashboard_detail['num_codes'] > max_len){ max_len = dashboard_detail['num_codes']};
            };
            
            var pct = ( num_codes / max_len ) * 100;
            if( pct < 20 ){
                return 20;
            } else {
                return pct;
            };
            
        };
        
        var det = dashboard_detail[current_system];
        var panel = $('#sysdetail_sectionprog');
        panel.html('');
        
        var this_html = '<div class="col-lg-6">';
        for( i=0; i<=8; i++ ) {
            var bar_width = calc_bar_width(det[i]['num_codes']);
            console.log(bar_width);       
            this_html += '<div class="row">';
            this_html += '<span class="col-lg-8">' + det[i]['sec'] + ' - ' + det[i]['section_name'] + ' - (' + det[i]['num_mapped'] + ' / ' + det[i]['valid_codes'] + ' ) - ' + det[i]['pct_mapped'] + '%</span>';
            this_html += '<div class="col-lg-4"><div class="progress m-t-xs full" style="width: ' + calc_bar_width(det[i]['num_codes']) + '%"><div style="width: ' + det[i]['pct_mapped'];
            this_html += '%" aria-valuemax="100" aria-valuemin="0" aria-valuenow="60" role="progressbar" class=" progress-bar progress-bar-' + det[i]['bootstrap'] + '"></div></div></div></div>';
        };
        this_html += '</div>'
        
        this_html += '<div class="col-lg-6">';
        for( i=9; i<det.length; i++ ) {
            this_html += '<div class="row">';
            this_html += '<span class="col-lg-8">' + det[i]['sec'] + ' - ' + det[i]['section_name'] + ' - (' + det[i]['num_mapped'] + ' / ' + det[i]['valid_codes'] + ' ) - ' + det[i]['pct_mapped'] + '%</span>';
            this_html += '<div class="col-lg-4"><div class="progress m-t-xs full" style="width: ' + calc_bar_width(det[i]['num_codes']) + '%"><div style="width: ' + det[i]['pct_mapped'];
            this_html += '%" aria-valuemax="100" aria-valuemin="0" aria-valuenow="60" role="progressbar" class=" progress-bar progress-bar-' + det[i]['bootstrap'] + '"></div></div></div></div>';
        };
        this_html += '</div>'
        
        panel.html(this_html);
    };
    
    $(function () {
        fill_system_detail(current_system);
    });
    
    $('.system-row').click(function(){
        current_system = $(this).data('system');
        fill_system_detail(current_system);
    })