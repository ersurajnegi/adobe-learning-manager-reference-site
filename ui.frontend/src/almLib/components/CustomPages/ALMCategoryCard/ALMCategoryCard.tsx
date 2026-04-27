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
import { useCategoryCard } from '../../../hooks/customPages';
import { CategorySource, PrimeCatalog } from '../../../models';
import { JAVASCRIPT_VOID_0 } from '../../../utils/constants';
import styles from './ALMCategoryCard.module.css';

const ALMCategoryCard = ({
  item,
  index,
  source,
  hideImage = false,
  hideDescription = false,
  disableLinks = false,
}: {
  hideImage?: boolean;
  hideDescription?: boolean;
  source: CategorySource;
  item: PrimeCatalog | any;
  index: number;
  disableLinks?: boolean;
}) => {
  const {
    imageHeight,
    imageUrl,
    color,
    name,
    description,
    id,
    navigateToCatalog,
    navigateToCustomPage,
  } = useCategoryCard({ item, source, hideImage });

  const cardId = `category-card-${name}`;
  const cardImageId = `category-card-image-${name}`;
  const cardTitleId = `category-card-title-${name}`;
  const cardDescriptionId = `category-card-description-${name}`;

  const handleCardClick = () => {
    if (!disableLinks) {
      if (item.pageId) {
        navigateToCustomPage();
      } else {
        navigateToCatalog();
      }
    }
  };

  return (
    <a
      data-automationid={cardId}
      key={index}
      href={JAVASCRIPT_VOID_0}
      tabIndex={disableLinks ? -1 : 0}
      className={styles.container}
      onClick={handleCardClick}
    >
      <div className={styles.cardContainer}>
        <div className={styles.card}>
          {imageUrl && !hideImage ? (
            <div
              role="img"
              aria-label={name}
              aria-hidden="true"
              className={`${styles.header} ${styles.centeredImage}`}
              data-automationid={cardImageId}
              style={{
                height: `${imageHeight}px`,
                backgroundColor: color,
                backgroundImage: `url("${imageUrl}")`,
              }}
            ></div>
          ) : (
            <div
              className={`${styles.header}`}
              data-automationid={cardImageId}
              style={
                hideImage
                  ? { height: `${imageHeight}px` }
                  : { height: `${imageHeight}px`, backgroundColor: color }
              }
            ></div>
          )}
          <div className={styles.content}>
            <div className={styles.title} title={name} data-automationid={cardTitleId}>
              {name}
            </div>
            {!hideDescription && (
              <p
                className={styles.description}
                title={description}
                data-automationid={cardDescriptionId}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
};

export default ALMCategoryCard;
