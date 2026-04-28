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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;

import com.adobe.granite.ui.components.ds.DataSource;
import com.adobe.granite.ui.components.ds.SimpleDataSource;
import com.adobe.learning.core.entity.ALMWidgetConfig;
import com.adobe.learning.core.entity.ALMWidgetOptions;
import com.adobe.learning.core.services.ALMWidgetConfigService;
import com.adobe.learning.core.services.AccountService;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith({AemContextExtension.class, MockitoExtension.class})
public class ALMWidgetSelectDatasourceTest {

  private final AemContext ctx = new AemContext();

  private ALMWidgetSelectDatasource dsServlet;

  @Mock private AccountService accountService;

  @Mock private ALMWidgetConfigService widgetConfigService;

  @BeforeEach
  public void setUp() throws Exception {
    dsServlet = new ALMWidgetSelectDatasource();

    Field accountServiceField = ALMWidgetSelectDatasource.class.getDeclaredField("accountService");
    accountServiceField.setAccessible(true);
    accountServiceField.set(dsServlet, accountService);

    Field widgetConfigServiceField =
        ALMWidgetSelectDatasource.class.getDeclaredField("widgetConfigService");
    widgetConfigServiceField.setAccessible(true);
    widgetConfigServiceField.set(dsServlet, widgetConfigService);

    // Build widget configs matching testReactWidgetsConfig.json
    ALMWidgetOptions titleOption = new ALMWidgetOptions();
    titleOption.setName("Title");
    titleOption.setRef("widgetConfig.attributes.title");
    titleOption.setType("string");
    titleOption.setDefaultValue("My Learning");

    ALMWidgetConfig myLearning = new ALMWidgetConfig();
    myLearning.setName("My Learning Widget");
    myLearning.setRef("com.adobe.learning.mylearning");
    myLearning.setType("widget");
    myLearning.setOptions(Collections.singletonList(titleOption));

    ALMWidgetConfig catalog = new ALMWidgetConfig();
    catalog.setName("Catalog Widget");
    catalog.setRef("com.adobe.learning.catalog");
    catalog.setType("widget");
    catalog.setOptions(Collections.emptyList());

    ALMWidgetConfig commonConfig = new ALMWidgetConfig();
    commonConfig.setName("Common Config");
    commonConfig.setRef("com.adobe.learning.commonConfig");
    commonConfig.setType("acapConfig");
    commonConfig.setOptions(Collections.emptyList());

    lenient()
        .when(widgetConfigService.getWidgetConfigs())
        .thenReturn(Arrays.asList(myLearning, catalog, commonConfig));

    // Create a page and set it as current resource
    ctx.create().page("/content/mypage");
    ctx.currentResource("/content/mypage");

    // Load JCR content at the suffix path (separate from page)
    ctx.load().json("/files/almWidgetDatasourceRsrc.json", "/widget/page");
  }

  @Test
  public void testDoGet_NullSuffix() {
    // No suffix → empty DataSource
    dsServlet.doGet(ctx.request(), ctx.response());

    SimpleDataSource sds =
        (SimpleDataSource) ctx.request().getAttribute(DataSource.class.getName());
    assertNotNull(sds);
    assertFalse(sds.iterator().hasNext());
  }

  @Test
  public void testDoGet_AllWidgets() {
    ctx.requestPathInfo().setSuffix("/widget/page/jcr:content");

    dsServlet.doGet(ctx.request(), ctx.response());

    SimpleDataSource sds =
        (SimpleDataSource) ctx.request().getAttribute(DataSource.class.getName());
    assertNotNull(sds);

    // Collect select options
    List<String> values = new ArrayList<>();
    List<String> texts = new ArrayList<>();
    Iterator<Resource> rsrcs = sds.iterator();
    while (rsrcs.hasNext()) {
      Resource rsc = rsrcs.next();
      ValueMap map = rsc.getValueMap();
      if (map.get("value") != null) {
        values.add(map.get("value").toString());
      }
      if (map.get("text") != null) {
        texts.add(map.get("text").toString());
      }
    }

    // Should contain only "widget" type entries (2 of the 3 in testReactWidgetsConfig.json)
    assertEquals(2, values.size());
    assertTrue(values.contains("com.adobe.learning.mylearning"));
    assertTrue(values.contains("com.adobe.learning.catalog"));
    assertTrue(texts.contains("My Learning Widget"));
    assertTrue(texts.contains("Catalog Widget"));
  }

  @Test
  public void testDoGet_ResourceNull() {
    // Suffix points to non-existent resource → empty DataSource
    ctx.requestPathInfo().setSuffix("/content/nonexistent/path");

    dsServlet.doGet(ctx.request(), ctx.response());

    SimpleDataSource sds =
        (SimpleDataSource) ctx.request().getAttribute(DataSource.class.getName());
    assertNotNull(sds);
    assertFalse(sds.iterator().hasNext());
  }
}
