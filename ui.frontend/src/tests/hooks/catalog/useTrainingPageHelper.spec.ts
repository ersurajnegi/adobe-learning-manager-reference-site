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
/**
 * Unit Tests for useTrainingPageHelper
 *
 * This file contains a single utility function: findPrimaryEnrolledInstance
 * which recursively searches through a learning object's sub-LOs to find
 * the enrolled instance ID for a specific child course.
 *
 * Testing Strategy:
 * - Module integrity
 * - Basic functionality
 * - Edge cases (null, undefined, empty)
 * - Recursive behavior
 * - Different LO types (Course, LP, Certification)
 */

import { findPrimaryEnrolledInstance } from '../../../almLib/hooks/catalog/useTrainingPageHelper';
import { PrimeLearningObject } from '../../../almLib/models';
import { COURSE, LEARNING_PROGRAM, CERTIFICATION } from '../../../almLib/utils/constants';

describe('useTrainingPageHelper', () => {
  describe('findPrimaryEnrolledInstance', () => {
    describe('Basic Functionality', () => {
      it('should return empty string when training has no subLOs', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: undefined,
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:456');
        expect(result).toBe('');
      });

      it('should return empty string when subLOs is null', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: null,
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:456');
        expect(result).toBe('');
      });

      it('should return empty string when subLOs is empty array', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [],
        } as PrimeLearningObject;

        const result = findPrimaryEnrolledInstance(training, 'course:456');
        expect(result).toBe('');
      });

      it('should find matching course and return its enrolled instance ID', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:456',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-789',
                },
              },
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:456');
        expect(result).toBe('instance-789');
      });

      it('should return empty string when child course ID does not match', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:456',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-789',
                },
              },
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:999');
        expect(result).toBe('');
      });

      it('should search through multiple courses to find the match', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:111',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-111',
                },
              },
            },
            {
              id: 'course:222',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-222',
                },
              },
            },
            {
              id: 'course:333',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-333',
                },
              },
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:222');
        expect(result).toBe('instance-222');
      });

      it('should return the first matching course instance', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:456',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-first',
                },
              },
            },
            {
              id: 'course:456', // Duplicate ID (edge case)
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-second',
                },
              },
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:456');
        expect(result).toBe('instance-first');
      });
    });

    describe('Recursive Behavior', () => {
      it('should recursively search through nested learning programs', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'lp-456',
              loType: LEARNING_PROGRAM,
              subLOs: [
                {
                  id: 'course:789',
                  loType: COURSE,
                  enrollment: {
                    loInstance: {
                      id: 'instance-deep',
                    },
                  },
                },
              ],
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:789');
        expect(result).toBe('instance-deep');
      });

      it('should recursively search through nested certifications', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'cert-456',
              loType: CERTIFICATION,
              subLOs: [
                {
                  id: 'course:789',
                  loType: COURSE,
                  enrollment: {
                    loInstance: {
                      id: 'instance-cert',
                    },
                  },
                },
              ],
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:789');
        expect(result).toBe('instance-cert');
      });

      it('should search through multiple levels of nesting', () => {
        const training = {
          id: 'lp-level1',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'lp-level2',
              loType: LEARNING_PROGRAM,
              subLOs: [
                {
                  id: 'cert-level3',
                  loType: CERTIFICATION,
                  subLOs: [
                    {
                      id: 'course:target',
                      loType: COURSE,
                      enrollment: {
                        loInstance: {
                          id: 'instance-nested-deep',
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:target');
        expect(result).toBe('instance-nested-deep');
      });

      it('should return empty string when nested search finds nothing', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'lp-456',
              loType: LEARNING_PROGRAM,
              subLOs: [
                {
                  id: 'course:789',
                  loType: COURSE,
                  enrollment: {
                    loInstance: {
                      id: 'instance-deep',
                    },
                  },
                },
              ],
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:999');
        expect(result).toBe('');
      });

      it('should search sibling LPs before going deeper', () => {
        const training = {
          id: 'lp-root',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'lp-sibling1',
              loType: LEARNING_PROGRAM,
              subLOs: [
                {
                  id: 'course:other',
                  loType: COURSE,
                  enrollment: {
                    loInstance: {
                      id: 'instance-other',
                    },
                  },
                },
              ],
            },
            {
              id: 'course:target',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-sibling',
                },
              },
            },
            {
              id: 'lp-sibling2',
              loType: LEARNING_PROGRAM,
              subLOs: [
                {
                  id: 'course:another',
                  loType: COURSE,
                  enrollment: {
                    loInstance: {
                      id: 'instance-another',
                    },
                  },
                },
              ],
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:target');
        expect(result).toBe('instance-sibling');
      });
    });

    describe('Edge Cases', () => {
      it('should handle course with null enrollment', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:456',
              loType: COURSE,
              enrollment: null,
            },
          ],
        } as any;

        // This will throw an error in the actual implementation
        // because it tries to access enrollment.loInstance.id
        expect(() => findPrimaryEnrolledInstance(training, 'course:456')).toThrow();
      });

      it('should handle course with undefined enrollment', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:456',
              loType: COURSE,
              enrollment: undefined,
            },
          ],
        } as any;

        // This will throw an error in the actual implementation
        expect(() => findPrimaryEnrolledInstance(training, 'course:456')).toThrow();
      });

      it('should handle course with null loInstance', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:456',
              loType: COURSE,
              enrollment: {
                loInstance: null,
              },
            },
          ],
        } as any;

        // This will throw an error in the actual implementation
        expect(() => findPrimaryEnrolledInstance(training, 'course:456')).toThrow();
      });

      it('should handle LP with undefined subLOs in nested structure', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'lp-456',
              loType: LEARNING_PROGRAM,
              subLOs: undefined,
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:999');
        expect(result).toBe('');
      });

      it('should handle mixed content (courses and LPs)', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:111',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-111',
                },
              },
            },
            {
              id: 'lp-222',
              loType: LEARNING_PROGRAM,
              subLOs: [
                {
                  id: 'course:333',
                  loType: COURSE,
                  enrollment: {
                    loInstance: {
                      id: 'instance-333',
                    },
                  },
                },
              ],
            },
            {
              id: 'course:444',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-444',
                },
              },
            },
          ],
        } as any;

        // Should find course at top level
        expect(findPrimaryEnrolledInstance(training, 'course:111')).toBe('instance-111');

        // Should find course in nested LP
        expect(findPrimaryEnrolledInstance(training, 'course:333')).toBe('instance-333');

        // Should find course at top level after LP
        expect(findPrimaryEnrolledInstance(training, 'course:444')).toBe('instance-444');
      });

      it('should handle empty string as childCourseId', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:456',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-789',
                },
              },
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, '');
        expect(result).toBe('');
      });

      it('should handle special characters in childCourseId', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:special-123_ABC.def',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-special',
                },
              },
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:special-123_ABC.def');
        expect(result).toBe('instance-special');
      });
    });

    describe('LO Type Handling', () => {
      it('should only return instance ID for COURSE type', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:456',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-course',
                },
              },
            },
          ],
        } as any;

        const result = findPrimaryEnrolledInstance(training, 'course:456');
        expect(result).toBe('instance-course');
      });

      it('should recursively search when subLO is not a COURSE', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'lp-456', // This is an LP, not a course
              loType: LEARNING_PROGRAM,
              subLOs: [
                {
                  id: 'course:789',
                  loType: COURSE,
                  enrollment: {
                    loInstance: {
                      id: 'instance-nested',
                    },
                  },
                },
              ],
            },
          ],
        } as any;

        // Looking for course inside the LP
        const result = findPrimaryEnrolledInstance(training, 'course:789');
        expect(result).toBe('instance-nested');
      });

      it('should not return instance ID if ID matches but loType is not COURSE', () => {
        const training = {
          id: 'lp-root',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'lp-target', // ID matches but it's an LP, not a course
              loType: LEARNING_PROGRAM,
              subLOs: [],
            },
          ],
        } as any;

        // This should return empty string because 'lp-target' is not a COURSE
        const result = findPrimaryEnrolledInstance(training, 'lp-target');
        expect(result).toBe('');
      });
    });

    describe('Performance and Complexity', () => {
      it('should handle large flat structure efficiently', () => {
        const subLOs = [];
        for (let i = 0; i < 100; i++) {
          subLOs.push({
            id: `course:${i}`,
            loType: COURSE,
            enrollment: {
              loInstance: {
                id: `instance-${i}`,
              },
            },
          });
        }

        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs,
        } as any;

        // Should find the last course
        const result = findPrimaryEnrolledInstance(training, 'course:99');
        expect(result).toBe('instance-99');
      });

      it('should handle deep nesting efficiently', () => {
        // Create a deeply nested structure (10 levels)
        let currentLO: any = {
          id: 'course:deepest',
          loType: COURSE,
          enrollment: {
            loInstance: {
              id: 'instance-deepest',
            },
          },
        };

        for (let i = 0; i < 10; i++) {
          currentLO = {
            id: `lp-level${i}`,
            loType: LEARNING_PROGRAM,
            subLOs: [currentLO],
          };
        }

        const result = findPrimaryEnrolledInstance(currentLO, 'course:deepest');
        expect(result).toBe('instance-deepest');
      });

      it('should stop searching after finding first match', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:target',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-first',
                },
              },
            },
            {
              id: 'lp-nested',
              loType: LEARNING_PROGRAM,
              subLOs: [
                {
                  id: 'course:target', // Duplicate ID deeper in structure
                  loType: COURSE,
                  enrollment: {
                    loInstance: {
                      id: 'instance-nested',
                    },
                  },
                },
              ],
            },
          ],
        } as any;

        // Should return first match at top level
        const result = findPrimaryEnrolledInstance(training, 'course:target');
        expect(result).toBe('instance-first');
      });
    });

    describe('Return Value Validation', () => {
      it('should always return a string', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [],
        } as PrimeLearningObject;

        const result = findPrimaryEnrolledInstance(training, 'course:999');
        expect(typeof result).toBe('string');
      });

      it('should return string (empty or instance ID)', () => {
        const training1 = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [],
        } as PrimeLearningObject;

        const training2 = {
          id: 'lp-456',
          loType: LEARNING_PROGRAM,
          subLOs: [
            {
              id: 'course:789',
              loType: COURSE,
              enrollment: {
                loInstance: {
                  id: 'instance-abc',
                },
              },
            },
          ],
        } as any;

        const result1 = findPrimaryEnrolledInstance(training1, 'course:999');
        const result2 = findPrimaryEnrolledInstance(training2, 'course:789');

        expect(typeof result1).toBe('string');
        expect(typeof result2).toBe('string');
        expect(result1).toBe('');
        expect(result2).toBe('instance-abc');
      });

      it('should never return undefined', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [],
        } as PrimeLearningObject;

        const result = findPrimaryEnrolledInstance(training, 'course:999');
        expect(result).not.toBeUndefined();
      });

      it('should never return null', () => {
        const training = {
          id: 'lp-123',
          loType: LEARNING_PROGRAM,
          subLOs: [],
        } as PrimeLearningObject;

        const result = findPrimaryEnrolledInstance(training, 'course:999');
        expect(result).not.toBeNull();
      });
    });
  });
});
