'use client'

import { Modal, Form, Input, Alert, message } from 'antd'
import { useState } from 'react'

interface Props {
    service: { id: string; name: string; enabled: boolean }
    onClose: () => void
    onSuccess: () => void
}

export default function ServiceStatusModal({
    service,
    onClose,
    onSuccess,
}: Props) {
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    const targetEnabled = !service.enabled

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            setLoading(true)

            const res = await fetch(`/api/services/${service.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: targetEnabled,
                    reason: values.reason,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Action failed')
            }

            message.success(
                targetEnabled
                    ? `${service.name} enabled successfully`
                    : `${service.name} disabled successfully`
            )

            form.resetFields()
            onSuccess()
            onClose()
        } catch (err: any) {
            message.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={targetEnabled ? `Enable ${service.name}` : `Disable ${service.name}`}
            open
            onOk={handleSubmit}
            onCancel={onClose}
            okText={targetEnabled ? 'Enable' : 'Disable'}
            okButtonProps={{ danger: !targetEnabled, loading }}
        >
            <Alert
                type={targetEnabled ? 'info' : 'warning'}
                showIcon
                message={
                    targetEnabled
                        ? 'This service will become available to customers.'
                        : 'This service will no longer be available to customers.'
                }
                style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical">
                <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[
                        { required: true, message: 'Reason is required' },
                        { min: 3, message: 'Provide a meaningful reason' },
                    ]}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    )
}
