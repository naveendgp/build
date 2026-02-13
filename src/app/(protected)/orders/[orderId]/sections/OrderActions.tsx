'use client'

import { useState } from 'react'
import { Card, Button, Space, Popconfirm, message } from 'antd'
import { PermissionGate } from '@/components/PermissionGate'
import CancelOrderModal from '@/components/cancelOrderModal'

export default function OrderActions({ order }: { order: any }) {
    const isCancellable = ['PENDING', 'CONFIRMED'].includes(order.status)
    const isCompleted = order.status === 'COMPLETED'
    const [cancelModalOpen, setCancelModalOpen] = useState(false)

    const handleRefund = () => {
        message.info('Refund action — will connect to API when backend is ready')
    }

    return (
        <>
            <Card title="Actions">
                <Space>
                    <PermissionGate permission="ORDER_CANCEL">
                        <Button
                            danger
                            disabled={!isCancellable}
                            onClick={() => setCancelModalOpen(true)}
                        >
                            Cancel Order
                        </Button>
                    </PermissionGate>

                    <PermissionGate permission="PAYMENT_READ">
                        <Popconfirm
                            title="Issue refund?"
                            description="This will initiate a refund to the customer."
                            onConfirm={handleRefund}
                            okText="Yes, Refund"
                            cancelText="No"
                            disabled={!isCompleted && order.status !== 'CANCELLED'}
                        >
                            <Button
                                type="default"
                                disabled={!isCompleted && order.status !== 'CANCELLED'}
                            >
                                Issue Refund
                            </Button>
                        </Popconfirm>
                    </PermissionGate>
                </Space>
            </Card>

            <CancelOrderModal
                orderId={order.id}
                open={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                onSuccess={() => window.location.reload()}
            />
        </>
    )
}
