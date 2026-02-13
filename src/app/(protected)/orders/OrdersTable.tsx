'use client'

import { ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { Badge, Typography, Space, Button, Tooltip, Avatar } from 'antd'
import { UserOutlined, EyeOutlined, ShopOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { PermissionGate } from '@/components/PermissionGate'
import { useState } from 'react'
import OrderDetailsDrawer from './OrderDetailsDrawer'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Text } = Typography

interface Order {
    id: string
    userName: string
    userContact: string
    status: string
    serviceType: string
    shopName: string
    totalAmount: number
    createdAt: string
}

export default function OrdersTable() {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

    const columns: ProColumns<Order>[] = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            width: 120,
            search: true,
            render: (_, record) => (
                <Text copyable={{ text: record.id }} code>
                    {record.id}
                </Text>
            ),
        },
        {
            title: 'Customer',
            dataIndex: 'userName',
            search: true,
            render: (_, record) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.userName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.userContact}</Text>
                    </Space>
                </Space>
            )
        },
        {
            title: 'Shop',
            dataIndex: 'shopName',
            search: false,
            render: (_, record) => (
                <Space>
                    <ShopOutlined style={{ color: '#1890ff' }} />
                    <Text>{record.shopName}</Text>
                </Space>
            )
        },
        {
            title: 'Service',
            dataIndex: 'serviceType',
            search: false,
            render: (text) => <Text type="secondary">{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            valueEnum: {
                PENDING: { text: 'Pending', status: 'Default' },
                CONFIRMED: { text: 'Confirmed', status: 'Processing' },
                PICKED_UP: { text: 'Picked Up', status: 'Processing' },
                IN_PROGRESS: { text: 'In Progress', status: 'Processing' },
                SHIPPED: { text: 'Shipped', status: 'Processing' },
                DELIVERED: { text: 'Delivered', status: 'Success' },
                COMPLETED: { text: 'Completed', status: 'Success' },
                CANCELLED: { text: 'Cancelled', status: 'Error' },
            },
            render: (_, record) => {
                let status: any = 'default'
                if (['CONFIRMED', 'PICKED_UP', 'IN_PROGRESS', 'SHIPPED'].includes(record.status)) status = 'processing'
                if (['DELIVERED', 'COMPLETED'].includes(record.status)) status = 'success'
                if (record.status === 'CANCELLED') status = 'error'

                return <Badge status={status} text={record.status.replace(/_/g, ' ')} />
            }
        },
        {
            title: 'Amount',
            dataIndex: 'totalAmount',
            search: false,
            render: (_, record) => (
                <Text strong>
                    ₹{record.totalAmount.toLocaleString()}
                </Text>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            valueType: 'dateTime',
            search: false,
            render: (_, record) => (
                <Tooltip title={new Date(record.createdAt).toLocaleString()}>
                    <Space size={4}>
                        <ClockCircleOutlined style={{ color: '#bfbfbf' }} />
                        <Text type="secondary">{dayjs(record.createdAt).fromNow()}</Text>
                    </Space>
                </Tooltip>
            )
        },
        {
            title: 'Actions',
            valueType: 'option',
            render: (_, record) => [
                <Tooltip key="view" title="View Details">
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setSelectedOrderId(record.id)}
                    >
                        View
                    </Button>
                </Tooltip>,
                <PermissionGate key="cancel" permission="ORDER_CANCEL">
                    {/* Placeholder for cancel action - currently handled inside details or separate modal logic */}
                </PermissionGate>,
            ],
        },
    ]

    return (
        <>
            <ProTable<Order>
                headerTitle="Recent Orders"
                rowKey="id"
                columns={columns}
                pagination={{ pageSize: 10 }}
                options={{ density: true, fullScreen: true, reload: true, setting: true }}
                request={async (params) => {
                    const query = new URLSearchParams({
                        page: String(params.current),
                        pageSize: String(params.pageSize),
                        ...(params.id && { orderId: params.id }),
                        ...(params.userName && { user: params.userName }),
                        ...(params.status && { status: params.status }),
                    })

                    const res = await fetch(`/api/orders?${query}`)
                    const json = await res.json()

                    return {
                        data: json.data,
                        total: json.total,
                        success: true,
                    }
                }}
                search={{ labelWidth: 'auto', collapseRender: false }}
            />
            {selectedOrderId && (
                <OrderDetailsDrawer
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </>
    )
}
