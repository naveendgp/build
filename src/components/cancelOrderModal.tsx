'use client'

import { Modal, Form, Input, message } from 'antd'
import { useState } from 'react'

interface Props {
  orderId: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CancelOrderModal({
  orderId,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleCancel = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: values.reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Cancel failed')
      }

      message.success('Order cancelled successfully')
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
      title="Cancel Order"
      open={open}
      onOk={handleCancel}
      onCancel={onClose}
      okText="Confirm Cancel"
      okButtonProps={{ danger: true, loading }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Cancellation Reason"
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
