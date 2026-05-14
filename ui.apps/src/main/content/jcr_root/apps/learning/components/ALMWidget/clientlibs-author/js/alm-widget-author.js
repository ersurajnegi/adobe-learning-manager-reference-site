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
 * ALM Widget - Author Mode Event Handlers
 * 
 * This script handles ALM Widget changes in AEM author mode.
 * 
 * Uses MutationObserver to watch for DOM changes in the content frame.
 * When an ALM Widget is added, removed, or modified, the content frame
 * is reloaded to ensure the widget renders correctly with its React components.
 * 
 * Detects:
 * - Drag & drop from component browser
 * - Copy & paste operations
 * - Delete operations
 * - Move operations
 * - Edit operations (DOM updates after dialog save)
 */
(function (document, window, $) {
    "use strict";

    const ALM_WIDGET_RESOURCE_TYPE = "learning/components/ALMWidget";
    let reloadTimeout = null;
    let mutationObserver = null;

    /**
     * Reload the content frame
     */
    function reloadContentFrame() {
        try {
            if (Granite && Granite.author && Granite.author.ContentFrame) {
                console.log('[ALM Widget Author] Reloading content frame after widget change');
                Granite.author.ContentFrame.reload();
            } else {
                console.warn('[ALM Widget Author] Granite.author.ContentFrame not available');
            }
        } catch (e) {
            console.error('[ALM Widget Author] Error reloading content frame:', e);
        }
    }

    /**
     * Schedule a reload with debouncing to prevent multiple rapid reloads
     */
    function scheduleReload(reason) {
        console.log('[ALM Widget Author] Reload scheduled:', reason);
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(function() {
            reloadContentFrame();
        }, 500);
    }

    /**
     * Check if a DOM element is an ALM Widget
     * An ALM Widget must have class "ALMWidget" and contain a child with class "alm-widget-container"
     */
    function isALMWidgetElement(element) {
        if (!element || element.nodeType !== 1) {
            return false;
        }

        const className = element.className || '';
        
        // Check if element has "ALMWidget" class
        if (typeof className === 'string' && className.indexOf('ALMWidget') === -1) {
            return false;
        }

        // Check if element has a child with "alm-widget-container" class
        try {
            const hasWidgetContainer = element.querySelector('.alm-widget-container') !== null;
            return hasWidgetContainer;
        } catch (e) {
            // querySelector might fail on some elements
            return false;
        }
    }


    /**
     * Setup MutationObserver to watch for DOM changes in content frame
     * This catches all ALM Widget changes: drag & drop, delete, move, and edit operations
     */
    function setupMutationObserver() {
        try {
            const contentFrame = Granite.author.ContentFrame;
            if (!contentFrame || !contentFrame.contentWindow) {
                console.warn('[ALM Widget Author] Content frame not available for MutationObserver');
                return;
            }

            const targetNode = contentFrame.contentWindow.document.body;
            if (!targetNode) {
                console.warn('[ALM Widget Author] Content frame body not available');
                return;
            }

            // Disconnect existing observer if any
            if (mutationObserver) {
                mutationObserver.disconnect();
            }

            mutationObserver = new MutationObserver(function(mutations) {
                let almWidgetChanged = false;

                mutations.forEach(function(mutation) {
                    // Check added nodes (drag & drop, paste)
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && isALMWidgetElement(node)) {
                            console.log('[ALM Widget Author] ALM Widget added to DOM');
                            almWidgetChanged = true;
                        }
                    });

                    // Check removed nodes (delete, cut)
                    mutation.removedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && isALMWidgetElement(node)) {
                            console.log('[ALM Widget Author] ALM Widget removed from DOM');
                            almWidgetChanged = true;
                        }
                    });
                });

                if (almWidgetChanged) {
                    scheduleReload('DOM mutation');
                }
            });

            mutationObserver.observe(targetNode, {
                childList: true,
                subtree: true,
                attributes: false
            });

            console.log('[ALM Widget Author] MutationObserver initialized and active');
        } catch (e) {
            console.error('[ALM Widget Author] Error setting up MutationObserver:', e);
        }
    }

    /**
     * Initialize MutationObserver when content frame is ready
     */
    function initializeMutationObserver() {
        // Try immediately
        setupMutationObserver();

        // Retry after delay if not successful
        if (!mutationObserver) {
            setTimeout(setupMutationObserver, 2000);
        }
    }

    // ========================================================================
    // Initialization
    // ========================================================================

    // Initialize on page load
    $(window).on('load', function() {
        console.log('[ALM Widget Author] Window loaded, initializing MutationObserver');
        setTimeout(initializeMutationObserver, 1000);
    });

    // Re-initialize when switching to Edit layer
    $(document).on('cq-layer-activated', function(e) {
        if (e.layer === 'Edit') {
            console.log('[ALM Widget Author] Edit layer activated, reinitializing MutationObserver');
            setTimeout(initializeMutationObserver, 500);
        }
    });

    console.log('[ALM Widget Author] MutationObserver monitoring initialized');

})(document, window, Granite.$);
