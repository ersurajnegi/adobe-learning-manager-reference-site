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
import React, { useEffect, useMemo, useState } from 'react';
import { ALMDialog, ALMDialogContent, ALMDialogFooter, ALMDialogHeader } from '../../ALMDialog';
import { Button, Flex, Heading, View } from '@adobe/react-spectrum';
import PrimeCatalogFilterListItem from './PrimeCatalogFilterListItem';
import { useDeviceTypeContext } from '../../../contextProviders/DeviceContextProvider';
import styles from './PrimeCatalogFilters.module.css';
import { useDialog } from '../../../contextProviders/ALMDialogContextProvider';
import { useDispatch } from 'react-redux';
import { GetTranslation } from '../../../utils/translationService';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import { FILTER } from '../../../utils/constants';
import { useIntl } from 'react-intl';
import PrimeSelectedFiltersList from './PrimeSelectedFiltersList';

const PrimeCatalogFiltersMobile: React.FC<any> = (props: any) => {
  const dispatch = useDispatch();
  const deviceContext = useDeviceTypeContext();
  const { openDialog, closeDialog, currentOpenDialogId } = useDialog();
  const { formatMessage } = useIntl();
  const {
    filterOrder,
    filterState,
    selectedFilter,
    updateShowFilterLists,
    renderPriceRangeFilter,
    searchFilters,
    updateFilters,
    clearFilterSearch,
    showFilterLists,
    updateFilterList,
    showClearFiltersButton,
    updatePriceRangeFilter,
    resetFilters,
    getSelectedFilters,
  } = props;

  const [initialFilters, setInitialFilters] = useState({});
  const selectedFilters = getSelectedFilters(filterState);

  const resetSearchResults = async () => {
    await clearFilterSearch(FILTER.SKILL_NAME);
    await clearFilterSearch(FILTER.TAG_NAME);
  };

  const cancelButtonAction = () => {
    resetFilters(initialFilters);
    closeDialog('alm-filters-dialog');
  };

  const applyButtonAction = () => {
    updateFilterList();
    closeDialog('alm-filters-dialog');
  };

  useEffect(() => {
    setInitialFilters(selectedFilters);
    return () => {
      resetSearchResults();
    };
  }, []);

  // Build live selected filters from the local filterState so chips update instantly
  // when toggling items in the mobile/tablet dialog.
  const selectedFiltersForDialog = useMemo(() => {
    const accum: any[] = [];
    if (!filterState) return accum;
    Object.keys(filterState).forEach((key: string) => {
      const filter = filterState[key];
      if (!filter || !filter.list) return;
      if (key === FILTER.PRICE_RANGE) {
        const start = filter.list?.[0]?.value || 0;
        const end = filter.list?.[1]?.value || 0;
        if (start || end) {
          accum.push({
            checked: true,
            filterType: key,
            labelToShow: `${start}-${end}`,
            label: `${start}-${end}`,
            data: { start, end },
          });
        }
        return;
      }
      // For catalogs in the dialog, rely on local list state to reflect
      // immediate user interactions (select/unselect) and show names.
      // If an item is not in the list, we intentionally skip to avoid
      // rendering IDs as labels.
      if (key === FILTER.CATALOGS) {
        filter.list.forEach((item: any) => {
          if (item && item.checked) {
            const labelToShow = item.label;
            if (!labelToShow) return;
            accum.push({
              checked: true,
              filterType: key,
              labelToShow,
              label: labelToShow,
              data: item.value ? { id: item.value } : undefined,
            });
          }
        });
        return;
      }
      filter.list.forEach((item: any) => {
        if (item && item.checked) {
          // For static lists (type, duration, format, learnerState, etc.) translate for display,
          // but keep the raw label key for updateFilters matching.
          const isDynamic = Boolean(filter.isListDynamic || filter.canSearch);
          const rawLabel = item.label;
          const labelToShow = isDynamic ? rawLabel : GetTranslation(rawLabel, true);
          const chip: any = {
            checked: true,
            filterType: key,
            labelToShow,
            label: rawLabel,
          };
          if (key === FILTER.CATALOGS && item.value) {
            chip.data = { id: item.value };
          }
          accum.push(chip);
        }
      });
    });
    return accum;
  }, [filterState]);

  const showNoResultsFound = (filter: any) => {
    return (
      filter &&
      (filter?.type === FILTER.SKILL_NAME || filter?.type === FILTER.TAG_NAME) &&
      (!filter?.list || filter.list?.length === 0)
    );
  };

  return (
    <ALMDialog
      id="alm-filters-dialog"
      height={deviceContext.isMobile ? 80 : 60}
      stickyPosition={true}
      overlayClose={true}
      borderRadius={deviceContext.isMobile ? 'top' : 'all'}
    >
      <ALMDialogHeader>
        <Flex direction="column" width={'100%'}>
          <Flex direction="row" alignItems="center" justifyContent="space-between" width={'100%'}>
            <Heading level={3} UNSAFE_className={styles.almDialogTitle}>
              {GetTranslation('alm.catalog.filters')}
            </Heading>
            <div>{showClearFiltersButton()}</div>
          </Flex>
          <PrimeSelectedFiltersList
            updateFilters={updateFilters}
            updatePriceRangeFilter={updatePriceRangeFilter}
            selectedFilters={getSelectedFilters(filterState)}
          />
        </Flex>
      </ALMDialogHeader>
      <ALMDialogContent>
        <Flex justifyContent={'space-between'} direction="row" gap={20}>
          <View
            borderRadius="medium"
            width={deviceContext.isTablet ? 'size-1700' : 'size-1200'}
            padding="10"
            UNSAFE_className={`${styles.filtersNameContainer}`}
          >
            <Flex direction="column" gap="size-0">
              {filterOrder.map((filterType: string) => {
                const filter = filterState[filterType];
                if (!filter) {
                  return null;
                }
                const filterContainerId = `filterContainer${filter?.type}`;
                const minimumValuesToDisplayFilter = 1;
                const isFilterInvalid =
                  !filter ||
                  !filter.list ||
                  (filter.list && filter.list.length < minimumValuesToDisplayFilter);
                if (isFilterInvalid && !showNoResultsFound(filter)) {
                  return null;
                }
                return (
                  <label
                    key={filter?.type}
                    className={`${styles.typeLabel} ${selectedFilter?.type === filter?.type ? styles.selectedFilter : ''}`}
                    data-automationid="filtersText"
                    id={filterContainerId}
                    onClick={() => dispatch(updateShowFilterLists(filter?.type))}
                  >
                    {GetTranslation(filter?.label, true)}{' '}
                    {selectedFilter?.type === filter?.type ? <ChevronRight size="S" /> : ''}
                  </label>
                );
              })}
            </Flex>
          </View>
          <View width="single-line-width" flex={1}>
            {selectedFilter && selectedFilter.type === FILTER.PRICE_RANGE ? (
              renderPriceRangeFilter(selectedFilter)
            ) : (
              <PrimeCatalogFilterListItem
                filter={selectedFilter}
                searchFilters={searchFilters}
                updateFilters={updateFilters}
                clearFilterSearch={clearFilterSearch}
                showNoResultsFound={showNoResultsFound(selectedFilter)}
                showFilterLists={showFilterLists}
              />
            )}
          </View>
        </Flex>
      </ALMDialogContent>
      <ALMDialogFooter>
        <Button variant="secondary" onPress={cancelButtonAction}>
          {formatMessage({
            id: 'alm.text.cancel',
            defaultMessage: 'Cancel',
          })}
        </Button>
        <Button variant="cta" onPress={applyButtonAction}>
          {formatMessage({
            id: 'alm.text.apply',
            defaultMessage: 'Apply',
          })}
        </Button>
      </ALMDialogFooter>
    </ALMDialog>
  );
};

export default PrimeCatalogFiltersMobile;
