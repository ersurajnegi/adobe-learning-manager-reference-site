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

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;

import com.day.cq.wcm.api.Page;
import com.google.gson.JsonObject;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import java.lang.reflect.Field;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith({AemContextExtension.class, MockitoExtension.class})
public class GlobalConfigurationServiceImplTest {

  private final AemContext ctx = new AemContext();

  private static final String SUBSERVICE_NAME = "alm-components-configuration";
  private static final Map<String, Object> SERVICE_PARAMS =
      Collections.singletonMap(ResourceResolverFactory.SUBSERVICE, SUBSERVICE_NAME);

  @Mock private Page currentPage;

  @Mock private ResourceResolverFactory resolverFactory;

  private GlobalConfigurationServiceImpl globalConfigService;

  @BeforeEach
  public void setUp()
      throws LoginException,
          NoSuchFieldException,
          SecurityException,
          IllegalArgumentException,
          IllegalAccessException {
    Map<String, String> pageProperties = new HashMap<>();
    pageProperties.put("cq:conf", "/conf/global/learning/testConfig");
    ctx.create().page("/content/mypage", null, pageProperties);
    ctx.currentResource("/content/mypage");
    ctx.load()
        .json(
            "/files/AdminConfigRsrc.json",
            "/conf/global/learning/testConfig/settings/cloudconfigs/adobe-learning-manager-config");

    lenient()
        .when(resolverFactory.getServiceResourceResolver(SERVICE_PARAMS))
        .thenReturn(ctx.resourceResolver());
    ctx.registerService(
        ResourceResolverFactory.class,
        resolverFactory,
        org.osgi.framework.Constants.SERVICE_RANKING,
        Integer.MAX_VALUE);

    globalConfigService = new GlobalConfigurationServiceImpl();

    Field resourceResolverFactory =
        GlobalConfigurationServiceImpl.class.getDeclaredField("resolverFactory");
    resourceResolverFactory.setAccessible(true);
    resourceResolverFactory.set(globalConfigService, resolverFactory);
  }

  @Test
  public void testGetAdminConfigs() {
    // String expectedConfigs =
    // "{\"testConfig\":\"test1\",\"clientId\":\"clientId\",\"clientSecret\":\"clientSecret\",\"almBaseURL\":\"https://learningmanagerstage1.adobe.com\",\"refreshToken\":\"refreshToken\",\"theme.background\":\"transparent\",\"pageLocale\":\"en_IN\"}";
    JsonObject j = globalConfigService.getAdminConfigs(ctx.currentPage());
    assertTrue("test1".equals(j.get("testConfig").getAsString()));
    assertTrue("clientId".equals(j.get("clientId").getAsString()));
    assertTrue("clientSecret".equals(j.get("clientSecret").getAsString()));
    assertTrue("transparent".equals(j.get("theme.background").getAsString()));
  }
}
