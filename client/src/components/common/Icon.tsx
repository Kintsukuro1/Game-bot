import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

export interface CustomIconProps {
  name: string;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
  color?: string;
}

// Mapeo de alias comunitarios a Iconify (https://icon-sets.iconify.design/)
const iconAliasMap: Record<string, string> = {
  apartment: 'material-symbols:apartment-rounded',
  badge: 'material-symbols:badge-outline-rounded',
  fitness_center: 'material-symbols:fitness-center-rounded',
  explore: 'material-symbols:explore-outline-rounded',
  storefront: 'material-symbols:storefront-outline-rounded',
  shield_moon: 'material-symbols:shield-moon-outline-rounded',
  crosshair: 'material-symbols:crosshair-rounded',
  casino: 'material-symbols:casino-outline-rounded',
  backpack: 'material-symbols:backpack-outline-rounded',
  favorite: 'material-symbols:favorite-rounded',
  bolt: 'material-symbols:bolt-rounded',
  psychology: 'material-symbols:psychology-outline-rounded',
  local_fire_department: 'material-symbols:local-fire-department-rounded',
  local_hospital: 'material-symbols:local-hospital-outline-rounded',
  local_shipping: 'material-symbols:local-shipping-outline-rounded',
  shopping_cart: 'material-symbols:shopping-cart-outline-rounded',
  crisis_alert: 'material-symbols:crisis-alert-rounded',
  account_balance: 'material-symbols:account-balance-outline-rounded',
  refresh: 'material-symbols:refresh-rounded',
  hourglass_top: 'material-symbols:hourglass-top-rounded',
  user: 'material-symbols:person-outline-rounded',
  check: 'material-symbols:check-circle-rounded',
  check_circle: 'material-symbols:check-circle-outline-rounded',
  loader: 'material-symbols:progress-activity',
  close: 'material-symbols:cancel-outline-rounded',
  lock: 'material-symbols:lock-outline-rounded',
  face: 'material-symbols:face-outline-rounded',
  body_system: 'material-symbols:accessibility-new-rounded',
  front_hand: 'material-symbols:front-hand-outline-rounded',
  back_hand: 'material-symbols:back-hand-outline-rounded',
  directions_walk: 'material-symbols:directions-walk-rounded',
  accessible_forward: 'material-symbols:accessible-forward-rounded',
  vaccines: 'material-symbols:vaccines-outline-rounded',
  sports_mma: 'material-symbols:sports-mma-rounded',
  security: 'material-symbols:security-rounded',
  speed: 'material-symbols:speed-rounded',
  my_location: 'material-symbols:my-location-rounded',
  arrow_forward: 'material-symbols:arrow-forward-rounded',
  shopping_bag: 'material-symbols:shopping-bag-outline-rounded',
  wallet: 'material-symbols:wallet-outline-rounded',
  directions_car: 'material-symbols:directions-car-outline-rounded',
  star: 'material-symbols:star-rounded',
  timer: 'material-symbols:timer-outline-rounded',
  content_cut: 'material-symbols:content-cut-rounded',
  memory: 'material-symbols:memory-rounded',
  visibility: 'material-symbols:visibility-outline-rounded',
  explosion: 'material-symbols:explosion-rounded',
  tune: 'material-symbols:tune-rounded',
  group: 'material-symbols:group-outline-rounded',
  location_on: 'material-symbols:location-on-outline-rounded',
  diversity_3: 'material-symbols:diversity-3-rounded',
  map: 'material-symbols:map-outline-rounded',
  precision_manufacturing: 'material-symbols:precision-manufacturing-outline-rounded',
  nightlife: 'material-symbols:nightlife-rounded',
  swords: 'material-symbols:swords-rounded',
  radar: 'material-symbols:radar-rounded',
  person_search: 'material-symbols:person-search-outline-rounded',
  monetization_on: 'material-symbols:monetization-on-rounded',
  playing_cards: 'material-symbols:playing-cards-outline-rounded',
  sensors: 'material-symbols:sensors-rounded',
  mode_night: 'material-symbols:mode-night-outline-rounded',
  medication: 'material-symbols:medication-outline-rounded',
  healing: 'material-symbols:healing-outline-rounded',
  shield: 'material-symbols:shield-outline-rounded',
  qr_code_scanner: 'material-symbols:qr-code-scanner-rounded',
  swap_horiz: 'material-symbols:swap-horiz-rounded',
  delete: 'material-symbols:delete-outline-rounded',
  touch_app: 'material-symbols:touch-app-outline-rounded',
};

export const Icon: React.FC<CustomIconProps> = ({ name, className = '', size = 20, style, color }) => {
  const iconName = iconAliasMap[name] || (name.includes(':') ? name : `material-symbols:${name}`);
  return (
    <IconifyIcon
      icon={iconName}
      className={className}
      width={size}
      height={size}
      style={style}
      color={color}
    />
  );
};
