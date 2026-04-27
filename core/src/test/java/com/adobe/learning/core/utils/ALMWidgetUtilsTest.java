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

import static org.junit.jupiter.api.Assertions.*;

import com.adobe.learning.core.entity.ALMWidgetConfig;
import com.google.gson.JsonObject;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.sling.testing.mock.sling.ResourceResolverType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(AemContextExtension.class)
public class ALMWidgetUtilsTest {

  private final AemContext ctx = new AemContext(ResourceResolverType.JCR_MOCK);

  // --- getWidgetConfig tests ---

  @Test
  public void testGetWidgetConfig_NestedKeys() {
    Map<String, Object> configMap = new LinkedHashMap<>();
    // Single-level key → flat
    configMap.put("name", "testWidget");
    // Two-level key → nested
    configMap.put("theme.primaryColor", "red");
    // Three-level key → deep nested
    configMap.put("widgetConfig.attributes.numRows", "3");
    // Shared parent keys → merge under same object
    configMap.put("theme.secondaryColor", "blue");

    JsonObject result = ALMWidgetUtils.getWidgetConfig(configMap);

    assertEquals("testWidget", result.get("name").getAsString());
    assertTrue(result.has("theme"));
    assertEquals("red", result.getAsJsonObject("theme").get("primaryColor").getAsString());
    assertEquals("blue", result.getAsJsonObject("theme").get("secondaryColor").getAsString());
    assertTrue(result.has("widgetConfig"));
    assertEquals(
        "3",
        result
            .getAsJsonObject("widgetConfig")
            .getAsJsonObject("attributes")
            .get("numRows")
            .getAsString());
  }

  @Test
  public void testGetWidgetConfig_TypeHandling() {
    // Boolean value → JSON boolean, not string
    Map<String, Object> boolMap = new HashMap<>();
    boolMap.put("isEnabled", Boolean.TRUE);
    JsonObject boolResult = ALMWidgetUtils.getWidgetConfig(boolMap);
    assertTrue(boolResult.get("isEnabled").getAsBoolean());
    assertTrue(boolResult.get("isEnabled").isJsonPrimitive());

    // String value → JSON string
    Map<String, Object> strMap = new HashMap<>();
    strMap.put("title", "Hello");
    JsonObject strResult = ALMWidgetUtils.getWidgetConfig(strMap);
    assertEquals("Hello", strResult.get("title").getAsString());

    // Empty map → empty JsonObject
    JsonObject emptyResult = ALMWidgetUtils.getWidgetConfig(new HashMap<>());
    assertEquals(0, emptyResult.size());
  }

  // --- getALMWidgetsConfig tests ---

  @Test
  public void testGetALMWidgetsConfig_MissingResource() {
    // No resource at the expected path → returns empty list
    List<ALMWidgetConfig> result = ALMWidgetUtils.getALMWidgetsConfig(ctx.resourceResolver());
    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  @Test
  public void testGetALMWidgetsConfig_ValidResource() {
    // Load test JSON as a binary file at the expected path
    ctx.load()
        .binaryFile(
            "/files/testReactWidgetsConfig.json", "/apps/learning/react-widgets-config.json");

    List<ALMWidgetConfig> result = ALMWidgetUtils.getALMWidgetsConfig(ctx.resourceResolver());

    assertNotNull(result);
    assertEquals(3, result.size());

    // First widget
    assertEquals("My Learning Widget", result.get(0).getName());
    assertEquals("com.adobe.learning.mylearning", result.get(0).getRef());
    assertEquals("widget", result.get(0).getType());
    assertEquals(1, result.get(0).getOptions().size());
    assertEquals("Title", result.get(0).getOptions().get(0).getName());

    // Second is widget type, third is acapConfig type
    assertEquals("widget", result.get(1).getType());
    assertEquals("acapConfig", result.get(2).getType());
  }
}
