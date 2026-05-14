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

import static org.junit.jupiter.api.Assertions.*;

import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.testing.mock.sling.ResourceResolverType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(AemContextExtension.class)
public class ALMWidgetModelTest {

  private final AemContext ctx = new AemContext(ResourceResolverType.JCR_MOCK);

  private ALMWidgetModel model;

  @BeforeEach
  public void setUp() throws Exception {
    ctx.load().json("/files/almWidgetModelTest.json", "/content/alm");
    // Create a model instance using the constructor (without triggering init)
    model = new ALMWidgetModel(ctx.request());
  }

  // --- flattenPropertyName tests ---

  @Test
  public void testFlattenPropertyName() throws Exception {
    Method method = ALMWidgetModel.class.getDeclaredMethod("flattenPropertyName", String.class);
    method.setAccessible(true);

    // Dotted path → last segment
    assertEquals("showFilters", method.invoke(model, "widgetConfig.attributes.showFilters"));
    // Two-level
    assertEquals("primaryColor", method.invoke(model, "theme.primaryColor"));
    // No dot → returns as-is
    assertEquals("noDot", method.invoke(model, "noDot"));
    // Null → empty string
    assertEquals("", method.invoke(model, (String) null));
  }

  // --- parseDefaultValue tests ---

  @Test
  public void testParseDefaultValue() throws Exception {
    Method method =
        ALMWidgetModel.class.getDeclaredMethod("parseDefaultValue", String.class, String.class);
    method.setAccessible(true);

    // Boolean type
    assertEquals(Boolean.TRUE, method.invoke(model, "true", "boolean"));
    assertEquals(Boolean.FALSE, method.invoke(model, "false", "boolean"));

    // Number type - valid integer
    assertEquals(42, method.invoke(model, "42", "number"));
    // Number type - invalid falls back to string
    assertEquals("abc", method.invoke(model, "abc", "number"));

    // Integer type alias
    assertEquals(10, method.invoke(model, "10", "integer"));

    // String type → returns string as-is
    assertEquals("hello", method.invoke(model, "hello", "string"));

    // Null type → returns string as-is
    assertEquals("value", method.invoke(model, "value", (String) null));
  }

  // --- generateWidgetId tests ---

  @Test
  public void testGenerateWidgetId() throws Exception {
    Method method = ALMWidgetModel.class.getDeclaredMethod("generateWidgetId");
    method.setAccessible(true);

    // With stored widgetId → returns stored value
    ctx.currentResource("/content/alm/widgetModelWithId");
    Resource resourceWithId = ctx.currentResource();
    setPrivateField(model, "resource", resourceWithId);
    setPrivateField(model, "properties", resourceWithId.getValueMap());

    String storedResult = (String) method.invoke(model);
    assertEquals("alm-widget-123456", storedResult);

    // Without stored widgetId → generates "alm-widget-NNNNNN" format
    ctx.currentResource("/content/alm/widgetModelNoSelection");
    Resource resourceNoId = ctx.currentResource();
    setPrivateField(model, "resource", resourceNoId);
    setPrivateField(model, "properties", resourceNoId.getValueMap());

    String generatedResult = (String) method.invoke(model);
    assertTrue(generatedResult.startsWith("alm-widget-"));
    // The numeric part should be 6 digits
    String numericPart = generatedResult.substring("alm-widget-".length());
    assertEquals(6, numericPart.length());
    // Should be parseable as integer
    assertDoesNotThrow(() -> Integer.parseInt(numericPart));
  }

  // --- hasWidgetConfig tests ---

  @Test
  public void testHasWidgetConfig() throws Exception {
    // Empty ref → false (default value is "")
    assertFalse(model.hasWidgetConfig());

    // Set ref → true
    setPrivateField(model, "selectedWidgetRef", "com.adobe.learning.mylearning");
    assertTrue(model.hasWidgetConfig());

    // Null ref → false
    setPrivateField(model, "selectedWidgetRef", null);
    assertFalse(model.hasWidgetConfig());
  }

  private void setPrivateField(Object target, String fieldName, Object value) throws Exception {
    Field field = target.getClass().getDeclaredField(fieldName);
    field.setAccessible(true);
    field.set(target, value);
  }
}
