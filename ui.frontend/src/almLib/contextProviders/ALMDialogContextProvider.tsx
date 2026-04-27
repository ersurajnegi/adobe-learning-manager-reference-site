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
import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

// Define the shape of the context
interface DialogContextType {
  isOpen: (id: string) => boolean;
  openDialog: (id: string) => void;
  closeDialog: (id: string) => void;
  closeAllDialogs: () => void;
  openedDialogIds: string[];
  currentOpenDialogId: string;
}

// Create contexts for Dialog state
const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

// Dialog Root Component
export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [openDialogs, setOpenDialogs] = useState<{ [key: string]: boolean }>({});
  const [currentOpenDialogId, setCurrentOpenDialogId] = useState<string>('');

  const isOpen = (id: string) => !!openDialogs[id];

  const openDialog = (id: string) => {
    setOpenDialogs(prev => ({ ...prev, [id]: true }));
    setCurrentOpenDialogId(id);
  };

  const closeDialog = (id: string) => {
    setOpenDialogs(prev => ({ ...prev, [id]: false }));
    if (currentOpenDialogId === id) {
      setCurrentOpenDialogId('');
    }
  };

  const closeAllDialogs = () => {
    setOpenDialogs(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = false;
      });
      return next;
    });
    setCurrentOpenDialogId('');
  };

  const openedDialogIds = useMemo(
    () => Object.keys(openDialogs).filter(id => openDialogs[id]),
    [openDialogs]
  );

  return (
    <DialogContext.Provider
      value={{
        isOpen,
        openDialog,
        closeDialog,
        closeAllDialogs,
        openedDialogIds,
        currentOpenDialogId,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
};

// Hook to use Dialog context
export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
