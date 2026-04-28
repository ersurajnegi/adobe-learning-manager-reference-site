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
import ReactDOM from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSkills } from '../../hooks/profile/useSkills';
import { useUserSkillInterest } from '../../hooks/profile/useUserSkillInterest';
import { GetTranslation } from '../../utils/translationService';
import { getALMAccount, getALMObject, isEmptyJson } from '../../utils/global';
import {
  ADMIN_ASSIGN,
  update,
  EXTERNAL,
  GENERAL,
  INTERNAL,
  LO_ENROLL,
  SKILL,
  USER_SELECTED,
  MODE,
  CPENEW,
  VIEW,
  ADD,
  ENTER,
  EXTERNAL_SKILL_IFRAME_ID,
  SKILL_INPUT,
  SKILL_NAME,
  ALM_BUTTON,
  PRIMARY,
  ACTIVE,
  CPE,
} from '../../utils/constants';
import { ExternalSkillGraphComponent } from './ExternalSkillGraph';
import { ALMLoader } from '../Common/ALMLoader';
import Search from '@spectrum-icons/workflow/Search';
import ChevronDown from '@spectrum-icons/workflow/ChevronDown';

import styles from './ALMSkillComponent.module.css';
import stylesExternal from './ExternalSkillGraph/ExternalSkillGraphComponent.module.css';
import { PrimeSkill, PrimeUserSkillInterest } from '../../models';
import { PrlPreferenceSection } from '../PrlPreferenceSection';
import { GetHomePageLink, SendLinkEvent } from '../../utils/widgets/base/EventHandlingBase';
import {
  addBodyStyles,
  addExternalFontLink,
  addExternalSkillFrameCss,
  copyStyleSheetsToChildFrame,
  getAttrStyle,
  sendSkillsSkipLinks,
} from './ALMSkillComponent.utils';
import Close from '@spectrum-icons/workflow/Close';
import { Item, TabList, TabPanels, Tabs } from '@react-spectrum/tabs';
import { ALMErrorBoundary } from '../Common/ALMErrorBoundary';
import { Key, lightTheme, Provider } from '@adobe/react-spectrum';
import { NO_SKILL_INTEREST_SVG } from '../../utils/inline_svg';
import CheckmarkCircle from '@spectrum-icons/workflow/CheckmarkCircle';

const ALMSkillComponent = () => {
  const { formatMessage } = useIntl();
  const {
    items,
    fetchUserSkillInterest,
    saveUserSkillInterest,
    removeUserSkillInterest,
    loadMoreUserSkillInterest,
    hasMoreItems,
  } = useUserSkillInterest();
  const { skills, fetchSkills, searchSkill, hasMoreSkills, loadMoreSkills } = useSkills();
  const urlSearchParams = window.location.hash.split('?')[1];
  const initialMode = urlSearchParams ? urlSearchParams.split(`${MODE}=`)[1] : VIEW;
  const [mode, setMode] = useState(initialMode);
  const [selectedInterest, setSelectedInterest] = useState([] as string[]);
  const [isPrlEnabled, setIsPrlEnabled] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Key>(INTERNAL);
  const [showAddInterest, setShowAddInterest] = useState(false);
  const [selectedExternalInterest, setSelectedExternalInterest] = useState([]);
  const [showLoader, setShowLoader] = useState(false);
  const [internalSkillInterestIds, setInternalSkillInterestIds] = useState([] as string[]);
  const [filteredSkills, setFilteredSkills] = useState([] as PrimeSkill[]);
  const [searchString, setSearchString] = useState('');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const externalSkillGraphRef = useRef();

  const skillsRef = useRef([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const landingPage = useMemo(() => {
    const customPage = getALMObject()?.getLandingPageFromMenu;
    return typeof customPage === 'function' ? customPage() : null;
  }, []);

  const showHomePageLink = landingPage ? landingPage?.pageType === 'HOME' : true;
  const alm = getALMObject();

  useEffect(() => {
    const getAccount = async () => {
      setShowLoader(true);
      const account = await getALMAccount();
      if (account) {
        setIsPrlEnabled(account.prlCriteria?.enabled);
        const shouldShowTabs =
          account.prlCriteria?.enabled ||
          account.recommendationAccountType === CPENEW ||
          account.recommendationAccountType === CPE
            ? false
            : account.enableExternalSkills;
        setShowTabs(shouldShowTabs);
        setShowAddInterest(account.exploreSkills);
      }
    };
    getAccount();
  }, []);

  useEffect(() => {
    if (!isEmptyJson(items) && isInternalTab()) {
      const internalSkillInterestIds: string[] = [];
      items.map(item => {
        internalSkillInterestIds.push(item.skill.id);
      });
      setInternalSkillInterestIds(internalSkillInterestIds);
    }
  }, [items]);

  useEffect(() => {
    clearSkillRefs();
    if (!isEmptyJson(skills)) {
      let filteredSkills = skills?.filter(skill => {
        return internalSkillInterestIds.indexOf(skill.id) === -1;
      });
      setFilteredSkills(filteredSkills);
    }
  }, [skills]);
  // Send skip links to parent Ember app
  useEffect(() => {
    const timer = setTimeout(() => {
      sendSkillsSkipLinks(isPrlEnabled, items.length > 0);
    }, 100);

    return () => clearTimeout(timer);
  }, [isPrlEnabled, items.length]);

  const highlightAllSelectedSkills = () => {
    const skills = skillsRef.current as any;
    selectedInterest.forEach(interest => {
      const index = skills.findIndex((element: any) => element.id === `skill-${interest}`);
      if (index > -1) {
        highlightSelectedSkill(skills[index]);
      }
    });
  };

  useEffect(() => {
    highlightAllSelectedSkills();
  }, [filteredSkills]);

  // Send skip links to parent Ember app
  useEffect(() => {
    const timer = setTimeout(() => {
      sendSkillsSkipLinks(isPrlEnabled, items.length > 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [isPrlEnabled, items.length]);

  const clearSkillRefs = () => {
    skillsRef.current = [];
  };

  const removeFocus = (event: Event) => {
    const currentSkill = event.target as HTMLElement;
    if (currentSkill) {
      currentSkill.blur();
    }
  };

  const clearSelectedSkills = () => {
    setSelectedInterest([]);
    setSelectedExternalInterest([]);
  };

  const loadMoreSkillsHandler = async () => {
    setShowLoader(true);
    await loadMoreSkills();
    setShowLoader(false);
  };

  const highlightSelectedSkill = (skillBox: any) => {
    skillBox.className += ` ${styles.selectedSkillBox}`;
    skillBox.ariaPressed = true;
    skillBox.children[1].style.display = 'flex';
  };

  const removeHighlight = (skillBox: any) => {
    skillBox.className = styles.skillBoxSelectable;
    skillBox.ariaPressed = false;
    skillBox.children[1].style.display = 'none';
  };

  const toggleSkillSelection = (index: number) => {
    let skillBox = skillsRef.current[index] as any;
    const skillId = skillBox.id.split('skill-')[1];
    let selectedSkills = selectedInterest;
    const skillIndex = selectedSkills.indexOf(skillId);
    if (skillIndex > -1) {
      selectedSkills.splice(skillIndex, 1);
      removeHighlight(skillBox);
    } else {
      selectedSkills.push(skillId);
      highlightSelectedSkill(skillBox);
    }
    setSelectedInterest(selectedSkills);
  };

  const scrollToSkillsSection = () => {
    document.getElementById('skills-section')?.scrollIntoView();
  };

  const editSkillInterestHandler = () => {
    setMode(update);
    setSelectedTab(INTERNAL);
    loadSkillSection();
  };

  const loadSkillSection = async () => {
    setShowLoader(true);
    await fetchSkills();
    scrollToSkillsSection();
    setShowLoader(false);
  };

  const goToHomeHandler = async () => {
    if (landingPage && !landingPage.isDefault && landingPage.id) {
      alm.navigateToCustomPage(landingPage.id);
      return;
    }
    SendLinkEvent(GetHomePageLink());
  };

  useEffect(() => {
    if (!isViewMode()) {
      loadSkillSection();
    }
    return () => {
      unmountExternalSkillGraph();
    };
  }, []);

  const saveSkillInterest = async () => {
    const selectedInterestArr = [...selectedInterest];
    selectedExternalInterest.map(externalInterest => {
      selectedInterestArr.push(`${EXTERNAL}:${externalInterest}`);
    });
    const isSelectedInterestEmpty = selectedInterestArr.length === 0;
    setErrorMsg(
      isSelectedInterestEmpty
        ? GetTranslation('alm.profile.skills.selectMinimumSkillMessage', true)
        : ''
    );
    if (isSelectedInterestEmpty) {
      return;
    }
    setShowLoader(true);
    await saveUserSkillInterest(selectedInterestArr);
    setShowLoader(false);
    return isAddMode() ? goToHomeHandler() : loadDefaultState();
  };

  const unmountExternalSkillGraph = () => {
    let externalSkillGraph = externalSkillGraphRef.current;
    if (externalSkillGraph) {
      (externalSkillGraph as any).stopThreeJS();
    }
  };

  const loadDefaultState = async () => {
    setShowLoader(true);
    unmountExternalSkillGraph();
    await fetchUserSkillInterest(INTERNAL);
    clearSelectedSkills();
    setMode(VIEW);
    setSelectedTab(INTERNAL);
    scrollToSkillsSection();
    setSearchString('');
    setShowLoader(false);
    setErrorMsg('');
    updateFrameLoaded(false);
  };

  const noSkillInterestPresent = () => {
    return (
      items?.length === 0 || (items?.length === 1 && items[0].skill.name.toLowerCase() === GENERAL)
    );
  };

  const getFilteredSkills = () => {
    return filteredSkills.filter(skill => {
      return (
        skill.name.toLowerCase() !== GENERAL && skill.state.toLowerCase() === ACTIVE.toLowerCase()
      );
    });
  };

  const noSkillPresent = () => {
    return getFilteredSkills()?.length === 0;
  };

  const removeSkillInterest = async (skillId: string) => {
    setShowLoader(true);
    await removeUserSkillInterest(skillId);
    setShowLoader(false);
  };

  const getSkillLevelName = (levelId: string) => {
    switch (levelId) {
      case '1':
        return formatMessage({
          id: 'alm.profile.skillLevel.beginner',
          defaultMessage: 'Beginner',
        });
      case '2':
        return formatMessage({
          id: 'alm.profile.skillLevel.intermediate',
          defaultMessage: 'Intermediate',
        });
      case '3':
        return formatMessage({
          id: 'alm.profile.skillLevel.advanced',
          defaultMessage: 'Advanced',
        });
      default:
        return '';
    }
  };

  const getFormattedSourceString = (source: string) => {
    switch (source) {
      case ADMIN_ASSIGN:
        return formatMessage({
          id: 'alm.profile.skills.adminAssign',
          defaultMessage: 'Added by Admin',
        });
      case LO_ENROLL:
        return formatMessage({
          id: 'alm.profile.skills.loEnroll',
          defaultMessage: 'Added based on your learnings',
        });
      case USER_SELECTED:
        return formatMessage({
          id: 'alm.profile.skills.selfAssigned',
          defaultMessage: 'Self Assigned',
        });
      default:
        return '';
    }
  };
  const getCreditsPercent = (a: number, b: number) => {
    const percent = (a * 100) / b > 100 ? 100 : (a * 100) / b;
    return ' ' + Math.round((percent + Number.EPSILON) * 100) / 100;
  };

  const populateUserSkillInterestLevelData = (userSkillInterest: PrimeUserSkillInterest) => {
    let pointsObject = {};
    let pointsArray = [];
    if (userSkillInterest.userSkills) {
      for (let i = 0; i < userSkillInterest.userSkills.length; i++) {
        const skillEnrollmentDetails = userSkillInterest.userSkills[i].id.split('_');
        const levelId = skillEnrollmentDetails[2];

        if (levelId) {
          pointsObject = {
            levelId: levelId,
            pointsAchieved: userSkillInterest.userSkills[i].pointsEarned,
            totalPoints: userSkillInterest.userSkills[i].skillLevel.maxCredits,
          };
          pointsArray.push(pointsObject);
        }
      }
    }
    return pointsArray;
  };

  const isAddMode = () => {
    return mode === ADD;
  };

  const isViewMode = () => {
    return mode === VIEW;
  };

  const isUpdateMode = () => {
    return mode === update;
  };

  const isInternalTab = () => {
    return selectedTab === INTERNAL;
  };

  const clearSelectedInterest = () => {
    setSelectedInterest([]);
    setSelectedExternalInterest([]);
  };

  useEffect(() => {
    handleClickOnTab(selectedTab.toString());
    setErrorMsg('');
  }, [selectedTab]);

  const updateFrameLoaded = (value: boolean) => {
    setTimeout(() => setIframeLoaded(value), 300);
  };

  const handleClickOnTab = async (tab: string) => {
    setShowLoader(true);
    if (!isViewMode()) {
      if (isInternalTab()) {
        unmountExternalSkillGraph();
        if (filteredSkills.length === 0) {
          await fetchSkills();
        } else {
          setTimeout(() => {
            highlightAllSelectedSkills();
          }, 0);
        }
        updateFrameLoaded(false);
      } else {
        clearSkillRefs();
      }
    } else {
      clearSelectedInterest();
      await fetchUserSkillInterest(tab);
    }
    setShowLoader(false);
  };

  const loadViewMode = () => {
    return isViewMode() && getViewModeSection();
  };

  const getTabMenu = () => {
    return (
      <>
        <Tabs
          UNSAFE_className={styles.skillsTabRow}
          onSelectionChange={setSelectedTab}
          selectedKey={selectedTab}
        >
          <TabList id="tabList" UNSAFE_className={styles.skillTab}>
            <Item key={INTERNAL}>{GetTranslation('alm.adminDefinedSkills', true)}</Item>
            <Item key={EXTERNAL}>{GetTranslation('alm.industryAlignedSkills', true)}</Item>
          </TabList>
          <TabPanels>
            <Item key={INTERNAL}>
              {isViewMode() ? loadViewMode() : isInternalTab() && getInternalSkillUpdateSection()}
            </Item>
            <Item key={EXTERNAL}>
              {isViewMode() ? loadViewMode() : !isInternalTab() && getExternalSkillUpdateSection()}
            </Item>
          </TabPanels>
        </Tabs>
      </>
    );
  };

  const getSkillsHeadingText = () => {
    switch (mode) {
      case ADD:
        return formatMessage({
          id: 'alm.profile.skills.addInterestsHeading',
          defaultMessage: 'Tell us a bit about your interests',
        });
      case update:
        return formatMessage({
          id: 'alm.profile.skills.addToMyInterest',
          defaultMessage: 'Add to my Areas of Interest',
        });
      case VIEW:
        return formatMessage({
          id: 'alm.profile.skills.areasOfInterest',
          defaultMessage: 'My Areas of Interest',
        });
    }
  };

  const getPageHeading = () => {
    return (
      <>
        <div
          className={styles.skillsPageHeading}
          data-skip-link-target="com.adobe.captivateprime.primeskills"
          tabIndex={-1}
        >
          {formatMessage({
            id: 'heading.your.areas.interest',
            defaultMessage: 'Your areas of interest',
          })}
        </div>
      </>
    );
  };
  const getHeaderSection = () => {
    return (
      <>
        <div
          className={`${styles.skillsHeading} ${isViewMode() && styles.extraMargin}`}
          data-skip-link-target="com.adobe.captivateprime.primeskills"
          tabIndex={-1}
        >
          {getSkillsHeadingText()}
        </div>
        {!isViewMode() && (
          <div className={styles.skillsDescription}>
            {isAddMode() &&
              formatMessage({
                id: 'alm.profile.skills.addInterestsSubHeading',
                defaultMessage: 'Select at least one interest to begin with. ',
              })}
            {formatMessage({
              id: 'alm.profile.skills.description',
              defaultMessage: "We'll use them to personalize the learning recommendations.",
            })}
          </div>
        )}
      </>
    );
  };

  const addToSkillsRef = (ref: never) => {
    if (ref && !skillsRef.current.includes(ref)) {
      skillsRef.current.push(ref);
    }
  };

  const loadMoreUserSkillInterestHandler = async () => {
    setShowLoader(true);
    await loadMoreUserSkillInterest();
    setShowLoader(false);
  };

  const getSkillToolTip = (skillInterest: PrimeUserSkillInterest) => {
    return (
      <>
        <div className={styles.arrowUp} aria-hidden={true}></div>
        <div className={styles.skillDataTooltip}>
          {skillInterest.skill.name}
          <br />
          {skillInterest.source !== 'USER_SELECTED' && (
            <div>{getFormattedSourceString(skillInterest.source)}</div>
          )}
          {populateUserSkillInterestLevelData(skillInterest).map((level: any) => {
            return (
              <div key={`${level.levelId}_${skillInterest.skill.id}`}>
                <strong>{getSkillLevelName(level.levelId)}</strong>:
                {getCreditsPercent(level.pointsAchieved, level.totalPoints)}%
                {formatMessage({
                  id: 'alm.profile.skills.achieved',
                  defaultMessage: ' Achieved',
                })}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const getViewModeSection = () => {
    return (
      <>
        {items?.length > 0 && (
          <div className={styles.skillsContainer}>
            {items
              .filter(skillInterest => skillInterest.skill.name.toLowerCase() !== GENERAL)
              .map(skillInterest => {
                const id = skillInterest.skill.id;
                return (
                  <div
                    key={id}
                    className={styles.skillBox}
                    tabIndex={0}
                    id={'skill-' + id}
                    aria-labelledby={'skillName-' + id}
                    role="group"
                    onMouseLeave={(event: any) => {
                      removeFocus(event);
                    }}
                  >
                    <div className={styles.skillName} aria-hidden={true}>
                      {skillInterest.skill.name}
                    </div>
                    <div className={styles.srOnly} id={'skillName-' + id}>
                      {getSkillToolTip(skillInterest)}
                    </div>
                    <div className={styles.removeSkillContainer}>
                      <button
                        onClick={() => {
                          removeSkillInterest(id);
                        }}
                        className={styles.removeInterestButton}
                        aria-label={formatMessage({
                          id: 'alm.profile.skills.removeInterest',
                          defaultMessage: 'Remove from My interests',
                        })}
                        title={formatMessage({
                          id: 'alm.profile.skills.removeInterest',
                          defaultMessage: 'Remove from My interests',
                        })}
                      >
                        <Close />
                      </button>
                    </div>
                    {getSkillToolTip(skillInterest)}
                  </div>
                );
              })}
          </div>
        )}
        {!showLoader &&
          noSkillInterestPresent() &&
          getNoSkillSection('alm.profile.skills.noSkillInterest')}
        {hasMoreItems && (
          <>
            {getButton(
              styles.showMoreButton,
              'alm.profile.skills.viewMore',
              'View more',
              loadMoreUserSkillInterestHandler,
              true
            )}
          </>
        )}
      </>
    );
  };

  const getNoSkillSection = (key: string) => {
    return (
      <>
        <div className={styles.noSkillsContainer}>
          {NO_SKILL_INTEREST_SVG()}
          <div>{GetTranslation(key, true)}</div>
        </div>
      </>
    );
  };

  const enterKeyPressed = (event: any) => {
    return event.key === ENTER || event.keyCode === 13;
  };

  const onChangeHandler = (event: any) => {
    setSearchString(event.target.value);
  };

  const handleSearchInput = async (event: any) => {
    if (enterKeyPressed(event)) {
      if (searchString) {
        setShowLoader(true);
        await searchSkill(searchString);
        setShowLoader(false);
      } else {
        fetchSkills();
      }
    }
  };

  const getNewIframe = () => {
    const iframeDoc =
      (iframeRef.current as any).contentDocument ||
      (iframeRef.current as any).contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(
      `<!DOCTYPE html><html style="${getAttrStyle('html')}"><head></head><body style='margin:0'><div id='${EXTERNAL_SKILL_IFRAME_ID}' style='overflow:hidden'></div></body></html>`
    );
    iframeDoc.close();
    return iframeDoc;
  };

  const loadExternalSkillFrame = () => {
    if (!iframeRef.current) return;
    const iframeDoc = getNewIframe();
    addBodyStyles(iframeDoc);
    addExternalFontLink(iframeDoc);
    addExternalSkillFrameCss(iframeDoc, stylesExternal);
    copyStyleSheetsToChildFrame(iframeDoc);
    // Render the component into the iframe's root element
    ReactDOM.render(
      <ExternalSkillGraphComponent
        selectedExternalInterest={selectedExternalInterest}
        setSelectedExternalInterest={setSelectedExternalInterest}
        ref={externalSkillGraphRef}
      />,
      iframeDoc.getElementById(EXTERNAL_SKILL_IFRAME_ID)
    );
  };

  const getSkillSearchSection = () => {
    return (
      <>
        <span className={styles.searchBox} id="searchBox" role="search">
          <input
            id={SKILL_INPUT}
            automation-id={SKILL_INPUT}
            className={styles.skillInput}
            autoComplete="off"
            onKeyUp={handleSearchInput}
            onChange={onChangeHandler}
            placeholder={GetTranslation('alm.skillSearchPlaceholder', true)}
            aria-label={GetTranslation('alm.skillSearchPlaceholder', true)}
            value={searchString}
          />
          <span className={styles.searchIcon}>
            <Search />
          </span>
        </span>
      </>
    );
  };

  const getInternalSkillUpdateSection = () => {
    return (
      <>
        {isUpdateMode() && getSkillSearchSection()}
        {filteredSkills?.length > 0 && (
          <>
            <div className={styles.skillsContainer}>
              {getFilteredSkills().map((skill: PrimeSkill, index: number) => (
                <button
                  key={skill.id}
                  className={styles.skillBoxSelectable}
                  tabIndex={0}
                  id={`${SKILL.toLowerCase()}-${skill.id}`}
                  aria-labelledby={`${SKILL_NAME}-${skill.id}`}
                  onClick={(event: any) => {
                    toggleSkillSelection(index);
                  }}
                  onMouseLeave={(event: any) => {
                    removeFocus(event);
                  }}
                  ref={addToSkillsRef}
                  aria-pressed={false}
                >
                  <span className={styles.skillNameSelectable}>{skill.name}</span>
                  <span
                    id={`${SKILL.toLowerCase()}-${skill.id}-tick`}
                    className={styles.selectedTick}
                  >
                    <CheckmarkCircle />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {hasMoreSkills &&
          getButton(
            styles.showMoreButton,
            'alm.profile.skills.exploreMore',
            'Explore more',
            loadMoreSkillsHandler,
            true
          )}
        {!showLoader && noSkillPresent() && getNoSkillSection('alm.profile.skills.noSkill')}
      </>
    );
  };

  useEffect(() => {
    if (iframeLoaded && iframeRef.current) {
      loadExternalSkillFrame();
    }
  }, [iframeLoaded]);
  const getExternalSkillUpdateSection = () => {
    updateFrameLoaded(true);
    return (
      <iframe
        id={EXTERNAL_SKILL_IFRAME_ID}
        className={styles.externalFrame}
        ref={iframeRef}
        title="iframe-component"
        src="about:blank"
      ></iframe>
    );
  };

  const getButton = (
    className: string,
    key: string,
    value: string,
    handler: any,
    withIcon?: boolean
  ) => {
    return (
      <button className={className} onClick={handler}>
        {formatMessage({
          id: key,
          defaultMessage: value,
        })}
        {withIcon && (
          <div className={styles.primeDownCaret}>
            <ChevronDown />
          </div>
        )}
      </button>
    );
  };

  const showAddInterestButton = () => {
    return !isPrlEnabled && showAddInterest;
  };
  const getActionButtons = () => {
    return (
      <>
        <div className={isViewMode() ? styles.actionButtonArea : styles.editActionButtonArea}>
          {isViewMode() && (
            <>
              {showHomePageLink &&
                getButton(
                  `${ALM_BUTTON} ${styles.secondaryButton} ${styles.actionButton}`,
                  'alm.profile.skills.goToHome',
                  'Go to Home',
                  goToHomeHandler
                )}
              {showAddInterestButton() &&
                getButton(
                  `${ALM_BUTTON} ${PRIMARY} ${styles.actionButton}`,
                  'alm.profile.skills.addInterest',
                  'Add Interest',
                  editSkillInterestHandler
                )}
            </>
          )}
          {isUpdateMode() &&
            getButton(
              `${ALM_BUTTON} ${styles.secondaryButton} ${styles.editActionButton}`,
              'back',
              'Back',
              loadDefaultState
            )}
          {!isViewMode() && (
            <>
              {getButton(
                `${ALM_BUTTON} ${PRIMARY} ${styles.editActionButton}`,
                'add',
                'Add',
                saveSkillInterest
              )}
            </>
          )}
        </div>
      </>
    );
  };

  const showInterestHeader = () => {
    return (
      <div
        className={styles.skillHeading}
        data-skip-link-target="com.adobe.captivateprime.skills.interests"
        tabIndex={-1}
      >
        {GetTranslation('alm.community.board.skills', true)}
      </div>
    );
  };

  const isPrlAndHasSkillInterest = () => {
    return isPrlEnabled && items.length > 0;
  };

  const showSkillsSection = () => {
    return !isPrlEnabled || isPrlAndHasSkillInterest();
  };

  return (
    <>
      <ALMErrorBoundary>
        <Provider theme={lightTheme} colorScheme={'light'}>
          <section id="skills-section" className={styles.skillsArea}>
            {showLoader && <ALMLoader classes={styles.primeLoaderWrapper} />}
            {isPrlEnabled && getPageHeading()}
            <PrlPreferenceSection />
            <section id="interests-section" className={styles.interestsArea}>
              {!isPrlEnabled && getHeaderSection()}
              {isPrlAndHasSkillInterest() && showInterestHeader()}
              {showTabs && showSkillsSection() && getTabMenu()}
              {!showTabs && isViewMode() && showSkillsSection() && getViewModeSection()}
              {!showTabs && !isViewMode() && getInternalSkillUpdateSection()}
              {errorMsg && <span className={styles.errorMsg}>{errorMsg}</span>}
              {showSkillsSection() && getActionButtons()}
            </section>
          </section>
        </Provider>
      </ALMErrorBoundary>
    </>
  );
};

export default ALMSkillComponent;
