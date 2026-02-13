'use client'

import { ProLayout } from '@ant-design/pro-components'
import { usePathname, useRouter } from 'next/navigation'
import {
    DashboardOutlined,
    ShoppingOutlined,
    UserOutlined,
    ShopOutlined,
    DollarOutlined,
    SettingOutlined,
    LogoutOutlined
} from '@ant-design/icons'
import { Avatar, Space, Typography, Dropdown } from 'antd'
import Link from 'next/link'
import { usePermissions } from '@/core/permissions/PermissionContext'

const { Text } = Typography

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const permissions = usePermissions()

    // Define menu structure with grouping
    const menuData = [
        {
            path: '/protected',
            name: 'Dashboard',
            icon: <DashboardOutlined />,
        },
        {
            path: '/operations',
            name: 'OPERATIONS',
            type: 'group',
            children: [
                {
                    path: '/orders',
                    name: 'Orders',
                    icon: <ShoppingOutlined />,
                    permission: 'ORDER_READ',
                },
                {
                    path: '/payments',
                    name: 'Payments',
                    icon: <DollarOutlined />,
                    permission: 'PAYMENT_READ',
                },
            ]
        },
        {
            path: '/management',
            name: 'MANAGEMENT',
            type: 'group',
            children: [
                {
                    path: '/users',
                    name: 'Users',
                    icon: <UserOutlined />,
                    permission: 'USER_READ',
                },
                {
                    path: '/partners',
                    name: 'Partners',
                    icon: <ShopOutlined />,
                    permission: 'PARTNER_READ',
                }
            ]
        },
        {
            path: '/settings',
            name: 'Settings',
            icon: <SettingOutlined />,
            // permission: 'SETTINGS_READ' // Future
        }
    ]

    // Recursive function to filter menu items based on permissions
    const filterMenu = (items: any[]): any[] => {
        return items
            .map(item => {
                if (item.children) {
                    const filteredChildren = filterMenu(item.children)
                    // If group has no visible children, don't show the group
                    if (filteredChildren.length === 0) return null
                    return { ...item, children: filteredChildren }
                }

                // If item has a permission requirement, check it
                if (item.permission && !permissions.includes(item.permission)) {
                    return null
                }

                return item
            })
            .filter(Boolean)
    }

    const filteredMenuData = filterMenu(menuData)

    return (
        <ProLayout
            logo={
                <Avatar
                    shape="square"
                    size="small"
                    style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }}
                >
                    A
                </Avatar>
            }
            title="Admin Panel"
            route={{
                path: '/',
                routes: filteredMenuData,
            }}
            location={{
                pathname,
            }}
            layout="mix"
            splitMenus={false}
            siderMenuType="group"
            menu={{
                collapsedShowGroupTitle: false,
            }}
            // Use avatarProps for the user profile
            avatarProps={{
                icon: <UserOutlined />,
                size: 'small',
                style: { backgroundColor: '#87d068' },
                title: 'Admin',
                render: (props, dom) => (
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'logout',
                                    icon: <LogoutOutlined />,
                                    label: 'Logout',
                                    onClick: () => {
                                        // Handle logout logic, for now just redirect
                                        router.push('/login')
                                    }
                                }
                            ]
                        }}
                    >
                        <Space style={{ cursor: 'pointer' }}>
                            {dom}
                        </Space>
                    </Dropdown>
                ),
            }}
            menuItemRender={(item, dom) => (
                <Link href={item.path || '/'}>
                    {dom}
                </Link>
            )}
            token={{
                sider: {
                    colorMenuBackground: '#fff',
                    colorMenuItemDivider: '#f0f0f0',
                    colorBgMenuItemSelected: '#e6f7ff', // Softer blue background
                    colorTextMenuSelected: '#1890ff',   // Primary blue text
                },
                header: {
                    colorBgHeader: '#fff',
                }
            }}
        >
            {children}
        </ProLayout>
    )
}
