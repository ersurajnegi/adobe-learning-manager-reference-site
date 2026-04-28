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
import { CategorySource, PrimeCatalog } from '../../models';
import { CATALOG } from '../../utils/constants';
import { getALMConfig, getALMObject } from '../../utils/global';
import { getLocalizedData } from '../../utils/hooks';
import { GetTileColor } from '../../utils/themes';

export const IMAGE_HEIGHT = 160;
export const IMAGE_HIDDEN_HEIGHT = 8;

interface UseCategoryCardProps {
  item: PrimeCatalog | any;
  source: CategorySource;
  hideImage?: boolean;
}

export const useCategoryCard = ({ item, source, hideImage = false }: UseCategoryCardProps) => {
  const alm = getALMObject();
  const isCatalog = item?.type === CATALOG;
  const { id, name } = item;
  const imageHeight = hideImage ? IMAGE_HIDDEN_HEIGHT : IMAGE_HEIGHT;
  const imageUrl =
    isCatalog && item?.contentImageUrl
      ? (item?.contentImageUrl as string)
      : (item?.imageUrl as string);
  const description =
    isCatalog && item?.localizedMetadata
      ? getLocalizedData(item?.localizedMetadata || [], getALMConfig().locale)?.overview
      : item?.description;
  const color = GetTileColor(id);

  const navigateToCatalog = () => {
    const params = {
      catalogs: source === CategorySource.CATALOGS ? id : '',
      roles: source === CategorySource.ROLES ? name : '',
      products: source === CategorySource.PRODUCTS ? name : '',
      convertParams: true,
    };
    alm.navigateToCatalogPage(params);
  };

  const navigateToCustomPage = () => {
    if (item.pageId && typeof alm.navigateToCustomPage === 'function') {
      alm.navigateToCustomPage(item.pageId);
      return;
    } else {
      navigateToCatalog();
    }
  };

  return {
    imageHeight,
    imageUrl,
    color,
    name,
    description,
    id,
    navigateToCatalog,
    navigateToCustomPage,
  };
};
