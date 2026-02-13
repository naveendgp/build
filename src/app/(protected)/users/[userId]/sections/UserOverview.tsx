'use client'

import { Card, Descriptions, Tag } from 'antd'

export default function UserOverview({ user }: { user: any }) {
    return (
        <Card title="User Overview">
            <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">{user.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                <Descriptions.Item label="Contact">{user.contact}</Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={user.isActive ? 'success' : 'default'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Orders">{user.ordersCount ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Total Spent">₹{user.totalSpent ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Joined">
                    {new Date(user.joinedAt).toLocaleString()}
                </Descriptions.Item>
            </Descriptions>
        </Card>
    )
}
