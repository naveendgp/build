// src/components/providers/DialogProvider.tsx
import React from 'react';
import { useDialogStore } from './dialogStore';
import CustomDialog from '../CustomDialog';

const DialogProvider = () => {
    const { visible, title, content, showSingleBtn, onConfirm, onClose, hideDialog } =
        useDialogStore();

    return (
        <CustomDialog
            visible={visible}
            title={title}
            content={content}
            onConfirm={() => {
                hideDialog();
                onConfirm?.();
            }}
            onClose={() => {
                hideDialog();
                onClose?.();
            }}
            showSingleBtn={showSingleBtn}
        />
    );
};

export default DialogProvider;
