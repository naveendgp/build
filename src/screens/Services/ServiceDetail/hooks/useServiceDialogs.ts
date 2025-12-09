import { useState } from 'react';

export const useServiceDialogs = () => {
    const [showServiceTimeDialog, setShowServiceTimeDialog] = useState(false);
    const [showOfferDialog, setShowOfferDialog] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    return {
        showServiceTimeDialog,
        setShowServiceTimeDialog,
        showOfferDialog,
        setShowOfferDialog,
        showDialog,
        setShowDialog,
        showDiscardDialog,
        setShowDiscardDialog,
    };
};

