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

import React, { useMemo } from 'react';
import { IntlProvider } from 'react-intl';

import { mountingPoints } from './config/config';

import { AppContextProvider } from './contextProviders';
import { CommerceContextProvider } from './almLib';

import {
  ActiveFieldsContainter,
  ALMSkillComponent,
  ALMUserProfile,
  Portal,
  PrimeCatalogContainer,
  PrimeCommunityBoardList,
  PrimeCommunityBoardPage,
  PrimeInstancePage,
  PrimeNotificationContainer,
  PrimeTrainingPage,
  ALMMasthead,
  ALMCategoryBrowser,
  ALMNavigationBar,
  ALMFooter,
  PrlPreferenceSection,
} from './almLib';
import ALMPrimeWidgets from './almLib/components/Widgets/ALMPrimeWidgets/ALMPrimeWidgets';
import ALMWidgetContainer, {
  ALMWidgetProps,
} from './almLib/components/ALMWidgetContainer/ALMWidgetContainer';
import { PrimeAuthorPage } from './almLib/components/Author';
import './almLib/utils/global';
import './App.css';

/**
 * Props interface for the main App component
 */
interface AppProps {
  locale: string;
  messages: Record<string, string>;
}

/**
 * Configuration for portal components mapping
 */
interface PortalConfig {
  selector: string;
  component: React.ReactNode;
  id: string;
}

/**
 * Creates the portal configuration array
 */
const createPortalConfigs = (): PortalConfig[] => [
  {
    id: 'notification-container',
    selector: mountingPoints.notificationContainer,
    component: <PrimeNotificationContainer />,
  },
  {
    id: 'catalog-container',
    selector: mountingPoints.catalogContainer,
    component: <PrimeCatalogContainer />,
  },
  {
    id: 'training-overview-page',
    selector: mountingPoints.trainingOverviewPage,
    component: <PrimeTrainingPage />,
  },
  {
    id: 'instance-container',
    selector: mountingPoints.instanceContainer,
    component: <PrimeInstancePage />,
  },
  {
    id: 'profile-page-container',
    selector: mountingPoints.profilePageContainer,
    component: <ALMUserProfile />,
  },
  {
    id: 'user-skills-container',
    selector: mountingPoints.userSkillsContainer,
    component: <ALMSkillComponent />,
  },
  {
    id: 'active-fields-container',
    selector: mountingPoints.activeFieldsContainer,
    component: <ActiveFieldsContainter />,
  },
  {
    id: 'board-container',
    selector: mountingPoints.boardContainer,
    component: <PrimeCommunityBoardPage />,
  },
  {
    id: 'boards-container',
    selector: mountingPoints.boardsContainer,
    component: <PrimeCommunityBoardList />,
  },
  {
    id: 'navigation-bar-container',
    selector: mountingPoints.navigationBarContainer,
    component: <ALMNavigationBar />,
  },
  {
    id: 'masthead-container',
    selector: mountingPoints.mastHeadContainer,
    component: <ALMMasthead />,
  },
  {
    id: 'category-browser-container',
    selector: mountingPoints.categoryBrowserContainer,
    component: <ALMCategoryBrowser />,
  },
  {
    id: 'footer-container',
    selector: mountingPoints.footerContainer,
    component: <ALMFooter />,
  },
  {
    id: 'author-container',
    selector: mountingPoints.authorContainer,
    component: <PrimeAuthorPage />,
  },
  {
    id: 'user-recommendations-container',
    selector: mountingPoints.userRecommendationsContainer,
    component: <PrlPreferenceSection />,
  },
  {
    id: 'home-page-widgets',
    selector: mountingPoints.homePageWidgets,
    component: <ALMPrimeWidgets />,
  },
];

/**
 * Main application component that sets up the portal structure
 * and renders all major application sections using React portals.
 *
 * @param props - The component props containing locale and messages
 * @returns The main application component
 */
const App: React.FC<AppProps> = ({ locale, messages }) => {
  console.log('App: Component is rendering with locale:', locale);

  const portalConfigs = useMemo(() => {
    console.log('App: Creating portal configs');
    return createPortalConfigs();
  }, []);

  const renderedPortals = useMemo(() => {
    console.log('App: Creating rendered portals, count:', portalConfigs.length);
    return portalConfigs.map(({ selector, component, id }) => {
      console.log(`App: Creating portal for ${id} with selector: ${selector}`);
      return (
        <Portal key={`portal-${id}`} selector={selector}>
          {component}
        </Portal>
      );
    });
  }, [portalConfigs]);

  const renderedWidgets = useMemo(() => {
    const widgetContainers = Array.from(
      document.querySelectorAll<HTMLElement>(mountingPoints.genericWidgetContainer)
    );
    return widgetContainers.map(container => {
      let widgetProps: ALMWidgetProps = {
        widgetId: '',
        widgetRef: '',
        params: {},
      };
      try {
        widgetProps = JSON.parse(container.dataset.widgetProps || '') as ALMWidgetProps;
      } catch (error) {
        console.error(
          `Error parsing widget props for container ${container.dataset.widgetProps}:`,
          error
        );
      }
      return (
        <ALMWidgetContainer
          key={`container-${widgetProps.widgetId}`}
          container={container}
          widgetProps={widgetProps}
        />
      );
    });
  }, []);

  return (
    <IntlProvider locale={locale} messages={messages}>
      <div id="alertDialog"></div>
      <CommerceContextProvider>
        <AppContextProvider>
          {renderedPortals}
          {renderedWidgets}
        </AppContextProvider>
      </CommerceContextProvider>
    </IntlProvider>
  );
};

export default App;
