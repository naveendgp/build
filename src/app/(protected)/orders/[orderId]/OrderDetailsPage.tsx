'use client'

import { PageContainer } from '@ant-design/pro-components'
import { Card, Spin, Row, Col } from 'antd'
import { useEffect, useState } from 'react'
import OrderOverview from './sections/OrderOverview'
import UserSection from './sections/UserSection'
import ShopSection from './sections/ShopSection'
import BillingSection from './sections/BillingSection'
import TimelineSection from './sections/TimelineSection'
import OrderActions from './sections/OrderActions'

export default function OrderDetailsPage({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/orders/${orderId}`)
            .then((res) => res.json())
            .then((data) => {
                setOrder(data)
                setLoading(false)
            })
    }, [orderId])

    if (loading) return <Spin style={{ marginTop: 100 }} />

    return (
        <PageContainer
            title={`Order ${order.id}`}
            breadcrumb={{
                routes: [
                    { path: '/orders', breadcrumbName: 'Orders' },
                    { path: '', breadcrumbName: order.id },
                ],
            }}
        >
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <OrderOverview order={order} />
                </Col>

                <Col span={12}>
                    <UserSection order={order} />
                </Col>

                <Col span={12}>
                    <ShopSection order={order} />
                </Col>

                <Col span={12}>
                    <BillingSection order={order} />
                </Col>

                <Col span={12}>
                    <TimelineSection order={order} />
                </Col>

                <Col span={24}>
                    <OrderActions order={order} />
                </Col>
            </Row>
        </PageContainer>
    )
}
