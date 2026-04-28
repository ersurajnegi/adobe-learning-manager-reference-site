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

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;

import com.adobe.granite.ui.components.ds.DataSource;
import com.adobe.granite.ui.components.ds.SimpleDataSource;
import com.adobe.learning.core.services.GlobalConfigurationService;
import com.adobe.learning.core.utils.HttpClientBuilderFactoryMock;
import com.google.gson.JsonObject;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.apache.http.osgi.services.HttpClientBuilderFactory;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith({AemContextExtension.class, MockitoExtension.class})
public class EmbeddableLrngWidgetDatasourceTest {

  private final AemContext ctx = new AemContext();

  private EmbeddableLrngWidgetDatasource dsServlet;

  @Mock private GlobalConfigurationService configService;

  @BeforeEach
  public void setUp() throws Exception {

    HttpClientBuilderFactory clientBuilderFactory = new HttpClientBuilderFactoryMock();
    dsServlet = new EmbeddableLrngWidgetDatasource();

    JsonObject adminConfigs = new JsonObject();
    adminConfigs.addProperty("almBaseURL", "https://learningmanagerstage1.adobe.com");
    adminConfigs.addProperty("theme.background", "transparent");
    lenient().when(configService.getAdminConfigs(isNull())).thenReturn(adminConfigs);

    Field replicatorField = EmbeddableLrngWidgetDatasource.class.getDeclaredField("configService");
    replicatorField.setAccessible(true);
    replicatorField.set(dsServlet, configService);

    Field replicatorField1 =
        EmbeddableLrngWidgetDatasource.class.getDeclaredField("clientBuilderFactory");
    replicatorField1.setAccessible(true);
    replicatorField1.set(dsServlet, clientBuilderFactory);

    ctx.registerService(HttpClientBuilderFactory.class, clientBuilderFactory);

    ctx.registerService(
        GlobalConfigurationService.class,
        configService,
        org.osgi.framework.Constants.SERVICE_RANKING,
        Integer.MAX_VALUE);

    ctx.create().page("/content/mypage");
    ctx.create().page("/content/mypage/widgetSelect");
    ctx.currentResource("/content/mypage");

    ctx.requestPathInfo().setSuffix("/widget/page");
    ctx.load().json("/files/AdminConfigRsrc.json", "/widget/page");
  }

  @Test
  public void testGet() {
    dsServlet.doGet(ctx.request(), ctx.response());
    SimpleDataSource sds =
        (SimpleDataSource) ctx.request().getAttribute(DataSource.class.getName());
    Iterator<Resource> rsrcs = sds.iterator();
    List<String> resourcesNames = new ArrayList<>();
    while (rsrcs.hasNext()) {
      Resource rsc = rsrcs.next();
      ValueMap map = rsc.getValueMap();
      if (map.get("name") != null && !map.get("name").toString().isEmpty()) {
        resourcesNames.add(map.get("name").toString());
      }
    }
    assertTrue(resourcesNames.contains("./widgetConfig.attributes.numRows"));
    assertTrue(resourcesNames.contains("./widgetConfig.attributes.catalogIds"));
  }
}
