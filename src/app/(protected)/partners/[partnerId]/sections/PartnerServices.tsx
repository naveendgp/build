'use client'

import { Card, Table, Tag, Button } from 'antd'
import { useEffect, useState } from 'react'
import { PermissionGate } from '@/components/PermissionGate'
import ServiceStatusModal from '@/components/ServiceStatusModal'

interface Service {
    id: string
    name: string
    type: 'WEIGHT' | 'ITEM'
    enabled: boolean
    config?: { minWeight?: number; maxWeight?: number }
}

export default function PartnerServices({
    partnerId,
    partnerApproved,
    partnerEnabled,
}: {
    partnerId: string
    partnerApproved: boolean
    partnerEnabled: boolean
}) {
    const [services, setServices] = useState<Service[]>([])
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/partners/${partnerId}/services`)
            .then((res) => res.json())
            .then((data) => {
                setServices(data.data ?? [])
                setLoading(false)
            })
    }, [partnerId])

    const actionsDisabled = !partnerApproved || !partnerEnabled

    return (
        <Card title="Services">
            <Table<Service>
                rowKey="id"
                dataSource={services}
                loading={loading}
                pagination={false}
                locale={{ emptyText: 'No services configured' }}
                columns={[
                    {
                        title: 'Service Name',
                        dataIndex: 'name',
                    },
                    {
                        title: 'Type',
                        dataIndex: 'type',
                        render: (type: string) => (
                            <Tag color={type === 'WEIGHT' ? 'blue' : 'purple'}>
                                {type}
                            </Tag>
                        ),
                    },
                    {
                        title: 'Config',
                        dataIndex: 'config',
                        render: (config: Service['config'], record) => {
                            if (record.type === 'WEIGHT' && config) {
                                return `${config.minWeight ?? 0} – ${config.maxWeight ?? '∞'} kg`
                            }
                            return '—'
                        },
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
                        title: 'Actions',
                        render: (_, service) => (
                            <PermissionGate permission="PARTNER_WRITE">
                                <Button
                                    size="small"
                                    danger={service.enabled}
                                    disabled={actionsDisabled}
                                    onClick={() => setSelectedService(service)}
                                >
                                    {service.enabled ? 'Disable' : 'Enable'}
                                </Button>
                            </PermissionGate>
                        ),
                    },
                ]}
            />

            {selectedService && (
                <ServiceStatusModal
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </Card>
    )
}
