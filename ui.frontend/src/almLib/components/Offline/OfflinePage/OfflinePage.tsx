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
import { getALMConfig, getALMObject, getQueryParamsFromUrl } from '../../../utils/global';
import { ALMBackButton } from '../../Common/ALMBackButton';
import { ALMErrorBoundary } from '../../Common/ALMErrorBoundary';
import { Button, lightTheme, Provider } from '@adobe/react-spectrum';
import styles from './OfflinePage.module.css';
import { sendEventsToApp } from '../../../utils/mobileAppUtils/appUtils';
import { NetworkStatus, NATIVEAPPEVENTS } from '../../../utils/mobileAppUtils/appConstants';
import { GetTranslation } from '../../../utils/translationService';
import { OFFLINE_ICON } from '../../../utils/inline_svg';

const OfflinePage = () => {
  const handleDownloadClick = (): void => {
    // event.stopPropagation();
    const { networkStatus } = getQueryParamsFromUrl();
    if (networkStatus === NetworkStatus.OFFLINE) {
      getALMObject().navigateToDownloadsPage?.();
    } else {
      getALMObject().navigateToDownloadsPage?.();
      sendEventsToApp(NATIVEAPPEVENTS.RELOAD_IMMERSIVE, {
        loadDownloadsPage: true,
        networkStatus: NetworkStatus.OFFLINE,
      });
    }
  };

  const handleRetryClick = (): void => {
    // event.stopPropagation();
    sendEventsToApp(NATIVEAPPEVENTS.RETRY_NETWORK_CONNECTION, {});
  };

  return (
    <ALMErrorBoundary>
      <Provider theme={lightTheme} colorScheme={'light'}>
        <div className={styles.backgroundPage}>
          {!getALMConfig().hideBackButton && <ALMBackButton />}
          <section className={styles.pageContainer}>
            {OFFLINE_ICON(GetTranslation('app.aria.offlineIcon'))}
            <h2>{GetTranslation('app.offlineText')}</h2>
            <p>{GetTranslation('app.offlinePageText')}</p>
            <Button variant="cta" type="button" onPress={handleDownloadClick}>
              <span>{GetTranslation('app.goToDownloads')}</span>
            </Button>
            <Button variant="secondary" onPress={handleRetryClick}>
              {GetTranslation('app.retry')}
            </Button>
          </section>
        </div>
      </Provider>
    </ALMErrorBoundary>
  );
};

export default OfflinePage;
