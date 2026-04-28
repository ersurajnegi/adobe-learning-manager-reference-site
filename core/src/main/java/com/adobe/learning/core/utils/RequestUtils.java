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

import org.apache.http.client.config.RequestConfig;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.osgi.services.HttpClientBuilderFactory;

public final class RequestUtils {

  private static final int TIMEOUT = 10000;

  private static final RequestConfig REQUEST_CONFIG =
      RequestConfig.custom()
          .setConnectTimeout(TIMEOUT)
          .setConnectionRequestTimeout(TIMEOUT)
          .setSocketTimeout(TIMEOUT)
          .build();

  private RequestUtils() {}

  public static RequestConfig getRequestConfig() {
    return REQUEST_CONFIG;
  }

  public static CloseableHttpClient getClient(HttpClientBuilderFactory clientBuilderFactory) {
    return clientBuilderFactory.newBuilder().setDefaultRequestConfig(getRequestConfig()).build();
  }
}
