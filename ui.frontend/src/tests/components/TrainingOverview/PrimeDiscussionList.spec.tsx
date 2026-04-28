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
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrimeDiscussionList from '@components/TrainingOverview/PrimeDiscussionList/PrimeDiscussionList';
import { PrimeLearningObject, PrimeDiscussionPost } from '@models/PrimeModels';

jest.mock('@utils/translationService', () => ({
  GetTranslation: (key: string) => {
    const map: Record<string, string> = {
      'alm.text.discussion.sortBy.new': 'Newest First',
      'alm.text.discussion.sortBy.old': 'Oldest First',
      'alm.text.noDiscussion': 'No discussions yet',
      'alm.text.dicussion.sortBy': 'Sort by',
    };
    return map[key] ?? key;
  },
}));

jest.mock('@spectrum-icons/workflow/InfoOutline', () => ({
  __esModule: true,
  default: () => <span data-testid="info-icon" />,
}));

jest.mock('@adobe/react-spectrum', () => ({
  Picker: ({ children, onSelectionChange, defaultSelectedKey, 'data-automationid': automationId }: any) => {
    const childArray = Array.isArray(children) ? children : [children];
    return (
      <select
        data-testid="sort-picker"
        data-automationid={automationId}
        defaultValue={defaultSelectedKey}
        onChange={(e) => onSelectionChange(e.target.value)}
      >
        {childArray.map((child: any) => (
          <option key={child.key} value={child.key}>
            {child.props.children}
          </option>
        ))}
      </select>
    );
  },
}));

jest.mock('@react-spectrum/tabs', () => ({
  Item: ({ children }: any) => <>{children}</>,
}));

jest.mock('@components/TrainingOverview/PrimeDiscussionItem', () => ({
  PrimeDiscussionItem: ({ discussion, training, deleteDiscussion }: any) => (
    <div data-testid={`discussion-item-${discussion.id}`}>
      <button onClick={() => deleteDiscussion(training.id, discussion.id)}>Delete</button>
    </div>
  ),
}));

const mockTraining: PrimeLearningObject = {
  id: 'course123',
  loType: 'course',
  localizedMetadata: [],
} as any;

const mockDiscussions: PrimeDiscussionPost[] = [
  { id: 'discussion1', comment: 'First comment', dateCreated: Date.now() } as any,
  { id: 'discussion2', comment: 'Second comment', dateCreated: Date.now() - 3600000 } as any,
];

const mockGetAllDiscussion = jest.fn();
const mockDeleteDiscussion = jest.fn();

const defaultProps = {
  training: mockTraining,
  discussionList: mockDiscussions,
  deleteDiscussion: mockDeleteDiscussion,
  getAllDiscussion: mockGetAllDiscussion,
};

describe('PrimeDiscussionList', () => {
  describe('empty state', () => {
    it('emptyList_showsNoDiscussionText', () => {
      render(<PrimeDiscussionList {...defaultProps} discussionList={[]} />);
      screen.getByText('No discussions yet');
    });

    it('emptyList_hidesSortPicker', () => {
      render(<PrimeDiscussionList {...defaultProps} discussionList={[]} />);
      expect(screen.queryByTestId('sort-picker')).toBeNull();
    });
  });

  describe('non-empty state', () => {
    it('nonEmptyList_showsSortPicker', () => {
      render(<PrimeDiscussionList {...defaultProps} />);
      screen.getByTestId('sort-picker');
    });

    it('nonEmptyList_rendersDiscussionItemForEachEntry', () => {
      render(<PrimeDiscussionList {...defaultProps} />);
      screen.getByTestId('discussion-item-discussion1');
      screen.getByTestId('discussion-item-discussion2');
    });
  });

  describe('sort', () => {
    it('sort_newestFirst_callsGetAllDiscussionWithTrue', () => {
      render(<PrimeDiscussionList {...defaultProps} />);
      fireEvent.change(screen.getByTestId('sort-picker'), { target: { value: 'Newest First' } });
      expect(mockGetAllDiscussion).toHaveBeenCalledWith(true);
    });

    it('sort_oldestFirst_callsGetAllDiscussionWithFalse', () => {
      render(<PrimeDiscussionList {...defaultProps} />);
      fireEvent.change(screen.getByTestId('sort-picker'), { target: { value: 'Oldest First' } });
      expect(mockGetAllDiscussion).toHaveBeenCalledWith(false);
    });
  });

  it('deleteDiscussion_clicked_passesTrainingIdAndDiscussionId', () => {
    render(<PrimeDiscussionList {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect(mockDeleteDiscussion).toHaveBeenCalledWith('course123', 'discussion1');
  });
});
