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
import { useEffect, useCallback, useState } from 'react';
import APIServiceInstance from '../../common/APIService';
import { QueryParams, RestAdapter } from '../../utils/restAdapter';
import { PrimeUserBadge } from '../../models';
import { getALMConfig, getALMObject, getALMUser } from '../../utils/global';
import { useDispatch, useSelector } from 'react-redux';
import { State } from '../../store/state';
import { loadBadges, paginateBadges } from '../../store/actions/badge/action';
import { COMPLETED_IC } from '../../utils/constants';
import { JsonApiParse } from '../../utils/jsonAPIAdapter';

const queryParams: QueryParams = {
  'page[offset]': 0,
  'page[limit]': 10,
  include: 'badge,model,model.skill',
  sort: '-dateAchieved',
};

export const useBadges = () => {
  const { badges, next } = useSelector((state: State) => state.badge);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const getUserId = async () => {
    if (!getALMObject().isPrimeUserLoggedIn()) {
      return;
    }
    const userResponse = await getALMUser();
    return userResponse?.user?.id;
  };

  const getBadgesList = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await APIServiceInstance.getUsersBadges(userId, queryParams);
      dispatch(
        loadBadges({
          badges: response?.badgeList || [],
          next: response?.links?.next || '',
        })
      );
      setIsLoading(false);
    } catch (e) {
      console.error('Error fetching badges: ', e);
      dispatch(
        loadBadges({
          badges: [] as PrimeUserBadge[],
          next: '',
        })
      );
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    getBadgesList();
  }, [getBadgesList]);

  //pagination
  const loadMoreBadge = useCallback(async () => {
    if (!next) return;
    const parsedResponse = await APIServiceInstance.loadMore(next);
    dispatch(
      paginateBadges({
        badges: parsedResponse!.userBadgeList || [],
        next: parsedResponse!.links?.next || '',
      })
    );
  }, [dispatch, next]);

  //download functionality
  const getClickableLink = (url: any) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = url!;
    link.target = '_blank';
    link.style.display = 'none';
    link.setAttribute('download', '');

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdfClick = useCallback(async (e: React.MouseEvent, id: any) => {
    e.preventDefault();
    e.stopPropagation();

    let interval: NodeJS.Timeout | undefined;

    try {
      const body = {
        data: {
          type: 'job',
          attributes: {
            description: '',
            jobType: 'generateUserBadge',
            payload: {
              userBadgeId: id,
            },
          },
        },
      };
      const baseApiUrl = getALMConfig().primeApiURL;
      const response = await RestAdapter.post({
        url: `${baseApiUrl}jobs`,
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
        },
      });
      const parsedResponse = JsonApiParse(response);
      const jobId = parsedResponse.job.id;

      const getDownloadLink = async () => {
        const response2 = await RestAdapter.get({
          url: `${baseApiUrl}jobs/${jobId}`,
        });
        const res = JsonApiParse(response2);

        if (res.job.status.code === COMPLETED_IC) {
          if (interval) {
            clearInterval(interval);
          }
          const downloadLink = res.job.status.data.s3Url;
          getClickableLink(downloadLink);
        }
      };

      interval = setInterval(getDownloadLink, 2000);
    } catch (error) {
      console.error('Error: ', error);
      if (interval) {
        clearInterval(interval);
      }
    }
  }, []);

  const handleDownloadImgClick = useCallback(async (e: React.MouseEvent, url: any) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(url);
      const imageBlog = await response.blob();
      const imageURL = URL.createObjectURL(imageBlog);
      getClickableLink(imageURL);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }, []);

  return {
    badges,
    loadMoreBadge,
    isLoading,
    handleDownloadPdfClick,
    handleDownloadImgClick,
  };
};

export default useBadges;
