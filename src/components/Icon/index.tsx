import React from 'react';
import { iconMap, IconProps } from './interface';

const CustomIcon: React.FC<IconProps> = ({
  type = 'FontAwesome',
  name = 'navicon',
  size = 22,
  color = '#000',
}) => {
  if (type === 'svg') {
    const SvgIcon = name as React.ComponentType;
    return <SvgIcon />;
  }
  const Icon = iconMap[type];
  if (!Icon) {
    return null; // or some fallback
  }
  return <Icon name={name as string} size={size} color={color} />;
};

export default CustomIcon; 