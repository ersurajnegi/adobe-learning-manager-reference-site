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

package com.adobe.learning.core.models;

import com.adobe.learning.core.entity.ALMWidgetConfig;
import com.adobe.learning.core.entity.ALMWidgetOptions;
import com.adobe.learning.core.services.ALMWidgetConfigService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;
import org.apache.sling.models.annotations.injectorspecific.Self;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Model(adaptables = {SlingHttpServletRequest.class, Resource.class})
public class ALMWidgetModel {

  @ScriptVariable private com.day.cq.wcm.api.Page currentPage;

  @Self private SlingHttpServletRequest request;

  @OSGiService private ALMWidgetConfigService widgetConfigService;

  private static final Logger LOGGER = LoggerFactory.getLogger(ALMWidgetModel.class);

  private Resource resource;
  private String selectedWidgetRef = "";
  private String selectedRef = "";
  private String widgetConfigs = "";
  private String widgetId = "";
  private ValueMap properties;

  public ALMWidgetModel(final SlingHttpServletRequest request) {}

  @PostConstruct
  public void init() {
    resource = request.getResource();
    properties = resource.getValueMap();

    LOGGER.debug("ALMWidgetModel Init:: currentPage {}", currentPage.getPath());
    ValueMap map = resource.getValueMap();

    // Generate or retrieve widget ID
    widgetId = generateWidgetId();

    if (map != null) {
      List<ALMWidgetConfig> widgets = widgetConfigService.getWidgetConfigs();
      LOGGER.trace("ALMWidgetModel Init:: Widgets from JSON {}", new Gson().toJson(widgets));
      List<ALMWidgetConfig> availableWidgetsList = getAvailableWidgets(widgets);

      selectedWidgetRef =
          map.get("widgetRefSelected") != null ? map.get("widgetRefSelected").toString() : null;

      // If no widget is selected, automatically select the first available widget (Catalog)
      if (selectedWidgetRef == null && !availableWidgetsList.isEmpty()) {
        selectedWidgetRef = availableWidgetsList.get(0).getRef();
        LOGGER.debug("ALMWidgetModel Init:: Auto-selecting default widget: {}", selectedWidgetRef);
      }

      Optional<ALMWidgetConfig> opSelectedWidgetConfig =
          availableWidgetsList.stream()
              .filter(widget -> widget.getRef().equals(selectedWidgetRef))
              .findFirst();
      ALMWidgetConfig selectedWidgetConfig;
      if (opSelectedWidgetConfig.isPresent()) {
        selectedWidgetConfig = opSelectedWidgetConfig.get();
      } else if (!availableWidgetsList.isEmpty()) {
        selectedWidgetConfig = availableWidgetsList.get(0);
      } else {
        selectedWidgetConfig = null;
      }

      if (selectedWidgetConfig != null) {
        selectedRef = selectedWidgetConfig.getRef();
        this.widgetConfigs = getWidgetConfig(map, selectedWidgetRef, selectedWidgetConfig);
      }
    }
  }

  private String getWidgetConfig(
      Map<String, Object> valueMap,
      String selectedWidgetRef,
      ALMWidgetConfig selectedWidgetConfig) {
    Gson gson = new GsonBuilder().disableHtmlEscaping().create();
    Map<String, Object> params = new HashMap<>();

    // Process only the options for the selected widget
    if (selectedWidgetConfig != null && selectedWidgetConfig.getOptions() != null) {
      for (ALMWidgetOptions option : selectedWidgetConfig.getOptions()) {
        String fullRef = option.getRef();
        String key = flattenPropertyName(fullRef);

        // Check if user has set a value for this option
        Object userValue = valueMap.get(fullRef);
        LOGGER.debug(
            "ALMWidgetModel - Option: {}, UserValue: {}, Type: {}",
            fullRef,
            userValue,
            userValue != null ? userValue.getClass().getName() : "null");

        if (userValue != null) {
          // User has set a value - use it
          if ("boolean".equalsIgnoreCase(option.getType())) {
            // For checkboxes: convert to boolean properly
            boolean boolValue = false;
            if (userValue instanceof Boolean) {
              boolValue = (Boolean) userValue;
            } else if (userValue instanceof String) {
              String strValue = userValue.toString();
              // Remove {Boolean} prefix if present (AEM adds this)
              if (strValue.startsWith("{Boolean}")) {
                strValue = strValue.substring(9); // Remove "{Boolean}"
              }
              boolValue = Boolean.parseBoolean(strValue);
            }
            params.put(key, boolValue);
            LOGGER.debug("ALMWidgetModel - Converted {} to boolean: {}", userValue, boolValue);
          } else if (userValue instanceof String) {
            String strValue = userValue.toString();
            if ("number".equalsIgnoreCase(option.getType())) {
              try {
                params.put(key, Integer.parseInt(strValue));
              } catch (NumberFormatException e) {
                params.put(key, strValue);
              }
            } else {
              params.put(key, strValue);
            }
          } else if (userValue instanceof Integer) {
            params.put(key, (Integer) userValue);
          } else if (userValue instanceof Boolean) {
            params.put(key, (Boolean) userValue);
          } else {
            params.put(key, gson.toJson(userValue));
          }
        } else {
          // User has not set a value - use default if available
          if ("boolean".equalsIgnoreCase(option.getType())) {
            // For unchecked checkboxes, the property won't exist in valueMap
            // So this means it's unchecked = false
            params.put(key, false);
          } else if (option.getDefaultValue() != null && !option.getDefaultValue().isEmpty()) {
            Object defaultValue = parseDefaultValue(option.getDefaultValue(), option.getType());
            params.put(key, defaultValue);
          }
        }
      }
    }

    // Create the final widget configuration structure
    Map<String, Object> widgetConfig = new HashMap<>();
    widgetConfig.put("widgetId", widgetId);
    widgetConfig.put("widgetRef", selectedWidgetRef);
    widgetConfig.put("params", params);

    return gson.toJson(widgetConfig);
  }

  /**
   * Generate a unique 6-digit widget ID based on the resource path. This ensures the ID is
   * deterministic (same component = same ID) and survives edits, while being unique across
   * different widget instances.
   */
  private String generateWidgetId() {
    // Try to get stored widgetId from properties first
    String storedId = properties.get("widgetId", String.class);
    if (storedId != null && !storedId.isEmpty()) {
      return storedId;
    }

    // Generate ID from resource path for deterministic uniqueness
    String path = resource.getPath();

    // Use hash of the full path to ensure uniqueness
    int hash = Math.abs(path.hashCode());

    // Format as 6-digit number
    String id = String.format("%06d", hash % 1000000);

    LOGGER.debug("Generated widget ID: {} for path: {}", id, path);
    return "alm-widget-" + id;
  }

  private Object parseDefaultValue(String defaultValue, String type) {
    if (type == null) return defaultValue;

    switch (type.toLowerCase()) {
      case "boolean":
        return Boolean.parseBoolean(defaultValue);
      case "number":
      case "integer":
        try {
          return Integer.parseInt(defaultValue);
        } catch (NumberFormatException e) {
          return defaultValue;
        }
      default:
        return defaultValue;
    }
  }

  private String flattenPropertyName(String propertyRef) {
    if (propertyRef == null) return "";

    // Extract the last part after the last dot
    // e.g., "widgetConfig.attributes.showFilters" -> "showFilters"
    int lastDotIndex = propertyRef.lastIndexOf('.');
    if (lastDotIndex != -1 && lastDotIndex < propertyRef.length() - 1) {
      return propertyRef.substring(lastDotIndex + 1);
    }

    return propertyRef;
  }

  public String getWidgetConfigs() {
    return widgetConfigs;
  }

  public String getProperties() {
    return new Gson().toJson(properties);
  }

  public String getSelectedRef() {
    return selectedRef;
  }

  public String getWidgetRef() {
    return selectedWidgetRef;
  }

  public boolean hasWidgetConfig() {
    return selectedWidgetRef != null && !selectedWidgetRef.isEmpty();
  }

  private List<ALMWidgetConfig> getAvailableWidgets(List<ALMWidgetConfig> widgets) {
    return widgets.stream()
        .filter(widget -> "widget".equals(widget.getType()))
        .collect(Collectors.toList());
  }
}
