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
import { SendMessageToParent } from '../../../utils/widgets/base/EventHandlingBase';
import { GetPrimeEmitEventLinks } from '../../../utils/global';
import { PrimeEvent } from '../../../utils/widgets/common';
import { GetTranslation } from '../../../utils/translationService';

export const CATALOG_MAIN_CONTENT_WIDGET_REF = 'com.adobe.captivateprime.catalog';

export const sendCatalogSkipLinks = () => {
  const skipLinks: Array<{ elementId: string; label: string; widgetRef: string }> = [
    {
      elementId: CATALOG_MAIN_CONTENT_WIDGET_REF,
      label: GetTranslation('alm.catalog.header', true),
      widgetRef: CATALOG_MAIN_CONTENT_WIDGET_REF,
    },
  ];

  SendMessageToParent(
    { type: PrimeEvent.ALM_SKIP_LINKS, widgets: skipLinks },
    GetPrimeEmitEventLinks()
  );
};
