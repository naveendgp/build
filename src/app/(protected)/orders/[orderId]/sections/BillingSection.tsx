'use client'

import { Card, Table, Descriptions, Tag } from 'antd'

const paymentStatusColor: Record<string, string> = {
    PAID: 'success',
    PENDING: 'warning',
    REFUNDED: 'blue',
    FAILED: 'error',
}

export default function BillingSection({ order }: { order: any }) {
    const items = order.items ?? []

    const columns = [
        { title: 'Item', dataIndex: 'name', key: 'name' },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 60 },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 80,
            render: (price: number) => `₹${price}`,
        },
        {
            title: 'Total',
            key: 'total',
            width: 80,
            render: (_: unknown, record: { quantity: number; price: number }) =>
                `₹${record.quantity * record.price}`,
        },
    ]

    return (
        <Card title="Billing">
            {items.length > 0 && (
                <Table
                    dataSource={items}
                    columns={columns}
                    rowKey="name"
                    pagination={false}
                    size="small"
                    style={{ marginBottom: 16 }}
                />
            )}
            <Descriptions column={1} size="small">
                <Descriptions.Item label="Subtotal">₹{order.subtotal ?? order.totalAmount}</Descriptions.Item>
                <Descriptions.Item label="Delivery Fee">₹{order.deliveryFee ?? 0}</Descriptions.Item>
                {(order.discount ?? 0) > 0 && (
                    <Descriptions.Item label="Discount">
                        <span style={{ color: '#52c41a' }}>−₹{order.discount}</span>
                    </Descriptions.Item>
                )}
                <Descriptions.Item label="Total">
                    <strong>₹{order.totalAmount}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Method">{order.paymentMethod ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Payment Status">
                    <Tag color={paymentStatusColor[order.paymentStatus] ?? 'default'}>
                        {order.paymentStatus ?? '—'}
                    </Tag>
                </Descriptions.Item>
            </Descriptions>
        </Card>
    )
}
