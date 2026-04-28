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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './ALMNavMenu.module.css';
import { MORE_ICON, CHEVRON_DOWN_ICON } from '../../utils/inline_svg';
import { getIconByName } from '../../utils/template_icons_svg';
import {
  CATALOG_PAGE_PATH,
  MENU,
  MENU_BELOW_HEADER,
  MENU_INSIDE_HEADER,
  MENU_ITEM,
  PAGE,
} from '../../utils/constants';
import { getALMObject } from '../../utils/global';
import { GetTranslation } from '../../utils/translationService';

export interface ALMNavMenuItem {
  id: string;
  label: string;
  route?: string;
  pageId?: string;
  customPagePath?: string;
  iconName?: string;
  isSubmenu?: boolean;
  subItems?: ALMNavMenuItem[];
  automationId?: string;
}

export type NavMenuLayout = typeof MENU_INSIDE_HEADER | typeof MENU_BELOW_HEADER;

export interface ALMNavMenuProps {
  menuItems: ALMNavMenuItem[];
  layout?: NavMenuLayout;
  showIcons?: boolean;
  className?: string;
}

const MORE_BUTTON_WIDTH = 80;
const ITEM_GAP = 20;
const BUFFER = 20;
const HEADER_RESERVED_WIDTH = 800;

const estimateItemWidth = (item: ALMNavMenuItem, showIcons: boolean): number => {
  const basePadding = 24;
  const iconWidth = showIcons && item.iconName ? 32 : 0;
  const labelWidth = Math.min(item.label.length * 7, 118);
  const chevronWidth = item.isSubmenu ? 20 : 0;
  return basePadding + iconWidth + labelWidth + chevronWidth;
};

const navigateToItem = (item: ALMNavMenuItem): boolean => {
  const almObject = getALMObject();
  if (!almObject) {
    return false;
  }

  if (item.pageId && almObject.navigateToCustomPage) {
    almObject.navigateToCustomPage(item.pageId);
    return true;
  }

  if (item.route === CATALOG_PAGE_PATH) {
    almObject.navigateToCatalogPage();
    return true;
  }

  return false;
};

const ALMNavMenu = ({
  menuItems,
  layout = MENU_INSIDE_HEADER,
  showIcons = true,
  className = '',
}: ALMNavMenuProps) => {
  const location = useLocation();
  const navElementRef = useRef<HTMLElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  const [visibleCount, setVisibleCount] = useState(menuItems.length);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [submenuOpenLeft, setSubmenuOpenLeft] = useState(false);
  const [nestedSubmenuPosition, setNestedSubmenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!menuItems?.length) {
        setVisibleCount(menuItems.length);
        return;
      }

      const navElement = navElementRef.current;
      if (!navElement) {
        return;
      }

      // Determine container width based on layout
      let containerWidth: number;

      if (layout === MENU_BELOW_HEADER) {
        // For belowHeader, use the nav element width directly (full width minus padding)
        containerWidth = navElement.offsetWidth;
      } else {
        // For insideHeader, use fallback calculation
        const navWidth = navElement.offsetWidth;
        const parentWidth = navElement.parentElement?.offsetWidth || 0;
        const windowBasedWidth = Math.max(0, window.innerWidth - HEADER_RESERVED_WIDTH);

        containerWidth = Math.max(navWidth, parentWidth);
        if (containerWidth < 100 && windowBasedWidth > 200) {
          containerWidth = windowBasedWidth;
        }
      }

      if (containerWidth < 50) {
        setVisibleCount(Math.min(4, menuItems.length));
        return;
      }

      const itemWidths = menuItems.map(item => estimateItemWidth(item, showIcons));
      const totalAllWidth = itemWidths.reduce(
        (sum, width, i) => sum + width + (i > 0 ? ITEM_GAP : 0),
        0
      );

      if (totalAllWidth <= containerWidth - BUFFER) {
        setVisibleCount(menuItems.length);
        return;
      }

      const availableWidth = containerWidth - MORE_BUTTON_WIDTH - BUFFER;
      let totalUsed = 0;
      let count = 0;

      for (let i = 0; i < menuItems.length; i++) {
        const candidateTotal = totalUsed + (count > 0 ? ITEM_GAP : 0) + itemWidths[i];
        if (candidateTotal <= availableWidth) {
          totalUsed = candidateTotal;
          count++;
        } else {
          break;
        }
      }

      setVisibleCount(Math.max(1, count));
    };

    let rafId: number | null = null;

    const runCalculation = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(calculateVisibleItems);
    };

    // Initial calculation with delay for DOM readiness
    const timer = setTimeout(runCalculation, 100);

    // ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(runCalculation);
    if (navElementRef.current) {
      resizeObserver.observe(navElementRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
    };
  }, [layout, menuItems, showIcons]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside =
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(target) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(target);

      if (isOutside) {
        setMoreDropdownOpen(false);
        setSubmenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isItemActive = (item: ALMNavMenuItem): boolean => {
    if (item.route && item.route === location.pathname) {
      return true;
    }
    if (item.pageId) {
      const pageIdNum = item.pageId.replace(PAGE, '');
      if (location.pathname.includes(`/${PAGE}/${pageIdNum}`)) {
        return true;
      }
    }
    if (item.route === CATALOG_PAGE_PATH && location.pathname.includes(CATALOG_PAGE_PATH)) {
      return true;
    }
    return (
      item.subItems?.some(subItem => {
        if (subItem.route === location.pathname) {
          return true;
        }
        if (subItem.pageId) {
          const subPageIdNum = subItem.pageId.replace(`${PAGE}:`, '');
          if (location.pathname.includes(`/${PAGE}/${subPageIdNum}`)) {
            return true;
          }
        }
        return false;
      }) ?? false
    );
  };

  const handleItemClick = (item: ALMNavMenuItem, e?: React.MouseEvent) => {
    if (item.isSubmenu && item.subItems?.length) {
      e?.preventDefault();
      setSubmenuOpen(submenuOpen === item.id ? null : item.id);
      return;
    }
    navigateToItem(item);
    setMoreDropdownOpen(false);
    setSubmenuOpen(null);
  };

  const renderIcon = (iconName: string | undefined, isSelected: boolean) => {
    if (!showIcons || !iconName) {
      return null;
    }
    const svgString = getIconByName(iconName, isSelected);
    if (!svgString) {
      return null;
    }
    return <span dangerouslySetInnerHTML={{ __html: svgString }} />;
  };

  const { visibleItems, overflowItems } = useMemo(
    () => ({
      visibleItems: menuItems.slice(0, visibleCount),
      overflowItems: menuItems.slice(visibleCount),
    }),
    [menuItems, visibleCount]
  );

  const renderNavItem = (item: ALMNavMenuItem) => {
    const isActive = isItemActive(item);
    const hasSubmenu = item.isSubmenu && item.subItems?.length;
    const isSubmenuVisible = submenuOpen === item.id;

    const handleSubmenuMouseEnter = (e: React.MouseEvent<HTMLLIElement>) => {
      if (hasSubmenu) {
        // Check if there's enough space on the right
        const rect = e.currentTarget.getBoundingClientRect();
        const dropdownWidth = 200; // min-width of submenuDropdown
        // If dropdown would extend beyond viewport, open to the left
        const wouldOverflow = rect.left + dropdownWidth > window.innerWidth;
        setSubmenuOpenLeft(wouldOverflow);
        setSubmenuOpen(item.id);
      }
    };

    const handleSubmenuMouseLeave = () => {
      if (hasSubmenu) {
        setSubmenuOpen(null);
      }
    };

    return (
      <li
        key={item.id}
        className={styles.navItemWrapper}
        data-item-id={item.id}
        onMouseEnter={hasSubmenu ? handleSubmenuMouseEnter : undefined}
        onMouseLeave={hasSubmenu ? handleSubmenuMouseLeave : undefined}
      >
        <button
          className={`${styles.navItem} ${isActive ? styles.navItemSelected : ''}`}
          onClick={e => !hasSubmenu && handleItemClick(item, e)}
          title={item.label}
          data-automation-id={item.automationId}
          aria-current={isActive ? PAGE : undefined}
          aria-expanded={hasSubmenu ? isSubmenuVisible : undefined}
          aria-haspopup={hasSubmenu ? MENU : undefined}
        >
          {showIcons && item.iconName && (
            <span className={styles.iconContainer}>
              {renderIcon(item.iconName, isActive && !hasSubmenu)}
            </span>
          )}
          <span className={styles.navText}>{item.label}</span>
          {hasSubmenu && (
            <span className={styles.chevronIcon}>
              <CHEVRON_DOWN_ICON />
            </span>
          )}
        </button>

        {hasSubmenu && isSubmenuVisible && (
          <div
            className={`${styles.submenuDropdown} ${submenuOpenLeft ? styles.submenuDropdownLeft : ''}`}
          >
            {item.subItems?.map(subItem => (
              <button
                key={subItem.id}
                className={`${styles.dropdownItem} ${isItemActive(subItem) ? styles.dropdownItemSelected : ''}`}
                onClick={() => {
                  navigateToItem(subItem);
                  setSubmenuOpen(null);
                  setMoreDropdownOpen(false);
                }}
                title={subItem.label}
              >
                {showIcons && subItem.iconName && (
                  <span className={styles.iconContainer}>
                    {renderIcon(subItem.iconName, isItemActive(subItem))}
                  </span>
                )}
                <span className={styles.navText}>{subItem.label}</span>
              </button>
            ))}
          </div>
        )}
      </li>
    );
  };

  const renderMoreButton = () => {
    if (!overflowItems.length) {
      return null;
    }

    const handleButtonMouseEnter = () => {
      if (moreButtonRef.current) {
        const rect = moreButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
        });
      }
      setMoreDropdownOpen(true);
    };

    const handleButtonMouseLeave = (e: React.MouseEvent) => {
      const relatedTarget = e.relatedTarget;
      if (relatedTarget instanceof Node && moreDropdownRef.current?.contains(relatedTarget)) {
        return;
      }
      setMoreDropdownOpen(false);
      setSubmenuOpen(null);
    };

    const handleDropdownMouseLeave = (e: React.MouseEvent) => {
      const relatedTarget = e.relatedTarget;
      if (relatedTarget instanceof Node) {
        if (moreButtonRef.current?.contains(relatedTarget)) {
          return;
        }
        if (moreDropdownRef.current?.contains(relatedTarget)) {
          return;
        }
      }
      setMoreDropdownOpen(false);
      setSubmenuOpen(null);
    };

    return (
      <li
        className={styles.navItemWrapper}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
      >
        <button
          ref={moreButtonRef}
          className={`${styles.moreButton} ${moreDropdownOpen ? styles.moreButtonOpen : ''}`}
          aria-expanded={moreDropdownOpen}
          aria-haspopup={MENU}
          aria-label={GetTranslation('alm.menu.items.more', true)}
        >
          <span className={`${styles.iconContainer} ${styles.moreIcon}`}>
            <MORE_ICON />
          </span>
          <span className={styles.navText}>{GetTranslation('alm.menu.items.more', true)}</span>
        </button>

        {moreDropdownOpen && (
          <div
            ref={moreDropdownRef}
            className={styles.moreDropdown}
            role={MENU}
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
            onMouseEnter={() => setMoreDropdownOpen(true)}
            onMouseLeave={handleDropdownMouseLeave}
          >
            {overflowItems.map(item => {
              const isActive = isItemActive(item);
              const hasSubmenu = item.isSubmenu && item.subItems?.length;
              const isSubmenuVisible = submenuOpen === item.id;

              const handleSubmenuEnter = (e: React.MouseEvent<HTMLDivElement>) => {
                if (!hasSubmenu) {
                  setSubmenuOpen(null);
                  return;
                }
                const rect = e.currentTarget.getBoundingClientRect();
                const submenuWidth = 200;
                const wouldOverflowRight = rect.right + submenuWidth > window.innerWidth;
                const left = wouldOverflowRight ? rect.left - submenuWidth : rect.right - 2;
                setNestedSubmenuPosition({ top: rect.top, left });
                setSubmenuOpen(item.id);
              };

              return (
                <div
                  key={item.id}
                  className={styles.dropdownItemWrapper}
                  onMouseEnter={handleSubmenuEnter}
                >
                  <button
                    className={`${styles.dropdownItem} ${isActive ? styles.dropdownItemSelected : ''}`}
                    onClick={e => !hasSubmenu && handleItemClick(item, e)}
                    title={item.label}
                    role={MENU_ITEM}
                    aria-current={isActive ? PAGE : undefined}
                    aria-expanded={hasSubmenu ? isSubmenuVisible : undefined}
                    aria-haspopup={hasSubmenu ? MENU : undefined}
                  >
                    {showIcons && item.iconName && (
                      <span className={styles.iconContainer}>
                        {renderIcon(item.iconName, isActive)}
                      </span>
                    )}
                    <span className={styles.navText}>{item.label}</span>
                    {hasSubmenu && (
                      <span className={`${styles.chevronIcon} ${styles.chevronRight}`}>
                        <CHEVRON_DOWN_ICON />
                      </span>
                    )}
                  </button>

                  {hasSubmenu && isSubmenuVisible && nestedSubmenuPosition && (
                    <div
                      className={styles.nestedSubmenu}
                      style={{
                        position: 'fixed',
                        top: nestedSubmenuPosition.top,
                        left: nestedSubmenuPosition.left,
                        zIndex: 10001,
                      }}
                    >
                      {item.subItems?.map(subItem => (
                        <button
                          key={subItem.id}
                          className={`${styles.dropdownItem} ${isItemActive(subItem) ? styles.dropdownItemSelected : ''}`}
                          onClick={() => {
                            navigateToItem(subItem);
                            setSubmenuOpen(null);
                            setMoreDropdownOpen(false);
                          }}
                          title={subItem.label}
                          role={MENU_ITEM}
                        >
                          {showIcons && subItem.iconName && (
                            <span className={styles.iconContainer}>
                              {renderIcon(subItem.iconName, isItemActive(subItem))}
                            </span>
                          )}
                          <span className={styles.navText}>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </li>
    );
  };

  const containerClassName = `
    ${styles.navMenuContainer} 
    ${layout === MENU_BELOW_HEADER ? styles.belowHeader : styles.insideHeader}
    ${className}
  `.trim();

  return (
    <nav
      ref={navElementRef}
      className={containerClassName}
      role="navigation"
      aria-label={GetTranslation('alm.navmenu.navigation', true)}
    >
      <ul className={styles.navContainer} role={MENU}>
        {visibleItems.map(renderNavItem)}
        {renderMoreButton()}
      </ul>
    </nav>
  );
};

export default ALMNavMenu;
