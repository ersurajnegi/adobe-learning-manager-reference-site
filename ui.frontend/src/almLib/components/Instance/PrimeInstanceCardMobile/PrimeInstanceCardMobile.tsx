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
/* eslint-disable no-script-url */
/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Divider,
  Flex,
  Heading,
  Link,
  View,
  Text,
  ProgressBar,
} from '@adobe/react-spectrum';
import { INSTANCE_CARD_WIDTH } from '../../../utils/widgets/common';
import styles from './PrimeInstanceCardMobile.module.css';
import { COMPLETED, ENGLISH_LOCALE, SEPARATOR, WAITING } from '../../../utils/constants';
import { useIntl } from 'react-intl';
import { useUserContext } from '../../../contextProviders/userContextProvider';
import { formatTime, GetFormattedDate } from '../../../utils/dateTime';
import { getFormattedPrice } from '../../../utils/price';
import { useMemo } from 'react';
import { checkIsEnrolled } from '../../../utils/overview';
import { getFormattedDataFromIndex } from '../../../utils/global';
import { formatSingleTimeWithTimezone, formatDateWithTimezone } from '../../../utils/timezoneUtils';

const PrimeInstanceCardMobile = (props: any) => {
  const {
    id,
    name,
    format,
    showStartDateAndInstructor,
    showLocation,
    showCompletionDateColumn,
    startDate,
    completionDate,
    enrollByDate,
    location,
    instructorsName,
    selectInstanceHandler,
    locale,
    price,
    enrollment,
    showProgressBar,
    seatLimit,
    seatsAvailable,
    extension,
    extensionClickHandler,
    instanceId,
    hasCrVcModule,
    waitlistPosition,
    instanceLanguage,
    extensionLocalizedMetadata,
    loFormat,
    instanceName,
    languageText,
    seatsAvailableText,
  } = props;
  const { formatMessage } = useIntl();

  const { user } = useUserContext() || {};

  const contentLocale = user?.contentLocale || ENGLISH_LOCALE;

  const selectHandler = () => {
    selectInstanceHandler(id);
  };
  // Use timezone-aware date and time formatting for CR/VC sessions
  const startDateValue = formatDateWithTimezone(startDate, user, locale, user?.account);
  const { time: startTimeValue, timezoneDisplay } = formatSingleTimeWithTimezone(
    startDate,
    user,
    locale,
    user?.account
  );
  const completionDateValue = formatDateWithTimezone(completionDate, user, locale, user?.account);
  const completionTimeValue = formatTime(completionDate, locale);
  const enrollByDateValue = GetFormattedDate(enrollByDate, locale);

  const getInstanceName = () => {
    return instanceName(name, selectHandler, styles);
  };

  const getExtensionLocalizedMetadata = useMemo(() => {
    return extensionLocalizedMetadata(extension, contentLocale);
  }, [extension, contentLocale]);

  const getLoFormatLabel = useMemo(() => {
    return loFormat(format);
  }, [format]);

  const getSeatsAvailableText = () => {
    return seatsAvailableText(
      seatLimit,
      seatsAvailable,
      enrollment,
      waitlistPosition,
      hasCrVcModule,
      styles
    );
  };

  const getLanguageText = () => {
    return languageText(instanceLanguage, styles);
  };

  return (
    <View
      borderWidth="thin"
      borderColor="gray-300"
      borderRadius="large"
      padding="size-200"
      // maxWidth="500px"
      width={INSTANCE_CARD_WIDTH}
    >
      <Flex direction={'column'} height={'100%'}>
        <Heading
          level={3}
          marginTop={0}
          marginBottom="size-100"
          UNSAFE_style={{ color: '#1473E6' }}
        >
          {getInstanceName()}
        </Heading>

        <Flex direction="column" gap="size-25">
          <Text>{getLoFormatLabel}</Text>
          {(!enrollment || enrollment?.state === WAITING) && (
            <Flex direction="row">
              <Text>{getSeatsAvailableText()}</Text>
            </Flex>
          )}

          {instanceLanguage && (
            <Flex direction="row">
              <Text>{getLanguageText()}</Text>
            </Flex>
          )}

          {!enrollment && enrollByDateValue && (
            <Flex direction="row">
              <Text>
                <span style={{ fontWeight: 'bold' }}>
                  {formatMessage({
                    id: 'alm.instance.enrolBy.label',
                    defaultMessage: 'Enroll by',
                  })}
                  {': '}
                </span>
                {enrollByDateValue}
              </Text>
            </Flex>
          )}
          {showStartDateAndInstructor && instructorsName.length > 0 && (
            <Flex direction="row">
              <Text>
                <span style={{ fontWeight: 'bold' }}>
                  {formatMessage({
                    id: 'alm.instance.instructors',
                    defaultMessage: 'Instructors',
                  })}
                  {': '}
                </span>
                {instructorsName[0]}
                {instructorsName.length > 1 && (
                  <>
                    <span>{SEPARATOR}</span>
                    <span
                      className={styles.tooltip}
                      data-title={getFormattedDataFromIndex(instructorsName, 1)}
                    >
                      +{instructorsName.length - 1}{' '}
                      {formatMessage({
                        id: 'alm.text.more',
                        defaultMessage: 'more',
                      })}
                    </span>
                  </>
                )}
              </Text>
            </Flex>
          )}
          {showProgressBar && enrollment && checkIsEnrolled(enrollment) && (
            <div className={styles.progressContainer}>
              {enrollment.state === COMPLETED ? (
                <>
                  <p className={styles.completed}>
                    {formatMessage({
                      id: 'alm.catalog.filter.completed',
                      defaultMessage: 'Completed',
                    })}
                  </p>
                </>
              ) : (
                <>
                  <ProgressBar
                    showValueLabel={false}
                    value={enrollment.progressPercent}
                    UNSAFE_className={styles.progressBar}
                  />
                  <span className={`${styles.completed} ${styles.progressPercentLabel}`}>
                    {formatMessage(
                      {
                        id: 'alm.catalog.card.progress.percent',
                        defaultMessage: `${enrollment?.progressPercent}% complete`,
                      },
                      { '0': enrollment?.progressPercent }
                    )}
                  </span>
                </>
              )}
            </div>
          )}
        </Flex>
        <Flex direction="column" gap="size-100" marginTop="size-200">
          <Divider size="S" />
          {showStartDateAndInstructor && startDateValue && (
            <>
              <Flex direction="row" justifyContent="space-between" alignItems="center">
                <Text>
                  <span>
                    {formatMessage({
                      id: 'alm.instance.start.date',
                      defaultMessage: 'Starts On',
                    })}
                  </span>
                </Text>
                <Text>
                  <span style={{ fontWeight: 'bold' }}>
                    {startDateValue} {`(${startTimeValue})`}
                  </span>
                </Text>
              </Flex>
              {timezoneDisplay ? (
                <Flex direction="row" justifyContent="end" alignItems="center">
                  <Text>
                    <span className={styles.timezoneDisplay} title={timezoneDisplay}>
                      {timezoneDisplay}
                    </span>
                  </Text>
                </Flex>
              ) : null}
              <Divider size="S" />
            </>
          )}

          {showCompletionDateColumn && completionDateValue && (
            <>
              <Flex direction="row" justifyContent="space-between" alignItems="center">
                <Text>
                  <span>
                    {formatMessage({
                      id: 'alm.instance.completeBy.label',
                      defaultMessage: 'Complete By',
                    })}
                  </span>
                </Text>
                <Text>
                  <span style={{ fontWeight: 'bold' }}>
                    {completionDateValue} {`(${completionTimeValue})`}
                  </span>
                </Text>
              </Flex>
              <Divider size="S" />
            </>
          )}

          {showLocation && location.length > 0 && (
            <>
              <Flex direction="row" justifyContent="space-between" alignItems="center">
                <Text>
                  <span>
                    {formatMessage({
                      id: 'alm.instance.location',
                      defaultMessage: 'Location(s)',
                    })}
                  </span>
                </Text>
                <Text>
                  <span>
                    <span style={{ fontWeight: 'bold' }}>{location[0]}</span>
                    {location.length > 1 && (
                      <>
                        <span>{SEPARATOR}</span>
                        <span
                          data-title={getFormattedDataFromIndex(location, 1)}
                          className={styles.tooltip}
                        >
                          +{location.length - 1}{' '}
                          {formatMessage({
                            id: 'alm.text.more',
                            defaultMessage: 'more',
                          })}
                        </span>
                      </>
                    )}
                  </span>
                </Text>
              </Flex>
              <Divider size="S" />
            </>
          )}

          {price && (
            <>
              <Flex direction="row" justifyContent="space-between" alignItems="center">
                <Text>
                  <span>
                    {formatMessage({
                      id: 'alm.instance.price',
                      defaultMessage: 'Price',
                    })}
                  </span>
                </Text>
                <Text>
                  <span>{getFormattedPrice(price)}</span>
                </Text>
              </Flex>
              <Divider size="S" />
            </>
          )}
        </Flex>

        <Flex
          direction="row"
          gap="size-100"
          marginTop="size-300"
          justifyContent={'space-between'}
          alignItems={'self-end'}
          flex="1"
        >
          <Button
            variant="accent"
            style="outline"
            width="50%"
            UNSAFE_style={{ borderRadius: '50px' }}
            UNSAFE_className={`almButton secondary ${styles.buttonLabel}`}
            data-automationid={`component:instance-details-list:::selectInstance:::${name}`}
            onPress={selectHandler}
          >
            {formatMessage({
              id: 'alm.instance.select',
              defaultMessage: 'Select',
            })}
          </Button>
          {extension && (
            <a
              className={styles.extensionLabel}
              onClick={event => extensionClickHandler(instanceId, event)}
            >
              {getExtensionLocalizedMetadata?.label}
            </a>
          )}
        </Flex>
      </Flex>
    </View>
  );
};

export default PrimeInstanceCardMobile;
