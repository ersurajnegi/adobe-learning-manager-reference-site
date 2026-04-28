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

public class PrlCriteria {

  private Boolean enabled;
  private PrlCriteriaAttributes products;
  private PrlCriteriaAttributes roles;

  public PrlCriteria() {}

  public Boolean getEnabled() {
    return enabled;
  }

  public void setEnabled(Boolean enabled) {
    this.enabled = enabled;
  }

  public PrlCriteriaAttributes getProducts() {
    return products;
  }

  public void setProducts(PrlCriteriaAttributes products) {
    this.products = products;
  }

  public PrlCriteriaAttributes getRoles() {
    return roles;
  }

  public void setRoles(PrlCriteriaAttributes roles) {
    this.roles = roles;
  }
}
