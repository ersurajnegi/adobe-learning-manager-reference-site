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
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrimeCommunityMobileScrollToTop from '@components/Community/PrimeCommunityMobileScrollToTop/PrimeCommunityMobileScrollToTop';

jest.mock('@spectrum-icons/workflow/ChevronUp', () => ({
  __esModule: true,
  default: () => <svg data-testid="chevron-up-icon" />,
}));

describe('PrimeCommunityMobileScrollToTop', () => {
  let scrollToSpy: jest.SpyInstance;

  beforeEach(() => {
    scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    scrollToSpy.mockRestore();
  });

  it('calls window.scrollTo(0, 0) when the button is clicked', () => {
    render(<PrimeCommunityMobileScrollToTop />);
    userEvent.click(screen.getByRole('button'));
    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
  });
});
