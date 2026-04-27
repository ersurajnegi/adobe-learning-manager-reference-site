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

package com.adobe.learning.core.utils;

import com.adobe.learning.core.entity.ALMWidgetConfig;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class ALMWidgetUtils {
  private static Logger LOGGER = LoggerFactory.getLogger(ALMWidgetUtils.class);

  private static final String WIDGET_CONFIG_PATH = "/apps/learning/react-widgets-config.json";

  public static List<ALMWidgetConfig> getALMWidgetsConfig(ResourceResolver resolver) {
    try {
      Resource configResource = resolver.getResource(WIDGET_CONFIG_PATH);
      if (configResource == null) {
        LOGGER.error("Widget configuration file not found at: {}", WIDGET_CONFIG_PATH);
        return Arrays.asList();
      }

      try (InputStream inputStream = configResource.adaptTo(InputStream.class);
          BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {

        StringBuilder jsonString = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
          jsonString.append(line);
        }

        String jsonContent = jsonString.toString().trim();
        if (jsonContent.isEmpty()) {
          LOGGER.error("Widget configuration file is empty: {}", WIDGET_CONFIG_PATH);
          return Arrays.asList();
        }

        Gson gson = new Gson();
        return Arrays.asList(gson.fromJson(jsonContent, ALMWidgetConfig[].class));
      }
    } catch (Exception e) {
      LOGGER.error("Error loading widget configuration from JSON at: {}", WIDGET_CONFIG_PATH, e);
    }

    return Arrays.asList();
  }

  public static JsonObject getWidgetConfig(final Map<String, Object> configMap) {
    JsonObject widgetConfigObject = new JsonObject();

    for (Entry<String, Object> e : configMap.entrySet()) {
      String[] keys = e.getKey().split("\\.");

      if (keys.length == 1) {
        addPropertyWithType(widgetConfigObject, keys[0], e.getValue());

      } else {
        JsonObject parentObject = widgetConfigObject;
        for (int i = 0; i < keys.length; i++) {
          String key = keys[i];
          JsonElement element = parentObject.get(key);
          if (element == null) {
            if (i == keys.length - 1) {
              addPropertyWithType(parentObject, key, e.getValue());

            } else {
              JsonObject jObject = new JsonObject();
              parentObject.add(key, jObject);
              parentObject = parentObject.get(key).getAsJsonObject();
            }
          } else {
            JsonObject obj = element.getAsJsonObject();
            if (i == keys.length - 1) {
              addPropertyWithType(obj, key, e.getValue());

            } else {
              parentObject = obj;
            }
          }
        }
      }
    }

    return widgetConfigObject;
  }

  private static void addPropertyWithType(JsonObject obj, String key, Object value) {
    String objectType = value.getClass().getSimpleName();
    if ("Boolean".equalsIgnoreCase(objectType)) {
      obj.addProperty(key, (Boolean) value);
    } else {
      obj.addProperty(key, value.toString());
    }
  }
}
