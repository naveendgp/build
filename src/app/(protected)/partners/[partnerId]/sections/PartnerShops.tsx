'use client'

import { Card, Table, Tag, Button } from 'antd'
import { useEffect, useState } from 'react'
import { PermissionGate } from '@/components/PermissionGate'
import ShopStatusModal from '@/components/ShopStatusModal'

export default function PartnerShops({
    partnerId,
    partnerEnabled,
}: {
    partnerId: string
    partnerEnabled: boolean
}) {
    const [shops, setShops] = useState<any[]>([])
    const [selectedShop, setSelectedShop] = useState<any>(null)

    useEffect(() => {
        fetch(`/api/partners/${partnerId}/shops`)
            .then((res) => res.json())
            .then((data) => setShops(data.data ?? []))
    }, [partnerId])

    return (
        <Card title="Shops">
            <Table
                rowKey="id"
                dataSource={shops}
                pagination={false}
                locale={{ emptyText: 'No shops registered' }}
                columns={[
                    {
                        title: 'Shop Name',
                        dataIndex: 'name',
                    },
                    {
                        title: 'Status',
                        dataIndex: 'enabled',
                        render: (enabled: boolean) =>
                            enabled ? (
                                <Tag color="green">Enabled</Tag>
                            ) : (
                                <Tag color="red">Disabled</Tag>
                            ),
                    },
                    {
                        title: 'Services',
                        dataIndex: 'servicesCount',
                    },
                    {
                        title: 'Orders',
                        dataIndex: 'ordersCount',
                    },
                    {
                        title: 'Actions',
                        render: (_, shop) => (
                            <PermissionGate permission="PARTNER_WRITE">
                                <Button
                                    size="small"
                                    danger={shop.enabled}
                                    disabled={!partnerEnabled}
                                    onClick={() => setSelectedShop(shop)}
                                >
                                    {shop.enabled ? 'Disable' : 'Enable'}
                                </Button>
                            </PermissionGate>
                        ),
                    },
                ]}
            />

            {selectedShop && (
                <ShopStatusModal
                    shop={selectedShop}
                    onClose={() => setSelectedShop(null)}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </Card>
    )
}
