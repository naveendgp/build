'use client'

import { Card, Descriptions, Tag } from 'antd'

const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'default', label: 'Pending' },
    APPROVED: { color: 'success', label: 'Approved' },
    REJECTED: { color: 'error', label: 'Rejected' },
    SUSPENDED: { color: 'warning', label: 'Suspended' },
}

export default function PartnerOverview({ partner }: { partner: any }) {
    const sc = statusConfig[partner.status] ?? { color: 'default', label: partner.status }

    return (
        <Card title="Partner Overview">
            <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">{partner.name}</Descriptions.Item>
                <Descriptions.Item label="Contact">{partner.contact}</Descriptions.Item>
                <Descriptions.Item label="Email">{partner.email}</Descriptions.Item>
                <Descriptions.Item label="Status">
                    <Tag color={sc.color}>{sc.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Services">{partner.servicesCount ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Total Revenue">₹{partner.totalRevenue ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Joined">
                    {new Date(partner.joinedAt).toLocaleString()}
                </Descriptions.Item>
            </Descriptions>
        </Card>
    )
}
