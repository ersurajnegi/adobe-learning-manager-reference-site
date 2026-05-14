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

import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.osgi.services.HttpClientBuilderFactory;

public class HttpClientBuilderFactoryMock implements HttpClientBuilderFactory {

  @Override
  public HttpClientBuilder newBuilder() {
    return new MockHttpClientBuilder();
  }

  private class MockHttpClientBuilder extends HttpClientBuilder {
    @Override
    public CloseableHttpClient build() {
      return HttpClients.createDefault();
    }
  }
}
