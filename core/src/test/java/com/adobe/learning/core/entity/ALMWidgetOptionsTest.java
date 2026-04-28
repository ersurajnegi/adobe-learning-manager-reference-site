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
package com.adobe.learning.core.entity;

import static org.junit.jupiter.api.Assertions.*;

import com.google.gson.Gson;
import org.junit.jupiter.api.Test;

public class ALMWidgetOptionsTest {

  @Test
  public void testGsonDeserialization() {
    Gson gson = new Gson();

    // @SerializedName("default") maps JSON "default" to getDefaultValue()
    String json =
        "{"
            + "\"name\": \"Show Filters\","
            + "\"ref\": \"widgetConfig.attributes.showFilters\","
            + "\"type\": \"boolean\","
            + "\"default\": \"true\","
            + "\"description\": \"Toggle filter visibility\","
            + "\"mandatory\": true,"
            + "\"hidden\": false,"
            + "\"multiSelect\": true,"
            + "\"emptyText\": \"Select a value\","
            + "\"dataSource\": \"/api/data\","
            + "\"options\": [{\"label\": \"Yes\", \"value\": \"true\"}]"
            + "}";

    ALMWidgetOptions options = gson.fromJson(json, ALMWidgetOptions.class);

    assertEquals("Show Filters", options.getName());
    assertEquals("widgetConfig.attributes.showFilters", options.getRef());
    assertEquals("boolean", options.getType());
    assertEquals("true", options.getDefaultValue());
    assertEquals("Toggle filter visibility", options.getDescription());
    assertTrue(options.getMandatory());
    assertFalse(options.getHidden());
    assertTrue(options.getMultiSelect());
    assertEquals("Select a value", options.getEmptyText());
    assertEquals("/api/data", options.getDataSource());
    assertNotNull(options.getOptions());
    assertEquals(1, options.getOptions().size());
    assertEquals("Yes", options.getOptions().get(0).get("label"));
    assertEquals("true", options.getOptions().get(0).get("value"));
  }
}
