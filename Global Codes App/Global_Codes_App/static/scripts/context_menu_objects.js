var result_type_menuobjects_original = [

		{ header: 'Download' },
		{
		    text: '<b>T</b>he Script', subMenu: [
               { header: 'Requires jQuery' },
               {
                   text: 'context.js', href: 'http://lab.jakiestfu.com/contextjs/context.js', target: '_blank', action: function (e) {
                       _gaq.push(['_trackEvent', 'ContextJS Download', this.pathname, this.innerHTML]);
                   }
               }
		    ]
		},
		{
		    text: 'The Styles', subMenu: [

               {
                   text: 'context.bootstrap.css', href: 'http://lab.jakiestfu.com/contextjs/context.bootstrap.css', target: '_blank', action: function (e) {
                       _gaq.push(['_trackEvent', 'ContextJS Bootstrap CSS Download', this.pathname, this.innerHTML]);
                   }
               },

               {
                   text: 'context.standalone.css', href: 'http://lab.jakiestfu.com/contextjs/context.standalone.css', target: '_blank', action: function (e) {
                       _gaq.push(['_trackEvent', 'ContextJS Standalone CSS Download', this.pathname, this.innerHTML]);
                   }
               }
		    ]
		},
		{ divider: true },
		{ header: 'Meta' },
		{
		    text: 'The Author', subMenu: [
               { header: '@jakiestfu' },
               { text: 'Website', href: 'http://jakiestfu.com/', target: '_blank' },
               { text: 'Forrst', href: 'http://forrst.com/people/jakiestfu', target: '_blank' },
               { text: 'Twitter', href: 'http://twitter.com/jakiestfu', target: '_blank' },
               {
                   text: 'Donate?', action: function (e) {
                       e.preventDefault();
                       $('#donate').submit();
                   }
               }
		    ]
		},
		{
		    text: 'Hmm?', subMenu: [
               { header: 'Well, thats lovely.' },
               {
                   text: '2nd Level', subMenu: [
                      { header: 'You like?' },
                      {
                          text: '3rd Level!?', subMenu: [
                             { header: 'Of course you do' },
                             {
                                 text: 'MENUCEPTION', subMenu: [
                                    { header: 'FUCK' },
                                    {
                                        text: 'MAKE IT STOP!', subMenu: [
                                           { header: 'NEVAH!' },
                                           {
                                               text: 'Shieeet', subMenu: [
                                                  { header: 'WIN' },
                                                  {
                                                      text: 'Dont Click Me', href: 'http://bit.ly/1dH1Zh1', target: '_blank', action: function () {
                                                          console.log(this);
                                                      }
                                                  }
                                               ]
                                           }
                                        ]
                                    }
                                 ]
                             }
                          ]
                      }
                   ]
               }
		    ]
		}
];



var result_type_menuobjects = [
		{ header: 'Result Type' },
        {
            text: 'Result (R)',
            action: function (e, selector) {
                run_sql_update(selector, { newval: map_result_type_key_pressed['R'] });
                $('html, body').animate({ scrollTop: selector.offset().top }, 300);
            }
        },
        { text: 'SubResult (S)' },
        { text: 'Qualifier (Q)' },
        { text: 'Internal (I)' },
        { text: 'Not Requested (N)' },
        { divider: true },
        { header: 'Other' },
        { text: 'Held (H)' },
        { text: 'Delete (Del)' }
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