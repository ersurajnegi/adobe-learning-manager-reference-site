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
import { SearchField } from '@adobe/react-spectrum';
import { GetTranslation } from '../../../utils/translationService';
import styles from './PrimeCatalogFilters.module.css';
import { ALMLoader } from '../../Common/ALMLoader';
import { ALL, FILTER, SEARCHED_FILTER_TYPES } from '../../../utils/constants';
import store from '../../../../store/APIStore';
import PrimeCheckbox from './PrimeCheckBox';
import { useMemo } from 'react';
import React from 'react';
import { useDeviceTypeContext } from '../../../contextProviders/DeviceContextProvider';

const PrimeCatalogFilterListItem: React.FC<any> = React.memo((props: any) => {
  const { filter, searchFilters, updateFilters, clearFilterSearch, showNoResultsFound } = props;

  if (!filter) {
    return null;
  }

  const deviceContext = useDeviceTypeContext();
  const filterContainerId = `filterContainer${filter.type}`;
  const classes = filter.type === 'levels' ? `${styles.levelsFilter}` : '';
  const filterType = filter.type;
  const containerClasses =
    filterType === 'levels'
      ? `${styles.container} ${styles.levelsFilterContainer}`
      : `${styles.container}`;

  const filterStateFromStore = store.getState().catalog.filterState || {};
  const selectedItems: { [key: string]: boolean } = filterStateFromStore[filterType as never];
  // create a LocalSelectedItems state to store changes locally

  const showFilterLists = filterStateFromStore.showFilterLists;
  // console.log("localSelectedItems", localSelectedItems);
  const FilterListItem: React.FC<any> = (props: any) => {
    const { filterItem } = props;
    let isItemChecked = filterItem.checked;

    if (filter.canSearch) {
      isItemChecked = selectedItems[filterItem.value] || false;
      if (SEARCHED_FILTER_TYPES.has(filterType)) {
        isItemChecked = filterItem.checked;
      }
    }

    return (
      <PrimeCheckbox
        filterType={filterType!}
        label={filterItem.label}
        checked={isItemChecked}
        changeHandler={updateFilters}
        isListDynamic={filter.isListDynamic}
        automationId={`input-${filterItem.label}:::selected:::${isItemChecked}`}
      />
    );
  };

  const renderFilterListItems = () => {
    if (filter.isLoading && SEARCHED_FILTER_TYPES.has(filter.type)) {
      return <ALMLoader classes={styles.loader} />;
    }

    if (showNoResultsFound) {
      return (
        <li key={GetTranslation('alm.text.noResultsFound')}>
          {GetTranslation('alm.text.noResultsFound')}
        </li>
      );
    }
    return filter.list?.map((filterItem: any, index: number) => (
      <li key={`${filterItem.label}-${index}`} className={styles.item}>
        <FilterListItem filterItem={filterItem} />
      </li>
    ));
  };

  const renderFilterSearch = useMemo(() => {
    return (
      <div style={{ marginBottom: '10px' }}>
        <SearchField
          placeholder={GetTranslation(`alm.catalog.${filter.type}.search.placeholder`, true)}
          onChange={query => {
            searchFilters(query, filter.type);
          }}
          data-automationid={`filterSearchField${filter.type}`}
          onClear={() => {
            clearFilterSearch(filter.type);
          }}
          height="30px"
          width="100%"
        />
      </div>
    );
  }, [filter.type]);
  return (
    <div
      key={filter.type}
      className={containerClasses}
      role="group"
      aria-labelledby={`filterText ${filterContainerId}`}
    >
      {(deviceContext.isDesktop || showFilterLists === ALL || showFilterLists === filter.type) && (
        <>
          {filter.canSearch && renderFilterSearch}
          <ul className={styles.listContainer}>{renderFilterListItems()}</ul>
        </>
      )}
    </div>
  );
});

export default PrimeCatalogFilterListItem;
