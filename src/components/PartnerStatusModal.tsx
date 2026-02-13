'use client'

import { Modal, Form, Input, Alert, message } from 'antd'
import { useState } from 'react'

interface Props {
    partnerId: string
    enabled: boolean
    open: boolean
    onClose: () => void
}

export default function PartnerStatusModal({
    partnerId,
    enabled,
    open,
    onClose,
}: Props) {
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            setLoading(true)

            const res = await fetch(
                `/api/partners/${partnerId}/status`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        enabled,
                        reason: values.reason,
                    }),
                }
            )

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Action failed')
            }

            message.success(
                enabled
                    ? 'Partner enabled successfully'
                    : 'Partner disabled successfully'
            )

            form.resetFields()
            onClose()
            window.location.reload()
        } catch (err: any) {
            message.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={enabled ? 'Enable Partner' : 'Disable Partner'}
            open={open}
            onOk={handleSubmit}
            onCancel={onClose}
            okText={enabled ? 'Enable' : 'Disable'}
            okButtonProps={{ danger: !enabled, loading }}
        >
            <Alert
                type={enabled ? 'info' : 'warning'}
                showIcon
                message={
                    enabled
                        ? 'This partner will resume operations on the platform.'
                        : 'This partner and all their shops will be disabled.'
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
