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

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith({AemContextExtension.class, MockitoExtension.class})
public class AlmAdminRefreshTokenLoginServletTest {
  private final AemContext ctx = new AemContext();

  private AlmAdminRefreshTokenLoginServlet adminRefreshTokenLoginServlet;

  @BeforeEach
  public void setUp()
      throws IllegalArgumentException,
          IllegalAccessException,
          NoSuchFieldException,
          SecurityException {
    adminRefreshTokenLoginServlet = new AlmAdminRefreshTokenLoginServlet();
    ctx.create().page("/content/mypage");
    ctx.create().page("/content/mypage/widgetSelect");
    ctx.currentResource("/content/mypage");
    ctx.load().json("/files/AdminConfigRsrc.json", "/widget/page");
  }

  @Test
  public void testDoPostPublishMode()
      throws IllegalArgumentException,
          IllegalAccessException,
          NoSuchFieldException,
          SecurityException {
    ctx.request().addRequestParameter("pagePath", "/content/mypage");
    ctx.request().addRequestParameter("code", "xxxxx");
    adminRefreshTokenLoginServlet.doPost(ctx.request(), ctx.response());
    JsonObject jsonObject =
        JsonParser.parseString(ctx.response().getOutputAsString()).getAsJsonObject();
    assertTrue(jsonObject.get("isALMLoginImplementation").getAsBoolean());
  }
}
