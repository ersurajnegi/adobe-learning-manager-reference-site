/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE/2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

(function (document, $) {
  "use strict";

  $(document).ready(function () {
    // Simple placeholder for now - React widgets coming soon
    $('.alm-widget-container').each(function() {
      if (!$(this).attr('rendered')) {
        $(this).attr('rendered', 'true');
        $(this).html('<div class="alm-widget-placeholder" style="padding: 20px; border: 2px dashed #ccc; text-align: center; background: #f9f9f9;">' +
          '<h3>🚀 Adobe Learning Manager Widget Placeholder</h3>' +
          '<p>Click CONFIGURE to change widget type and settings</p>' +
          '</div>');
      }
    });
  });

})(document, Granite.$);
