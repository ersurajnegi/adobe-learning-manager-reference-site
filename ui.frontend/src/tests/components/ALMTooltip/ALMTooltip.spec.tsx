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
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider as SpectrumProvider, defaultTheme } from '@adobe/react-spectrum';
import ALMTooltip from '@components/Common/ALMTooltip/ALMTooltip';

jest.mock('@utils/inline_svg', () => ({
  ALM_TOOLTIP: jest.fn(() => <svg data-testid="alm-tooltip-icon" />),
}));

import { ALM_TOOLTIP } from '@utils/inline_svg';

function renderTooltip(message: string) {
  return render(
    <SpectrumProvider theme={defaultTheme}>
      <ALMTooltip message={message} />
    </SpectrumProvider>
  );
}

describe('ALMTooltip', () => {
  it('renders_messageText_inDOM', () => {
    renderTooltip('Helpful information');
    expect(screen.getByText('Helpful information')).toBeInTheDocument();
  });

  it('renders_emptyMessage_withoutCrashing', () => {
    const { container } = renderTooltip('');
    expect(container.querySelector('.showOnHover')).toBeInTheDocument();
  });

  it('renders_icon_viaALM_TOOLTIP', () => {
    renderTooltip('Test');
    // Verifies the component calls ALM_TOOLTIP() to render the icon;
    // what the icon renders is ALM_TOOLTIP's own responsibility
    expect(ALM_TOOLTIP).toHaveBeenCalled();
  });

  it('updatesMessage_whenPropChanges', () => {
    const { rerender } = renderTooltip('Initial');
    expect(screen.getByText('Initial')).toBeInTheDocument();

    rerender(
      <SpectrumProvider theme={defaultTheme}>
        <ALMTooltip message="Updated" />
      </SpectrumProvider>
    );

    expect(screen.getByText('Updated')).toBeInTheDocument();
    expect(screen.queryByText('Initial')).not.toBeInTheDocument();
  });
});
