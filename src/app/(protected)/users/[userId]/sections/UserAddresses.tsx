'use client'

import { Card, List, Tag } from 'antd'
import { EnvironmentOutlined } from '@ant-design/icons'

interface Address {
    label: string
    line1: string
    line2?: string
    city: string
    pincode: string
    isDefault?: boolean
}

export default function UserAddresses({ user }: { user: any }) {
    const addresses: Address[] = user.addresses ?? []

    return (
        <Card title="Saved Addresses">
            {addresses.length === 0 ? (
                <p style={{ color: '#999' }}>No saved addresses</p>
            ) : (
                <List
                    dataSource={addresses}
                    renderItem={(addr) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<EnvironmentOutlined style={{ fontSize: 18, color: '#1677ff' }} />}
                                title={
                                    <span>
                                        {addr.label}
                                        {addr.isDefault && (
                                            <Tag color="blue" style={{ marginLeft: 8 }}>Default</Tag>
                                        )}
                                    </span>
                                }
                                description={
                                    <>
                                        {addr.line1}
                                        {addr.line2 && <>, {addr.line2}</>}
                                        <br />
                                        {addr.city} — {addr.pincode}
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Card>
    )
}
