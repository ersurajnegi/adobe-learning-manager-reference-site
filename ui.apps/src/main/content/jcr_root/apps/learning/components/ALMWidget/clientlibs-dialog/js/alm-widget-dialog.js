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

/**
 * ALM Widget - Simplified Dialog Behavior
 * 
 * This script handles dialog-specific logic like field visibility
 * based on widget selection and widget-specific conditional logic.
 * 
 * Note: Page reload logic is handled in clientlibs-author/alm-widget-author.js
 */
(function (document, window, $) {
    "use strict";
    
    const CP_DIALOG_REL = ".cp-dialog-form-rel";
    
    // Track previously selected widget to detect changes
    let previousWidget = null;

    /**
     * Hide fields marked with hideOption class
     */
    function handleHiddenOptions() {
        $("input.hideOption").closest("div.coral-Form-fieldwrapper").attr("hidden",'');
    }

    /**
     * Show/hide dialog fields based on selected widget type
     * 
     * This is the core function that manages field visibility in the dialog.
     * Each widget type (Category, Courses & Paths, etc.) has its own set of configuration fields.
     * This function ensures only the fields relevant to the currently selected widget are visible.
     * 
     * How it works:
     * 1. Cleanup: Removes any existing @Delete hidden inputs from previous selections
     * 2. Iterate: Loops through all form fields (inputs, selects, checkboxes)
     * 3. Match: Compares each field's 'itemtype' attribute with the selected widget type
     * 4. Hide non-matching fields:
     *    - Sets 'hidden' attribute on the field wrapper
     *    - Creates a hidden input with name 'fieldName@Delete' to remove the property from JCR on save
     *    - Disables the field to prevent it from being submitted
     * 5. Show matching fields:
     *    - Removes 'hidden' attribute from the field wrapper
     *    - Re-enables the field
     * 6. Widget-specific logic: Calls specialized handlers for certain widgets (e.g., Category widget)
     * 
     * The @Delete mechanism is an AEM/Sling convention that tells the repository to remove
     * a property when the form is submitted. This ensures fields from previously selected
     * widget types don't persist in JCR when switching to a different widget type.
     */
    function handleSelection() {
        // Clean up old @Delete inputs
        $(CP_DIALOG_REL).find("input[type='hidden']").each(function() { 
            if ($(this).attr("name").indexOf("@Delete") != -1) {
                $(this).remove();
            }
        });
        
        let selectedWidgetElem = $('.selector-widget coral-select-item:selected');
        if (selectedWidgetElem && selectedWidgetElem[0] && selectedWidgetElem[0].value) {
            let selectedWidget = selectedWidgetElem[0].value;
            
            // Reset Category widget fields when switching away from it
            if (previousWidget === 'com.adobe.captivateprime.category' && 
                selectedWidget !== 'com.adobe.captivateprime.category') {
                window.ALM.ALMWidget.CategoryWidget.resetFields();
            }
            
            // Reset Courses & Paths widget fields when switching away from it
            if (previousWidget === 'com.adobe.captivateprime.courses.and.paths' && 
                selectedWidget !== 'com.adobe.captivateprime.courses.and.paths') {
                window.ALM.ALMWidget.CoursesAndPathsWidget.resetFields();
            }
            
            // Update previous widget tracker
            previousWidget = selectedWidget;
        
            // Handle both checkboxes and other input types
            $(CP_DIALOG_REL).find("coral-checkbox, :input, coral-select, coral-radio").each(function () {
                let elemName = $(this).attr("name");
                let itemType = $(this).attr("itemtype");
                
                if (elemName && itemType) {
                    let $elem = $(this);
                    let isCheckbox = $elem.is("coral-checkbox");
                    let isRadio = $elem.is("coral-radio");
                    let divWrapper = isCheckbox ? $elem : $elem.closest("div.coral-Form-fieldwrapper");
                    
                    if (itemType !== selectedWidget) {
                        // Hide non-matching widgets
                        divWrapper.attr("hidden", '');
                        let deleteName = elemName + "@Delete";
                        $('<input>').attr({type:'hidden', name: deleteName}).appendTo(CP_DIALOG_REL);
                        $elem.attr("disabled", "");
                    } else {
                        // Show matching widgets
                        divWrapper.removeAttr("hidden");
                        if (isRadio) {
                            $elem.removeAttr("hidden");
                        }
                        $elem.removeAttr("disabled");
                    }
                } 
            });
            
            // Apply widget-specific logic
            // Note: handleUI is NOT called here - it will be called after initializeDefaults()
            // This ensures radio buttons and other defaults are set before showing/hiding fields
        }
    }

    /**
     * Initialize dialog when content is loaded
     */
    function initialize() {
        
        let usageTypeSelectElem = $(".selector-widget").get(0);
        
        if (usageTypeSelectElem) {
            Coral.commons.ready(usageTypeSelectElem, function() {
                // Initialize previous widget tracker with current selection
                let selectedWidgetElem = $('.selector-widget coral-select-item:selected');
                if (selectedWidgetElem && selectedWidgetElem[0] && selectedWidgetElem[0].value) {
                    previousWidget = selectedWidgetElem[0].value;
                }
                
                handleHiddenOptions();
                handleSelection();
                window.ALM.ALMWidget.CategoryWidget.initializeDefaults(); // Apply default radio selections
                window.ALM.ALMWidget.CoursesAndPathsWidget.initializeDefaults(); // Apply default radio selections
                
                // Re-apply widget-specific UI after defaults are set
                if (selectedWidgetElem && selectedWidgetElem[0]) {
                    const selectedWidget = selectedWidgetElem[0].value;
                    if (selectedWidget === 'com.adobe.captivateprime.category') {
                        window.ALM.ALMWidget.CategoryWidget.handleUI();
                    } else if (selectedWidget === 'com.adobe.captivateprime.courses.and.paths') {
                        window.ALM.ALMWidget.CoursesAndPathsWidget.handleUI();
                    }
                }
                
                // Listen for widget type changes
                usageTypeSelectElem.on('change', function() {
                    handleSelection();
                    
                    // Initialize defaults first (sets radio buttons)
                    window.ALM.ALMWidget.CategoryWidget.initializeDefaults();
                    window.ALM.ALMWidget.CoursesAndPathsWidget.initializeDefaults();
                    
                    // Now call handleUI after defaults are set
                    const newSelectedWidget = $('.selector-widget coral-select-item:selected').val();
                    if (newSelectedWidget === 'com.adobe.captivateprime.category') {
                        window.ALM.ALMWidget.CategoryWidget.handleUI();
                    } else if (newSelectedWidget === 'com.adobe.captivateprime.courses.and.paths') {
                        window.ALM.ALMWidget.CoursesAndPathsWidget.handleUI();
                    }
                });
            });
        }
        
        // Setup widget-specific event listeners
        window.ALM.ALMWidget.CategoryWidget.setupEventListeners();
        window.ALM.ALMWidget.CoursesAndPathsWidget.setupEventListeners();
    }
    
    /**
     * Cleanup function to remove event listeners when dialog closes
     */
    function cleanup() {
        window.ALM.ALMWidget.CategoryWidget.removeEventListeners();
        window.ALM.ALMWidget.CoursesAndPathsWidget.removeEventListeners();
    }

    // Initialize on content loaded
    $(document).on("foundation-contentloaded", initialize);
    
    // Cleanup on dialog close
    $(document).on("coral-overlay:close", function(e) {
        // Check if the closing overlay is the ALM Widget dialog
        const $dialog = $(e.target);
        if ($dialog.is('coral-dialog') && $dialog.find('.selector-widget').length > 0) {
            cleanup();
        }
    });

})(document, window, jQuery);
