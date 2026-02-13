'use client'

import { PageContainer } from '@ant-design/pro-components'
import { Card, Row, Col, Spin } from 'antd'
import { useEffect, useState } from 'react'
import UserOverview from './sections/UserOverview'
import UserAddresses from './sections/UserAddresses'
import UserOrders from './sections/UserOrders'
import UserActions from './sections/UserActions'

export default function UserDetailsPage({ userId }: { userId: string }) {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/users/${userId}`)
            .then((res) => res.json())
            .then((data) => {
                setUser(data)
                setLoading(false)
            })
    }, [userId])

    if (loading) return <Spin style={{ marginTop: 100 }} />

    return (
        <PageContainer
            title={user.name}
            breadcrumb={{
                routes: [
                    { path: '/users', breadcrumbName: 'Users' },
                    { path: '', breadcrumbName: user.name },
                ],
            }}
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <UserOverview user={user} />
                </Col>

                <Col span={12}>
                    <UserAddresses user={user} />
                </Col>

                <Col span={24}>
                    <UserOrders userId={user.id} />
                </Col>

                <Col span={24}>
                    <UserActions user={user} />
                </Col>
            </Row>
        </PageContainer>
    )
}
