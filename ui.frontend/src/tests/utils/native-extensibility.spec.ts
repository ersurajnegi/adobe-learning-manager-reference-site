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
  getWindowObject: () => ({}),
}));

import {
  openLink,
  openExtensionInNewTab,
  openExtensionInSameTab,
  getExtensionAppUrl,
  removeExtraQPFromExtension,
  getParsedJwt,
  getExtensionWithinvocationType,
  getExtensionWithId,
  getExtension,
  isExtensionAllowedForLO,
} from '@almLib/utils/native-extensibility';

describe('native-extensibility', () => {
  beforeEach(() => {
    global.open = jest.fn();
  });

  describe('openLink', () => {
    it('openLink_blankTarget_callsWindowOpenWithCorrectUrlAndTarget', () => {
      openLink('https://example.com', '_blank');
      expect(global.open).toHaveBeenCalledWith('https://example.com', '_blank');
    });

    it('openLink_topTarget_callsWindowOpenWithTopTarget', () => {
      openLink('https://example.com/page', '_top');
      expect(global.open).toHaveBeenCalledWith('https://example.com/page', '_top');
    });
  });

  describe('getExtensionAppUrl', () => {
    it('getExtensionAppUrl_withParams_appendsAllQueryParams', () => {
      const result = getExtensionAppUrl('https://example.com', { token: 'abc', user: '123' });
      expect(result.searchParams.get('token')).toBe('abc');
      expect(result.searchParams.get('user')).toBe('123');
    });

    it('getExtensionAppUrl_withoutParams_returnsUrlWithNoQueryString', () => {
      const result = getExtensionAppUrl('https://example.com');
      expect(result.href).toBe('https://example.com/');
      expect(result.searchParams.toString()).toBe('');
    });
  });

  describe('openExtensionInNewTab', () => {
    it('openExtensionInNewTab_withParams_opensUrlWithParamsInBlankTarget', () => {
      openExtensionInNewTab('https://example.com', { key: 'val' });
      expect(global.open).toHaveBeenCalledWith('https://example.com/?key=val', '_blank');
    });

    it('openExtensionInNewTab_withoutParams_opensBaseUrlInBlankTarget', () => {
      openExtensionInNewTab('https://example.com');
      expect(global.open).toHaveBeenCalledWith('https://example.com/', '_blank');
    });
  });

  describe('openExtensionInSameTab', () => {
    it('openExtensionInSameTab_withParams_opensUrlWithParamsInTopTarget', () => {
      openExtensionInSameTab('https://example.com', { ref: 'home' });
      expect(global.open).toHaveBeenCalledWith('https://example.com/?ref=home', '_top');
    });

    it('openExtensionInSameTab_withoutParams_opensBaseUrlInTopTarget', () => {
      openExtensionInSameTab('https://example.com');
      expect(global.open).toHaveBeenCalledWith('https://example.com/', '_top');
    });
  });

  describe('removeExtraQPFromExtension', () => {
    it('removeExtraQPFromExtension_urlHasExtToken_removesItAndPreservesOtherParams', () => {
      window.history.pushState({}, '', '?extToken=secret&page=catalog');
      let capturedUrl = '';
      jest.spyOn(window.history, 'replaceState').mockImplementation((_state, _title, url) => {
        capturedUrl = url as string;
      });

      removeExtraQPFromExtension();

      expect(capturedUrl).not.toContain('extToken');
      expect(capturedUrl).toContain('page=catalog');
    });

    it('removeExtraQPFromExtension_urlHasNoExtToken_callsReplaceStateUnchanged', () => {
      window.history.pushState({}, '', '?page=catalog&tab=all');
      let capturedUrl = '';
      jest.spyOn(window.history, 'replaceState').mockImplementation((_state, _title, url) => {
        capturedUrl = url as string;
      });

      removeExtraQPFromExtension();

      expect(capturedUrl).toContain('page=catalog');
      expect(capturedUrl).toContain('tab=all');
    });
  });

  describe('getParsedJwt', () => {
    it('getParsedJwt_validToken_returnsDecodedPayload', () => {
      const payload = { sub: 'user-1', iat: 1234, role: 'learner' };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      const result = getParsedJwt(token);
      expect(result.sub).toBe('user-1');
      expect(result.iat).toBe(1234);
      expect(result.role).toBe('learner');
    });

    it('getParsedJwt_invalidToken_returnsUndefined', () => {
      expect(getParsedJwt('noPeriods')).toBeUndefined();
    });

    it('getParsedJwt_tokenWithInvalidBase64_returnsUndefined', () => {
      expect(getParsedJwt('header.!!!invalid-base64!!.sig')).toBeUndefined();
    });
  });

  describe('getExtensionWithinvocationType', () => {
    const extensions = [
      { id: 'e1', invocationType: 'LEARNER_ENROLL', defaultScope: 'ALL' },
      { id: 'e2', invocationType: 'LEARNER_OVERVIEW', defaultScope: 'SELECTED' },
    ] as any;

    it('getExtensionWithinvocationType_matchingTypeAndScope_returnsExtension', () => {
      const result = getExtensionWithinvocationType(extensions, 'LEARNER_ENROLL', 'ALL');
      expect(result?.id).toBe('e1');
    });

    it('getExtensionWithinvocationType_emptyExtensions_returnsUndefined', () => {
      expect(getExtensionWithinvocationType([], 'LEARNER_ENROLL')).toBeUndefined();
    });

    it('getExtensionWithinvocationType_nonMatchingType_returnsUndefined', () => {
      expect(getExtensionWithinvocationType(extensions, 'ADMIN_MENU', 'ALL')).toBeUndefined();
    });
  });

  describe('getExtensionWithId', () => {
    const extensions = [
      { id: 'e1', invocationType: 'LEARNER_ENROLL' },
      { id: 'e2', invocationType: 'LEARNER_OVERVIEW' },
    ] as any;

    it('getExtensionWithId_matchingInvocationType_returnsExtension', () => {
      const result = getExtensionWithId(extensions, 'LEARNER_ENROLL');
      expect(result?.id).toBe('e1');
    });

    it('getExtensionWithId_noMatch_returnsUndefined', () => {
      expect(getExtensionWithId(extensions, 'UNKNOWN_TYPE')).toBeUndefined();
    });

    it('getExtensionWithId_emptyArray_returnsUndefined', () => {
      expect(getExtensionWithId([], 'LEARNER_ENROLL')).toBeUndefined();
    });
  });

  describe('getExtension', () => {
    const extensions = [
      { id: 'e1', invocationType: 'LEARNER_ENROLL', defaultScope: 'ALL' },
    ] as any;

    it('getExtension_emptyExtensions_returnsUndefined', () => {
      expect(getExtension([], [], 'LEARNER_ENROLL')).toBeUndefined();
    });

    it('getExtension_noOverrides_returnsExtensionByInvocationType', () => {
      const result = getExtension(extensions, [], 'LEARNER_ENROLL');
      expect(result?.id).toBe('e1');
    });

    it('getExtension_enabledOverride_returnsMatchingExtension', () => {
      const result = getExtension(
        extensions,
        [{ id: 'e1', enabled: 'true' }] as any,
        'LEARNER_ENROLL'
      );
      expect(result?.id).toBe('e1');
    });

    it('getExtension_disabledOverride_returnsUndefined', () => {
      const result = getExtension(
        extensions,
        [{ id: 'e1', enabled: 'false' }] as any,
        'LEARNER_ENROLL'
      );
      expect(result).toBeUndefined();
    });

    it('getExtension_overrideForDifferentExtension_fallsBackToDefault', () => {
      const result = getExtension(
        extensions,
        [{ id: 'other-id', enabled: 'true' }] as any,
        'LEARNER_ENROLL'
      );
      expect(result?.id).toBe('e1');
    });
  });

  describe('isExtensionAllowedForLO', () => {
    it('isExtensionAllowedForLO_courseWithSelfEnroll_returnsTrue', () => {
      expect(
        isExtensionAllowedForLO(
          { loType: 'course', enrollmentType: 'Self Enroll' } as any,
          {} as any
        )
      ).toBe(true);
    });

    it('isExtensionAllowedForLO_courseWithAdminEnroll_returnsFalse', () => {
      expect(
        isExtensionAllowedForLO(
          { loType: 'course', enrollmentType: 'Admin Enroll' } as any,
          {} as any
        )
      ).toBe(false);
    });

    it('isExtensionAllowedForLO_certificationWithValidity_returnsFalse', () => {
      expect(
        isExtensionAllowedForLO(
          { loType: 'certification' } as any,
          { validity: '2025-12-31' } as any
        )
      ).toBe(false);
    });

    it('isExtensionAllowedForLO_certificationWithoutValidity_returnsTrue', () => {
      expect(
        isExtensionAllowedForLO({ loType: 'certification' } as any, {} as any)
      ).toBe(true);
    });

    it('isExtensionAllowedForLO_learningProgramWithAdminEnroll_returnsFalse', () => {
      expect(
        isExtensionAllowedForLO(
          { loType: 'learningProgram', enrollmentType: 'Admin Enroll' } as any,
          {} as any
        )
      ).toBe(false);
    });

    it('isExtensionAllowedForLO_learningProgramWithSelfEnroll_returnsTrue', () => {
      expect(
        isExtensionAllowedForLO(
          { loType: 'learningProgram', enrollmentType: 'Self Enroll' } as any,
          {} as any
        )
      ).toBe(true);
    });

    it('isExtensionAllowedForLO_jobAid_returnsTrue', () => {
      expect(
        isExtensionAllowedForLO({ loType: 'jobAid' } as any, {} as any)
      ).toBe(true);
    });
  });
});
