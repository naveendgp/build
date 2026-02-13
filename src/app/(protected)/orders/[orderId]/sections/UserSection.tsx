'use client'

import { Card, Descriptions } from 'antd'

export default function UserSection({ order }: { order: any }) {
    const user = order.user ?? {}

    return (
        <Card title="Customer Details">
            <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">{user.name ?? order.userName}</Descriptions.Item>
                <Descriptions.Item label="Phone">{user.contact ?? order.userContact}</Descriptions.Item>
                <Descriptions.Item label="Email">{user.email ?? order.userEmail ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Pickup Address">{order.pickupAddress}</Descriptions.Item>
                <Descriptions.Item label="Delivery Address">{order.deliveryAddress}</Descriptions.Item>
            </Descriptions>
        </Card>
    )
}
