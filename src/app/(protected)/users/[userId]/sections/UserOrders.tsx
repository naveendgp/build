'use client'

import { Card, Table, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'default', label: 'Pending' },
    CONFIRMED: { color: 'processing', label: 'Confirmed' },
    COMPLETED: { color: 'success', label: 'Completed' },
    CANCELLED: { color: 'error', label: 'Cancelled' },
}

interface Order {
    id: string
    serviceType: string
    status: string
    totalAmount: number
    createdAt: string
}

export default function UserOrders({ userId }: { userId: string }) {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetch(`/api/users/${userId}/orders`)
            .then((res) => res.json())
            .then((data) => {
                setOrders(data.data ?? data ?? [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [userId])

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => (
                <a onClick={() => router.push(`/orders/${id}`)}>
                    {id}
                </a>
            ),
        },
        {
            title: 'Service',
            dataIndex: 'serviceType',
            key: 'serviceType',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const sc = statusConfig[status] ?? { color: 'default', label: status }
                return <Tag color={sc.color}>{sc.label}</Tag>
            },
        },
        {
            title: 'Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount: number) => `₹${amount}`,
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
    ]

    return (
        <Card title="Order History">
            <Table
                dataSource={orders}
                columns={columns}
                rowKey="id"
                loading={loading}
                size="small"
                pagination={{ pageSize: 5 }}
            />
        </Card>
    )
}
