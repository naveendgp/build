'use client'

import { PageContainer } from '@ant-design/pro-components'
import { Row, Col, Spin } from 'antd'
import { useEffect, useState } from 'react'
import PartnerOverview from './sections/PartnerOverview'
import PartnerKYC from './sections/PartnerKYC'
import PartnerServices from './sections/PartnerServices'
import PartnerActions from './sections/PartnerActions'

export default function PartnerDetailsPage({
    partnerId,
}: {
    partnerId: string
}) {
    const [partner, setPartner] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/partners/${partnerId}`)
            .then((res) => res.json())
            .then((data) => {
                setPartner(data)
                setLoading(false)
            })
    }, [partnerId])

    if (loading) return <Spin style={{ marginTop: 100 }} />

    return (
        <PageContainer
            title={partner.name}
            breadcrumb={{
                routes: [
                    { path: '/partners', breadcrumbName: 'Partners' },
                    { path: '', breadcrumbName: partner.name },
                ],
            }}
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <PartnerOverview partner={partner} />
                </Col>

                <Col span={12}>
                    <PartnerKYC kyc={partner.kyc} />
                </Col>

                <Col span={24}>
                    <PartnerServices
                        partnerId={partner.id}
                        partnerApproved={partner.status === 'APPROVED'}
                        partnerEnabled={partner.enabled}
                    />
                </Col>

                <Col span={24}>
                    <PartnerActions partner={partner} />
                </Col>
            </Row>
        </PageContainer>
    )
}
