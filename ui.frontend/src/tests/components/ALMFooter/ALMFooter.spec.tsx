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
import { render, screen, fireEvent } from '@testing-library/react';
import ALMFooter from '@components/Footer/ALMFooter';

jest.mock('react-intl', () => ({
  useIntl: () => ({ locale: 'en-US' }),
}));

jest.mock('@utils/global', () => ({
  isUrl: (str: string) => str.startsWith('http://') || str.startsWith('https://'),
}));

jest.mock('@utils/translationService', () => ({
  getPreferredLocalizedMetadata: (data: any) => data,
}));

const mockOpenLink = jest.fn();
const mockOpenExtensionInNewTab = jest.fn();
const mockOpenExtensionInSameTab = jest.fn();

jest.mock('@utils/native-extensibility', () => ({
  EXTENSION_LAUNCH_TYPE: { IN_APP: 'IN_APP', SAME_TAB: 'SAME_TAB', NEW_TAB: 'NEW_TAB' },
  InvocationType: { LEARNER_FOOTER: 'LEARNER_FOOTER' },
  openExtensionInNewTab: (url: string) => mockOpenExtensionInNewTab(url),
  openExtensionInSameTab: (url: string) => mockOpenExtensionInSameTab(url),
  openLink: (link: string, target: string) => mockOpenLink(link, target),
}));

jest.mock('@components/Common/ALMExtensionIframeDialog', () => ({
  ALMExtensionIframeDialog: ({ onClose }: any) => (
    <div data-testid="extension-iframe-dialog">
      <button onClick={onClose}>Close Dialog</button>
    </div>
  ),
}));

const mockUseFooter = jest.fn();
jest.mock('@hooks/footer', () => ({
  useFooter: (config: any) => mockUseFooter(config),
}));

jest.mock('@utils/widgets/utils', () => ({
  injectCss: jest.fn(),
}));

jest.mock('dompurify', () => ({
  default: { sanitize: (html: string) => html },
}));

describe('ALMFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFooter.mockReturnValue({ isFooterStylingEnabled: false, html: '' });
  });

  it('customStyling_enabled_rendersCustomHtmlContainer', () => {
    mockUseFooter.mockReturnValue({ isFooterStylingEnabled: true, html: '<p>Custom</p>' });
    const { container } = render(<ALMFooter />);

    expect(container.querySelector('#custom-footer-injections')).not.toBeNull();
    expect(container.querySelector('.footerMenu')).toBeNull();
  });

  it('customStyling_disabled_rendersDefaultFooter', () => {
    const { container } = render(<ALMFooter />);

    expect(container.querySelector('.footerMenu')).not.toBeNull();
    expect(container.querySelector('#custom-footer-injections')).toBeNull();
  });

  it('footerConfig_passedToUseFooter', () => {
    const config = { theme: 'dark' };
    render(<ALMFooter footerConfig={config} />);

    expect(mockUseFooter).toHaveBeenCalledWith(config);
  });

  it('links_provided_rendersLinkNames', () => {
    const learnerHelpLinks = [
      { localizedHelpLink: { name: 'Help', link: 'https://help.com' } },
      { localizedHelpLink: { name: 'Support', link: 'https://support.com' } },
    ];
    render(<ALMFooter learnerHelpLinks={learnerHelpLinks} />);

    expect(screen.getByText('Help')).not.toBeNull();
    expect(screen.getByText('Support')).not.toBeNull();
  });

  it('linkClick_urlLink_callsOpenLinkWithUrl', () => {
    const learnerHelpLinks = [{ localizedHelpLink: { name: 'Help', link: 'https://help.com' } }];
    render(<ALMFooter learnerHelpLinks={learnerHelpLinks} />);

    fireEvent.click(screen.getByText('Help'));

    expect(mockOpenLink).toHaveBeenCalledWith('https://help.com', '_blank');
  });

  it('linkClick_nonUrlLink_prependsMailto', () => {
    const learnerHelpLinks = [{ localizedHelpLink: { name: 'Contact', link: 'support@example.com' } }];
    render(<ALMFooter learnerHelpLinks={learnerHelpLinks} />);

    fireEvent.click(screen.getByText('Contact'));

    expect(mockOpenLink).toHaveBeenCalledWith('mailto:support@example.com', '_blank');
  });

  it('disableLinks_true_appliesDisabledClassAndAttribute', () => {
    const learnerHelpLinks = [{ localizedHelpLink: { name: 'Help', link: 'https://help.com' } }];
    const { container } = render(<ALMFooter learnerHelpLinks={learnerHelpLinks} disableLinks={true} />);

    const button = container.querySelector('.helpButtonDisabled') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.disabled).toBe(true);
  });

  it('disableLinks_false_appliesEnabledClass', () => {
    const learnerHelpLinks = [{ localizedHelpLink: { name: 'Help', link: 'https://help.com' } }];
    const { container } = render(<ALMFooter learnerHelpLinks={learnerHelpLinks} disableLinks={false} />);

    const button = container.querySelector('.helpButton') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.disabled).toBe(false);
  });

  it('accountJson_provided_usesItsLinksNotPropLinks', () => {
    const accountJson = {
      accountData: JSON.stringify({
        data: { attributes: { learnerHelpLinks: [{ localizedHelpLink: { name: 'Account Help', link: 'https://account.com' } }] } },
      }),
    };
    render(<ALMFooter accountJson={accountJson} learnerHelpLinks={[{ localizedHelpLink: { name: 'Prop Link', link: 'https://prop.com' } }]} />);

    expect(screen.getByText('Account Help')).not.toBeNull();
    expect(screen.queryByText('Prop Link')).toBeNull();
  });

  it('extension_learnerFooterType_rendersButton', () => {
    const extensions = [
      { invocationType: 'LEARNER_FOOTER', launchType: 'NEW_TAB', url: 'https://ext.com', localizedMetadata: { name: 'Extension 1' } },
    ];
    render(<ALMFooter nativeExtensions={extensions} />);

    expect(screen.getByText('Extension 1')).not.toBeNull();
  });

  it('extension_otherInvocationType_notRendered', () => {
    const extensions = [
      { invocationType: 'OTHER_TYPE', launchType: 'NEW_TAB', url: 'https://ext.com', localizedMetadata: { name: 'Other Extension' } },
    ];
    render(<ALMFooter nativeExtensions={extensions} />);

    expect(screen.queryByText('Other Extension')).toBeNull();
  });

  it('extension_newTab_click_callsOpenExtensionInNewTab', () => {
    const extensions = [
      { invocationType: 'LEARNER_FOOTER', launchType: 'NEW_TAB', url: 'https://ext.com/new', localizedMetadata: { name: 'New Tab Ext' } },
    ];
    render(<ALMFooter nativeExtensions={extensions} />);

    fireEvent.click(screen.getByText('New Tab Ext'));

    expect(mockOpenExtensionInNewTab).toHaveBeenCalledWith('https://ext.com/new');
  });

  it('extension_sameTab_click_callsOpenExtensionInSameTab', () => {
    const extensions = [
      { invocationType: 'LEARNER_FOOTER', launchType: 'SAME_TAB', url: 'https://ext.com/same', localizedMetadata: { name: 'Same Tab Ext' } },
    ];
    render(<ALMFooter nativeExtensions={extensions} />);

    fireEvent.click(screen.getByText('Same Tab Ext'));

    expect(mockOpenExtensionInSameTab).toHaveBeenCalledWith('https://ext.com/same');
  });

  it('extension_inApp_click_showsIframeDialog', () => {
    const extensions = [
      { invocationType: 'LEARNER_FOOTER', launchType: 'IN_APP', url: 'https://ext.com/app', localizedMetadata: { name: 'App Ext' }, width: 800, height: 600 },
    ];
    render(<ALMFooter nativeExtensions={extensions} />);

    fireEvent.click(screen.getByText('App Ext'));

    expect(screen.getByTestId('extension-iframe-dialog')).not.toBeNull();
  });

  it('iframeDialog_close_hidesDialog', () => {
    const extensions = [
      { invocationType: 'LEARNER_FOOTER', launchType: 'IN_APP', url: 'https://ext.com/app', localizedMetadata: { name: 'App Ext' }, width: 800, height: 600 },
    ];
    render(<ALMFooter nativeExtensions={extensions} />);
    fireEvent.click(screen.getByText('App Ext'));

    fireEvent.click(screen.getByText('Close Dialog'));

    expect(screen.queryByTestId('extension-iframe-dialog')).toBeNull();
  });
});
