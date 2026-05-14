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

package com.adobe.learning.core.servlets;

import com.adobe.granite.ui.components.ds.DataSource;
import com.adobe.granite.ui.components.ds.SimpleDataSource;
import com.adobe.granite.ui.components.ds.ValueMapResource;
import com.adobe.learning.core.entity.ALMWidgetConfig;
import com.adobe.learning.core.entity.AccountResponse;
import com.adobe.learning.core.services.ALMWidgetConfigService;
import com.adobe.learning.core.services.AccountService;
import com.day.cq.wcm.api.Page;
import com.day.cq.wcm.api.PageManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.servlet.Servlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.api.wrappers.ValueMapDecorator;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(
    service = Servlet.class,
    property = {
      "sling.servlet.methods=GET",
      "sling.servlet.resourceTypes=" + ALMWidgetSelectDatasource.RESOURCE_TYPE
    })
public class ALMWidgetSelectDatasource extends SlingAllMethodsServlet {

  private static final long serialVersionUID = 6208632688001248037L;

  private static final Logger LOGGER = LoggerFactory.getLogger(ALMWidgetSelectDatasource.class);

  static final String RESOURCE_TYPE = "learning/components/ALMWidget/selectdatasource";

  @Reference private transient AccountService accountService;

  @Reference private transient ALMWidgetConfigService widgetConfigService;

  @Override
  protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) {

    String requestSuffix = "";
    List<Resource> resourceList = new ArrayList<>();

    if (null != request.getRequestPathInfo().getSuffix()) {
      requestSuffix = request.getRequestPathInfo().getSuffix();
      Resource resource = request.getResourceResolver().getResource(requestSuffix);

      if (resource != null) {
        ResourceResolver resolver = request.getResourceResolver();
        List<ALMWidgetConfig> widgets = widgetConfigService.getWidgetConfigs();
        List<ALMWidgetConfig> availableWidgetsList = getAvailableWidgets(widgets);

        // Fetch account response for nomenclature and filtering
        AccountResponse accountResponse = getAccountResponse(resolver, requestSuffix);
        Map<String, String> nomenclatureMap =
            (accountResponse != null)
                ? accountService.buildNomenclatureMap(accountResponse)
                : Collections.emptyMap();
        String effectiveAccountType =
            (accountResponse != null) ? accountResponse.getEffectiveAccountType() : null;

        // Filter widgets by account type
        List<ALMWidgetConfig> filteredWidgets =
            filterWidgetsByAccountType(availableWidgetsList, effectiveAccountType);

        for (ALMWidgetConfig widgetConfig : filteredWidgets) {
          ValueMap vm = new ValueMapDecorator(new HashMap<String, Object>());
          String value = widgetConfig.getRef();
          vm.put("value", value);
          // Replace nomenclature keys in widget name
          String displayName = replaceNomenclatureKeys(widgetConfig.getName(), nomenclatureMap);
          vm.put("text", displayName);
          resourceList.add(new ValueMapResource(request.getResourceResolver(), "", "", vm));
        }
      }
    }

    request.setAttribute(DataSource.class.getName(), new SimpleDataSource(resourceList.iterator()));
  }

  /**
   * Fetches the AccountResponse from the AccountService.
   *
   * @param resolver The resource resolver
   * @param resourcePath The path to resolve the page from
   * @return AccountResponse or null if unable to fetch
   */
  private AccountResponse getAccountResponse(ResourceResolver resolver, String resourcePath) {
    try {
      PageManager pageManager = resolver.adaptTo(PageManager.class);
      if (pageManager == null) {
        LOGGER.debug("CPPrime::ALMWidgetSelectDatasource:: Unable to get PageManager");
        return null;
      }

      Page currentPage = pageManager.getContainingPage(resourcePath);
      if (currentPage == null) {
        LOGGER.debug(
            "CPPrime::ALMWidgetSelectDatasource:: Unable to get page from path: {}", resourcePath);
        return null;
      }

      AccountResponse accountResponse = accountService.getAccountDetails(currentPage);
      if (accountResponse == null) {
        LOGGER.debug("CPPrime::ALMWidgetSelectDatasource:: Unable to get account details");
      }

      return accountResponse;

    } catch (Exception e) {
      LOGGER.error(
          "CPPrime::ALMWidgetSelectDatasource:: Exception while fetching account response", e);
      return null;
    }
  }

  /**
   * Filters widgets based on the effective account type. Widgets with no allowedAccountTypes
   * restriction are always included. If effectiveAccountType is null, no filtering is applied
   * (fail-open).
   */
  private List<ALMWidgetConfig> filterWidgetsByAccountType(
      List<ALMWidgetConfig> widgets, String effectiveAccountType) {
    if (effectiveAccountType == null) {
      return widgets;
    }
    return widgets.stream()
        .filter(
            widget -> {
              List<String> allowed = widget.getAllowedAccountTypes();
              return allowed == null || allowed.isEmpty() || allowed.contains(effectiveAccountType);
            })
        .collect(Collectors.toList());
  }

  /**
   * Replaces nomenclature keys in the given text with their corresponding values.
   *
   * @param text The text containing potential nomenclature keys
   * @param nomenclatureMap Map of nomenclature keys to values
   * @return The text with nomenclature keys replaced by values
   */
  private String replaceNomenclatureKeys(String text, Map<String, String> nomenclatureMap) {
    if (text == null || nomenclatureMap.isEmpty()) {
      return text;
    }

    String result = text;
    for (Map.Entry<String, String> entry : nomenclatureMap.entrySet()) {
      if (result.contains(entry.getKey())) {
        result = result.replace(entry.getKey(), entry.getValue());
      }
    }
    return result;
  }

  private List<ALMWidgetConfig> getAvailableWidgets(List<ALMWidgetConfig> widgets) {
    return widgets.stream()
        .filter(widget -> "widget".equals(widget.getType()))
        .collect(Collectors.toList());
  }
}
