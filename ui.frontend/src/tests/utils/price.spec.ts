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
jest.mock('@almLib/utils/global', () => ({
  getALMConfig: jest.fn(),
}));
jest.mock('@almLib/utils/constants', () => ({
  ADOBE_COMMERCE: 'aem-commerce',
}));

import { getFormattedPrice, isCommerceEnabled, canShowPriceFilter } from '@almLib/utils/price';
import { getALMConfig } from '@almLib/utils/global';

describe('price', () => {
  beforeEach(() => {
    (getALMConfig as jest.Mock).mockClear();
    (getALMConfig as jest.Mock).mockReturnValue({ usageType: 'aem-commerce' });
  });

  it('getFormattedPrice', () => {
    expect(getFormattedPrice(100)).toBe('$100');
    expect(getFormattedPrice(99.99)).toBe('$99.99');
    expect(getFormattedPrice(0)).toBe('$0');
  });

  it('isCommerceEnabled', () => {
    expect(isCommerceEnabled()).toBe(true);

    (getALMConfig as jest.Mock).mockReturnValue({ usageType: 'other' });
    expect(isCommerceEnabled()).toBe(false);
  });

  it('canShowPriceFilter', () => {
    (getALMConfig as jest.Mock).mockReturnValue({ usageType: 'aem-commerce' });
    expect(canShowPriceFilter({} as any)).toBe(true);

    (getALMConfig as jest.Mock).mockReturnValue({ usageType: 'other' });
    expect(canShowPriceFilter({ enableECommerce: true } as any)).toBe(true);
    expect(canShowPriceFilter({ enableECommerce: false } as any)).toBe(false);
  });
});
