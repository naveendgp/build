'use client'

import { Card, Timeline, Tag } from 'antd'
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    CarOutlined,
} from '@ant-design/icons'

const iconMap: Record<string, React.ReactNode> = {
    PENDING: <ClockCircleOutlined style={{ color: '#999' }} />,
    CONFIRMED: <CheckCircleOutlined style={{ color: '#1677ff' }} />,
    PICKED_UP: <CarOutlined style={{ color: '#13c2c2' }} />,
    IN_PROGRESS: <SyncOutlined style={{ color: '#1677ff' }} />,
    OUT_FOR_DELIVERY: <CarOutlined style={{ color: '#fa8c16' }} />,
    COMPLETED: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    CANCELLED: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
}

const statusLabel: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PICKED_UP: 'Picked Up',
    IN_PROGRESS: 'In Progress',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
}

interface TimelineEntry {
    status: string
    timestamp: string
    note?: string
}

export default function TimelineSection({ order }: { order: any }) {
    const entries: TimelineEntry[] = order.timeline ?? []

    return (
        <Card title="Order Timeline">
            {entries.length === 0 ? (
                <p style={{ color: '#999' }}>No timeline data available</p>
            ) : (
                <Timeline
                    items={entries.map((entry) => ({
                        dot: iconMap[entry.status],
                        children: (
                            <div>
                                <strong>{statusLabel[entry.status] ?? entry.status}</strong>
                                <br />
                                <span style={{ color: '#666', fontSize: 12 }}>
                                    {new Date(entry.timestamp).toLocaleString()}
                                </span>
                                {entry.note && (
                                    <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                                        {entry.note}
                                    </div>
                                )}
                            </div>
                        ),
                    }))}
                />
            )}
        </Card>
    )
}
