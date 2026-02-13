'use client'

import { Card, Descriptions } from 'antd'

export default function ShopSection({ order }: { order: any }) {
    const shop = order.shop ?? {}

    return (
        <Card title="Shop Details">
            <Descriptions column={1} size="small">
                <Descriptions.Item label="Shop Name">{shop.name ?? order.shopName}</Descriptions.Item>
                <Descriptions.Item label="Phone">{shop.contact ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Address">{shop.address ?? '—'}</Descriptions.Item>
            </Descriptions>
        </Card>
    )
}
