import React from 'react';
import {iconMap, IconProps} from './interface';

const CustomIcon: React.FC<IconProps> = ({
  type = 'FontAwesome',
  name = 'navicon',
  size = 22,
  color = '#000',
}) => {
  const Icon = iconMap[type];
  return <Icon name={name} size={size} color={color} />;
};

export default CustomIcon; 