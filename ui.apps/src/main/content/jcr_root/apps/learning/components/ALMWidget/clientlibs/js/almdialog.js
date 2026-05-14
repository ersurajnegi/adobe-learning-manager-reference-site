/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

(function (document, window, $) {
    "use strict";
    
    const CP_DIALOG_REL = ".cp-dialog-form-rel";

    function handleHiddenOptions() {
        // Placeholder for hidden options handling
    }

    function handleSelection() {
        $(CP_DIALOG_REL).find("input[type='hidden']").each(function() { 
            if ($(this).attr("name").indexOf("@Delete") != -1) {
                $(this).remove();
            }
        });
        
        let selectedWidgetElem = $('.selector-widget coral-select-item:selected');
        if (selectedWidgetElem && selectedWidgetElem[0] && selectedWidgetElem[0].value) {
            let selectedWidget = selectedWidgetElem[0].value;
        
            // Handle both checkboxes and other input types
            $(CP_DIALOG_REL).find("coral-checkbox, :input, coral-select").each(function () {
                let elemName = $(this).attr("name");
                let itemType = $(this).attr("itemtype");
                
                if (elemName && itemType) {
                    let $elem = $(this);
                    let isCheckbox = $elem.is("coral-checkbox");
                    let divWrapper = isCheckbox ? $elem : $elem.closest("div.coral-Form-fieldwrapper");
                    
                    if (itemType !== selectedWidget) {
                        // Hide non-matching widgets
                        divWrapper.attr("hidden", '');
                        if (divWrapper.find("label#hideOption").length < 1 && divWrapper.find("input.hideOption").length < 1) {
                            let deleteName = elemName + "@Delete";
                            $('<input>').attr({type:'hidden', name: deleteName}).appendTo(CP_DIALOG_REL);
                            $elem.attr("disabled", "");
                        }
                    } else {
                        // Show matching widgets
                        if (divWrapper.find("label#hideOption").length < 1 && divWrapper.find("input.hideOption").length < 1) {
                            divWrapper.removeAttr("hidden");
                        }
                        $elem.removeAttr("disabled");
                    }
                } 
            });
        }
    }

    $(document).on("foundation-contentloaded", function (e) {
        const $dlg = $(e.target).closest(".cq-dialog");
        if (!$dlg.length) return;

        const el = $dlg.find(".selector-widget").get(0);
        if (!el) { 
            console.warn("Widget type selector not found"); 
            return; 
        }

        Coral.commons.ready(el, function () {
            handleSelection();
            $(el).on("change", handleSelection);
        });
    });

})(document, window, Granite.$);