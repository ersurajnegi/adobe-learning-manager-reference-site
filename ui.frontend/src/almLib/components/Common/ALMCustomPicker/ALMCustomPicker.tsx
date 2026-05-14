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
import { Item, Picker } from '@adobe/react-spectrum';
import React, { useEffect, useState } from 'react';
import { GetTranslationsReplaced } from '../../../utils/translationService';

interface Option {
  id: string;
  name: string;
}

const ALMCustomPicker: React.FC<{
  options: Option[];
  onOptionSelected: (selectedOption: string) => void;
  defaultSelectedOptionId: string;
}> = props => {
  const { options, onOptionSelected, defaultSelectedOptionId } = props;
  const defaultSelectedKey = defaultSelectedOptionId;
  const defaulSelectedOption = options.find(option => option.id === defaultSelectedOptionId);
  const defaultSelectedOptionName = defaulSelectedOption?.name!;
  let selectedItemText = GetTranslationsReplaced(
    'alm.sort.selectedOption',
    {
      selectedOption: defaultSelectedOptionName,
    },
    true
  );
  const [selectedItemAriaLabel, setSelectedItemAriaLabel] = useState<string>(selectedItemText);
  useEffect(() => {
    selectedItemText = GetTranslationsReplaced(
      'alm.sort.selectedOption',
      {
        selectedOption: defaultSelectedOptionName,
      },
      true
    );
    setSelectedItemAriaLabel(selectedItemText);
  }, [defaultSelectedOptionName]);
  const handleOptionSelected = (key: React.Key) => {
    const selectedOption = options.find(option => option.id === key);
    const selectedItemText = GetTranslationsReplaced(
      'alm.sort.selectedOption',
      {
        selectedOption: selectedOption?.name!,
      },
      true
    );
    setSelectedItemAriaLabel(selectedItemText);
    selectedOption && onOptionSelected(selectedOption.id);
  };
  return (
    <Picker
      items={options}
      defaultSelectedKey={defaultSelectedKey}
      onSelectionChange={key => handleOptionSelected(key!)}
      aria-label={selectedItemAriaLabel}
    >
      {options.map(option => (
        <Item key={option.id} data-automationid={option.name}>
          {option.name}
        </Item>
      ))}
    </Picker>
  );
};

export default ALMCustomPicker;
