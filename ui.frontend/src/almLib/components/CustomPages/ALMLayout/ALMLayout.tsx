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
import React, { useRef, useMemo } from 'react';
import styles from './ALMLayout.module.css';

import { Column, Row } from '../../../models';
import { useCustomPageContextProvider } from '../../../contextProviders/ALMCustomPageProvider';

const ColumnRenderer: React.FC<{ column: Column }> = React.memo(({ column }) => {
  const context = useCustomPageContextProvider();
  const {
    pageConfig: { widgets },
    renderWidget,
  } = context;

  const classes = `${styles.almLayoutColumn} ${styles[`almLayoutColumn${column.colSpan}`]}`;

  const renderContent = useMemo(() => {
    if (column.rows?.length) {
      return column.rows.map((row: Row) => <RowRenderer key={row.id} row={row} />);
    }

    try {
      return <div className={styles.widgetContainer}>{renderWidget(column, widgets!)}</div>;
    } catch (error) {
      console.error(`Error rendering widget for column ${column.id}:`, error);
      return null; // Fallback component
    }
  }, [column, widgets, renderWidget]); // Include column in dependencies

  return (
    <div key={column.id} className={classes}>
      {renderContent}
    </div>
  );
});

const RowRenderer: React.FC<{ row: Row; index?: number }> = React.memo(({ row, index }) => {
  const { columns, isFullStretchRow } = row;
  const ref = useRef<HTMLDivElement>(null);

  const rowClasses = `${styles.almLayoutRow} ${isFullStretchRow ? styles.almLayoutRowFullWidth : ''}`;

  return (
    <div className={rowClasses} ref={ref} {...(index !== undefined && { id: `row-${index}` })}>
      {columns.map((column: Column) => (
        <ColumnRenderer key={column.id} column={column} />
      ))}
    </div>
  );
});

interface ALMLayoutProps {
  layout: Row[];
}
const ALMLayout: React.FC<ALMLayoutProps> = React.memo(({ layout }) => {
  if (!layout) return null;

  return (
    <section className={styles.almLayoutContainer}>
      {layout.map((row: Row, index: number) => (
        <RowRenderer key={row.id} row={row} index={index} />
      ))}
    </section>
  );
});

export default ALMLayout;
