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

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

public class ALMWidgetConfigTest {

  @Test
  public void testOptionsImmutability() {
    ALMWidgetConfig config = new ALMWidgetConfig();

    // Set options with a mutable list
    List<ALMWidgetOptions> options = new ArrayList<>();
    ALMWidgetOptions opt = new ALMWidgetOptions();
    opt.setName("testOption");
    opt.setType("string");
    options.add(opt);
    config.setOptions(options);

    // getOptions returns correct data
    assertEquals(1, config.getOptions().size());
    assertEquals("testOption", config.getOptions().get(0).getName());

    // getOptions returns unmodifiable list
    assertThrows(
        UnsupportedOperationException.class, () -> config.getOptions().add(new ALMWidgetOptions()));

    // allowedAccountTypes returns null when unset (no defensive wrapping)
    assertNull(config.getAllowedAccountTypes());
  }
}
