/**
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { render, screen } from '@testing-library/react';
import ALMLoader from '@components/Common/ALMLoader/ALMLoader';

jest.mock('../../../almLib/assets/images/LoadingButton.gif', () => 'default-loading.gif');

const mockGetALMConfig = jest.fn();
jest.mock('@utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
}));

const mockFormatMessage = jest.fn();
jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: mockFormatMessage }),
}));

describe('ALMLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetALMConfig.mockReturnValue({ customLoaderImage: null });
    mockFormatMessage.mockImplementation(({ defaultMessage }: any) => defaultMessage);
  });

  it('customLoaderImage_provided_usedAsSrc', () => {
    mockGetALMConfig.mockReturnValue({ customLoaderImage: 'https://example.com/custom.gif' });
    render(<ALMLoader />);

    expect((screen.getByRole('img') as HTMLImageElement).src).toBe('https://example.com/custom.gif');
  });

  it('customLoaderImage_absent_usesDefaultImage', () => {
    mockGetALMConfig.mockReturnValue({ customLoaderImage: null });
    render(<ALMLoader />);

    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('default-loading.gif');
  });

  it('customLoaderImage_emptyString_usesDefaultImage', () => {
    mockGetALMConfig.mockReturnValue({ customLoaderImage: '' });
    render(<ALMLoader />);

    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('default-loading.gif');
  });

  it('classes_provided_appendedToSection', () => {
    const { container } = render(<ALMLoader classes="my-custom-class" />);

    expect(container.querySelector('section')?.className).toContain('loadingContainer');
    expect(container.querySelector('section')?.className).toContain('my-custom-class');
  });

  it('altText_usesFormattedMessage', () => {
    mockFormatMessage.mockReturnValue('Chargement');
    render(<ALMLoader />);

    expect(screen.getByRole('img').getAttribute('alt')).toBe('Chargement');
  });
});
