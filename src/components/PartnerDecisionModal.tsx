'use client'

import { Modal, Form, Input, Alert, message } from 'antd'
import { useState } from 'react'

interface Props {
    partnerId: string
    decision: 'APPROVE' | 'REJECT'
    open: boolean
    onClose: () => void
}

export default function PartnerDecisionModal({
    partnerId,
    decision,
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
                `/api/partners/${partnerId}/decision`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        decision,
                        reason: values.reason,
                    }),
                }
            )

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Action failed')
            }

            message.success(
                decision === 'APPROVE'
                    ? 'Partner approved successfully'
                    : 'Partner rejected successfully'
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
            title={
                decision === 'APPROVE'
                    ? 'Approve Partner'
                    : 'Reject Partner'
            }
            open={open}
            onOk={handleSubmit}
            onCancel={onClose}
            okText={decision === 'APPROVE' ? 'Approve' : 'Reject'}
            okButtonProps={{ danger: decision === 'REJECT', loading }}
        >
            <Alert
                type={decision === 'APPROVE' ? 'info' : 'warning'}
                showIcon
                message={
                    decision === 'APPROVE'
                        ? 'This partner will be allowed to operate on the platform.'
                        : 'This partner will not be allowed to operate.'
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
