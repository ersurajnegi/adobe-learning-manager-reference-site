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
import { useState } from 'react';
import { PrimeAccount, PrimeCatalog, PrimeUser } from '../../../models';
import { GetTileColorFromIndex } from '../../../utils/themes';
import { Widget } from '../../../utils/widgets/common';
import styles from './ALMBrowseCatalog.module.css';
import { getALMObject } from '../../../utils/global';

const ALMBrowseCatalog: React.FC<{
  widget?: Widget;
  catalog: PrimeCatalog;
  account: PrimeAccount;
  user: PrimeUser;
  index: number;
}> = ({ catalog, index }) => {
  const [tileColor] = useState<string>(() => {
    return GetTileColorFromIndex(index);
  });

  const getBackgroundStyle = () => {
    const imageUrl = catalog.imageUrl || '';
    return imageUrl ? { backgroundImage: `url("${imageUrl}")` } : { backgroundColor: tileColor };
  };

  const cardClickHandler = () => {
    getALMObject().navigateToCatalogPage({ selectedListableCatalogIds: catalog.id });
  };
  return (
    <button
      className={`${styles.card} ${catalog.imageUrl ? styles.hasImage : ''}`}
      style={{ ...getBackgroundStyle() }}
      onClick={cardClickHandler}
      data-automationid={catalog.name}
      aria-label={catalog.name}
    >
      <span className={styles.textContainer}>{catalog.name}</span>
    </button>
  );
};

export default ALMBrowseCatalog;
