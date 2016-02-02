
// Page 1

{% load i18n static %}

{% load templatetag_handlebars customised_template_tags %}

{% tplhandlebars "live_preview_name_details_template_ltr" %}

    <div class="live_preview_wrapper" dir="ltr" style="direction: ltr;">

        {# START: STANDARD NAC DETAILS RESUME STYLE PREVIEW TEMPLATE #}
        {# THIS STANDARD DIV IS USED FOR STYLE 25 ONLY #}
        <div class="live_preview_topContainer" dir="ltr" style="direction: ltr;">
            <div class="live_preview_nac_standardHeading" dir="ltr" style="direction: ltr;">{{ nac_personal_details_heading }}</div>
            {{ #if name_details_remove_photograph }}
                <div class="live_preview_standard_nac_top_photograph_wrapper" style="direction: ltr;">
                    {# image has max-height: 149px & max-width: 149px; assigned in the css file #}
                    <img id="id_name_details_photograph_live_nameDetailsPhotograph" class="name_details_photograph_preview_dimensions" src="{{ name_details_photograph }}" />
                </div>
            {{ /if }}
        </div>








// Page 2


{% include "resume_details/name_address_contact_details_live_preview_template.html" %}


var templates = {};

    var templateDirections = ['ltr', 'rtl'];
    var templateTypes = ['name', 'summary', 'objective', 'desired_occupation', 'notes'];
    for (var i = 0; i < templateDirections.length; i++) {
      var compiledTemplates = [];
      for (var j = 0; j < templateTypes.length; j++) {
        var templateSelector = '#live_preview_' + templateTypes[j] + '_details_template_' + templateDirections[i];
        var compiledTemplate = Handlebars.compile($(templateSelector).html());
        compiledTemplates.push(compiledTemplate)
      }
      templates[templateDirections[i]] = compiledTemplates;
    }
    
    
    
      updateLivePreview(
        templates[languageDirection],
        getFormValues,
        getLabels
      );
      
      
//updateLivePreview

    var data = $.extend({}, getFormValues(), getLabels(labels));

    var populatedTemplate = '';
    for (var i = 0; i < templates.length; i++) {
        populatedTemplate += templates[i](data);
    }
    
    
     $('#live_preview').html(populatedTemplate);
     
     
     Jenkins - Form validator