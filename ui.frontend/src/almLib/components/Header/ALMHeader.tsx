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
import { useState, useMemo, ReactNode, useEffect } from 'react';
import styles from './ALMHeader.module.css';
import { SEARCH_ICON, CROSS_ICON } from '../../utils/inline_svg';
import { getALMObject } from '../../utils/global';
import { GetTranslation } from '../../utils/translationService';
import { useLocation } from 'react-router-dom';
import { getSearchOrCatalog } from '../../utils/catalog';
import { SEARCH } from '../../utils/constants';

export interface ALMHeaderProps {
  accountJson: string;
  className?: string;
  children?: ReactNode;
}

interface AccountData {
  data?: {
    attributes?: {
      logoUrl?: string;
      name?: string;
      logoStyling?: string;
    };
  };
}

const ALMHeader = ({ accountJson, className = '', children }: ALMHeaderProps) => {
  const location = useLocation();
  const [searchText, setSearchText] = useState('');

  const parsedData: AccountData = useMemo(() => JSON.parse(accountJson), [accountJson]);
  const attributes = parsedData.data?.attributes || {};

  const companyLogo = attributes.logoUrl || '';
  const companyName = attributes.name || '';
  const logoStyling = attributes.logoStyling || 'LOGO_NAME';
  const showLogo = logoStyling.includes('LOGO');
  const showName = logoStyling.includes('NAME');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const navigateToCatalog = () => {
    const almObject = getALMObject();
    if (almObject?.navigateToCatalogPage) {
      almObject.navigateToCatalogPage({ searchText });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToCatalog();
  };

  const handleClearSearch = () => {
    setSearchText('');
    const almObject = getALMObject();
    if (almObject?.navigateToCatalogPage) {
      almObject.navigateToCatalogPage();
    }
  };

  const handleLogoClick = () => {
    const almObject = getALMObject();
    if (almObject?.navigateToCustomPage) {
      almObject.navigateToCustomPage();
    }
  };

  useEffect(() => {
    if (getSearchOrCatalog() !== SEARCH) {
      setSearchText('');
    }
  }, [location.pathname]);

  const renderLogoSection = () => (
    <button
      type="button"
      className={styles.logoSection}
      onClick={handleLogoClick}
      aria-label={GetTranslation('alm.header.companyLogo', true)}
    >
      {showLogo && companyLogo && (
        <img
          src={companyLogo}
          alt={companyName || GetTranslation('alm.header.companyLogo', true)}
          className={styles.companyLogo}
        />
      )}
      {showName && companyName && <span className={styles.companyName}>{companyName}</span>}
    </button>
  );

  const renderSearchBar = () => {
    return (
      <form className={styles.searchContainer} onSubmit={handleSearchSubmit}>
        <div className={styles.searchInputWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={GetTranslation('alm.header.search', true)}
            value={searchText}
            onChange={handleSearchChange}
            aria-label={GetTranslation('alm.header.search', true)}
          />
          <button
            type="submit"
            className={styles.searchButton}
            aria-label={GetTranslation('alm.header.search', true)}
          >
            <SEARCH_ICON />
          </button>
          {searchText.length > 0 && (
            <button
              type="button"
              className={styles.searchClearButton}
              onClick={handleClearSearch}
              aria-label={GetTranslation('alm.header.clearSearch', true)}
            >
              <CROSS_ICON />
            </button>
          )}
        </div>
      </form>
    );
  };

  const renderSignUpButton = () => {
    return (
      <button
        onClick={() => getALMObject().handleLogIn()}
        className={styles.signUpButton}
        aria-label={GetTranslation('alm.header.signUp', true)}
      >
        {GetTranslation('alm.header.signUp', true)}
      </button>
    );
  };

  return (
    <header className={`${styles.headerContainer} ${className}`}>
      <div className={styles.headerContent}>
        {renderLogoSection()}
        {children && <div className={styles.navSection}>{children}</div>}
        <div className={styles.actionsSection}>
          {renderSearchBar()}
          {renderSignUpButton()}
        </div>
      </div>
    </header>
  );
};

export default ALMHeader;
