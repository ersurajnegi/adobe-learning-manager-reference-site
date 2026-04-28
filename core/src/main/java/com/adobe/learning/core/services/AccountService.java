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

import com.adobe.learning.core.entity.AccountResponse;
import com.day.cq.wcm.api.Page;
import java.util.Map;

/** Service interface for fetching ALM account details. */
public interface AccountService {

  /**
   * Fetches account details from ALM API.
   *
   * @param currentPage The current AEM page used to retrieve configuration
   * @return AccountResponse containing account details including terminologies, or null if an error
   *     occurs
   */
  AccountResponse getAccountDetails(Page currentPage);

  /**
   * Fetches account details from ALM API using provided credentials.
   *
   * @param almURL The ALM base URL
   * @param accessToken The OAuth access token
   * @return AccountResponse containing account details including terminologies, or null if an error
   *     occurs
   */
  AccountResponse getAccountDetails(String almURL, String accessToken);

  /**
   * Builds a nomenclature map from the account response. The map contains keys in the format
   * "nomenclature.&lt;entityType&gt;.singular" and "nomenclature.&lt;entityType&gt;.plural" with
   * corresponding name values.
   *
   * <p>Locale priority for selecting values:
   *
   * <ol>
   *   <li>Account locale (if present and terminology exists for that locale)
   *   <li>en-US locale (fallback)
   *   <li>First matching entity type (if neither account locale nor en-US is found)
   * </ol>
   *
   * @param accountResponse The account response containing terminologies
   * @return Map with nomenclature keys and corresponding name values, or empty map if
   *     accountResponse is null
   */
  Map<String, String> buildNomenclatureMap(AccountResponse accountResponse);
}
