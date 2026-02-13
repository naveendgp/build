'use client'

import { Card, Descriptions, Tag } from 'antd'

const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'default', label: 'Pending' },
    CONFIRMED: { color: 'processing', label: 'Confirmed' },
    PICKED_UP: { color: 'cyan', label: 'Picked Up' },
    IN_PROGRESS: { color: 'blue', label: 'In Progress' },
    OUT_FOR_DELIVERY: { color: 'orange', label: 'Out for Delivery' },
    COMPLETED: { color: 'success', label: 'Completed' },
    CANCELLED: { color: 'error', label: 'Cancelled' },
}

export default function OrderOverview({ order }: { order: any }) {
    const sc = statusConfig[order.status] ?? { color: 'default', label: order.status }

    return (
        <Card title="Order Overview">
            <Descriptions column={3} size="small">
                <Descriptions.Item label="Order ID">{order.id}</Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={sc.color}>{sc.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Service Type">{order.serviceType}</Descriptions.Item>
                <Descriptions.Item label="Pickup Address">{order.pickupAddress}</Descriptions.Item>
                <Descriptions.Item label="Delivery Address">{order.deliveryAddress}</Descriptions.Item>
                <Descriptions.Item label="Created">
                    {new Date(order.createdAt).toLocaleString()}
                </Descriptions.Item>
                {order.rider && (
                    <>
                        <Descriptions.Item label="Rider">{order.rider.name}</Descriptions.Item>
                        <Descriptions.Item label="Rider Contact">{order.rider.contact}</Descriptions.Item>
                    </>
                )}
            </Descriptions>
        </Card>
    )
}
