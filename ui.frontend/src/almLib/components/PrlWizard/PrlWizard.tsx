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
import { PrimeRecommendations } from '../../models/PrimeModels';
import { ADVANCED, PrimeEvent } from '../../utils/widgets/common';
import '../../components/PrlPreferenceSection/PrlChips/index';
import '../../components/PrlPreferenceSection/PrlLevelSelector/index';
import { GetPrimeEmitEventLinks } from '../../utils/global';
import { SendMessageToParent } from '../../utils/widgets/base/EventHandlingBase';
import { GetTranslation, GetTranslationReplaced } from '../../utils/translationService';
import { PRL_WIZARD_ERROR_SVG, PRL_WIZARD_SVG, PRL_WIZARD_SVG_SMALL } from '../../utils/inline_svg';
import { useEffect, useState } from 'react';
import styles from './PrlWizard.module.css';
import { PrlChips } from '../../components/PrlPreferenceSection/PrlChips/index';
import { PrlLevelSelector } from '../../components/PrlPreferenceSection/PrlLevelSelector/index';
import PrlBg from '../../assets/images/prl_bg.jpg';
import LoadingButton from '../../assets/images/LoadingButton.gif';
import { useRecommendations } from '../../hooks/profile/useRecommendations';
import {
  checkIfWeCanShowPRLWizard,
  focusOnWizardStep,
  getIsProductsEnabled,
  getIsRolesEnabled,
  getLevelsData,
  getProductsData,
  getRolesData,
  isNextButtonEnable,
  POPUP_VIEW,
  WIZARD_STEP,
} from '../../utils/prlWizardUtils';
import { useUserContext } from '../../contextProviders/userContextProvider';

interface PrlState {
  wizardSteps: string[];
  selectedProducts: PrimeRecommendations[];
  selectedRoles: PrimeRecommendations[];
}

const PrlWizard = () => {
  const {
    items,
    products,
    roles,
    levels,
    getUserRecommendationPreferences,
    getRecommendationsForType,
    getRecommendationLevels,
    saveUserRecommedations,
  } = useRecommendations();
  const [currentStep, setCurrentStep] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [numberOfSteps, setNumberOfSteps] = useState(0);
  const [prlState, setPrlState] = useState<PrlState>({
    wizardSteps: [] as Array<string>,
    selectedProducts: [] as Array<PrimeRecommendations>,
    selectedRoles: [] as Array<PrimeRecommendations>,
  });
  const [currentView, setCurrentView] = useState(POPUP_VIEW.START);
  const [isSubmitInProgress, setIsSubmitInProgress] = useState(false);
  const { user } = useUserContext() || {};
  const account = user.account;

  useEffect(() => {
    const init = () => {
      setCurrentView(POPUP_VIEW.LOADING);
      if (account.prlCriteria?.enabled) {
        getData();
        return;
      }
      setCurrentView(POPUP_VIEW.ERROR);
      SendMessageToParent({ type: PrimeEvent.PRL_DIALOG_CLOSED }, GetPrimeEmitEventLinks());
    };
    init();
    SendMessageToParent({ type: PrimeEvent.ALM_HIDE_FOOTER }, GetPrimeEmitEventLinks());
    document.addEventListener(PrimeEvent.ALM_RELOAD_PRL_FRAME, init);
    return () => {
      document.removeEventListener(PrimeEvent.ALM_RELOAD_PRL_FRAME, init);
    };
  }, []);

  const getData = async () => {
    try {
      await getUserRecommendationPreferences();
      const wizard_steps = [];
      const promises = [];
      const productsData = getProductsData(account, getRecommendationsForType);
      promises.push(productsData.networkCall);
      wizard_steps.push(...productsData.steps!);
      const rolesData = getRolesData(account, getRecommendationsForType);
      promises.push(rolesData.networkCall);
      wizard_steps.push(...rolesData.steps!);
      const levelsData = getLevelsData(account, getRecommendationLevels);
      promises.push(levelsData.networkCall);
      await Promise.all(promises);
      setPrlState({
        wizardSteps: wizard_steps,
        selectedProducts: items?.products || [],
        selectedRoles: items?.roles || [],
      });
      if (checkIfWeCanShowPRLWizard(account, products, roles)) {
        SendMessageToParent({ type: PrimeEvent.PRL_DIALOG_LAUNCHED }, GetPrimeEmitEventLinks());
        setCurrentView(POPUP_VIEW.START);
        focusOnWizardStep('#start-header');
      } else {
        SendMessageToParent({ type: PrimeEvent.PRL_DIALOG_CLOSED }, GetPrimeEmitEventLinks());
        setCurrentView(POPUP_VIEW.ERROR);
      }
    } catch (error) {
      setCurrentView(POPUP_VIEW.ERROR);
    }
  };

  const proceedToNextStep = () => {
    const index = prlState.wizardSteps.findIndex(item => item === currentStep);
    if (index > -1 && index <= numberOfSteps) {
      setCurrentStepIndex(index + 1);
      setCurrentStep(prlState.wizardSteps[index + 1]);
      focusOnWizardStep(`#${index + 1}`);
    }
  };

  const proceedBack = () => {
    const index = prlState.wizardSteps.findIndex(item => item === currentStep);
    if (index > 0) {
      setCurrentStepIndex(index - 1);
      setCurrentStep(prlState.wizardSteps[index - 1]);
    }
    focusOnWizardStep(`#${index - 1}`);
  };

  const updateSelectedProducts = (newProducts: PrimeRecommendations[]) => {
    setPrlState(prevState => ({
      ...prevState,
      selectedProducts: newProducts,
    }));
  };

  const updateSelectedRoles = (newRoles: PrimeRecommendations[]) => {
    setPrlState(prevState => ({
      ...prevState,
      selectedRoles: newRoles,
    }));
  };

  const addSelectedProducts = (event: any) => {
    updateSelectedProducts([
      ...prlState.selectedProducts,
      {
        id: event.id,
        name: event.name,
        levels: account.prlCriteria?.products?.levelsEnabled ? [ADVANCED] : undefined,
      },
    ]);
  };

  const removeSelectedProducts = (event: any) => {
    updateSelectedProducts(prlState.selectedProducts.filter(item => item.id !== event.id));
  };

  const addSelectedRoles = (event: any) => {
    updateSelectedRoles([
      ...prlState.selectedRoles,
      {
        id: event.id,
        name: event.name,
        levels: account.prlCriteria?.roles?.levelsEnabled ? [ADVANCED] : undefined,
      },
    ]);
  };

  const removeSelectedRoles = (event: any) => {
    updateSelectedRoles(prlState.selectedRoles.filter(item => item.id !== event.id));
  };

  const startWizard = () => {
    setCurrentStep(prlState.wizardSteps[0]);
    setCurrentStepIndex(0);
    setNumberOfSteps(prlState.wizardSteps.length);
    setCurrentView(POPUP_VIEW.WIZARD);
    focusOnWizardStep(`#${currentStep}`);
  };

  const submitRecommendations = async () => {
    setIsSubmitInProgress(true);
    const requestObj = {
      id: items?.id,
      type: items?.type,
      attributes: {
        products: prlState.selectedProducts,
        roles: prlState.selectedRoles,
      },
    };
    try {
      await saveUserRecommedations(requestObj);
      SendMessageToParent({ type: PrimeEvent.PRL_DIALOG_CLOSED }, GetPrimeEmitEventLinks());
    } catch (error) {
      console.error(error);
      setCurrentView(POPUP_VIEW.ERROR);
    } finally {
      setIsSubmitInProgress(false);
    }
  };

  const updateLevel = (event: CustomEvent) => {
    const item = event.detail?.item;
    if (!item?.id) {
      console.error('NO data in custom event : ', JSON.stringify(event.detail));
      return;
    }
    const prlCriteria = account.prlCriteria || {};
    if (getIsProductsEnabled(account) && prlCriteria.products?.levelsEnabled) {
      const index = prlState.selectedProducts.findIndex(role => role.id === item.id);
      if (index > -1) {
        prlState.selectedProducts[index] = item;
        updateSelectedProducts([...prlState.selectedProducts]);
      }
    } else if (getIsRolesEnabled(account) && prlCriteria.roles?.levelsEnabled) {
      const index = prlState.selectedRoles.findIndex(role => role.id === item.id);
      if (index > -1) {
        prlState.selectedRoles[index] = item;
        updateSelectedRoles([...prlState.selectedRoles]);
      }
    }
  };

  const getSelectedItemsHtml = (items: Array<PrimeRecommendations>) => {
    return items && items.length ? `${items.map(item => item.name).join(', ')}` : ``;
  };

  const getChipsSelectorHtml = () => {
    if (currentStep === WIZARD_STEP.PRODUCTS) {
      return (
        <PrlChips
          options={products}
          selectedOptions={prlState.selectedProducts}
          radioGroupAriaLabel={GetTranslation('prl.wizard.select.products.text', true)}
          onAdd={addSelectedProducts}
          onRemove={removeSelectedProducts}
        ></PrlChips>
      );
    }
    if (currentStep === WIZARD_STEP.ROLES) {
      return (
        <PrlChips
          options={roles}
          selectedOptions={prlState.selectedRoles}
          radioGroupAriaLabel={GetTranslation('prl.wizard.select.roles.text', true)}
          onAdd={addSelectedRoles}
          onRemove={removeSelectedRoles}
        ></PrlChips>
      );
    }
    return ``;
  };

  const getLevelSelectorHtml = () => {
    const index = prlState.wizardSteps.findIndex(item => item === currentStep);
    if (index > 0) {
      let options = prlState.selectedRoles;
      let headerText = GetTranslationReplaced(
        'prl-lever-selector-header-text',
        GetTranslation('prl.roles.text', true)
      );
      if (prlState.wizardSteps[index - 1] === WIZARD_STEP.PRODUCTS) {
        options = prlState.selectedProducts;
        headerText = headerText = GetTranslationReplaced(
          'prl-lever-selector-header-text',
          GetTranslation('prl.products.text', true)
        );
      }
      return (
        <PrlLevelSelector
          className={styles.primeLevelSelector}
          options={options}
          levels={levels}
          onChangeHandler={updateLevel}
          headerText={headerText}
        ></PrlLevelSelector>
      );
    }
    return ``;
  };

  const getStepHeadingHtml = (key: string) => {
    return (
      <div className={styles.primePrlStepHeading}>
        <h3>{GetTranslation(key, true)}</h3>
        <p>{GetTranslation('prl.wizard.recommendations.text')}</p>
      </div>
    );
  };

  const getSelectedOptionsHtml = (key: string, options: Array<PrimeRecommendations>) => {
    return (
      <div className={styles.primePrlSelectedItemsContainer}>
        <h3>{GetTranslation(key, true)}</h3>
        <p>{getSelectedItemsHtml(options)}</p>
      </div>
    );
  };

  const getLeftContainerStepHtml = () => {
    const isRolesEnabled = getIsRolesEnabled(account);
    const isProductsEnabled = getIsProductsEnabled(account);
    if (currentStep === WIZARD_STEP.PRODUCTS) {
      return getStepHeadingHtml('prl.wizard.select.products.text');
    }
    if (currentStep === WIZARD_STEP.ROLES) {
      return (
        <>
          {isProductsEnabled
            ? getSelectedOptionsHtml('prl.wizard.selected.products.text', prlState.selectedProducts)
            : ``}
          {isRolesEnabled ? getStepHeadingHtml('prl.wizard.select.roles.text') : ``}
        </>
      );
    }
    if (currentStep === WIZARD_STEP.LEVELS) {
      return (
        <>
          {isProductsEnabled
            ? getSelectedOptionsHtml('prl.wizard.selected.products.text', prlState.selectedProducts)
            : ``}
          {isRolesEnabled
            ? getSelectedOptionsHtml('prl.wizard.selected.roles.text', prlState.selectedRoles)
            : ``}
        </>
      );
    }
    return ``;
  };

  const getStartView = () => {
    return (
      <>
        <section className={styles.primePrlStartContainer}>
          <div className={styles.primePrlStartImage}>
            {PRL_WIZARD_SVG(GetTranslation('prl.header.image.text'))}
          </div>
          <div className={styles.primePrlStartLabel}>
            <h1 id="start-header">{GetTranslation('prl.start.heading')}</h1>
            <p>{GetTranslation('prl.start.heading.extra')}</p>
            <button className={styles.primePrlDoneButton} onClick={startWizard}>
              {GetTranslation('prl.start.configure.button.text')}
            </button>
          </div>
        </section>
      </>
    );
  };

  const getWizardView = () => {
    const isNextEnabled = isNextButtonEnable(
      currentStep,
      prlState.selectedProducts,
      prlState.selectedRoles
    );
    const isRolesEnabled = getIsRolesEnabled(account);
    const isProductsEnabled = getIsProductsEnabled(account);
    let selecteAtleastOneStringType = 'prl.roles.text.singular';
    if (currentStep === WIZARD_STEP.PRODUCTS) {
      selecteAtleastOneStringType = 'prl.products.text.singular';
    }

    const selectAtLeatOneHTML = !isNextEnabled
      ? GetTranslationReplaced(
          'prl-lever-select-at-least-one',
          GetTranslation(selecteAtleastOneStringType, true)
        )
      : ``;

    const levelSelectorHtml = currentStep === WIZARD_STEP.LEVELS ? getLevelSelectorHtml() : ``;

    const backButtonHtml =
      currentStepIndex > 0 && numberOfSteps > 1 ? (
        <button
          onClick={proceedBack}
          className={`${styles.primePrlDoneButton} ${styles.primePrlSecondaryButton}`}
          disabled={isSubmitInProgress}
        >
          {GetTranslation('back')}
        </button>
      ) : (
        ``
      );

    const nextOrFinishButtonHtml =
      currentStepIndex === numberOfSteps - 1 ? (
        <button
          className={styles.primePrlDoneButton}
          disabled={!isNextEnabled || isSubmitInProgress}
          onClick={submitRecommendations}
        >
          {isSubmitInProgress ? (
            <span
              id="loader"
              data-automationid="loader"
              className={styles.primePrlSubmitLoader}
            ></span>
          ) : (
            GetTranslation('prl.finish.text')
          )}
        </button>
      ) : (
        <button
          className={styles.primePrlDoneButton}
          onClick={proceedToNextStep}
          disabled={!isNextEnabled}
        >
          {GetTranslation('prl.next.text')}
        </button>
      );

    const arrowHtml =
      isRolesEnabled && isProductsEnabled ? (
        <span className={styles.primePrlArrowRight}></span>
      ) : (
        ``
      );

    const svgTemplate = (
      <div className={styles.primePrlSvg}>
        {PRL_WIZARD_SVG_SMALL()}
        <div></div>
      </div>
    );
    const currentStepLeftContainerHtml = getLeftContainerStepHtml();
    const chipsHtml = getChipsSelectorHtml();
    const isChooseProductEnabled =
      currentStep === WIZARD_STEP.PRODUCTS ||
      (currentStep === WIZARD_STEP.LEVELS && !isRolesEnabled);
    const isChooseRoleEnabled =
      currentStep === WIZARD_STEP.ROLES || (currentStep === WIZARD_STEP.LEVELS && isRolesEnabled);
    return (
      <div className={styles.primePrlBody}>
        <div className={`${styles.primePrlChild} ${styles.primePrlLeft}`}>
          <div className={styles.primePrlStepContainer}>
            {isProductsEnabled ? (
              <span
                className={`${styles.primePrlStep} ${isChooseProductEnabled && styles.primePrlStepCurrent}`}
                id={WIZARD_STEP.PRODUCTS}
                tabIndex={0}
                aria-current={isChooseProductEnabled ? 'step' : 'false'}
              >
                {GetTranslation('prl.wizard.choose.products', true)}
              </span>
            ) : (
              ``
            )}
            {arrowHtml}
            {isRolesEnabled ? (
              <span
                className={`${styles.primePrlStep} ${isChooseRoleEnabled && styles.primePrlStepCurrent}`}
                id={WIZARD_STEP.ROLES}
                tabIndex={0}
                aria-current={isChooseRoleEnabled ? 'step' : 'false'}
              >
                {GetTranslation('prl.wizard.choose.roles', true)}
              </span>
            ) : (
              ``
            )}
          </div>
          <div className={styles.primePrlStepSeparator}>{currentStepLeftContainerHtml}</div>
          {svgTemplate}
        </div>
        <div className={`${styles.primePrlChild} ${styles.primePrlRight}`}>
          <div className={styles.primePrlRightContent}>
            {chipsHtml} {levelSelectorHtml}
          </div>
          <div className={styles.primeButtonsContainer}>
            <div className={styles.primeButtonsLabel}>{selectAtLeatOneHTML}</div>
            <div className={styles.primeButtonsChild}>
              {backButtonHtml} {nextOrFinishButtonHtml}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getErrorView = () => {
    return (
      <section className={styles.primePrlErrorContainer}>
        <div className={styles.primePrlErrorMessageContainer}>
          {PRL_WIZARD_ERROR_SVG()}
          <h2>{GetTranslation('prl.error.text')}</h2>
          <p>{GetTranslation('prl.error.info')}</p>
        </div>
      </section>
    );
  };

  const getLoadingView = () => {
    return (
      <section className={styles.primePrlErrorContainer}>
        <div
          className={styles.primePrlModalLoader}
          style={{ backgroundImage: `url(${LoadingButton})` } as React.CSSProperties}
        ></div>
      </section>
    );
  };

  const getCurrentViewHtml = () => {
    if (currentView === POPUP_VIEW.WIZARD) {
      return getWizardView();
    }
    if (currentView === POPUP_VIEW.ERROR) {
      return getErrorView();
    }
    if (currentView === POPUP_VIEW.LOADING) {
      return getLoadingView();
    }
    return getStartView();
  };

  return (
    <>
      <div
        tabIndex={-1}
        className={styles.primePrlOverlay}
        style={{ backgroundImage: `url(${PrlBg})` } as React.CSSProperties}
      >
        <div className={styles.primePrlDialog} role="dialog" aria-modal="true">
          {getCurrentViewHtml()}
        </div>
      </div>
    </>
  );
};

export default PrlWizard;
