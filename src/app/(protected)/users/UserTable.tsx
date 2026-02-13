'use client'

import { ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useRouter } from 'next/navigation'
import { Avatar, Space, Typography, Button, Tooltip, Tag } from 'antd'
import { UserOutlined, ArrowRightOutlined } from '@ant-design/icons'

const { Text } = Typography

interface User {
    id: string
    name: string
    email: string
    contact: string
    status: string // Added status to interface
    ordersCount: number
    joinedAt: string
}

export default function UsersTable() {
    const router = useRouter()

    const columns: ProColumns<User>[] = [
        {
            title: 'User',
            dataIndex: 'name',
            render: (_, record) => (
                <Space>
                    <Avatar
                        style={{ backgroundColor: '#1890ff' }}
                        icon={<UserOutlined />}
                    >
                        {record.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.email}
                        </Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            hideInTable: true, // Hidden in table, used for search
            search: true,
        },
        {
            title: 'Contact',
            dataIndex: 'contact',
            copyable: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            valueEnum: {
                ACTIVE: { text: 'Active', status: 'Success' },
                INACTIVE: { text: 'Inactive', status: 'Error' },
                BANNED: { text: 'Banned', status: 'Error' },
            },
            render: (_, record) => {
                // Mock status logic if not present in data
                const status = record.status || (Number(record.id.replace(/\D/g, '')) % 5 === 0 ? 'BANNED' : 'ACTIVE')
                const color = status === 'ACTIVE' ? 'success' : 'error'
                return <Tag color={color}>{status}</Tag>
            }
        },
        {
            title: 'Stats',
            dataIndex: 'ordersCount',
            search: false,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.ordersCount} Orders</Text>
                </Space>
            )
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
                        type="text"
                        icon={<ArrowRightOutlined />}
                        onClick={() => router.push(`/users/${record.id}`)}
                    />
                </Tooltip>
            ),
        },
    ]

    return (
        <ProTable<User>
            headerTitle="All Users"
            rowKey="id"
            columns={columns}
            pagination={{ pageSize: 10 }}
            options={{ density: true, fullScreen: true, reload: true, setting: true }}
            request={async (params) => {
                const query = new URLSearchParams({
                    page: String(params.current),
                    pageSize: String(params.pageSize),
                    ...(params.email && { email: params.email }),
                    ...(params.contact && { contact: params.contact }),
                    ...(params.name && { name: params.name }),
                })

                const res = await fetch(`/api/users?${query}`)
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
