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
import { RangeSlider, NumberField } from '@adobe/react-spectrum';
import { useEffect, useState } from 'react';
import {
  FilterType,
  canResetLevelsFilter,
  canShowLevelsForProducts,
  canShowLevelsForRoles,
} from '../../../utils/filters';
import { getALMObject, getQueryParamsFromUrl } from '../../../utils/global';
import { canShowPriceFilter } from '../../../utils/price';
import { GetTranslation } from '../../../utils/translationService';
import { ALMLoader } from '../../Common/ALMLoader';
import styles from './PrimeCatalogFilters.module.css';
import { clearLevelsFilter, updateShowFilterLists } from '../../../store';
import { useDispatch } from 'react-redux';
import { FILTER, LEVELS, SEARCHED_FILTER_TYPES } from '../../../utils/constants';
import { CATALOG_FILTERS_LOADER } from '../../../utils/inline_svg';
import store from '../../../../store/APIStore';
import PrimeCatalogFilterListItem from './PrimeCatalogFilterListItem';
import React from 'react';
import { useDeviceTypeContext } from '../../../contextProviders/DeviceContextProvider';
import { useDialog } from '../../../contextProviders/ALMDialogContextProvider';
import PrimeCatalogFiltersMobile from './PrimeCatalogFiltersMobile';
import { isAttributeEnabled } from '../../../utils/catalog';

const START = 'start';
const END = 'end';
const INITIAL_START = 0;
const INITIAL_END = 0;

type TrainingPrice = { start: number; end: number };

const PrimeCatalogFilters: React.FC<any> = (props: any) => {
  const {
    filterState,
    updateFilters,
    catalogAttributes,
    updatePriceRangeFilter,
    account,
    resetFilterList,
    resetFilters,
    areFiltersLoading,
    searchFilters,
    clearFilterSearch,
    updateFilterList,
    getSelectedFilters,
  } = props;

  const { priceRange } = filterState;

  if (filterState?.isLoading) {
    return <ALMLoader />;
  }

  const dispatch = useDispatch();
  const deviceContext = useDeviceTypeContext();
  const { isOpen } = useDialog();
  const filters = [...Object.values(filterState)];
  const filterStateFromStore = store.getState().catalog.filterState || {};
  const showFilterLists = filterStateFromStore.showFilterLists;
  const isLoggedIn = getALMObject().isPrimeUserLoggedIn();
  const isMobileOrTablet = deviceContext.isMobile || deviceContext.isTablet;

  const [trainingPrice, setTrainingPrice] = useState<TrainingPrice>({
    start: INITIAL_START,
    end: INITIAL_END,
  });

  useEffect(() => {
    const { levels } = filterState;
    const { prlCriteria } = account;
    if (!prlCriteria || !prlCriteria.enabled || !levels) {
      return;
    }

    if (canResetLevelsFilter(prlCriteria, filterState)) {
      resetFilterList(LEVELS);
      dispatch(clearLevelsFilter());
    }
  }, [filterState.products, filterState.roles]);

  useEffect(() => {
    if (priceRange) {
      setTrainingPrice({
        start: priceRange.list[0].value,
        end: priceRange.list[1].value || priceRange.maxPrice,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange?.maxPrice, JSON.stringify(priceRange?.list)]);

  const priceChangeHandler = (data: any) => {
    updatePriceRangeFilter({
      filterType: FILTER.PRICE_RANGE,
      data,
    });
  };

  const inputEnterKeyHandler = (event: any, type: string) => {
    if (event.key === 'Enter') {
      let value = (event.target as HTMLInputElement)?.value;
      value = value.replaceAll(',', '');
      changeTrainingPriceHandle(type, value);
    }
  };

  const changeTrainingPriceHandle = (type: string, value: number | string) => {
    let parsedValue = parseInt((value as string) || '0');
    if (type === START) {
      parsedValue = Math.max(0, Math.min(parsedValue, trainingPrice.end));
    } else {
      parsedValue = Math.min(priceRange.maxPrice, Math.max(parsedValue, trainingPrice.start));
    }

    setTrainingPrice(price => {
      let data = { ...price, [type]: parsedValue };
      updatePriceRangeFilter({
        filterType: FILTER.PRICE_RANGE,
        data,
      });
      return data;
    });
  };

  const showClearFiltersButton = () => {
    const queryParams = getQueryParamsFromUrl();
    for (let qp in queryParams) {
      const filterType = filterState[qp];
      if (filterType) {
        // Check if catalog filter is disabled and query param has catalog, then skip showing button
        if (qp === FILTER.CATALOGS && !isAttributeEnabled(catalogAttributes[FILTER.CATALOGS])) {
          continue;
        }
        return (
          <button className={styles.clearAllFiltersBtn} onClick={() => resetFilters()}>
            {GetTranslation('alm.filter.clearAll')}
          </button>
        );
      }
    }
  };
  if (areFiltersLoading && deviceContext.isDesktop) {
    return (
      <>
        <div className={styles.primeFilterContainer}>
          <div className={styles.filterHeader}>
            <h3 className={styles.filtersLabel}>{GetTranslation('alm.catalog.filters')}</h3>
            {showClearFiltersButton()}
          </div>
          {CATALOG_FILTERS_LOADER()}
        </div>
      </>
    );
  }

  const selectedFilter: FilterType =
    filters.find((filter: any) => {
      return filter.type === showFilterLists;
    }) || (filters[0] as FilterType);

  const filterOrder = [
    FILTER.ANNOUNCED_GROUPS,
    FILTER.CATALOGS,
    FILTER.PRODUCTS,
    FILTER.ROLES,
    FILTER.LEVELS,
    FILTER.LO_TYPES,
    FILTER.LO_FORMAT,
    FILTER.DURATION,
    FILTER.SKILL_NAME,
    FILTER.SKILL_LEVEL,
    FILTER.TAG_NAME,
    FILTER.LEARNER_STATE,
    FILTER.CITIES,
    FILTER.PRICE,
    FILTER.PRICE_RANGE,
  ];

  const showPriceRangeFilter = (filter: any) => {
    return catalogAttributes[FILTER.PRICE_RANGE] === 'true' && filter && filter.maxPrice;
  };

  const renderPriceRangeFilter = (filter: any) => {
    return showPriceRangeFilter(filter) ? (
      <div key={FILTER.PRICE_RANGE} className={styles.container}>
        <h3
          className={`${styles.typeLabel} ${styles.price}`}
          data-automationid="priceRangeFilterLabel"
        >
          {GetTranslation('alm.catalog.filter.priceRange.label', true)}
        </h3>
        <div className={styles.listContainer}>
          <RangeSlider
            label={GetTranslation('alm.catalog.filter.range.label')}
            value={trainingPrice}
            onChange={setTrainingPrice}
            onChangeEnd={priceChangeHandler}
            maxValue={priceRange.maxPrice}
            showValueLabel={false}
            width={'100%'}
            UNSAFE_className={styles.customSlider}
            data-automationid={`input:::selectedprice:::${trainingPrice}`}
          />
          <div className={styles.priceFilterContainer}>
            <div>
              <NumberField
                value={trainingPrice.start}
                onChange={value => changeTrainingPriceHandle(START, value)}
                minValue={0}
                maxValue={priceRange.maxPrice}
                width={'size-1200'}
                onKeyUp={event => inputEnterKeyHandler(event, START)}
                data-automationid={`input::startprice:::${trainingPrice.start}`}
              ></NumberField>
            </div>
            <div className={styles.priceToLabel}>{GetTranslation('to')}</div>
            <div>
              <NumberField
                value={trainingPrice.end}
                onChange={value => changeTrainingPriceHandle(END, value)}
                minValue={0}
                maxValue={priceRange.maxPrice}
                onKeyUp={event => inputEnterKeyHandler(event, END)}
                width={'size-1200'}
                data-automationid={`input::endprice:::${trainingPrice.end}`}
              ></NumberField>
            </div>
          </div>
        </div>
      </div>
    ) : null;
  };

  const renderFilterList = (
    filter: any,
    minimumValuesToDisplayFilter = 1,
    isFilterListEmpty = false
  ) => {
    const filterContainerId = `filterContainer${filter.type}`;
    const noResultsFound = filter && SEARCHED_FILTER_TYPES.has(filter.type) && isFilterListEmpty;
    const isFilterInvalid =
      !filter || !filter.list || (filter.list && filter.list.length < minimumValuesToDisplayFilter);
    const showFilters = noResultsFound || !isFilterInvalid;
    if (isFilterInvalid && !showFilters) {
      return null;
    }
    return catalogAttributes[filter.type] === 'true' ? (
      isMobileOrTablet ? (
        filter.type
      ) : (
        <div key={filter.type}>
          <h3 className={styles.typeLabel} data-automationid="filtersText" id={filterContainerId}>
            {GetTranslation(filter?.label, true)}
          </h3>
          <PrimeCatalogFilterListItem
            filter={filter}
            searchFilters={searchFilters}
            updateFilters={updateFilters}
            clearFilterSearch={clearFilterSearch}
            showNoResultsFound={isFilterListEmpty}
            showFilterLists={showFilterLists}
          />
        </div>
      )
    ) : null;
  };

  const renderAllFilters = () => {
    return filterOrder.map((filterType: string) => {
      const filter = filterState[filterType];
      const noOfValuesToDisplay = 1;
      if (!filter) {
        return null;
      }
      if (filterType === FILTER.CATALOGS) {
        const isFilterListEmpty = !filter?.list || filter.list?.length === 0;
        return renderFilterList(filter, noOfValuesToDisplay, isFilterListEmpty);
      }
      if (filterType === FILTER.LEVELS) {
        if (canShowLevelsForProducts(account, filterState)) {
          return renderFilterList(filter);
        }
        if (canShowLevelsForRoles(account, filterState)) {
          return renderFilterList(filter);
        }
        return null;
      }
      if (filterType === FILTER.SKILL_NAME) {
        const isFilterListEmpty = !filter?.list || filter.list?.length === 0;
        return renderFilterList(filter, noOfValuesToDisplay, isFilterListEmpty);
      }
      if (filterType === FILTER.TAG_NAME) {
        const isFilterListEmpty = !filter?.list || filter.list?.length === 0;
        return renderFilterList(filter, noOfValuesToDisplay, isFilterListEmpty);
      }
      if (filterType === FILTER.LEARNER_STATE) {
        if (isLoggedIn) {
          return renderFilterList(filter);
        }
        return null;
      }
      if (filterType === FILTER.PRICE) {
        if (canShowPriceFilter(account)) {
          return renderFilterList(filter);
        }
        return null;
      }
      if (filterType === FILTER.PRICE_RANGE) {
        if (canShowPriceFilter(account)) {
          return isMobileOrTablet
            ? showPriceRangeFilter(filter)
              ? filter.type
              : null
            : renderPriceRangeFilter(filter);
        }
        return null;
      }
      return renderFilterList(filter);
    });
  };

  const getEnabledFilters = () => {
    return renderAllFilters().filter((type: string) => {
      return type !== null;
    });
  };

  return (
    <div className={styles.primeFilterContainer}>
      {deviceContext.isMobile || deviceContext.isTablet ? (
        isOpen('alm-filters-dialog') ? (
          <PrimeCatalogFiltersMobile
            filterState={filterState}
            filterOrder={getEnabledFilters()}
            selectedFilter={selectedFilter}
            updateShowFilterLists={updateShowFilterLists}
            renderPriceRangeFilter={renderPriceRangeFilter}
            searchFilters={searchFilters}
            updateFilters={updateFilters}
            clearFilterSearch={clearFilterSearch}
            showFilterLists={showFilterLists}
            updateFilterList={updateFilterList}
            showClearFiltersButton={showClearFiltersButton}
            updatePriceRangeFilter={updatePriceRangeFilter}
            resetFilters={resetFilters}
            getSelectedFilters={getSelectedFilters}
          />
        ) : null
      ) : (
        <>
          <div className={styles.filterHeader}>
            <h3 className={styles.filtersLabel} id="filterText">
              {GetTranslation('alm.catalog.filters')}
            </h3>
            {showClearFiltersButton()}
          </div>
          {renderAllFilters()}
        </>
      )}
    </div>
  );
};

export default PrimeCatalogFilters;
