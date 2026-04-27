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

package com.adobe.learning.core.services;

import com.adobe.learning.core.entity.ALMWidgetConfig;
import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(service = ALMWidgetConfigService.class)
public class ALMWidgetConfigServiceImpl implements ALMWidgetConfigService {

  private static final Logger LOGGER = LoggerFactory.getLogger(ALMWidgetConfigServiceImpl.class);

  private static final String CONFIG_RESOURCE = "/react-widgets-config.json";

  private volatile List<ALMWidgetConfig> cachedConfigs;

  @Activate
  protected void activate() {
    cachedConfigs = loadConfigs();
    LOGGER.info("Loaded {} widget configurations from classpath", cachedConfigs.size());
  }

  @Override
  public List<ALMWidgetConfig> getWidgetConfigs() {
    if (cachedConfigs == null || cachedConfigs.isEmpty()) {
      cachedConfigs = loadConfigs();
    }
    return cachedConfigs;
  }

  private List<ALMWidgetConfig> loadConfigs() {
    try (InputStream inputStream = getClass().getResourceAsStream(CONFIG_RESOURCE)) {
      if (inputStream == null) {
        LOGGER.error("Widget configuration file not found on classpath: {}", CONFIG_RESOURCE);
        return Collections.emptyList();
      }

      try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
        StringBuilder jsonString = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
          jsonString.append(line);
        }

        String jsonContent = jsonString.toString().trim();
        if (jsonContent.isEmpty()) {
          LOGGER.error("Widget configuration file is empty: {}", CONFIG_RESOURCE);
          return Collections.emptyList();
        }

        Gson gson = new Gson();
        return Collections.unmodifiableList(
            Arrays.asList(gson.fromJson(jsonContent, ALMWidgetConfig[].class)));
      }
    } catch (Exception e) {
      LOGGER.error("Error loading widget configuration from classpath: {}", CONFIG_RESOURCE, e);
    }
    return Collections.emptyList();
  }
}
