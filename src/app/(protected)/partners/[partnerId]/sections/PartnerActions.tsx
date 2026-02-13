'use client'

import { Card, Button, Tag, Space } from 'antd'
import { useState } from 'react'
import { PermissionGate } from '@/components/PermissionGate'
import PartnerDecisionModal from '@/components/PartnerDecisionModal'
import PartnerStatusModal from '@/components/PartnerStatusModal'

export default function PartnerActions({ partner }: { partner: any }) {
    const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | null>(null)
    const [statusOpen, setStatusOpen] = useState(false)

    // PENDING → compliance decision (approve / reject)
    if (partner.status === 'PENDING') {
        return (
            <Card title="Compliance Decision">
                <PermissionGate permission="PARTNER_WRITE">
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => setDecision('APPROVE')}
                        >
                            Approve
                        </Button>

                        <Button
                            danger
                            onClick={() => setDecision('REJECT')}
                        >
                            Reject
                        </Button>
                    </Space>
                </PermissionGate>

                {decision && (
                    <PartnerDecisionModal
                        partnerId={partner.id}
                        decision={decision}
                        open={!!decision}
                        onClose={() => setDecision(null)}
                    />
                )}
            </Card>
        )
    }

    // APPROVED → operational toggle (enable / disable)
    if (partner.status === 'APPROVED') {
        return (
            <Card title="Operational Status">
                <Tag color={partner.enabled ? 'green' : 'red'}>
                    {partner.enabled ? 'Enabled' : 'Disabled'}
                </Tag>

                <PermissionGate permission="PARTNER_WRITE">
                    <Button
                        danger={partner.enabled}
                        style={{ marginLeft: 12 }}
                        onClick={() => setStatusOpen(true)}
                    >
                        {partner.enabled ? 'Disable Partner' : 'Enable Partner'}
                    </Button>
                </PermissionGate>

                {statusOpen && (
                    <PartnerStatusModal
                        partnerId={partner.id}
                        enabled={!partner.enabled}
                        open={statusOpen}
                        onClose={() => setStatusOpen(false)}
                    />
                )}
            </Card>
        )
    }

    // REJECTED → no actions
    return null
}
