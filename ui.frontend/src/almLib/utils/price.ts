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
import { PrimeAccount } from '../models';
import { ADOBE_COMMERCE } from './constants';
import { getALMConfig } from './global';

const currency = 'USD';
const locale = 'en-US';

const fraction = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatter = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: currency,
  minimumFractionDigits: 2,
});

export const getFormattedPrice = (price: number) => {
  return price % 1 === 0 ? fraction.format(price) : formatter.format(price);
};

export const isCommerceEnabled = () => {
  return getALMConfig().usageType === ADOBE_COMMERCE;
};
export const canShowPriceFilter = (account: PrimeAccount) => {
  return isCommerceEnabled() || account.enableECommerce;
};
