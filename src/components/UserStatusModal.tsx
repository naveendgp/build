'use client'

import { Modal, Form, Input, message } from 'antd'
import { useState } from 'react'

interface Props {
  userId: string
  enabled: boolean
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function UserStatusModal({
  userId,
  enabled,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          reason: values.reason,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Action failed')
      }

      message.success(
        enabled ? 'User enabled successfully' : 'User disabled successfully'
      )
      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={enabled ? 'Enable User' : 'Disable User'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      okText={enabled ? 'Enable' : 'Disable'}
      okButtonProps={{ danger: !enabled, loading }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Reason"
          rules={[
            { required: true, message: 'Reason is required' },
            { min: 3, message: 'Provide a meaningful reason' },
          ]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
