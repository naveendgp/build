'use client'

import { Drawer, Descriptions, Spin, Button } from 'antd'
import { useEffect, useState } from 'react'

interface Props {
    orderId: string
    onClose: () => void
}

export default function OrderDetailsDrawer({ orderId, onClose }: Props) {
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<any>(null)

    useEffect(() => {
        let mounted = true

        setLoading(true)
        fetch(`/api/orders/${orderId}`)
            .then((res) => res.json())
            .then((data) => {
                if (mounted) {
                    setOrder(data)
                    setLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [orderId])

    return (
        <Drawer
            open
            onClose={onClose}
            width={520}
            title={`Order ${orderId}`}
            destroyOnClose
        >
            {loading ? (
                <Spin />
            ) : (
                <Descriptions
                    column={1}
                    bordered
                    size="small"
                >
                    <Descriptions.Item label="Order ID">
                        {order.id}
                    </Descriptions.Item>

                    <Descriptions.Item label="User">
                        {order.user?.name} ({order.user?.contact})
                    </Descriptions.Item>

                    <Descriptions.Item label="Pickup Address">
                        {order.pickupAddress}
                    </Descriptions.Item>

                    <Descriptions.Item label="Delivery Address">
                        {order.deliveryAddress}
                    </Descriptions.Item>

                    <Descriptions.Item label="Service">
                        {order.serviceType}
                    </Descriptions.Item>

                    <Descriptions.Item label="Shop">
                        {order.shop?.name}
                    </Descriptions.Item>

                    <Descriptions.Item label="Status">
                        {order.status}
                    </Descriptions.Item>

                    <Descriptions.Item label="Total Amount">
                        ₹{order.totalAmount}
                    </Descriptions.Item>

                    <Descriptions.Item label="Created At">
                        {new Date(order.createdAt).toLocaleString()}
                    </Descriptions.Item>
                </Descriptions>
            )}
            <Button
                type="link"
                onClick={() => {
                    window.location.href = `/orders/${orderId}`
                }}
            >
                View full details →
            </Button>

        </Drawer>
    )
}
