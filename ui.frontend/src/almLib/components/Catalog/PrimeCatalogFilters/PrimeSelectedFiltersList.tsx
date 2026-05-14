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

import React, { useState } from 'react';
import styles from './PrimeSelectedFiltersList.module.css'; //change it
import { CLOSE_SVG } from '../../../utils/inline_svg';
import { GetTranslation } from '../../../utils/translationService';
import { FILTER } from '../../../utils/constants';

const maxVisibleFilters = 5;
const PrimeSelectedFiltersList = (props: any) => {
  const { updateFilters, updatePriceRangeFilter, selectedFilters } = props;

  const [showAll, setShowAll] = useState(false);

  const toggleShowAll = () => {
    setShowAll(prevState => !prevState);
  };

  const removeFilter = (filter: any) => {
    if (filter.filterType === FILTER.PRICE_RANGE) {
      filter.data.start = 0;
      filter.data.end = 0;
      updatePriceRangeFilter(filter);
    } else if (filter.filterType === FILTER.CATALOGS && filter.data?.id) {
      // Allow removal even if option isn't present in the visible list
      updateFilters({ filterType: FILTER.CATALOGS, label: filter.data.id, checked: false });
    } else {
      filter.checked = false;
      updateFilters(filter);
    }
  };

  // Render the selected filters
  const filtersToRender = showAll
    ? selectedFilters
    : selectedFilters && selectedFilters.slice(0, maxVisibleFilters);

  return (
    <div className={styles.selectedFiltersContainer}>
      {filtersToRender &&
        filtersToRender.map((filter: any, filterIndex: any) => (
          <div key={filterIndex} className={styles.selectedFilter}>
            <span className={styles.selectedFilterText} title={filter.labelToShow}>
              {filter.labelToShow}
            </span>
            <button
              className={styles.removeFilterButton}
              onClick={() => removeFilter(filter)}
              aria-label={filter.labelToShow}
              data-automationid={`removeFilter${filter.labelToShow}`}
            >
              {CLOSE_SVG()}
            </button>
          </div>
        ))}
      {selectedFilters && selectedFilters.length > maxVisibleFilters ? (
        <button className={styles.showFiltersButton} onClick={() => toggleShowAll()}>
          {!showAll ? GetTranslation('alm.text.showMore') : GetTranslation('alm.text.showLess')}
        </button>
      ) : (
        ''
      )}
    </div>
  );
};

export default PrimeSelectedFiltersList;
