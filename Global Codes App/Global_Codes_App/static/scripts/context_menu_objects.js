
var result_type_menuobjects = [
		{ header: 'Result Type' },
        {
            text: 'Result (R)',
            action: function (e, selector) {
                run_sql_update(selector, { newval: map_result_type_key_pressed['R'] });
                $('html, body').animate({ scrollTop: selector.offset().top }, 300);
            }
        },
        {
            text: 'SubResult (S)',
            action: function (e, selector) {
                run_sql_update(selector, { newval: map_result_type_key_pressed['S'] });
                $('html, body').animate({ scrollTop: selector.offset().top }, 300);
            }
        },
        {
            text: 'Qualifier (Q)',
            action: function (e, selector) {
                run_sql_update(selector, { newval: map_result_type_key_pressed['Q'] });
                $('html, body').animate({ scrollTop: selector.offset().top }, 300);
            }
        },
        {
            text: 'Internal (I)',
            action: function (e, selector) {
                run_sql_update(selector, { newval: map_result_type_key_pressed['I'] });
                $('html, body').animate({ scrollTop: selector.offset().top }, 300);
            }
        },
        {
            text: 'Not Requested (N)',
            action: function (e, selector) {
                run_sql_update(selector, { newval: map_result_type_key_pressed['N'] });
                $('html, body').animate({ scrollTop: selector.offset().top }, 300);
            }
        },
        { divider: true },
        { header: 'Other' },
        {
            text: 'Held (H)',
            action: function (e, selector) {
                run_sql_update(selector, { newval: map_result_type_key_pressed['H'] });
                $('html, body').animate({ scrollTop: selector.offset().top }, 300);
            }
        },
        {
            text: 'Delete (Del)',
            action: function (e, selector) {
                run_sql_update(selector, { newval: '' });
                $('html, body').animate({ scrollTop: selector.offset().top }, 300);
            }
        },

];

var loinc_menuobjects = [
		{ header: 'Search' },
        {
            text: 'Simple Search (Enter)',
            action: function (e, selector) {
                open_loinc_select2(selector);
                $('html, body').animate({
                    scrollTop: selector.offset().top
                }, 300);
            }
        },
		{
		    text: 'Advanced Search (Ctrl-Enter)',
		    action: function (e, selector) {
		        create_loinc_popup(selector);
		        $('html, body').animate({
		            scrollTop: selector.offset().top
		        }, 300);
		    }
		},

        { divider: true },
        
        { header: 'Other' },
        {
            text: 'LOINC Info (I)',
            action: function (e, selector) {
                loinc_iframe(selector.data('val'));
                $('html, body').animate({
                    scrollTop: selector.offset().top
                }, 500);
            }
        },

];