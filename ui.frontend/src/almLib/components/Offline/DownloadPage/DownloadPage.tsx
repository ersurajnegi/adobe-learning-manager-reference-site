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
import { getALMConfig } from '../../../utils/global';
import { ALMBackButton } from '../../Common/ALMBackButton';
import { ALMErrorBoundary } from '../../Common/ALMErrorBoundary';
import { lightTheme, Provider } from '@adobe/react-spectrum';
import styles from './DownloadPage.module.css';
import { PrimeTrainingList } from '../../Catalog/PrimeTrainingList';
import {
  showEffectivenessIndex,
  showRating,
} from '../../Widgets/ALMPrimeStrip/ALMPrimeStrip.helper';
import { useSelector } from 'react-redux';
import { State } from '../../../store/state';
import { GetTranslation } from '../../../utils/translationService';

const DownloadPage = () => {
  const listvals = useSelector((state: State) => state.catalog.offlineTrainings);
  const account = useSelector((state: State) => state.account);

  const getListViewHtml = (trainings: any[]) => {
    return (
      <ul className={styles.primeTrainingsList} data-automationid={'trainingsList'}>
        {trainings?.map(training => {
          return (
            <PrimeTrainingList
              training={training}
              key={`${training.id}-list`}
              guest={false}
              account={account}
              showRating={showRating(training, account)}
              showEffectivenessIndex={showEffectivenessIndex(training, account)}
            ></PrimeTrainingList>
          );
        })}
      </ul>
    );
  };

  return (
    <ALMErrorBoundary>
      <Provider theme={lightTheme} colorScheme={'light'}>
        <div className={styles.backgroundPage}>
          {!getALMConfig().hideBackButton && <ALMBackButton />}
          <section className={styles.pageContainer}>
            <div>
              <h2>{GetTranslation('app.downloadsPage')}</h2>
              {listvals && listvals.length
                ? getListViewHtml(listvals)
                : GetTranslation('app.noDownloadsAvailable')}
            </div>
          </section>
        </div>
      </Provider>
    </ALMErrorBoundary>
  );
};

export default DownloadPage;
