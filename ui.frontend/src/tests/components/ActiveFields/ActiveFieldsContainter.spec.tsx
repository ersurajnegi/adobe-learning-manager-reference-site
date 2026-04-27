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
import { waitFor } from '@testing-library/dom';
import { IntlProvider } from 'react-intl';
import ActiveFieldsContainter from '@components/ActiveFields/ActiveFieldsContainter';

const mockUseProfile = jest.fn();
const mockGetALMConfig = jest.fn();
const mockGetConfigurableAttributes = jest.fn();
const mockUpdateAccountActiveFields = jest.fn();
const mockSetUserFieldData = jest.fn();

// Captures the last set of props passed to ALMActiveFields — used to inspect
// predefinedMultiValues state after useEffect runs.
let mockCapturedProps: any = null;

jest.mock('@hooks', () => ({
  useProfile: () => mockUseProfile(),
}));

jest.mock('@utils/global', () => ({
  getALMConfig: () => mockGetALMConfig(),
  getConfigurableAttributes: (selector: string) => mockGetConfigurableAttributes(selector),
}));

jest.mock('@components/Common/ALMErrorBoundary', () => ({
  ALMErrorBoundary: ({ children }: any) => <>{children}</>,
}));

jest.mock('@components/ActiveFields/ALMActiveFields', () => ({
  __esModule: true,
  default: (props: any) => {
    mockCapturedProps = props;
    return (
      <div data-testid="alm-active-fields">
        <span data-testid={`title-${props.title}`}>{props.title}</span>
        <button
          data-testid={`update-field-${props.title}`}
          onClick={() => props.onActiveFieldUpdate('test-value', 'test-field')}
        >
          Update
        </button>
        <button
          data-testid={`switch-on-${props.title}`}
          onClick={() => props.onSwitchValueUpdate('newAttr', 'value', 'newField')}
        >
          Switch On
        </button>
        <button
          data-testid={`switch-off-${props.title}`}
          onClick={() => props.onSwitchValueUpdate('attr', '', 'field')}
        >
          Switch Off
        </button>
        <button
          data-testid={`update-multi-${props.title}`}
          onClick={() => props.updateSelectedMultiValues('multiVal', true)}
        >
          Update Multi
        </button>
      </div>
    );
  },
}));

const mockConfig = {
  mountingPoints: { activeFieldsContainer: '#active-fields-container' },
};

const mockAccountActiveFields = {
  fields: [
    { name: 'skills', allowedValues: ['React', 'TypeScript', 'Node.js'], isMultiValue: true },
  ],
};

const mockUser = {
  id: 'user-123',
  fields: { skills: ['React', 'TypeScript'] },
};

const renderComponent = () =>
  render(
    <IntlProvider locale="en" messages={{ 'alm.profile.fields.saveProfileChanges': 'Save Changes' }}>
      <ActiveFieldsContainter />
    </IntlProvider>
  );

describe('ActiveFieldsContainter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCapturedProps = null;
    mockGetALMConfig.mockReturnValue(mockConfig);
    mockGetConfigurableAttributes.mockReturnValue({
      section1ActiveFields: 'department',
      section1Description: 'Section 1 desc',
      section1Title: 'Section 1',
      section2ActiveFields: 'skills',
      section2Description: 'Section 2 desc',
      section2Title: 'Section 2',
    });
    mockUpdateAccountActiveFields.mockResolvedValue(undefined);
    mockUseProfile.mockReturnValue({
      profileAttributes: { user: mockUser, accountActiveFields: mockAccountActiveFields },
      updateAccountActiveFields: mockUpdateAccountActiveFields,
      userFieldData: { fields: {} },
      setUserFieldData: mockSetUserFieldData,
    });
  });

  it('renders_twoSections_withConfigTitles', () => {
    renderComponent();

    expect(screen.getAllByTestId('alm-active-fields')).toHaveLength(2);
    expect(screen.getByTestId('title-Section 1')).toBeInTheDocument();
    expect(screen.getByTestId('title-Section 2')).toBeInTheDocument();
  });

  it('renders_saveButton_whenFieldsExist', () => {
    const { container } = renderComponent();

    const saveButton = container.querySelector('.almButton.primary');
    expect(saveButton).not.toBeNull();
    expect(saveButton!.textContent).toBe('Save Changes');
  });

  it('renders_noSaveButton_whenNoFields', () => {
    mockUseProfile.mockReturnValue({
      profileAttributes: {
        user: { id: 'user-123', fields: null },
        accountActiveFields: { fields: [] },
      },
      updateAccountActiveFields: mockUpdateAccountActiveFields,
      userFieldData: { fields: {} },
      setUserFieldData: mockSetUserFieldData,
    });

    const { container } = renderComponent();

    expect(container.querySelector('.almButton.primary')).toBeNull();
  });

  it('getConfigurableAttributes_usesAlmConfigSelector', () => {
    renderComponent();

    expect(mockGetConfigurableAttributes).toHaveBeenCalledWith('#active-fields-container');
  });

  it('initMap_nullUserFields_allFalse', () => {
    mockUseProfile.mockReturnValue({
      profileAttributes: {
        user: { id: 'user-123', fields: null },
        accountActiveFields: mockAccountActiveFields,
      },
      updateAccountActiveFields: mockUpdateAccountActiveFields,
      userFieldData: { fields: {} },
      setUserFieldData: mockSetUserFieldData,
    });

    renderComponent();

    const map: Map<any, any> = mockCapturedProps.predefinedMultiValues;
    expect(map.get(mockAccountActiveFields.fields[0])).toBe(false);
  });

  it('initMap_existingUserFields_selectedValuesTrue', () => {
    renderComponent();

    const map: Map<string, boolean> = mockCapturedProps.predefinedMultiValues;
    expect(map.get('React')).toBe(true);
    expect(map.get('TypeScript')).toBe(true);
  });

  it('initMap_invalidUserValues_ignoredInMap', () => {
    mockUseProfile.mockReturnValue({
      profileAttributes: {
        user: { id: 'user-123', fields: { skills: ['React', 'InvalidSkill', 'TypeScript'] } },
        accountActiveFields: mockAccountActiveFields,
      },
      updateAccountActiveFields: mockUpdateAccountActiveFields,
      userFieldData: { fields: {} },
      setUserFieldData: mockSetUserFieldData,
    });

    renderComponent();

    const map: Map<string, boolean> = mockCapturedProps.predefinedMultiValues;
    expect(map.get('React')).toBe(true);
    expect(map.get('TypeScript')).toBe(true);
    expect(map.has('InvalidSkill')).toBe(false);
  });

  it('onActiveFieldUpdate_newField_mergedIntoUserData', () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('update-field-Section 1'));

    expect(mockSetUserFieldData).toHaveBeenCalledTimes(1);
    expect(mockSetUserFieldData).toHaveBeenCalledWith({ fields: { 'test-field': 'test-value' } });
  });

  it('onActiveFieldUpdate_existingFields_preserved', () => {
    mockUseProfile.mockReturnValue({
      profileAttributes: { user: mockUser, accountActiveFields: mockAccountActiveFields },
      updateAccountActiveFields: mockUpdateAccountActiveFields,
      userFieldData: { fields: { existing: 'kept' } },
      setUserFieldData: mockSetUserFieldData,
    });

    renderComponent();
    fireEvent.click(screen.getByTestId('update-field-Section 1'));

    expect(mockSetUserFieldData).toHaveBeenCalledWith({
      fields: { existing: 'kept', 'test-field': 'test-value' },
    });
  });

  it('onSwitchValueUpdate_valueSelected_noDataUpdate', () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('switch-on-Section 1'));

    expect(mockSetUserFieldData).not.toHaveBeenCalled();
  });

  it('onSwitchValueUpdate_valueDeselected_removedFromArray', () => {
    mockUseProfile.mockReturnValue({
      profileAttributes: { user: mockUser, accountActiveFields: mockAccountActiveFields },
      updateAccountActiveFields: mockUpdateAccountActiveFields,
      userFieldData: { fields: { field: ['attr', 'other'] } },
      setUserFieldData: mockSetUserFieldData,
    });

    renderComponent();
    fireEvent.click(screen.getByTestId('switch-off-Section 1'));

    expect(mockSetUserFieldData).toHaveBeenCalledWith({ fields: { field: ['other'] } });
  });

  it('onSwitchValueUpdate_undefinedArray_keepsUndefined', () => {
    mockUseProfile.mockReturnValue({
      profileAttributes: { user: mockUser, accountActiveFields: mockAccountActiveFields },
      updateAccountActiveFields: mockUpdateAccountActiveFields,
      userFieldData: { fields: { field: undefined } },
      setUserFieldData: mockSetUserFieldData,
    });

    renderComponent();
    fireEvent.click(screen.getByTestId('switch-off-Section 1'));

    expect(mockSetUserFieldData).toHaveBeenCalledWith({ fields: { field: undefined } });
  });

  it('updateSelectedMultiValues_updatesMapOnly', () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('update-multi-Section 1'));

    expect(mockSetUserFieldData).not.toHaveBeenCalled();
    expect(mockCapturedProps.predefinedMultiValues.get('multiVal')).toBe(true);
  });

  it('saveButton_click_callsUpdateWithFieldsAndUserId', async () => {
    mockUseProfile.mockReturnValue({
      profileAttributes: { user: mockUser, accountActiveFields: mockAccountActiveFields },
      updateAccountActiveFields: mockUpdateAccountActiveFields,
      userFieldData: { fields: { department: 'Engineering' } },
      setUserFieldData: mockSetUserFieldData,
    });

    const { container } = renderComponent();
    fireEvent.click(container.querySelector('.almButton.primary') as HTMLButtonElement);

    await waitFor(() =>
      expect(mockUpdateAccountActiveFields).toHaveBeenCalledWith(
        { department: 'Engineering' },
        'user-123'
      )
    );
  });
});
