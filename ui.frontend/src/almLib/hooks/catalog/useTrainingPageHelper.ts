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
import { PrimeLearningObject } from '../../models';
import { COURSE } from '../../utils/constants';

export function findPrimaryEnrolledInstance(
  training: PrimeLearningObject,
  childCourseId: string
): string | undefined {
  if (!training.subLOs) {
    return '';
  }

  for (const subLo of training.subLOs) {
    const isCourse = subLo.loType === COURSE;
    if (isCourse && subLo.id === childCourseId) {
      return subLo.enrollment.loInstance.id;
    } else if (!isCourse) {
      const instanceId = findPrimaryEnrolledInstance(subLo, childCourseId);
      if (instanceId) {
        return instanceId;
      }
    }
  }

  return '';
}
