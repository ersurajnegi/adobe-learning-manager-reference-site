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
import { useCallback, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { PrimeAlertDialog } from '../../components/Community/PrimeAlertDialog';

export enum VariantType {
  CONFIRMATION = 'confirmation',
  INFORMATION = 'information',
  DESTRUCTIVE = 'destructive',
  ERROR = 'error',
  WARNING = 'warning',
}

let alertTitle: String;
let alertBody: String;
let alertPrimaryActionLabel: String;
let alertSecondaryActionLabel: String;
let primaryActionHandler: Function;
let secondaryActionHandler: Function;
let variant: string;

const useConfirmationAlert = (): [
  (
    title: String,
    body: any,
    primaryActionLabel: String,
    secondaryActionLabel?: String,
    onPrimaryAction?: Function,
    onSecondaryAction?: Function,
    variantType?: string
  ) => void,
] => {
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  const handleShowConfirmation = useCallback((value: boolean) => {
    setShowConfirmation(value);
    const backgroundEvent = new Event(value ? 'almDisableBackground' : 'almEnableBackground');
    document.dispatchEvent(backgroundEvent);
  }, []);

  const almConfirmationAlert = useCallback(
    (
      title: String,
      body: any,
      primaryActionLabel: String,
      secondaryActionLabel?: String,
      onPrimaryAction?: Function,
      onSecondaryAction?: Function,
      variantType?: string
    ) => {
      alertTitle = title;
      alertBody = body;
      alertPrimaryActionLabel = primaryActionLabel;
      alertSecondaryActionLabel = secondaryActionLabel || '';
      primaryActionHandler = onPrimaryAction || function () {};
      secondaryActionHandler = onSecondaryAction || function () {};
      handleShowConfirmation(true);
      variant = variantType || VariantType.CONFIRMATION;
    },
    [handleShowConfirmation]
  );

  const onPrimaryActionHandler = useCallback(() => {
    handleShowConfirmation(false);
    if (typeof primaryActionHandler === 'function') {
      primaryActionHandler();
    }
  }, [handleShowConfirmation]);

  const onSecondaryActionHandler = useCallback(() => {
    handleShowConfirmation(false);
    if (typeof secondaryActionHandler === 'function') {
      secondaryActionHandler();
    }
  }, [handleShowConfirmation]);

  useEffect(() => {
    const alertDialogContainer = document.getElementById('alertDialog');
    if (!alertDialogContainer) return;

    if (showConfirmation || alertDialogContainer.hasChildNodes()) {
      render(
        <PrimeAlertDialog
          variant={variant}
          title={alertTitle}
          body={alertBody}
          primaryActionLabel={alertPrimaryActionLabel}
          secondaryActionLabel={alertSecondaryActionLabel}
          onPrimaryAction={onPrimaryActionHandler}
          onSecondaryAction={onSecondaryActionHandler}
          show={showConfirmation}
          classes="confirmationAlert"
        />,
        alertDialogContainer
      );
    }
  }, [showConfirmation, onPrimaryActionHandler, onSecondaryActionHandler]);

  return [almConfirmationAlert];
};

export { useConfirmationAlert };
