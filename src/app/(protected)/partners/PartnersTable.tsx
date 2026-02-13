'use client'

import { ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useRouter } from 'next/navigation'
import { Avatar, Space, Typography, Button, Tooltip, Tag, Badge } from 'antd'
import { ShopOutlined, ArrowRightOutlined, DollarOutlined } from '@ant-design/icons'

const { Text } = Typography

interface Partner {
    id: string
    name: string
    contact: string
    status: string
    servicesCount: number
    joinedAt: string
    revenue?: number // Optional since it might be mocked
}

export default function PartnersTable() {
    const router = useRouter()

    const columns: ProColumns<Partner>[] = [
        {
            title: 'Partner',
            dataIndex: 'name',
            render: (_, record) => (
                <Space>
                    <Avatar
                        shape="square"
                        style={{ backgroundColor: '#722ed1' }}
                        icon={<ShopOutlined />}
                    >
                        {record.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.id}
                        </Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            valueEnum: {
                PENDING: { text: 'Pending', status: 'Default' },
                APPROVED: { text: 'Approved', status: 'Success' },
                REJECTED: { text: 'Rejected', status: 'Error' },
                SUSPENDED: { text: 'Suspended', status: 'Warning' },
            },
            render: (_, record) => {
                let status = 'default'
                if (record.status === 'APPROVED') status = 'success'
                if (record.status === 'REJECTED') status = 'error'
                if (record.status === 'SUSPENDED') status = 'warning'

                return <Badge status={status as any} text={record.status} />
            }
        },
        {
            title: 'Contact',
            dataIndex: 'contact',
            copyable: true,
        },
        {
            title: 'Services',
            dataIndex: 'servicesCount',
            search: false,
            render: (count) => (
                <Tag color="blue">{count} Services</Tag>
            )
        },
        {
            title: 'Revenue',
            dataIndex: 'revenue',
            search: false,
            hideInSearch: true,
            render: (_, record) => {
                // Mock revenue if missing
                const revenue = record.revenue ?? (Number(record.id.replace(/\D/g, '')) * 1234 % 50000)
                return (
                    <Text>
                        <DollarOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                        ₹{revenue.toLocaleString()}
                    </Text>
                )
            }
        },
        {
            title: 'Joined',
            dataIndex: 'joinedAt',
            valueType: 'date',
            search: false,
            sorter: (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
        },
        {
            title: 'Action',
            key: 'action',
            search: false,
            render: (_, record) => (
                <Tooltip title="View Details">
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<ArrowRightOutlined />}
                        onClick={() => router.push(`/partners/${record.id}`)}
                    >
                        View
                    </Button>
                </Tooltip>
            ),
        },
    ]

    return (
        <ProTable<Partner>
            headerTitle="Partner Network"
            rowKey="id"
            columns={columns}
            pagination={{ pageSize: 10 }}
            options={{ density: true, fullScreen: true, reload: true, setting: true }}
            request={async (params) => {
                const query = new URLSearchParams({
                    page: String(params.current),
                    pageSize: String(params.pageSize),
                    ...(params.name && { name: params.name }),
                    ...(params.contact && { contact: params.contact }),
                    ...(params.status && { status: params.status }),
                })

                const res = await fetch(`/api/partners?${query}`)
                const json = await res.json()

                return {
                    data: json.data,
                    total: json.total,
                    success: true,
                }
            }}
            search={{ labelWidth: 'auto', collapseRender: false }}
        />
    )
}
