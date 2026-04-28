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
jest.mock('@almLib/utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

import { getAlmConfirmationBadwordParams } from '@almLib/utils/social-utils';
import { GetTranslation } from '@almLib/utils/translationService';

describe('social-utils', () => {
  beforeEach(() => {
    (GetTranslation as jest.Mock).mockClear();
    (GetTranslation as jest.Mock).mockImplementation((key: string) => key);
  });

  it('getAlmConfirmationBadwordParams', () => {
    const result = getAlmConfirmationBadwordParams('post');
    expect(result.title).toBe('alm.community.postNotPublished.label');
    expect(result.body).toBe('alm.community.postNotPublished.badWordFound');
    expect(result.actionlabel).toBe('text.close');
  });
});
